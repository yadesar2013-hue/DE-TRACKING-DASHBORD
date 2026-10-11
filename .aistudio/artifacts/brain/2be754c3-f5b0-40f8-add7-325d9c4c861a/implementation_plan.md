# Executive Performance Tracker — Fondation HYSTERESIS (2026)

Application exécutive dédiée au pilotage stratégique, à l'évaluation mensuelle et à la replanification opérationnelle des objectifs du Directeur Exécutif de la Fondation HYSTERESIS (mars à décembre 2026), avec double workflow d'évaluation (Directeur Exécutif vs Validation Présidence), calcul automatisé de la prime et intégration Google Drive.

### User Review & Critical Decisions

> [!IMPORTANT]
> Les ajustements demandés par le Directeur Exécutif sont intégrés dans le workflow de performance :
> - **Nomenclature stricte des statuts** : `TERMINE`, `NON TERMINE`, `EN COURS`, `VALIDE`.
> - **Règle de cotation & validation Présidence** :
>   * Toute tâche marquée `TERMINE` par le Directeur Exécutif reçoit provisoirement un score de **1**.
>   * Le statut `VALIDE` est attribué par la Présidente après contrôle des résultats et preuves : le score définitif est alors confirmé à **1**.
>   * Toute tâche `EN COURS` ou `NON TERMINE` reçoit un score de **0**.
>   * Deux indicateurs de taux : le **Taux d'évolution provisoire (DE)** et le **Taux d'évolution validé (Présidence)**.
>   * La prime à verser est calculée sur la base du taux validé par la Présidente (avec affichage prévisionnel basé sur le taux provisoire du DE).
> - **Intégration Google Drive** : Scopes Google Workspace pour lier les preuves d'exécution (PV, rapports, contrats) et sauvegarder les fiches mensuelles d'évaluation.
> - **Replanification T4 (Octobre à Décembre 2026)** : Rebascule de toutes les activités non finalisées au 30 septembre 2026, avec sanctuarisation des jalons réels (Conversations Inspirantes le 6 juin 2026, Journée de l'Excellence du 27 au 30 août 2026, Cohorte 2 le 24 octobre 2026).

---

### 1. Overview & Core Concept

- **Rôle de l'application** : Traduire et moderniser le canevas Excel `EVALUATION MENSUELLE DE` et le `PTA_Detaillé_Brut_2026_FH_Final` selon le cadre contractuel du Contrat d'Objectifs et de Performance (COP).
- **Acteurs du système** :
  1. **Directeur Exécutif** (Monsieur YADES Arsène Jean de Dieu) : Déclare l'avancement, renseigne les livrables et preuves, estime les tâches `TERMINE` (score 1 provisoire) ou `EN COURS`/`NON TERMINE` (score 0), et prépare la replanification.
  2. **Présidente de la Fondation** (Madame Cheryle IDOSSOU) : Révise les preuves fournies, valide formellement les tâches achevées en leur attribuant le statut `VALIDE` (score 1 définitif), émet ses observations et valide le montant de la prime à verser.
- **Cascade d'objectifs** :
  $$\text{Catégorie COP (A, B, C, D)} \longrightarrow \text{Objectif Stratégique} \longrightarrow \text{Objectif Opérationnel} \longrightarrow \text{Programme PTA} \longrightarrow \text{Activité/Tâche}$$

---

### 2. User Experience & Visual Design

- **Architecture de l'interface** :
  - **Barre supérieure exécutive (Top Bar Contract)** :
    * Zone Marque : `Fondation HYSTERESIS` (typographie élégante, institutionnelle).
    * Zone Navigation : 4 onglets majeurs (`Tableau Exécutif`, `Canevas Mensuel`, `Replanification T4`, `Mobilisation 100M`).
    * Zone Action : Sélecteur de rôle d'évaluation (`Vue Directeur Exécutif` / `Validation Présidence`) + Bouton Google Drive Sync & Export.
  - **Sélecteur de Période (Mars à Décembre 2026)** :
    * Navigation mois par mois avec indicateurs visuels d'avancement pour chaque mois.
    * Vue consolidée annuelle permettant de voir l'évolution cumulative depuis mars 2026.

- **Vues détaillées** :
  1. **Canevas d'Évaluation Mensuelle (Modèle Juillet Révisé)** :
     - Tableau haute densité reprenant exactement les colonnes :
       `Catégorie COP` | `Objectif Stratégique` | `Objectif Opérationnel` | `Programme PTA` | `Activité / Tâche` | `Deadline COP` | `Report` | `Résultats Attendus` | `Statut (TERMINE / NON TERMINE / EN COURS / VALIDE)` | `Score (0 ou 1)` | `Preuve` | `Observations`
     - **Bandeau de synthèse mensuelle (KPIs & Prime)** :
       * Nombre total de tâches programmées dans le mois ($N$)
       * Nombre de tâches terminées déclarées par le DE ($T_{\text{termine}}$) $\rightarrow$ Taux provisoire = $T_{\text{termine}} / N$
       * Nombre de tâches validées par la Présidence ($V_{\text{valide}}$) $\rightarrow$ Taux officiel = $V_{\text{valide}} / N$
       * Taux d'évolution global cumulé depuis mars 2026 (%)
       * Prime du Directeur Exécutif :
         $$\text{Prime validée} = \text{Base forfaitaire} \times \frac{V_{\text{valide}}}{N}$$
         (avec affichage en miroir de la prime prévisionnelle basée sur le taux provisoire)
  2. **Console de Validation Présidence (Revue & Arbitrage)** :
     - Mode focalisé permettant à la Présidente de passer en revue uniquement les tâches marquées `TERMINE`.
     - Bouton d'action directe "Valider la tâche" (passe de `TERMINE` à `VALIDE`, fige le point 1) ou "Demande de complément" (avec champ observation).
     - Bouton de validation globale du mois avec visa électronique de la Présidence.
  3. **Module de Replanification T4 (Octobre - Décembre 2026)** :
     - Identification automatique des activités des mois de mars à septembre dont le statut est `NON TERMINE` ou `EN COURS`.
     - Grille de replanification interactive : réassignation vers Octobre, Novembre ou Décembre 2026 avec inscription du motif de report dans la colonne `Report`.
     - Intégration des dates fixes validées :
       * Journée de l'Excellence : tenue du 27 au 30 août 2026 (`VALIDE`).
       * Conversations Inspirantes : lancées le 6 juin 2026 (`VALIDE`).
       * Sortie de la Cohorte 2 : fixée au 24 octobre 2026.
  4. **Suivi de Mobilisation des 100 000 000 FCFA** :
     - Étalement mensuel et trimestriel de l'objectif financier jusqu'au 31 décembre 2026.
     - Suivi du pipe de partenariats ($\ge 15$ contrats requis par le COP).
     - Suivi de la mobilisation pour les prestations du DE (juin-décembre).
  5. **Connecteur Google Drive** :
     - Authentification sécurisée Google Workspace.
     - Rattachement de liens de fichiers Drive (rapports, fiches, PV) directement dans la colonne `Preuve`.
     - Export / Sauvegarde des synthèses mensuelles et rapports d'évaluation sur Google Drive.

- **Design System & Anti-Slop** :
  - Palette ardoise neutre (`slate-900`, `slate-50`, accents `amber-700` et `emerald-700` mesurés).
  - Statuts lisibles en typographie pure sans pilules criardes (`VALIDE` en vert émeraude sobre, `TERMINE` en bleu discret, `EN COURS` en ambre, `NON TERMINE` en ardoise atténuée).
  - Numériques tabulaires (`font-mono tabular-nums`).

---

### 3. Key Product Decisions & Trade-Offs

- **Décision 1 : Logique des Statuts et Matrice de Notation**
  - *Approche choisie* : Statuts exclusifs `VALIDE`, `TERMINE`, `EN COURS`, `NON TERMINE`.
    * `VALIDE` = 1 point (validé par la Présidente).
    * `TERMINE` = 1 point provisoire (déclaré par le DE en attente de visa).
    * `EN COURS` = 0 point.
    * `NON TERMINE` = 0 point.
  - *Raison* : Correspond exactement à la règle transmise par le Directeur Exécutif, assurant une parfaite transparence entre la déclaration opérationnelle et la validation hiérarchique.
- **Décision 2 : Sécurité et Continuité d'Usage**
  - *Approche choisie* : Persistance complète dans `localStorage` combinée à la sauvegarde cloud Google Drive.
  - *Raison* : L'application fonctionne instantanément, sans risque de perte de données en cas de déconnexion ou de latence réseau.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   EXECUTIVE PERFORMANCE TRACKER UI                     │
├────────────────────┬────────────────────┬──────────────────────────────┤
│  Tableau Exécutif  │  Canevas Mensuel   │ Replanification T4 & 100M    │
└─────────┬──────────┴─────────┬──────────┴──────────────┬───────────────┘
          │                    │                         │
          ▼                    ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE EVALUATION ENGINE                          │
│  - copDatabase (4 Catégories A, B, C, D & Objectifs COP)              │
│  - taskStore (Toutes tâches PTA 2026 de Mars à Décembre)               │
│  - statusWorkflow:                                                     │
│      TERMINE (score prov. = 1) -> VALIDE par Présidence (score def. = 1)│
│      EN COURS (score = 0), NON TERMINE (score = 0)                     │
│  - monthlyMetrics: % Provisoire, % Validé, % Global, Prime mensuelle   │
│  - replanningMatrix: Bascule automatique non-terminés fin sept -> T4   │
└──────────────────┬─────────────────────────────┬───────────────────────┘
                   │                             │
                   ▼                             ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  Local Persistence (localStorage)    │  │  Google Drive Workspace API  │
│  - Préchargement complet du PTA 2026 │  │  - OAuth via Firebase Auth   │
│  - Fiches d'évaluation mensuelles    │  │  - Lier preuves Drive        │
│  - Export CSV / Excel / Impression   │  │  - Sauvegarde fiches d'éval  │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

#### Éléments de Données Principaux :
- **TaskItem** :
  * `id` : string
  * `copCategory` : 'A_ACTIVITES' | 'B_RH' | 'C_GOUVERNANCE' | 'D_FINANCES'
  * `strategicObjective` : Titre et code OS
  * `operationalObjective` : Titre et code OO
  * `programmePta` : Programme PTA de rattachement
  * `activity` : Description détaillée
  * `deadlineCop` : Échéance contractuelle
  * `month` : 3 à 12 (Mars à Décembre)
  * `report` : Mention de report (ex: "Reporté d'août à octobre")
  * `expectedResult` : Livrable quantifiable
  * `status` : `'VALIDE'` | `'TERMINE'` | `'EN_COURS'` | `'NON TERMINE'`
  * `proof` : Lien Google Drive ou description du livrable
  * `observations` : Notes et retours
  * `validatedByPresident` : booléen
  * `validationDate` : date
- **Calcul du Score par Tâche** :
  * `taskScore(task) = (task.status === 'VALIDE' || task.status === 'TERMINE') ? 1 : 0`
  * `officialScore(task) = task.status === 'VALIDE' ? 1 : 0`
- **Calcul Mensuel** :
  * Total tâches prévues au mois $m$ : $N_m$
  * Taux provisoire = $\frac{\sum \text{taskScore}(t)}{N_m} \times 100$
  * Taux officiel validé = $\frac{\sum \text{officialScore}(t)}{N_m} \times 100$
  * Taux d'évolution global = cumul de mars au mois $m$
  * Prime du mois = $\text{Base} \times \text{Taux officiel validé}$ (avec affichage de la prime provisoire estimée).

---
