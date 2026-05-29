# 🏛️ DBA_TO_UI_COMMUNICATION (Contrat Base de Données -> UI)

**DE :** Agent Architecte Base de Données (DBA)
**À :** Agent UI (Web & Mobile)
**SUJET :** Règles strictes d'interaction avec Supabase et protection du domaine.

En tant que DBA, j'ai restructuré et blindé la base de données (`0000_master_schema.sql`, `0001_dba_audit_fixes.sql`). Mon but est de protéger l'intégrité des données à tout prix pour l'Engine Biomécanique, et d'assurer des performances O(1). 

Vous (les agents développant l'UI) êtes les "clients" de cette base. Si vous ne respectez pas ce contrat, la base de données rejettera vos requêtes ou vous dégraderez les performances globales. **Lisez ceci avant d'écrire la moindre ligne de code frontend connectée à Supabase.**

---

## 1. LA RÈGLE D'OR : Le Soft Delete
**L'historique est sacré pour le modèle de Banister.** L'Engine a besoin des données passées pour calculer la fatigue résiduelle.
- 🚫 **INTERDIT** : Vous ne devez JAMAIS tenter d'exécuter un `DELETE` SQL sur `workout_sessions` ou `exercise_logs`. (De toute façon, les politiques RLS vous bloqueront violemment).
- ✅ **OBLIGATOIRE** : Pour "supprimer" une séance ou une série, vous devez faire un `UPDATE` en modifiant la colonne `deleted_at` avec le timestamp actuel (`deleted_at = NOW()`).
- *Note* : La policy RLS `SELECT` de la base filtre automatiquement les lignes où `deleted_at IS NOT NULL`. Côté UI, vous n'avez même pas à filtrer manuellement dans le frontend, les données "supprimées" n'arriveront jamais jusqu'à vous.

## 2. SYNCHRONISATION OFFLINE (Bulk Inserts)
- L'Application Mobile (le "Muscle") est conçue pour être offline-first (Zustand/SQLite local).
- Lorsque le réseau revient, il faut synchroniser les données vers Supabase.
- 🚫 **NE FAITES PAS UNE BOUCLE D'INSERTS** (ex: un `map` qui fait 50 appels réseau `supabase.from('exercise_logs').insert(...)`).
- ✅ **FAITES UN BULK INSERT** : Vous DEVEZ envoyer un tableau complet d'objets en une seule requête `supabase.from('exercise_logs').insert([...array_of_logs])`.
- *Pourquoi ?* L'architecture de la base (Clés Étrangères Composites) a été conçue sur-mesure pour encaisser ces Bulk Inserts en O(1) absolu. Servez-vous-en.

## 3. GESTION DES PROFILS (Table Users)
- 🚫 **INTERDIT** : N'essayez jamais de faire un `INSERT` dans la table `users` après la création d'un compte (Signup).
- ✅ **AUTOMATISÉ** : Un Trigger Database Backend s'en charge de manière autonome et sécurisée dès que le compte Auth est créé.
- ✅ L'UI doit uniquement se contenter de faire un `UPDATE` (ex: changer le `pdc`, `age`, etc.) via la page de profil de l'app.

## 4. CALCUL DU TONNAGE (Ne calculez rien dans l'UI)
- 🚫 **INTERDIT** : L'UI Web ne doit pas télécharger toutes les séries d'une séance pour faire un `.reduce()` localement et calculer le tonnage. C'est lourd, lent et redondant.
- ✅ **AUTOMATISÉ** : Le tonnage est calculé de manière incrémentale, en temps réel, par un Trigger SQL ultra-optimisé directement sur la colonne `total_tonnage` de la table `workout_sessions`.
- L'UI doit simplement afficher `session.total_tonnage`.

## 5. CONTRAINTES MATHÉMATIQUES (La DB ne pardonnera pas)
La base de données est le filet de sécurité ultime du modèle biomécanique. Elle rejettera (`HTTP 400/500 Violation de Check Constraint`) vos opérations si vos données UI sont absurdes :
- `actual_weight` ou `planned_weight` < 0
- `actual_reps` ou `planned_reps` < 0
- `actual_rpe` non compris entre 0 et 10
- `ended_at` antérieur à `started_at`
- `pdc` (poids de corps) ou `age` <= 0

✅ **Action pour l'UI** : Vous **devez** implémenter des schémas de validation **Zod** stricts dans vos formulaires (Web et Mobile) avant même de tenter un appel réseau. Si la base de données lève une erreur de contrainte, c'est que votre validation UI a échoué.

## 6. SÉPARATION DES COUCHES (Clean Architecture)
- 🚫 **RAPPEL ARCHITECTURAL** : Conformément à nos règles globales, aucun composant UI (React/React Native) ne doit appeler `supabase.from(...)` directement.
- ✅ Passez TOUJOURS par les dossiers `services/` ou des hooks dédiés qui encapsulent la logique Supabase, préparent le "Data Contract" typé, et gèrent les erreurs silencieusement.
