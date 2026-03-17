# Cyclabilite Grand Geneve - Portail collaboratif

Portail web de validation collaborative de l'indice de cyclabilite transfrontalier dans le Grand Geneve. Application React + Leaflet + Tailwind CSS.

## Architecture actuelle (prototype)

```
src/app/
  App.tsx                    # Point d'entree, layout, filtres, routage UI
  types/index.ts             # Types TypeScript (Cible, Observation, Commentaire...)
  hooks/useAppData.tsx       # Contexte React (AppDataProvider) — state central
  mock-data/
    faisceaux.ts             # Definition des 2 faisceaux + polygones corridors
    cibles.ts                # Points thematiques de discussion (mock statique)
  components/
    Map.tsx                  # Carte Leaflet imperative (useRef/useEffect, pas react-leaflet)
    Sidebar.tsx              # Panneau lateral : selecteur, legende, commentaires, export
    CibleThread.tsx          # Fil de discussion modal par cible
    QuickAddForm.tsx         # Formulaire d'ajout d'observation
    PhotoPicker.tsx          # Prise de photo camera arriere + galerie (max 3)
    Logo.tsx                 # Logo SVG du projet
    ui/Button.tsx            # Composant bouton reutilisable
  utils/
    storage.ts               # Persistance localStorage (observations, commentaires, ownership)
    export.ts                # Export GeoJSON / CSV
    image.ts                 # Compression JPEG base64 (max 1200px, 70%)
```

### Stockage actuel

| Donnee             | Source                  | Stockage              | Cle localStorage                    |
|--------------------|-------------------------|-----------------------|-------------------------------------|
| Cibles             | `mock-data/cibles.ts`   | Memoire (read-only)   | —                                   |
| Observations       | Utilisateurs            | `localStorage`        | `cyclabilite_observations`          |
| Commentaires       | Utilisateurs            | `localStorage`        | `cyclabilite_commentaires`          |
| Ownership          | Auto (a la creation)    | `localStorage`        | `cyclabilite_my_observations / _my_commentaires` |
| Votes              | Utilisateurs            | Dans le tableau obs   | (dans `cyclabilite_observations`)   |
| Photos             | Utilisateurs            | Base64 dans obs       | (dans `cyclabilite_observations`)   |

**Limites** : localStorage ~5-10 MB, donnees non partagees entre navigateurs, pas d'authentification.

---

## Passage en production avec Cloudflare

### 1. Hebergement statique — Cloudflare Pages

```bash
# Build
pnpm build

# Deploy via Wrangler CLI
npx wrangler pages deploy dist --project-name=cyclabilite-gg
```

Ou connecter le repo Git dans le dashboard Cloudflare Pages pour un deploiement continu.

### 2. Base de donnees — Cloudflare D1 (SQLite edge)

Remplacer localStorage par une base D1 :

```sql
-- Schema D1 suggere
CREATE TABLE cibles (
  cible_id TEXT PRIMARY KEY,
  faisceau_id TEXT NOT NULL,
  faisceau_nom TEXT,
  secteur_nom TEXT,
  theme_principal TEXT NOT NULL,
  type_cible TEXT,
  cote_frontiere TEXT,
  priorite_revue TEXT,
  score_indice_calcule REAL,
  classe_indice_calcule TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  titre_affichage TEXT NOT NULL,
  sous_titre_affichage TEXT,
  question_cle TEXT,
  statut_validation TEXT DEFAULT 'en_cours',
  derniere_mise_a_jour TEXT
);

CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  commentaire TEXT NOT NULL,
  categorie TEXT NOT NULL CHECK (categorie IN ('danger','amenagement','positif','validation')),
  auteur TEXT NOT NULL,
  organisation TEXT,
  role TEXT,
  date TEXT NOT NULL,
  cible_id TEXT REFERENCES cibles(cible_id),
  indice_juge TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_by TEXT NOT NULL  -- identifiant contributeur
);

CREATE TABLE votes (
  observation_id TEXT REFERENCES observations(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('up','down')),
  PRIMARY KEY (observation_id, voter_id)
);

CREATE TABLE commentaires (
  id TEXT PRIMARY KEY,
  auteur TEXT NOT NULL,
  texte TEXT NOT NULL,
  date TEXT NOT NULL,
  faisceau_id TEXT,
  created_by TEXT NOT NULL
);

CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  observation_id TEXT REFERENCES observations(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,  -- cle dans le bucket R2
  created_at TEXT DEFAULT (datetime('now'))
);
```

```bash
# Creer la base D1
npx wrangler d1 create cyclabilite-db
npx wrangler d1 execute cyclabilite-db --file=./schema.sql
```

### 3. Stockage photos — Cloudflare R2

Remplacer le stockage base64 dans localStorage par des uploads vers R2 :

```bash
# Creer le bucket R2
npx wrangler r2 bucket create cyclabilite-photos
```

