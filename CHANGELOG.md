# 📜 FORGE — Synthèse des Développements & Tâches Restantes

Ce document récapitule les modifications apportées au code, les suppressions effectuées, et ce qu'il reste à faire pour finaliser le projet.

---

## 🛠️ 1. Ce qui a été FAIT (Créé)

L'ensemble du moteur de simulation et de l'interface cockpit a été conçu de A à Z :

- **`src/lib/calculations.ts` (Le Moteur Physiologique)** :
  - **Formule INOL Modifiée** pour la fatigue musculaire locale (Primaire 100%, Synergistes 50%).
  - **Estimation de 1RM dynamique par Epley + RPE** : Permet de calculer l'intensité sur n'importe quel exercice même sans PR saisi, via `1RM = poids * (1 + (reps + (10 - RPE)) / 30)`.
  - **Taxation du Système Nerveux Central (SNC)** : Modèle basé sur le ratio poids/PDC, le RPE, et le Tier de l'exercice (Tier 1 axial multiplié jusqu'à x1.5).
  - **Échec Systémique** : Grise l'entièreté de l'avatar et affiche un statut d'alerte si le stress SNC dépasse les limites configurées.
  - **Bibliothèque intégrée** : Dictionnaire de 22 mouvements gym/force prédéfinis.

- **`src/lib/supabase.ts` (Persistance Hybride)** :
  - Sauvegarde locale automatique (`localStorage`) assurant un fonctionnement instantané et fluide sans connexion requise.
  - Synchronisation Supabase transparente : si l'utilisateur est connecté et la BDD disponible, sauvegarde et charge les profils et presets de Blueprints sur le cloud.

- **`src/components/simulator/HumanAvatar.tsx` (Avatar Heatmap)** :
  - Tracé complet d'un corps humain athlétique (Face & Dos) en SVG géométrique cyberpunk.
  - Heatmap en temps réel : Les muscles changent de couleur (Gris: repos, Vert: optimal, Orange: overreaching, Rouge: surentraînement).
  - Info-bulles HUD Tactique au survol : Affiche le nom, le score INOL exact, le nombre de séries effectives hebdomadaires, et le Top 2 des exercices contributeurs (avec leur %).

- **`src/components/simulator/Sequencer.tsx` & `ExerciseCard.tsx` (Planification)** :
  - Grille hebdomadaire 7 jours (Lundi → Dimanche) avec commutateur global par jour (Toggle).
  - Cartes d'exercices imbriquées éditables : Séries, reps, poids, RPE, activation individuelle, bouton de suppression.

- **`src/components/simulator/LibraryDrawer.tsx` (Bibliothèque)** :
  - Barre de recherche et filtres par muscle ou équipement (Machines, poids libres, PDC).
  - Assignation rapide au séquenceur en 1 clic pour chaque jour.

- **`src/components/simulator/CalibrageModal.tsx` (Gabarit)** :
  - Formulaire interactif pour calibrer le Poids de Corps (PDC) et les 1RM de référence (Squat, Bench, Deadlift, OHP).

---

## 🔄 2. Ce qui a été MODIFIÉ / AJUSTÉ

- **`app/page.tsx`** : Entièrement réécrit. Design en 3 zones ultra-premium (Sidebar profil/SNC à gauche, Zone centrale Avatar SVG + Séquenceur hebdomadaire, Bibliothèque à droite) avec effets de verre floutés (*glassmorphism*) et accents néon.
- **`app/globals.css`** : Ajout de styles de scrollbars personnalisés, micro-transitions fluides sur le SVG de l'avatar au survol, et animations de glowing/fade-in.
- **`app/layout.tsx`** : Configuration des polices et des métadonnées du site en français.
- **`tsconfig.json` & `package.json`** : Configuration des alias de chemins (`@/*`) et installation propre de toutes les dépendances (Next.js, React 19, Tailwind CSS v4, Lucide-react, etc.).

---

## 🗑️ 3. Ce qui a été SUPPRIMÉ

- Nettoyage complet des fichiers modèles et démos inutiles créés par défaut par Next.js :
  - `public/vercel.svg`, `public/next.svg`, `public/globe.svg`, `public/file.svg`, `public/window.svg`.
  - `app/favicon.ico`.

---

## 🚀 4. Ce qui RESTE à faire (Prochaines étapes)

1. **Création des tables Supabase** (Optionnel, uniquement si vous souhaitez utiliser la persistance Cloud) :
   - Créez les tables sur votre console Supabase avec les colonnes suivantes :
     - **Table `users`** : `id` (uuid), `pdc` (numeric), `pr_squat` (numeric), `pr_bench` (numeric), `pr_deadlift` (numeric), `pr_ohp` (numeric), `max_snc` (numeric), `updated_at` (timestamp).
     - **Table `blueprints`** : `id` (uuid/text), `user_id` (uuid), `nom` (text), `state` (jsonb), `updated_at` (timestamp).
2. **Déploiement en ligne** :
   - Liez votre dépôt Git `https://github.com/Sk1ndy/Forge.git` sur **Vercel** pour le déployer en production en 1 clic.
