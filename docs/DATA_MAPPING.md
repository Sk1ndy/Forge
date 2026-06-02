# 🗄️ ENGINE DATA MAPPING (POUR LE FRONT-END)

> [!IMPORTANT]
> **SOURCE DE VÉRITÉ UNIQUE :** La spécification complète, exhaustive et illustrée pour l'intégration UI/UX (contenant tous les schémas d'entrées, de sorties, les dictionnaires de traduction i18n et les recommandations graphiques Tailwind) est disponible dans :
> **[docs/UI_COMMUNICATION.md](file:///c:/Users/sk-y/Code/forge-simulator/docs/UI_COMMUNICATION.md)**

Le moteur de calcul (Core Engine) exporte un objet massif `SimulationResult`. L'interface graphique (Web ou Mobile) ne doit faire **aucun calcul métier**, mais uniquement consommer et afficher ces métriques.

---

## 🔴 Métriques du Système Nerveux Central (SNC)
| Variable | Type | Fréquence | Criticité | Nature | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sncScore` | `Number` | Daily | Exception Rouge (DANGER) | Proxy | Jauge absolue de stress nerveux aigu accumulé (axial + intensité). |
| `sncPercentage` | `Number (0-100)`| Real-Time | Progress Bar (Zinc) | Proxy | Taux d'épuisement aigu du SNC par rapport au maximum tolérable de l'athlète. |
| `chronicSncStress` | `Number` | Weekly | Exception Rouge (Burnout) | Physio | **NOUVEAU** : Accumulation long-terme du stress. Au-delà de `3.0`, déclenche le catabolisme musculaire. L'UI doit conseiller un Deload absolu. |
| `cnsFailure` | `Boolean` | Bloquante | Critique (Overlay Clinique) | Proxy | Si `true`, l'interface doit bloquer toute séance lourde (risque de surentraînement aigu). |

---

## ⚪ Métriques Musculaires (`muscles[muscleId]`)
| Variable | Type | Fréquence | Criticité | Nature | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `inol` | `Number` | Daily | Échelle de Gris | Physio | Indice de stress de Prilepin. > 2.0 = Surcharge (Effet Poubelle). |
| `statusLabel` | `String` | Daily | Zinc-50 / Zinc-400 / Gras | Proxy | État synthétique (`OPTIMAL` en Zinc-50, `REST` en Zinc-400, `OVERLOAD` en Gras / Hachures, `DANGER` en Exception Rouge). |
| `readiness` | `Number` | Daily | Contraste Zinc / Gris | Physio | TSB (Training Stress Balance) de Banister : `fitness - fatigue`. |
| `remainingCapacity`| `Number (0-1)` | Real-Time | Jauge Filaire | Proxy | Pourcentage de volume (INOL) restant avant d'atteindre le seuil critique de 2.5. |
| `jointStress` | `Number` | Weekly | Texte Gras / Overlay | Proxy | Accumulation de contraintes sur les tendons et les articulations (récupération locale asymétrique très lente). |

---

## 📈 Métriques de Progression (Gains)
| Variable | Type | Fréquence | Criticité | Nature | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `progressiveOverload` | `Object` | Fin de cycle | Courbe Filaire | Physio | **NOUVEAU** : Contient `weekOverWeekGrowthPct` par muscle. Indique la croissance hypertrophique simulée. |
| `geneticCeiling` | `(Implicit)` | Fin de cycle | Jauge Plafond Filaire | Physio | **NOUVEAU** : Loi de croissance logistique (Verhulst). Si les gains s'effondrent vers 0 malgré un bon entraînement, le plafond génétique est atteint. |

---

## 📊 Métriques Systémiques (Macros)
| Variable | Type | Fréquence | Criticité | Nature | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `globalWorkCapacity`| `Number (0-100)`| Weekly | Contraste Zinc | Proxy | Capacité globale de l'athlète à encaisser du volume (GWC). |
| `pushPullLegsRatio` | `Object` | Fin de cycle | Diagramme Filaire | Physio | Répartition du volume total en % (Push / Pull / Legs). |
| `injuryPredictions` | `Array<Object>`| Alerte | Exception Rouge | Proxy | Détection d'un pic de charge aigüe vs chronique (ACWR > 1.5). |
| `junkVolumeAlerts` | `Array<Object>`| Fin de séance | Opacité 60% / Italique | Physio | Liste des muscles sollicités inutilement (loi des rendements décroissants). |
| `monotonyAlerts` | `Array<Object>`| Fin de cycle | Texte Gras / Texture | Proxy | Détection d'une absence de variance des intensités (Monotonie de Foster). |
| `tensors` | `Object` | Background | Invisible | Data | Tenseurs normalisés (0-1) de la fatigue pour l'exploitation Machine Learning. |
