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
