# MANIFESTE DE LA DIRECTION ARTISTIQUE // FORGE MOBILE
**Version :** 5.0  
**Concept :** Clinical Brutalism & Aerospace Cockpit Telemetry  
**Plateforme :** Mobile Offline-First (React Native / twrnc)  

---

## 1. PHILOSOPHIE & CONCEPT GLOBAL (CLINICAL BRUTALISM)

L'identité visuelle de **Forge** s'oppose radicalement aux codes grand public des applications de fitness (pas de gamification, pas de couleurs saturées récréatives, pas de badges colorés ou de félicitations). L'interface est pensée comme un **outil de diagnostic clinique** ou un **cockpit de pilotage aéronautique**. 

L'utilisateur n'est pas un "client" à divertir, mais un **"Opérateur"** qui calibre et extrait des données de performance de son corps (le **"Vessel"**).

### Les Trois Piliers Conceptuels :
1. **Rigueur de Laboratoire** : Le design doit évoquer le sérieux scientifique, la froideur mathématique et la précision chirurgicale.
2. **Cockpit Aéronautique** : Densité élevée d'informations, télémétries en temps réel, polices monospacées, reticules vectoriels.
3. **Zéro Friction (Reach-Zone)** : Tous les éléments interactifs sont condensés dans les 40% inférieurs de l'écran pour une manipulation à une main, même sous haute fatigue musculaire.

---

## 2. SYSTEME DE COULEURS (OLED IMMERSION)

La palette de couleurs est ultra-restreinte, hautement fonctionnelle et optimisée pour les écrans OLED.

| Jeton CSS (`twrnc`) | Code Hex / RGBA | Rôle Visuel |
| :--- | :--- | :--- |
| **`bg-black`** | `#000000` | **Le Vide (Background)**. Noir absolu obligatoire pour fusionner avec le châssis physique du téléphone. |
| **`bg-surface`** / **`bg-surface-dim`** | `#131313` | Fond des barres d'outils et cartes surélevées. |
| **`text-surgical-white`** | `#FFFFFF` | Texte principal actif, boutons prioritaires et icônes d'action. |
| **`text-zinc-400`** | `#A1A1AA` | Libellés secondaires, tags de télémétrie et métadonnées. |
| **`text-zinc-500`** | `#71717A` | Ticks de curseurs, unités inactives, placeholders. |
| **`bg-glass-fill`** | `rgba(255, 255, 255, 0.03)` | Fond des conteneurs vitrés translucides. |
| **`border-glass-border`** | `rgba(255, 255, 255, 0.08)` | Bordures fines (1px) délimitant les cartes. |
| **`border-ghost-border`** | `rgba(255, 255, 255, 0.1)` | Bordures interactives (boutons inactifs, curseurs). |
| **`text-chirurgical-red`** | `#EF4444` | **Couleur d'état critique**. Alertes de fatigue critique, surcharge, cisaillement lombaire ou zones musculaires saturées. |
| **`text-clinical-orange`** | `#F97316` | **Couleur d'état intermédiaire**. Tension modérée, seuils de précaution ou avertissements. |
| **`text-clinical-green`** | `#10B981` | **Couleur d'état optimal**. Capteurs connectés, synchronisation réussie ou niveau optimal. |

> [!NOTE]
> **USAGE DES COULEURS D'ÉTAT (ROUGE, ORANGE, VERT)** :
> L'utilisation tactique de ces trois couleurs est autorisée pour exprimer un état système ou physiologique (ex: statut de capteurs, surcharge ou tension sur les graphiques de progression). Ces touches de couleur doivent rester extrêmement locales et subtiles pour préserver la dominance clinique monochrome de l'interface.

---

## 3. TYPOGRAPHIE HYBRIDE

La typographie sépare strictement le contenu d'interface (navigation/titres) de la télémétrie numérique.

### A. Geist Sans (Interface & Chrome)
Utilisé pour les en-têtes de cockpits, les titres de sections et la lecture de texte explicative.
* **Titres majeurs (Headline-LG)** : `32px`, gras (`fontFamily: 'Geist-Bold'`), hauteur de ligne serrée (`leading-none`), espacement des lettres négatif (`tracking-tighter` / `-0.04em`) pour un effet "lourd" et compact.
* **Titres secondaires (Headline-MD)** : `24px` (`Geist-Bold`), tracking `-0.02em`.
* **Corps de texte (Body-MD/LG)** : `16px` / `18px` (`Geist`), hauteur de ligne `1.5`.

