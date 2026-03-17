/**
 * Fingerprint basé sur l'adresse IP publique.
 * - Récupère l'IP via api.ipify.org
 * - Hash SHA-256 tronqué (16 chars) pour la vie privée
 * - Cache en mémoire + localStorage
 * - Fallback sur un identifiant aléatoire persistant si l'API est injoignable
 */

const CACHE_KEY = 'cyclabilite_owner_fp';
let cachedFingerprint: string | null = null;

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getLocalFallback(): string {
  const existing = localStorage.getItem(CACHE_KEY);
  if (existing) return existing;
  const fallback = `local_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
  localStorage.setItem(CACHE_KEY, fallback);
  return fallback;
}

/**
 * Résout le fingerprint propriétaire (basé IP quand possible).
 * Appeler une seule fois au démarrage, puis réutiliser la valeur.
 */
export async function resolveFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;

  // Essai de récupérer l'IP publique
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const ip: string = json.ip;
      // Hash pour ne jamais stocker l'IP en clair
      const salt = 'cyclabilite_grand_geneve_2026';
      const hash = await sha256Hex(`${salt}:${ip}`);
      cachedFingerprint = `ip_${hash.substring(0, 16)}`;
      localStorage.setItem(CACHE_KEY, cachedFingerprint);
      return cachedFingerprint;
    }
  } catch {
    // API injoignable – fallback
  }

  // Fallback : identifiant local persistant
  cachedFingerprint = getLocalFallback();
  return cachedFingerprint;
}

/**
 * Retourne le fingerprint déjà résolu (synchrone).
 * Si pas encore résolu, retourne le fallback localStorage.
 */
export function getFingerprint(): string {
  if (cachedFingerprint) return cachedFingerprint;
  cachedFingerprint = getLocalFallback();
  return cachedFingerprint;
}