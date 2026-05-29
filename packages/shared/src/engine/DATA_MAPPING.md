# 🗄️ ENGINE DATA MAPPING (POUR LE FRONT-END)

Le moteur de calcul (Core Engine) exporte un objet massif `SimulationResult`. L'interface graphique (Web ou Mobile) ne doit faire **aucun calcul métier**, mais uniquement consommer et afficher ces métriques.

## 🔴 Métriques du Système Nerveux Central (SNC)
| Variable | Type | Fréquence | Criticité | Nature | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sncScore` | `Number` | Daily | Rouge (DANGER) | Proxy | Jauge absolue de stress nerveux aigu accumulé (axial + intensité). |
| `sncPercentage` | `Number (0-100)`| Real-Time | Progress Bar | Proxy | Taux d'épuisement aigu du SNC par rapport au maximum tolérable de l'athlète. |
| `chronicSncStress` | `Number` | Weekly | Rouge vif (Burnout) | Physio | **NOUVEAU** : Accumulation long-terme du stress. Au-delà de `3.0`, déclenche le catabolisme musculaire. L'UI doit conseiller un Deload absolu. |
| `cnsFailure` | `Boolean` | Bloquante | Critique | Proxy | Si `true`, l'interface doit bloquer toute séance lourde (risque de surentraînement aigu). |

## 🟢 Métriques Musculaires (`muscles[muscleId]`)
| Variable | Type | Fréquence | Criticité | Nature | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `inol` | `Number` | Daily | Échelle de couleur | Physio | Indice de stress de Prilepin. > 2.0 = Poubelle (Surcharge). |
| `statusLabel` | `String` | Daily | Vert/Orange/Rouge| Proxy | État synthétique (`OPTIMAL`, `OVERLOAD`, `REST`, `DANGER`). |
| `readiness` | `Number` | Daily | Vert/Gris | Physio | TSB (Training Stress Balance) de Banister : `fitness - fatigue`. |
| `remainingCapacity`| `Number (0-1)` | Real-Time | Jauge Circulaire | Proxy | Pourcentage de volume (INOL) restant avant d'atteindre le seuil critique de 2.5. |
| `jointStress` | `Number` | Weekly | Orange | Proxy | Accumulation de contraintes sur les tendons et les articulations (récupération locale asymétrique très lente). |

## 📈 Métriques de Progression (Gains)
| Variable | Type | Fréquence | Criticité | Nature | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `progressiveOverload` | `Object` | Fin de cycle | Graphique Ligne | Physio | **NOUVEAU** : Contient `weekOverWeekGrowthPct` par muscle. Indique la croissance hypertrophique simulée. |
| `geneticCeiling` | `(Implicit)` | Fin de cycle | Jauge Plafond | Physio | **NOUVEAU** : Loi de croissance logistique (Verhulst). Si les gains s'effondrent vers 0 malgré un bon entraînement, le plafond génétique est atteint. |

## 📊 Métriques Systémiques (Macros)
| Variable | Type | Fréquence | Criticité | Nature | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `globalWorkCapacity`| `Number (0-100)`| Weekly | Bleu/Vert | Proxy | Capacité globale de l'athlète à encaisser du volume (GWC). |
| `pushPullLegsRatio` | `Object` | Fin de cycle | Camembert | Physio | Répartition du volume total en % (Push / Pull / Legs). |
| `injuryPredictions` | `Array<Object>`| Alerte | Rouge | Proxy | Détection d'un pic de charge aigüe vs chronique (ACWR > 1.5). |
| `junkVolumeAlerts` | `Array<Object>`| Fin de séance | Jaune | Physio | Liste des muscles sollicités inutilement (loi des rendements décroissants). |
| `monotonyAlerts` | `Array<Object>`| Fin de cycle | Orange | Proxy | Détection d'une absence de variance des intensités (Monotonie de Foster). |
| `tensors` | `Object` | Background | Invisible | Data | Tenseurs normalisés (0-1) de la fatigue pour l'exploitation Machine Learning. |

---

## 📥 Entrées de Données (Onboarding & Calibration)

L'interface n'a plus l'obligation de fournir un profil parfait avec les 4 `1RM` stricts. Le Moteur accepte désormais un **`OnboardingPayload`** fragmenté qui passera par le **`ProfileCalibrator`** pour inférer les trous de manière scientifique.

### `OnboardingPayload` (Le JSON envoyé par le Mobile)

| Champ | Type | Statut | Description |
| :--- | :--- | :--- | :--- |
| `pdc` | `Number` | **Obligatoire** | Poids de corps en kg (minimum vital pour l'algorithme). |
| `gender` | `Enum ('male', 'female')` | *Défaut: male* | Impacte les ratios statistiques de force. |
| `experience_level` | `Enum ('beginner', 'intermediate', 'advanced')` | *Défaut: beginner* | Modifie l'estimation des PRs et la capacité SNC (`maxSnc`). |
| `known_prs` | `Partial<UserPRs>` | **Optionnel** | Priorité 1 : Vérité Absolue. Si l'athlète connaît son Bench mais pas son Squat, envoyer `{ bench: 100 }`. |
| `recent_lifts` | `Array<Lift>` | **Optionnel** | Priorité 2 : Estimation Epley + Matrice de conversion. Accepte `squat`, `bench`, `deadlift`, `ohp`, **`leg_press`**, **`chest_press`**, **`lat_pulldown`**. Si l'athlète ne connaît aucun 1RM mais a récemment fait 10 reps à 100kg à la Leg Press, envoyer `[{ exo: 'leg_press', poids: 100, reps: 10 }]`. Le moteur calculera le 1RM Squat théorique. |

> **Processus en cascade (Waterfall) du Calibration Engine** : 
> 1. Si un `known_prs` existe pour un muscle, il le verrouille.
> 2. Sinon, s'il y a un `recent_lift` pour ce muscle (ou sa machine équivalente), il calcule le 1RM via Epley (`W * (1 + R/30)` bloqué à 10 reps max) et applique **une marge de sécurité de -10% (Sandbagging)**.
> 3. S'il n'y a **aucune** donnée, il applique les standards globaux relatifs au Poids de Corps (Symmetric Strength) basés sur le sexe et le niveau, toujours avec un malus de sécurité de -10%.
