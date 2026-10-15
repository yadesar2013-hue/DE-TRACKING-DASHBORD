# Tableau de bord DE — correction et mise en service

Version préparée le 15 octobre 2026 à partir du ZIP transmis.

## Ce qui a été corrigé

- Une même source de données pour tous les appareils : l'espace de travail partagé est chargé avant de permettre les modifications.
- Suppression des migrations qui effaçaient les anciens caches ou remplaçaient un mois entier sur la seule base du nombre de tâches.
- Suppression des faux partages cloud stockés uniquement dans le navigateur du créateur. Une erreur réseau est désormais signalée comme telle.
- API Vercel explicite dans `api/`, avec stockage durable Redis par API REST. Aucune écriture sur le disque de Vercel.
- Une copie ancienne ne peut pas écraser silencieusement les modifications d'un autre appareil : comparaison atomique des numéros de version.
- Sauvegarde locale des modifications en attente lors d'un conflit et export JSON téléchargeable.
- Les liens de partage restent des sessions distinctes. Une modification dans un partage ne remplace pas le tableau global.
- Les mises à jour du mois, de la prime et des tâches sont chargées ensemble ; un montant de prime nul est conservé.
- Les changements de rôle ou de mois consulté ne provoquent plus de sauvegarde des tâches.
- Identifiants uniques pour les nouvelles tâches, y compris les sous-tâches créées simultanément.
- Correction du conflit de dépendances `esbuild` / Vite et ajout d'un verrou npm reproductible.

## Données intégrées

Vous avez choisi les données du ZIP. Aucun résultat, montant ou statut nouveau n'a été inventé.

Les 235 tâches de `src/data/initialTasks.ts` constituent la référence chargée lors de la création du stockage partagé. Elles sont aussi fournies dans `data/donnees-reference-2026.json` pour consultation et sauvegarde.

| Mois 2026 | Tâches | Validées |
|---|---:|---:|
| Mars | 6 | 5 |
| Avril | 6 | 5 |
| Mai | 46 | 46 |
| Juin | 51 | 6 |
| Juillet | 23 | 22 |
| Août | 29 | 16 |
| Septembre | 17 | 4 |
| Octobre | 27 | 0 |
| Novembre | 15 | 0 |
| Décembre | 15 | 0 |
| **Total** | **235** | **104** |

Le mois initial reste septembre, comme dans le projet transmis. Vous pouvez sélectionner octobre depuis l'interface. Les tâches non validées ne sont pas automatiquement déclarées réalisées.

Les saisies présentes uniquement dans un ancien navigateur ne sont pas contenues dans ce ZIP. Leurs clés de stockage sont conservées ; ne videz pas les données de navigation avant de les avoir récupérées si vous en avez besoin.

## 1. Remettre les fichiers dans GitHub

1. Téléchargez et décompressez le ZIP corrigé.
2. Dans le dépôt GitHub existant, remplacez les fichiers du projet par ceux du dossier corrigé. `package.json`, `vercel.json`, `server.ts`, `api/`, `backend/`, `src/`, `tests/` et `package-lock.json` doivent se trouver à la racine du projet, sans dossier imbriqué supplémentaire.
3. N'envoyez ni `node_modules`, ni `dist`, ni votre fichier `.env`.
4. Validez les modifications avec un commit. Si vous utilisez VS Code :

```bash
git add .
git commit -m "Corriger les données partagées et le déploiement Vercel"
git push
```

Le fichier `bun.lock` du ZIP initial peut rester dans le dépôt : la configuration Vercel impose désormais `npm ci`, qui utilise `package-lock.json`.

## 2. Configurer le stockage partagé dans Vercel

Cette étape est nécessaire : le ZIP ne peut pas créer ni configurer votre base distante à votre place.

1. Créez une base Redis compatible avec l'API REST Upstash, depuis votre compte Upstash ou une intégration disponible dans votre espace Vercel.
2. Récupérez l'URL REST et le jeton REST disposant des droits de lecture et d'écriture.
3. Dans votre projet Vercel, ouvrez les paramètres des variables d'environnement.
4. Ajoutez ces variables pour l'environnement **Production** :

