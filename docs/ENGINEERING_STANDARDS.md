# FORGE CORE ENGINE : NORMES D'INGÉNIERIE ET POST-MORTEMS

> Ce document trace les erreurs architecturales récurrentes commises lors du développement des premiers modules (Générateur de Programmes, Protocole d'Échauffement). Il sert de **Checklist de Validation Absolue** avant de livrer la moindre ligne de code pour les futurs modules. Le but est d'éviter les itérations en 3 temps (Code -> Audit -> Fix) et de livrer "Prod Ready" au premier prompt.

---

## 🛑 ANTI-PATTERN 1 : "UI Logic in Core Engine" (Le Biais du Plate Math)
**L'Erreur :** Intégrer des arrondis matériels (ex: `Math.round(w / 2.5) * 2.5`) directement dans le moteur biomécanique.
**La Conséquence :** Aux USA (marché principal), les disques de 2.5 kg n'existent pas (incréments de 5 lbs typiques). Arrondir en kg dans l'engine provoque des charges impossibles à charger sur la barre une fois converties en lbs par le front-end.
**La Règle d'Or :** **Le Moteur est Mathématiquement Pur.** Il retourne des entiers ou des décimales stricts. C'est le Front-End (UI) qui gère le "Plate Math" en fonction des réglages locaux de l'utilisateur (Kg/Lbs et disques disponibles).

## 🛑 ANTI-PATTERN 2 : "Local Market Bias" (Le Biais du Système Métrique)
**L'Erreur :** Définir des limites de schémas Zod basées sur l'expérience européenne (`max(1000)` pour un exercice).
**La Conséquence :** Une presse à cuisses chargée par un athlète avancé américain peut facilement dépasser les 1500 lbs. Zod crashe et l'application est inutilisable aux US.
**La Règle d'Or :** Les validations Zod du moteur doivent toujours tolérer des valeurs extrêmes correspondant aux records du monde convertis en Livres (Lbs). Toujours utiliser `max(2500)` pour les charges (`poids`).

## 🛑 ANTI-PATTERN 3 : "One Size Fits All Biomechanics" (Le Biais de la Charge Fixe)
**L'Erreur :** Appliquer une intensité ou un RPE global (ex: 78% du 1RM / RPE 8.5) à tous les exercices indifféremment.
**La Conséquence :** 5 séries de Soulevé de Terre à 78% / RPE 8.5 provoquent un effondrement du système nerveux central (SNC). La même charge sur un Curl Biceps est presque sous-optimale.
**La Règle d'Or :** **Le Tier SNC est roi.** Chaque calcul de volume, de charge ou de RPE doit être modulé par l'attribut `tier_snc` (1, 2 ou 3) de l'exercice. (Ex: Tier 1 = RPE cible - 0.5, Charge - 10%).

## 🛑 ANTI-PATTERN 4 : "The Barbell Bias" (Le Biais de l'Haltérophile)
**L'Erreur :** Assumer que tous les exercices s'exécutent avec une barre olympique (ex: imposer une barre à vide de 20kg en échauffement).
**La Conséquence :** Demander de s'échauffer avec 20kg sur une machine (poulie) ou avec des haltères légères est dangereux et UX-incompatible.
**La Règle d'Or :** **Toujours lire l'attribut `equipment` dans `constants.ts`.** Ne jamais appliquer de logique de barre si `equipment !== 'poids_libre'`.

## 🛑 ANTI-PATTERN 5 : "Impossible UX" (Le Biais du Poids de Corps)
**L'Erreur :** Imposer des tractions (Pull-ups) à tous les utilisateurs débutants.
**La Conséquence :** Un utilisateur de 120 kg en surpoids se voit prescrire un mouvement qu'il est physiquement incapable d'exécuter. L'algorithme d'auto-régulation va rabaisser le volume mais le mouvement reste impossible.
**La Règle d'Or :** **Validation des capacités physiques.** Les mouvements au poids de corps (`pdc`) imposent une vérification du poids de l'athlète (`pdc < 85kg`) et de son niveau. Toujours prévoir une substitution (ex: `lat_pulldown` ou `machine_chest_press`).

---

### CHECKLIST "FIRST-PROMPT DELIVERY" POUR LES PROCHAINS MODULES :
1. [ ] As-tu vérifié l'impact `tier_snc` sur ton algorithme ?
2. [ ] As-tu évité tout arrondi propre au matériel de salle de sport ?
3. [ ] Ton schéma Zod crasherait-il si un Américain entrait "2000" lbs ?
4. [ ] As-tu géré les différences d'équipement (`machine` vs `pdc` vs `poids_libre`) ?
5. [ ] As-tu protégé le système nerveux central des prescriptions aberrantes ?
