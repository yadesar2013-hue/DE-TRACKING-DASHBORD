# Sauvegarde Cloud Collaborative & Intégration Drive Fondation HYSTERESIS

Mise en place d'un système complet d'enregistrement et de partage dans le cloud avec génération de liens uniques pour les collaborateurs, couplé à l'intégration systématique d'un accès direct au dossier officiel Google Drive (« Executive Performance Tracker - Fondation HYSTERESIS ») pour chaque preuve de l'évaluation du Directeur Exécutif.

## Décisions Clés & Réponses Validées

> [!IMPORTANT]
> Décisions confirmées suite à vos réponses aux questions d'orientation :
> - **Mode de partage** : Bouton d'enregistrement cloud avec génération d'un lien de partage direct permettant à toute personne recevant le lien de visualiser instantanément l'état complet des données (tâches, évaluations, statuts, observations).
> - **Intégration du dossier Drive** : Intégration d'un bouton direct vers le dossier officiel Google Drive (« Executive Performance Tracker - Fondation HYSTERESIS » : `https://drive.google.com/drive/folders/1h-vKuDGeu151t0r0N0EuYvgW8B92HKkM?usp=drive_link`) accessible sur chaque ligne de preuve dans le canevas d'évaluation du DE.

---

## 1. Vue d'Ensemble & Fonctionnalités

### Ce que le système apporte
1. **Sauvegarde & Partage Collaboratif dans le Cloud** :
   - Un bouton « Sauvegarder & Partager » mis en valeur dans la barre de navigation et les vues principales.
   - Création instantanée d'un instantané (snapshot) dans le cloud identifié par un code unique.
   - Génération d'un lien de partage complet (ex. `https://.../?share=xyz123`) prêt à copier d'un clic pour envoi aux collaborateurs (WhatsApp, email, intranet).
   - Chargement automatique des données sauvegardées lorsqu'un collaborateur ouvre ce lien, avec notification institutionnelle discrète (« Données partagées chargées depuis la sauvegarde ») et possibilité de basculer entre la version partagée et la version locale.
   - Sauvegarde hybride résiliente : API de snapshot côté serveur + encodage compact en URL de secours pour garantir la pérennité totale des partages même après redémarrage.

2. **Dossier Drive Officiel « Executive Performance Tracker - Fondation HYSTERESIS »** :
   - Présence d'un bouton direct d'accès au dossier Drive officiel (`https://drive.google.com/drive/folders/1h-vKuDGeu151t0r0N0EuYvgW8B92HKkM?usp=drive_link`) pour chaque ligne de tâche et sous-tâche dans le tableau d'évaluation du DE.
   - Bandeau d'accès rapide en en-tête du tableau d'évaluation avec lien direct vers le dossier officiel.
   - Dans l'éditeur rapide de preuve, bouton 1-clic « Insérer le dossier Drive officiel » pour préremplir ou associer directement le lien officiel.
   - Conservation intégrale de la prime contractuelle mensuelle à 150 000 FCFA et de la mention institutionnelle « Fondation HYSTERESIS — Cotonou, Bénin ».

---

## 2. Expérience Utilisateur & Design Visuel

### Parcours Utilisateur
1. **Enregistrement et Partage** :
   - L'utilisateur effectue ses modifications (statuts, preuves, replanifications, observations).
   - Il clique sur le bouton « Partager / Sauvegarder » dans la barre supérieure.
   - Une fenêtre modale soignée s'affiche avec :
     - Bouton d'action « Créer un lien de partage cloud ».
     - Affichage du lien généré avec bouton « Copier le lien » et retour visuel instantané (« Copié dans le presse-papier ! »).
     - Date et heure de la sauvegarde et récapitulatif du nombre de tâches enregistrées.
     - Bouton de test immédiat « Ouvrir le lien partagé ».
2. **Consultation par les Collaborateurs** :
   - Le collaborateur clique sur le lien reçu.
   - L'application s'ouvre avec un bandeau informatif en haut : « Version partagée de la Fondation HYSTERESIS — Mise à jour le [date/heure] ».
   - L'ensemble des tableaux, taux d'avancement, primes et observations reflète exactement ce qui a été enregistré.
3. **Accès au Drive sur chaque preuve dans l'évaluation du DE** :
   - Dans la colonne « Preuve / Lien de vérification » de chaque ligne de tâche :
     - Si une preuve spécifique existe : affichage du lien/libellé spécifique ET du bouton compact « Drive HYSTERESIS ↗ ».
     - Si aucune preuve spécifique n'est encore saisie : bouton d'accès rapide direct au dossier Drive officiel avec libellé clair (« Dossier Drive officiel »).

### Principes Visuels
- **Palette** : Bleu marine institutionnel (`#0F172A`), émeraude pour la confirmation de copie, ardoise pour les surfaces neutres.
- **Typographie** : `Plus Jakarta Sans` pour la structure, chiffres tabulaires `tabular-nums` pour les montants (150 000 FCFA) et les taux.
- **Rigueur anti-pollution visuelle** : Pas de faux compteurs ni de badges superflus. Boutons clairs et univoques (« Copier le lien », « Dossier Drive ↗ »).

---

## 3. Décisions Architecturales & Compromis

- **Stockage Cloud Hybride (Serveur + URL)** :
  - *Approche choisie* : Un point d'accès serveur persistant `/api/shares` qui enregistre l'instantané JSON et retourne un identifiant de partage court (`?share=...`), combiné avec un encodage URL résilient si nécessaire.
  - *Pourquoi* : Permet des liens très courts, faciles à copier et à partager sur WhatsApp ou par courriel, sans nécessiter de mot de passe complexe pour les collaborateurs en lecture.
- **Bouton Direct Drive sur chaque ligne** :
  - *Approche choisie* : Composant dédié `DriveLinkBadge` affichant un lien externe clair vers le dossier Google Drive officiel avec infobulle explicite (« Ouvrir le dossier officiel des preuves dans Google Drive »).
  - *Pourquoi* : Répond exactement à l'attente du DE et des évaluateurs d'accéder instantanément au référentiel des pièces justificatives sans navigation superflue.

---

## 4. Architecture Technique & Flux de Données

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             NAVBAR PRINCIPALE                               │
│  [Fondation HYSTERESIS]  [Canevas DE]  [Replanification]  [Partager 🔗]      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         Clic « Partager / Sauvegarder »
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODALE DE SAUVEGARDE & PARTAGE                           │
│  - Instantané de l'état : Tâches, Taux, Primes (150 000 FCFA), Mois         │
│  - Génération de l'identifiant cloud                                        │
│  - Lien unique généré : https://.../?share=<ID>                             │
│  - Bouton « Copier le lien » avec accusé de réception                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                  Ouverture du lien par un collaborateur
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GESTIONNAIRE D'ÉTAT (TRACKER CONTEXT)                    │
│  - Détection du paramètre d'URL `?share=<ID>` au chargement                │
│  - Récupération du snapshot depuis `/api/shares/:id`                        │
│  - Hydratation des tâches partagées pour tous les collaborateurs            │
│  - Bannière institutionnelle de notification                                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 CANEVAS D'ÉVALUATION MENSUELLE DU DE                        │
│  - Chaque ligne de tâche/sous-tâche possède son bouton direct :             │
│    « Drive HYSTERESIS ↗ » -> https://drive.google.com/drive/folders/1h-...  │
│  - Bandeau officiel en tête de canevas vers le dossier Drive                │
│  - Évaluation de prime sur base contractuelle de 150 000 FCFA               │
└─────────────────────────────────────────────────────────────────────────────┘
```
