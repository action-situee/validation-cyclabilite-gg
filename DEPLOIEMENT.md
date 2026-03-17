# Guide de déploiement - Portail Cyclabilité Grand Genève

Ce document décrit les différentes options de déploiement du portail.

## 🚀 Déploiement rapide (Frontend seul)

### Option 1 : Figma Make (Recommandé pour prototype)

Le portail est déjà prêt à être déployé via Figma Make.
- Aucune configuration supplémentaire nécessaire
- Fonctionne avec les données mockées
- Stockage dans le localStorage du navigateur

### Option 2 : Vercel

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel
```

Configuration automatique grâce à Vite.

### Option 3 : Netlify

```bash
# 1. Installer Netlify CLI
npm install -g netlify-cli

# 2. Se connecter
netlify login

# 3. Déployer
netlify deploy --prod
```

**Build settings** :
- Build command: `npm run build`
- Publish directory: `dist`

### Option 4 : GitHub Pages

1. Créer un repository GitHub
2. Pousser le code
3. Activer GitHub Pages dans les settings
4. Configurer avec GitHub Actions pour le build automatique

## 🗄️ Déploiement avec backend

### Option 1 : Supabase (Recommandé)

#### Avantages
- Backend as a Service gratuit pour commencer
- PostgreSQL managé
- Authentification intégrée
- Storage pour les photos
- API REST et Realtime automatiques

#### Setup

1. **Créer un projet Supabase**
   ```bash
   # Visiter https://supabase.com
   # Créer un nouveau projet
   ```

2. **Créer les tables**
   ```sql
   -- Table des retours
   CREATE TABLE retours_questionnaire (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     association TEXT NOT NULL,
     nom_repondant TEXT NOT NULL,
     email_repondant TEXT NOT NULL,
     mode_releve TEXT NOT NULL,
     faisceau_id TEXT NOT NULL,
     cible_id TEXT NOT NULL,
     date_observation DATE NOT NULL,
     heure_observation TIME,
     sens_deplacement TEXT,
     motif_deplacement TEXT,
     coherence_indice_note INTEGER,
     indice_calcule_juge TEXT,
     cyclabilite_percue_note INTEGER,
     permeabilite_note INTEGER,
     alternatives_note INTEGER,
     continuite_note INTEGER,
     intersections_note INTEGER,
     giratoires_note INTEGER,
     epaisseur_frontiere_note INTEGER,
     differentiel_fr_ch_note INTEGER,
     securite_note INTEGER,
     confort_note INTEGER,
     stress_ressenti_note INTEGER,
     potentiel_intervention_rapide_note INTEGER,
     priorite_action_note INTEGER,
     probleme_principal TEXT,
     probleme_secondaire TEXT,
     point_positif_principal TEXT,
     type_action_suggeree TEXT,
     description_alternative TEXT,
     proposition_concrete TEXT,
     commentaire_libre TEXT,
     photo_url TEXT,
     photo_legende TEXT,
     photo_latitude DECIMAL,
     photo_longitude DECIMAL,
     photo_source_geoloc TEXT,
     accord_publication_photo BOOLEAN,
     besoin_contact_suivi BOOLEAN,
     divergence DECIMAL,
     categorie_divergence TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Index pour performances
   CREATE INDEX idx_retours_cible ON retours_questionnaire(cible_id);
   CREATE INDEX idx_retours_faisceau ON retours_questionnaire(faisceau_id);
   CREATE INDEX idx_retours_date ON retours_questionnaire(date_observation DESC);

   -- Storage bucket pour les photos
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('photos-terrain', 'photos-terrain', true);

   -- Politique de stockage
   CREATE POLICY "Les photos sont accessibles publiquement"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'photos-terrain');

   CREATE POLICY "Les utilisateurs authentifiés peuvent uploader"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'photos-terrain');
   ```

3. **Installer le client Supabase**
   ```bash
   npm install @supabase/supabase-js
   ```

4. **Configurer dans le code**
   ```typescript
   // src/app/config/supabase.ts
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

   export const supabase = createClient(supabaseUrl, supabaseKey);
   ```

5. **Implémenter le BackendService**
   ```typescript
   // Modifier src/app/utils/storage.ts
   export const backendService: BackendService = {
     async submitRetour(retour: RetourQuestionnaire) {
       const { data, error } = await supabase
         .from('retours_questionnaire')
         .insert([retour])
         .select()
         .single();
       
       if (error) throw error;
       return data;
     },

     async uploadPhoto(file: File) {
       const fileName = `${Date.now()}_${file.name}`;
       const { data, error } = await supabase.storage
         .from('photos-terrain')
         .upload(fileName, file);
       
       if (error) throw error;
       
       const { data: { publicUrl } } = supabase.storage
         .from('photos-terrain')
         .getPublicUrl(fileName);
       
       return publicUrl;
     },

     async getAllRetours() {
       const { data, error } = await supabase
         .from('retours_questionnaire')
         .select('*')
         .order('created_at', { ascending: false });
       
       if (error) throw error;
       return data;
     },
   };
   ```

6. **Variables d'environnement**
   ```env
   # .env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Option 2 : Backend Node.js + PostgreSQL