**Worker d'upload** (`functions/api/upload-photo.ts`) :

```typescript
// Cloudflare Pages Function (ou Worker)
export async function onRequestPost(context) {
  const { request, env } = context;

  // Verifier l'authentification (voir section 5)
  const formData = await request.formData();
  const file = formData.get('photo') as File;
  const observationId = formData.get('observation_id') as string;

  if (!file || !observationId) {
    return new Response('Missing fields', { status: 400 });
  }

  // Generer une cle unique
  const key = `observations/${observationId}/${crypto.randomUUID()}.jpg`;

  // Upload vers R2
  await env.CYCLABILITE_PHOTOS.put(key, file.stream(), {
    httpMetadata: { contentType: 'image/jpeg' },
  });

  // Sauver la reference en D1
  await env.DB.prepare(
    'INSERT INTO photos (id, observation_id, r2_key) VALUES (?, ?, ?)'
  ).bind(crypto.randomUUID(), observationId, key).run();

  // Retourner l'URL publique ou signee
  return Response.json({
    url: `https://photos.cyclabilite-gg.example.com/${key}`,
    key,
  });
}
```

**Configuration `wrangler.toml`** :

```toml
name = "cyclabilite-gg"
compatibility_date = "2026-03-01"

[[d1_databases]]
binding = "DB"
database_name = "cyclabilite-db"
database_id = "<votre-id>"

[[r2_buckets]]
binding = "CYCLABILITE_PHOTOS"
bucket_name = "cyclabilite-photos"
```

### 4. API Workers — remplacer localStorage

Creer des Pages Functions dans `functions/api/` :

```
functions/api/
  observations.ts     # GET (list) + POST (create)
  observations/[id].ts # GET, PUT, DELETE
  votes.ts            # POST
  commentaires.ts     # GET + POST
  commentaires/[id].ts # DELETE
  upload-photo.ts     # POST (upload R2)
  cibles.ts           # GET (depuis D1 au lieu du mock)
```

Cote front, remplacer `storageService` par des appels fetch :

```typescript
// src/app/utils/api.ts (remplace storage.ts)
const API_BASE = '/api';

export const api = {
  async getObservations(): Promise<ObservationLibre[]> {
    const res = await fetch(`${API_BASE}/observations`);
    return res.json();
  },

  async createObservation(obs: Omit<ObservationLibre, 'id'>): Promise<ObservationLibre> {
    const res = await fetch(`${API_BASE}/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obs),
    });
    return res.json();
  },

  async uploadPhoto(observationId: string, file: Blob): Promise<{ url: string }> {
    const form = new FormData();
    form.append('photo', file);
    form.append('observation_id', observationId);
    const res = await fetch(`${API_BASE}/upload-photo`, { method: 'POST', body: form });
    return res.json();
  },

  // ... votes, commentaires, delete, etc.
};
```

### 5. Authentification (optionnel)

Pour un portail collaboratif associatif, quelques options :

- **Cloudflare Access** : SSO / email magic link, ideal pour un groupe restreint
- **Simple token par association** : generer un token par organisation dans D1, passe en header
- **Supabase Auth** : si besoin d'un systeme plus complet (magic link, OAuth)

### 6. Migration des donnees existantes

Script de migration localStorage → D1 :

```typescript
// A executer une fois dans la console navigateur de chaque contributeur
async function migrateToCloud() {
  const obs = JSON.parse(localStorage.getItem('cyclabilite_observations') || '[]');
  const coms = JSON.parse(localStorage.getItem('cyclabilite_commentaires') || '[]');

  for (const o of obs) {
    await fetch('/api/observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(o),
    });
  }

  for (const c of coms) {
    await fetch('/api/commentaires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    });
  }

  console.log(`Migrated ${obs.length} observations and ${coms.length} commentaires`);
}
```

### 7. Alternative Supabase

Si Cloudflare n'est pas souhaite, Supabase offre une alternative tout-en-un :

| Besoin            | Cloudflare             | Supabase                    |
|-------------------|------------------------|-----------------------------|
| Base de donnees   | D1 (SQLite edge)       | PostgreSQL                  |
| Stockage fichiers | R2                     | Supabase Storage (S3)       |
| Auth              | Cloudflare Access      | Supabase Auth (magic link)  |
| API               | Workers / Functions    | PostgREST auto-genere       |
| Cout (petit vol.) | Gratuit (limites gen.) | Gratuit (500 MB DB, 1 GB)   |

---

## Variables d'environnement

```env
# .env.local (developpement)
# Aucune variable requise pour le prototype localStorage

# .env.production (Cloudflare)
# Les bindings D1/R2 sont configures dans wrangler.toml
# Pas de cles API cote client
```

## Commandes

```bash
pnpm install        # Installer les dependances
pnpm build          # Build production (dist/)
```