| Variable | Valeur à renseigner |
|---|---|
| `UPSTASH_REDIS_REST_URL` | URL REST de la base |
| `UPSTASH_REDIS_REST_TOKEN` | Jeton REST de la base |
| `TRACKER_ACCESS_CODE` | Code d'accès privé suffisamment long, à communiquer uniquement aux collaborateurs autorisés |
| `TRACKER_STORAGE_PREFIX` | `hysteresis:ept:2026` |

Les noms alternatifs `KV_REST_API_URL` et `KV_REST_API_TOKEN` sont également pris en charge. Utilisez une paire complète du même fournisseur.

Ne préfixez pas ces variables par `VITE_` et ne les inscrivez pas dans GitHub : elles sont réservées au serveur. La clé Gemini ne sert pas au stockage de ce tableau de bord.

Pour Preview, utilisez un préfixe différent, par exemple `hysteresis:ept:2026:preview`, pour ne pas modifier les données de production pendant les essais.

Le code d'accès protège l'espace partagé ; les boutons DE / Présidente restent des modes d'interface et ne constituent pas une vérification de l'identité de chaque personne. Le code ne doit pas être placé dans un lien de partage.

## 3. Redéployer

- Conservez le préréglage **Vite** et le bon dossier racine dans Vercel.
- La configuration fournie utilise `npm ci`, `npm run build` et le dossier de sortie `dist`.
- Utilisez Node.js 22.12 ou supérieur (Node.js 24 convient).
- Après ajout des variables, lancez un nouveau déploiement de production.
- À la première ouverture, saisissez le code d'accès. Les 235 tâches du ZIP initialisent l'espace partagé une seule fois. Les ouvertures suivantes chargent les modifications déjà enregistrées.

Une mise à jour du code ne réinitialise jamais automatiquement une base existante. Pour remettre un mois à sa référence du ZIP, utilisez l'action de restauration du mois dans l'application après avoir exporté une sauvegarde.

## 4. Vérifier sur PC et mobile

1. Ouvrez exactement le même lien de production sur les deux appareils, avec ou sans le même paramètre `?share=...`.
2. Saisissez le code d'accès sur chacun.
3. Sélectionnez le même mois et les mêmes filtres.
4. Modifiez une observation sur le PC. Attendez l'actualisation de l'heure de synchronisation.
5. Sur le mobile, utilisez **Actualiser / Réessayer**, ou attendez environ cinq secondes lorsque la page est active.
6. Vérifiez que la modification apparaît, puis faites l'essai dans l'autre sens.

En cas d'erreur de connexion, les modifications restent locales et le bandeau indique l'échec. Lors d'un conflit, aucune fusion automatique n'est faite : exportez votre copie JSON, puis chargez la version récente avec **Actualiser / Réessayer**. Réappliquez ensuite les modifications utiles. Le JSON exporté est une copie de récupération ; il n'est pas réimporté automatiquement.

Les anciennes adresses de partage créées uniquement en local ne peuvent pas être récupérées sur un autre appareil. Créez un nouveau lien après la mise en service du stockage durable.

## Essai local

```bash
npm ci
npm run dev
```

Ouvrez `http://localhost:3000`. Sans variables Redis, le développement local utilise `data/cloud-store.json`. Sur Vercel, ce repli local est interdit : une configuration manquante produit une erreur explicite.

Pour tester aussi le code d'accès en local, copiez `.env.example` vers `.env` et renseignez `TRACKER_ACCESS_CODE`. Le serveur charge ce fichier ; il ne doit pas être envoyé dans GitHub.

`npm run preview` sert uniquement à prévisualiser les fichiers Vite : il ne lance pas l'API. Utilisez `npm run dev` pour tester l'application complète.

## Vérifications réalisées

- `npm run lint` : vérification TypeScript.
- `npm run build` : compilation de production.
- `npm test` : tests de l'API, du protocole REST Redis et de deux instances de l'interface React.
- Scénarios vérifiés : accès privé, même référence de 235 tâches, absence d'écriture au démarrage, conservation des anciens caches, propagation des changements, conflits entre appareils, prime nulle, liste de tâches vide, refus de doublons et isolation des partages.

Le stockage Redis réel et le déploiement de votre compte Vercel restent à vérifier après configuration. Aucun accès à votre compte Vercel ni aucune publication dans votre dépôt n'a été effectué.

Références techniques :
- https://vercel.com/docs/functions
- https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions
- https://upstash.com/docs/redis/features/restapi