#### Stack suggérée
- **Backend** : Express.js + TypeScript
- **Base de données** : PostgreSQL
- **ORM** : Prisma
- **Storage** : AWS S3 ou Cloudinary
- **Déploiement** : Render.com ou Railway

#### Architecture
```
/backend
  /src
    /routes       - Routes API
    /controllers  - Logique métier
    /models       - Modèles de données
    /middlewares  - Authentification, validation
    prisma/       - Schéma de base de données
```

#### Endpoints API à créer
```
POST   /api/retours              - Créer un retour
GET    /api/retours              - Lister les retours
GET    /api/retours/:id          - Détails d'un retour
GET    /api/retours/cible/:id   - Retours par cible
POST   /api/photos/upload        - Upload photo
GET    /api/synthese             - Statistiques
```

## 📊 Chargement des données CSV

### Option 1 : Google Sheets (Actuel)

1. Publier le Google Sheet en CSV
2. Obtenir l'URL de publication
3. Décommenter dans `/src/app/hooks/useCibles.ts` :
   ```typescript
   loadData(); // Ligne actuellement commentée
   ```

### Option 2 : Fichier local

Placer le CSV dans `/public/data/cibles.csv` et modifier l'URL :
```typescript
csvUrl: '/data/cibles.csv'
```

### Option 3 : API backend

Créer un endpoint `/api/cibles` et adapter le hook `useCibles`.

## 🔐 Authentification

### Avec Supabase
```typescript
// Se connecter
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Vérifier l'utilisateur
const { data: { user } } = await supabase.auth.getUser();
```

### Sans authentification
Le portail peut fonctionner sans auth pour un usage interne.

## 📧 Notifications email

### Option 1 : Supabase Edge Functions
Créer une fonction serverless pour l'envoi d'emails via SendGrid/Resend.

### Option 2 : Backend Node.js
Utiliser Nodemailer ou SendGrid SDK.

## 🌐 Nom de domaine

### Configuration DNS
```
Type: CNAME
Nom: cyclabilite
Valeur: [votre-service].app
```

Exemple : `cyclabilite.grand-geneve.org`

## 📱 Progressive Web App (PWA)

Pour activer le mode hors ligne :

1. **Installer Vite PWA plugin**
   ```bash
   npm install vite-plugin-pwa -D
   ```

2. **Configurer dans vite.config.ts**
   ```typescript
   import { VitePWA } from 'vite-plugin-pwa';

   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: 'autoUpdate',
         manifest: {
           name: 'Cyclabilité Grand Genève',
           short_name: 'Cyclabilité',
           description: 'Portail de validation de l\'indice de cyclabilité',
           theme_color: '#3b82f6',
         }
       })
     ]
   });
   ```

## 🔒 Sécurité

### Headers à configurer
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### HTTPS
Toujours utiliser HTTPS en production (automatique sur Vercel/Netlify).

## 📈 Monitoring

### Options
- **Sentry** : Tracking des erreurs
- **Plausible/Matomo** : Analytics respectueux de la vie privée
- **Vercel Analytics** : Si déployé sur Vercel

## 🧪 Tests avant déploiement

```bash
# Build de production
npm run build

# Vérifier la taille du bundle
du -sh dist

# Test local du build
npm run preview
```

## 📋 Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données créée et tables initialisées
- [ ] Storage pour photos configuré
- [ ] Build de production réussi
- [ ] Tests sur mobile et desktop
- [ ] Vérification des performances (Lighthouse)
- [ ] Configuration HTTPS
- [ ] Backup automatique configuré
- [ ] Documentation mise à jour
- [ ] Formation des utilisateurs prévue

## 🆘 Support et maintenance

### Logs
- Activer les logs d'erreur côté serveur
- Configurer des alertes pour les erreurs critiques

### Backups
- Backup quotidien de la base de données
- Backup des photos uploadées
- Conservation des données pendant 2 ans minimum

### Mises à jour
- Planifier des mises à jour mensuelles des dépendances
- Tester en environnement de staging avant production

---

**Pour toute question** : Contacter l'équipe projet cyclabilité Grand Genève
