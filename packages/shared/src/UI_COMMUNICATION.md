# ⚠️ NOTIFICATION POUR L'AGENT UI (FRONT-END)

**De : Agent Architecte (Core Engine)**
**À : Agent UI / Frontend**

Dans le cadre du refactoring "Zero-Debt" du moteur de calcul biomécanique, je procède à l'éradication du couplage UI/Logique présent dans le Core Engine. 

Le moteur ne retournera plus **aucune chaîne de caractères en français** pour les jours ou les alertes. Tu devras gérer l'internationalisation (i18n) et l'affichage côté Front.

## Ce qui va casser (Breaking Changes) :

### 1. `SimulationResult.injuryPredictions`
- **Avant** : `Array<string>` (ex: `["Pic de charge détecté sur : Pecs. Risque de blessure !"]`)
- **Maintenant** : `Array<{ muscleId: string, acwr: number, code: string }>` (ex: `[{ muscleId: 'chest', acwr: 1.6, code: 'INJURY_RISK_ACWR' }]`)
- **Ton action** : Créer un dictionnaire de traduction pour afficher un toast d'alerte quand `code === 'INJURY_RISK_ACWR'`.

### 2. `SimulationResult.monotonyAlerts`
- **Avant** : `Array<string>` (ex: `["Semaine 2 : Monotonie critique détectée..."]`)
- **Maintenant** : `Array<{ week: number, code: string }>` (ex: `[{ week: 2, code: 'MONOTONY_CRITICAL' }]`)
- **Ton action** : Intercepter `MONOTONY_CRITICAL` et formater le texte pour l'utilisateur.

### 3. `SimulationResult.junkVolumeAlerts`
- **Avant** : `Array<string>` (ex: `["Pectoraux (INOL: 2.1)"]`)
- **Maintenant** : `Array<{ muscleId: string, inolScore: number, code: string }>` (ex: `[{ muscleId: 'chest', inolScore: 2.1, code: 'JUNK_VOLUME_DETECTED' }]`)
- **Ton action** : Afficher un badge d'avertissement dans le bilan de la séance.

### 4. Index des Jours (`DAYS_OF_WEEK` et `peakFatigue`)
- Le moteur abandonne `['Lundi', 'Mardi', 'Mercredi'...]`.
- Il utilisera l'index numérique `0-6` ou l'ISO (ex: lundi = 0).
- Dans `SimulationResult.weeklyMacro.peakFatigue[id].day`, tu recevras un `Number` (0 à 6) au lieu d'une string. À toi de le formater avec `date-fns` ou un tableau localisé.

Merci d'appliquer ces modifications dans `apps/web/` une fois que mon refactoring backend sera pushé.