### B. JetBrains Mono (Données & Télémétrie)
Utilisé pour tous les nombres, compteurs de reps, poids, pourcentages CNS, ACWR, HRV et labels système en majuscules. La nature monospacée empêche le vacillement de l'interface lors de variations rapides de valeurs.
* **Grands chiffres (Telemetry-LG)** : `20px` à `36px` (`fontFamily: 'JetBrainsMono-Bold'`), chiffres tabulaires obligatoires.
* **Labels système (Label-Caps)** : `10px` à `12px` (`JetBrainsMono-Bold`), toujours en **MAJUSCULES**, avec un espacement de lettres élargi (`tracking-widest` / `0.1em` à `0.2em`).

---

## 4. FORMES, HIERARCHIE & GHOST BORDERS

* **Pas d'ombres portées** : Les ombres traditionnelles du Material Design ou de Cupertino sont proscrites. La profondeur est créée par les **Ghost Borders** (fines bordures blanches translucides à 8%-10% d'opacité) et les calques de transparence (`glass-fill`).
* **Les Squarcles (Angles Arrondis)** :
  - **Cartes primaires (Level 1)** : `rounded-2xl` / `rounded-3xl` (rayon de 24px à 28px). Inspiré des angles lissés de consoles automobiles haut de gamme.
  - **Boutons & Inputs** : `rounded-lg` / `rounded-xl` (rayon de 8px à 12px) pour garder un angle plus tendu et clinique.
  - **Indicateurs de statut** : Coins vifs ou rayon de `4px` maximum pour une esthétique de terminal technique.

---

## 5. LES INTERACTIONS ET MICRO-COMPOSANTS CLÉS

### A. Glissière de Validation Tactile (Slide to Validate)
* **Design** : Conteneur pilule noir (`h-16`) avec fond `glass-fill` et bordure `ghost-border`.
* **Interactions** : La poignée de glissement (un cercle de verre dépoli à 5% d'opacité avec un point blanc pur au centre) déclenche une vibration mécanique lors de la prise. En glissant, un calque blanc translucide (`rgba(255,255,255,0.05)`) s'étire en temps réel sous la poignée. Un retour haptique lourd de succès se déclenche à 100%.

### B. Le "Crucible" (Sphere de Chargement Stochastique)
* **Rendu** : Un logo Forge central enveloppé dans un cercle rotatif à deux niveaux.
* **Technique** : Un tracé SVG circulaire accueille deux lignes de texte monospacées courbées ("DATA THROUGHPUT // 1.2 GB/S", "ESTIMATED COMPLETION // 00:04.22") tournant en sens inverse à des vitesses différentes (`rotate-slow` vs `rotate-slow-reverse`).
* **Stochastique** : Le pourcentage de chargement imite une vraie analyse de données : il n'est pas linéaire mais procède par accélérations brutales (stochastic bursts) et micro-pauses sur des paliers clés (ex: 20%, 50%, 80%), avec un temps d'arrêt prolongé à 99% avant de flasher en blanc chirurgical pur à 100%.

### C. Le Curseur de Précision (TacticalSlider)
* **Design** : Un rail horizontal blanc translucide de 1px.
* **Aiguille** : Une réglette verticale blanche ultra-fine de 2px de large et 24px de haut, centrée verticalement (`top-12` pour une zone de contact de 48px). Elle dispose d'une micro-lueur diffuse blanche pour accrocher l'œil.
* **Graduations** : Ticks en police JetBrains Mono 8px gris Zinc-500 positionnés aux extrémités et au centre exact.

### D. La Blueprint (Heatmap Anatomique)
* **Wireframe** : Silhouette humaine vectorielle dessinée en traits fins Zinc-400 sur fond noir OLED.
* **Points Forts** : Représentés par des halos lumineux diffus blancs (`glow-white` / `blur-xl`) sur les groupes musculaires dominants (ex: pectoraux, quadriceps).
* **Points Faibles / Danger** : Représentés par des pulsations rouges chirurgicales (`pulse-red` / `blur-lg`) à opacité variable sur les zones à risque ou en retard (ex: abdominaux, lombaires).

---

## 6. LOGIQUE HAPTIQUE & TACTILE

L'absence de stimuli visuels colorés superflus est compensée par une **télémétrie haptique physique** :
* **Incrémentations (Curseurs/Steppers)** : Vibration de déclic légère (`HapticService.step()`) pour chaque unité passée.
* **Sélection (Boutons/Toggles)** : Vibration de contact nette (`HapticService.select()`).
* **Avertissement (Warning/Surcharge)** : Double vibration rapide.
* **Succès (Commit/Validation)** : Triple impulsion vibratoire progressive simulée sur le GPU.
* **Effet d'échelle (Physical Touch)** : Lors de chaque clic ou validation sur un conteneur majeur, une micro-contraction de l'interface entière (`transform: scale(0.995)`) renforce l'aspect mécanique de l'outil.
