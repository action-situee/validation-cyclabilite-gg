import { promises as fs } from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const DATA_DIR = path.resolve(__dirname, 'mock-api-data');
const OBSERVATIONS_FILE = path.join(DATA_DIR, 'observations.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'commentaires.json');
const SURVEYS_FILE = path.join(DATA_DIR, 'surveys.json');

type MockRecord = Record<string, unknown> & { id?: string };

function jsonResponse(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload, null, 2));
}

async function ensureStore(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]\n', 'utf8');
  }
}

async function readStore<T>(filePath: string): Promise<T[]> {
  await ensureStore(filePath);
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore<T>(filePath: string, payload: T[]) {
  await ensureStore(filePath);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function readBody(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function createMockApiHandler() {
  return async (req: any, res: any, next: () => void) => {
    const url = req.url ? new URL(req.url, 'http://localhost') : null;
    const pathname = url?.pathname || '';
    const method = req.method || 'GET';

    try {
      if (pathname === '/api/observations' && method === 'GET') {
        jsonResponse(res, 200, await readStore(OBSERVATIONS_FILE));
        return;
      }

      if (pathname === '/api/observations' && method === 'POST') {
        const body = await readBody(req);
        const existing = await readStore<MockRecord>(OBSERVATIONS_FILE);
        existing.push(body);
        await writeStore(OBSERVATIONS_FILE, existing);
        jsonResponse(res, 201, body);
        return;
      }

      if (pathname.startsWith('/api/observations/') && method === 'PUT') {
        const id = pathname.split('/').pop();
        const body = await readBody(req);
        const existing = await readStore<MockRecord>(OBSERVATIONS_FILE);
        const updated = existing.map((item) => (item.id === id ? body : item));
        await writeStore(OBSERVATIONS_FILE, updated);
        jsonResponse(res, 200, body);
        return;
      }

      if (pathname.startsWith('/api/observations/') && method === 'DELETE') {
        const id = pathname.split('/').pop();
        const existing = await readStore<MockRecord>(OBSERVATIONS_FILE);
        const updated = existing.filter((item) => item.id !== id);
        await writeStore(OBSERVATIONS_FILE, updated);
        jsonResponse(res, 200, { ok: true, id });
        return;
      }

      if (pathname === '/api/commentaires' && method === 'GET') {
        jsonResponse(res, 200, await readStore(COMMENTS_FILE));
        return;
      }

      if (pathname === '/api/commentaires' && method === 'POST') {
        const body = await readBody(req);
        const existing = await readStore<MockRecord>(COMMENTS_FILE);
        existing.push(body);
        await writeStore(COMMENTS_FILE, existing);
        jsonResponse(res, 201, body);
        return;
      }

      if (pathname.startsWith('/api/commentaires/') && method === 'DELETE') {
        const id = pathname.split('/').pop();
        const existing = await readStore<MockRecord>(COMMENTS_FILE);
        const updated = existing.filter((item) => item.id !== id);
        await writeStore(COMMENTS_FILE, updated);
        jsonResponse(res, 200, { ok: true, id });
        return;
      }

      if (pathname === '/api/surveys' && method === 'GET') {
        jsonResponse(res, 200, await readStore(SURVEYS_FILE));
        return;
      }

      if (pathname === '/api/surveys' && method === 'POST') {
        const body = await readBody(req);
        const existing = await readStore<MockRecord>(SURVEYS_FILE);
        existing.push(body);
        await writeStore(SURVEYS_FILE, existing);
        jsonResponse(res, 201, body);
        return;
      }
    } catch (error) {
      jsonResponse(res, 500, {
        error: 'mock_api_error',
        message: error instanceof Error ? error.message : 'Unknown mock API error',
      });
      return;
    }

    next();
  };
}

function localContributionsApi(): Plugin {
  const handler = createMockApiHandler();

  return {
    name: 'local-contributions-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localContributionsApi(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('maplibre-gl') || id.includes('pmtiles')) return 'map';
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('lucide-react') || id.includes('sonner')) return 'ui';
          if (id.includes('react')) return 'react';
          return undefined;
        },
      },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
});
