# Description Parfaite de l'Ancienne UI/UX de FORGE

Ce document détaille la disposition exacte et les composants de l'ancienne interface utilisateur de FORGE (commit `1d945be`). Il sert de référence ("cahier des charges visuel") pour la refonte complète du site web.

## 📐 Architecture Globale (Layout)

L'application était conçue comme un grand Dashboard occupant 100% de la hauteur de l'écran (`h-screen`), divisé en 3 sections principales horizontales (Flex Row) :

1. **LEFT PANEL (Panneau Gauche)** : Fixe (320px de large), dédié au profil utilisateur, au score global et à la gestion des programmes.
2. **CENTRAL WORKSPACE (Espace Central)** : Dynamique (prend le reste de l'espace `flex-1`), affiche le simulateur, l'avatar et les données d'entraînement.
3. **RIGHT PANEL (Bibliothèque)** : Rétractable, dédié à la recherche et l'ajout d'exercices.

---

## 1️⃣ LEFT PANEL (Menu & Contexte Utilisateur)

Ce panneau (fond sombre `bg-zinc-950`, bordure à droite) contenait les modules suivants de haut en bas :

*   **En-tête (Cloud Status)** : Affichait le tag "CLOUD" si l'utilisateur était connecté à Supabase et un bouton "Déconnexion".
*   **Mon Gabarit (Profil & Calibrage)** :
    *   Bouton "Modifier" pour ouvrir le `CalibrageModal`.
    *   Affichage rapide du Poids de corps et de la Capacité SNC max.
    *   Liste compacte des PRs (Squat, Bench, Deadlift, OHP).
*   **Readiness Gauge (Jauge de Récupération)** : Le composant `ReadinessGauge` affichait le score gamifié de l'état du Système Nerveux Central (SNC).
*   **Planning Hebdomadaire (Sélecteur de Jour)** : Le composant `DayPillSelector` affichait 7 "pilules" pour chaque jour de la semaine, permettant de sélectionner le jour actif et d'activer/désactiver les jours d'entraînement.
*   **Mes Blueprints (Gestion des Programmes)** :
    *   Boutons d'actions rapides : "Nouveau", "Sauvegarder", "Gérer" (Ouvre `BlueprintsModal`).
    *   Liste des 2 derniers blueprints utilisés, avec mise en surbrillance du blueprint actuellement actif.

---

## 2️⃣ CENTRAL WORKSPACE (Le Cœur du Simulateur)

L'espace central était le plus complexe, car il changeait totalement de disposition selon le mode de vue sélectionné (Journée vs Semaine).

### En-tête de l'Espace Central
*   **Toggle "Vue Journée" / "Vue Semaine"** : Un sélecteur style "Switch" pour changer l'interface.
*   **Outils d'Export (Uniquement en Vue Semaine)** : Boutons "Générer PDF", "Export Social" (`SocialExportButton`).
*   **Bouton Comparaison A/B** : Permettait de scinder l'écran en deux pour comparer deux programmes.

### Mode A : VUE JOURNÉE (Aperçu Quotidien)
Ce mode était divisé verticalement (Flex Column) :
1.  **Haut (Avatar Anatomique)** : Une div de hauteur fixe (`h-[340px]` à `45vh`) contenant le `HumanAvatar`. L'avatar montrait les muscles ciblés/fatigués spécifiquement pour le jour sélectionné.
2.  **Bas (Séquenceur d'Exercices)** : Le composant `Sequencer` qui listait les cartes d'exercices (`ExerciseCard`) prévus pour ce jour. Si vide, affichait `EmptyDayState`. La liste scrollait verticalement.
3.  **Bouton Flottant (Toggle Bibliothèque)** : Un bouton rond flottant à droite de l'écran pour faire apparaître le tiroir de la bibliothèque d'exercices.

### Mode B : VUE SEMAINE (Bilan Cumulé)
Ce mode était divisé horizontalement (Flex Row) :
1.  **Gauche (40% de largeur)** : Le `HumanAvatar` occupant toute la hauteur de l'écran, affichant la fatigue systémique cumulée sur l'ensemble de la semaine.
2.  **Droite (60% de largeur, scrollable)** : 
    *   Le `WeekScoreHeader` (KPIs globaux : Tonnes totales, INOL cumulé, Temps estimé).
    *   Le `WeekDashboard` : Un immense tableau de bord d'analytique contenant la Heatmap des muscles (`MesocycleHeatmap`), la répartition du volume par groupe musculaire, l'évolution journalière du SNC, etc.

### Mode C : COMPARAISON A/B
Lorsque le mode comparaison était activé (en Vue Semaine) :
*   L'écran se scindait exactement en **deux colonnes égales**.
*   **Colonne Gauche** : Le `WeekDashboard` du Programme A (Actuel).
*   **Colonne Droite** : Le `WeekDashboard` du Programme B (Sélectionné depuis le Modal).
*   L'Avatar disparaissait pour laisser toute la place aux datas comparatives.

---

## 3️⃣ RIGHT PANEL (Library Drawer)

*   Caché par défaut (sauf si ouvert en Vue Journée).
*   Tiroir latéral (`LibraryDrawer`) contenant la liste complète des exercices.
*   Filtres par groupe musculaire et recherche.
*   Permettait de glisser-déposer ou de cliquer pour ajouter un exercice au `Sequencer` actif.

---

## 🪟 Les Modales (Overlays)

*   **`CalibrageModal`** : Pour régler le poids, âge, PRs et métriques de base de l'utilisateur.
*   **`BlueprintsModal`** : Un gestionnaire de fichiers pour renommer, charger, dupliquer ou supprimer ses programmes d'entraînement.
*   **`StoryExportModal`** : Pour générer une image au format story Instagram de son "Bilan de la Semaine".
*   **`WelcomeSpotlight`** : Un tutoriel interactif (onboarding) lors de la première visite qui assombrissait l'écran et mettait en surbrillance les parties clés de l'UI.

---

## 🎨 Design System et UX

*   **Thème** : "Dark Mode Only" (Fonds `zinc-950` et `zinc-900`, textes `zinc-100` et `zinc-400`).
*   **Couleur d'Accentuation** : Vert Émeraude (`emerald-400`, `emerald-500`) pour les succès, la santé (SNC) et les actions principales.
*   **Couleurs de Danger/Fatigue** : Orange (`amber-500`) et Rouge (`red-500`) pour signaler un excès de volume ou un SNC grillé, avec des effets de lueur (glow) `shadow-[0_0_10px_rgba(239,68,68,0.6)]` pour dramatiser l'état critique.
*   **Typographie** : Utilisation intensive du texte en majuscules (uppercase) espacé (`tracking-wider`) pour les titres de sections (style très "Logiciel industriel / HUD Sci-Fi").
*   **Micro-interactions** : Tous les boutons utilisaient des transitions douces de fond et de bordure au survol (`transition-all hover:bg-zinc-800`). L'avatar s'illuminait au hover des muscles.
