# FORGE — Simulateur d'ingénierie sportive

**Forge un programme que ton corps peut réellement encaisser.**

Application web (SPA) de **conception assistée** pour la programmation sportive : l'utilisateur construit un programme hebdomadaire (*Blueprint*) et en simule l'impact physiologique (fatigue locale et systémique) via un avatar anatomique interactif.

> Source fonctionnelle : cahier des charges Obsidian (`Obsidian Vault/Forge/`).

---

## Sommaire

1. [Vision et périmètre](#vision-et-périmètre)
2. [Fonctionnalités](#fonctionnalités)
3. [Moteur de simulation](#moteur-de-simulation)
4. [Architecture](#architecture)
5. [Interface (zoning)](#interface-zoning)
6. [Parcours utilisateur](#parcours-utilisateur)
7. [Stack technique](#stack-technique)
8. [Modèle de données](#modèle-de-données)
9. [Hors périmètre](#hors-périmètre)

---

## Vision et périmètre

| Élément | Description |
|--------|-------------|
| **Type** | SPA (Single Page Application) |
| **Positionnement** | CAO pour la programmation sportive |
| **Objectif** | Blueprint hebdomadaire + simulation instantanée (heatmap musculaire + jauge SNC) |
| **Calculs** | Côté client, sans latence, à chaque modification du séquenceur |

---

## Fonctionnalités

### Panneau de calibrage

- Poids de corps (PDC)
- Records personnels (1RM) : Squat, Développé couché, Soulevé de terre, Overhead press
- Sert de base aux calculs d'intensité relative et de ratio charge/PDC

### Espace de planification (séquenceur 7 jours)

- Calendrier Lundi → Dimanche
- Drag & drop depuis la bibliothèque d'exercices
- Par exercice : séries, répétitions, poids (kg), RPE
- **Toggle** global par jour et par exercice (élément désactivé = exclu de la simulation)

### Interface de simulation

- Avatar anatomique 2D/3D (face / dos), calques SVG par groupe musculaire
- **Heatmap** : couleur en temps réel selon le volume hebdomadaire activé
- **Jauge SNC** : stress systémique (système nerveux central)
- **Tooltips** au survol : nom du muscle, statut, volume cumulé, score INOL, top 2 exercices contributeurs

---

## Moteur de simulation

Tous les calculs s'exécutent **côté client** à chaque changement du plan.

### Fatigue locale — INOL modifié

Pour chaque série planifiée :

1. **Intensité (%)** = `Poids série / PR (1RM) × 100`
2. **Score INOL (série)** = `Répétitions / (100 - Intensité)`
3. **Répartition** : muscle primaire 100 %, synergistes 50 %

### Grille de colorimétrie (avatar)

| Couleur | Signification |
|---------|----------------|
| Gris | Volume insuffisant / maintien |
| Vert | Zone optimale (hypertrophie) |
| Orange | Overreaching (récupération incomplète probable) |
| Rouge | MRV dépassé / surentraînement local |

### Modificateur nerveux (jauge SNC)

Impact selon le ratio charge/PDC et le **tier** de l'exercice :

| Tier | Exemples | Multiplicateur SNC | Condition notable |
|------|----------|-------------------|-------------------|
| 1 | Squat, soulevé de terre (axial lourd) | ×1.5 | Si charge > 1,5× PDC |
| 2 | Tractions, développé couché | ×1.2 | — |
| 3 | Isolation | ×1.0 | Impact surtout local |

**Échec systémique** : si la somme des points SNC dépasse la limite du gabarit utilisateur → avatar entier en gris.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (SPA)                             │
│  State (toggles, séquenceur) → Moteur INOL/SNC → SVG heatmap    │
└────────────────────────────┬────────────────────────────────────┘
                             │ SDK Supabase / Drizzle
┌────────────────────────────▼────────────────────────────────────┐
│  Supabase (Auth + Postgres)                                      │
│  exercices (RO) │ users (PDC, PR) │ blueprints (JSON 7 jours)   │
└─────────────────────────────────────────────────────────────────┘
```

- Simulations **stateless** côté serveur : fluidité maximale en local
- BDD : constantes (exercices), profil, sauvegarde des blueprints terminés

---

## Interface (zoning)

| Zone | Part d'écran | Contenu |
|------|--------------|---------|
| Gauche | ~20 % | Profil (PDC, PR), blueprints sauvegardés, jauge SNC |
| Centre haut | ~80 % × 60 % | Avatar SVG (face / dos) |
| Centre bas | ~80 % × 40 % | Séquenceur 7 colonnes (scroll horizontal si besoin) |
| Droite (tiroir) | Rétractable | Bibliothèque d'exercices (filtres muscle / équipement) |

---

## Parcours utilisateur

1. **Landing** — promesse produit
2. **Connexion** — Supabase Auth (Google / Magic Link), sans logique mot de passe custom
3. **Calibrage** — modale : PDC + 1RM Squat / Bench / Deadlift
4. **Cockpit** — avatar gris (état vierge)
5. **Planification** — drag & drop vers les jours
6. **Feedback temps réel** — heatmap + tooltips ; toggle off → recalcul immédiat
7. **Sauvegarde** — blueprint persisté sur Supabase

---

## Stack technique

| Couche | Choix recommandé |
|--------|------------------|
| Frontend | React ou Next.js (état complexe, recalcul instantané) |
| UI / tooltips | shadcn/ui (Radix Tooltip) |
| SVG | Mapping ID muscle ↔ état React (`fill`, opacité hover) |
| Backend / BDD | Supabase (Postgres) + Drizzle ORM |
| Auth | Supabase Auth (social, magic link) |
| Déploiement | Vercel ou Netlify |

---

## Modèle de données

### `exercices` (lecture seule)

| Champ | Description |
|-------|-------------|
| `id` | Identifiant |
| `nom` | Libellé |
| `tier_snc` | 1, 2 ou 3 |
| `muscle_primaire` | ex. `chest_major` |
| `muscles_secondaires` | IDs synergistes |

### `users`

Connexion, PDC, PRs (1RM).

### `blueprints`

Programmes sauvegardés : JSON structuré (7 jours, séries, toggles, paramètres par exercice).

---

## Hors périmètre

- Suivi quotidien (tracker)
- Historique de progression
- Mécaniques de jeu (RPG)

---

## Structure du dépôt (cible)

```
Forge/
├── README.md          # Ce document
├── frontend/          # SPA React/Next (à créer)
├── supabase/          # Migrations, schéma (à créer)
└── docs/              # Spécifications détaillées (optionnel)
```

---

## Roadmap de Développement (Feuille de Route)

Ce plan détaillé sert de guide pas-à-pas pour la création du projet.

### 🛠️ Phase 1 : Fondations et Architecture (Setup)
**Objectif** : Mettre en place l'environnement et les outils.
- [ ] Initialiser le projet Next.js (TypeScript, App Router).
- [ ] Configurer Tailwind CSS et shadcn/ui pour les composants.
- [ ] Configurer Supabase (projet lié, clés dans `.env`).
- [ ] Définir la structure (`src/components`, `src/lib`, etc.).

### 🗄️ Phase 2 : Modèle de Données et Auth
**Objectif** : Structurer la BDD et sécuriser l'accès.
- [ ] Créer le schéma Supabase (`users`, `exercices`, `blueprints`).
- [ ] Configurer le RLS sur Supabase.
- [x] Implémenter l'auth (Google / Magic Link).
- [ ] Créer un script de seed pour la table `exercices` (avec tier_snc, muscles).
- [ ] Créer la modale de "Calibrage" (PDC, PRs).

### 🧮 Phase 3 : Moteur de Simulation (Core Logic)
**Objectif** : Développer la logique métier indépendamment de l'UI.
- [ ] Créer les fonctions de calcul INOL (Intensité, Répétitions, Poids).
- [ ] Créer le calcul SNC (basé sur PDC et Tier).
- [ ] Créer les tests unitaires (Jest/Vitest) pour les calculs.
- [ ] Logique de mapping volume -> couleur heatmap.

### 🧍 Phase 4 : Interface Visuelle - L'Avatar
**Objectif** : Feedback visuel interactif.
- [ ] Intégrer l'avatar SVG avec des calques par groupe musculaire.
- [ ] Créer le composant React Avatar réactif aux props de stress.
- [ ] Implémenter les Tooltips (shadcn/ui) au survol.
- [ ] Créer la jauge visuelle SNC.

### 📅 Phase 5 : Séquenceur et Bibliothèque
**Objectif** : Construction du programme.
- [ ] Créer la "Bibliothèque d'exercices" (recherche/filtres).
- [ ] Implémenter la grille de 7 jours.
- [ ] Intégrer le Drag & Drop vers le séquenceur.
- [ ] Créer les "Cartes Exercice" (séries, reps, poids, RPE, Toggles).

### 🧠 Phase 6 : État Global et Intégration
**Objectif** : Relier le séquenceur au moteur en temps réel.
- [ ] Mettre en place le state global (Zustand ou Context) pour le Blueprint.
- [ ] Connecter le séquenceur au moteur de calcul (recalcul instantané).
- [ ] Connecter le résultat du moteur à l'Avatar et à la jauge SNC.

### 💾 Phase 7 : Persistance et Finalisation
**Objectif** : Sauvegarder et peaufiner.
- [ ] Implémenter la sauvegarde (JSON) du Blueprint dans Supabase.
- [ ] Créer la vue "Mes Blueprints" (historique).
- [ ] Gérer l'échec systémique visuel.
- [ ] Déploiement sur Vercel.

---

*Dernière mise à jour : mai 2026*
