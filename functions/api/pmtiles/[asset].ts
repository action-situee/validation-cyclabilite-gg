type Env = {
  VITE_PM_TILES_BIKE_SEGMENT?: string;
  VITE_PM_TILES_BIKE_CARREAU200?: string;
  VITE_PM_TILES_PERIMETER?: string;
};

const TILE_ASSET_BY_PARAM = {
  'bike-segment': 'VITE_PM_TILES_BIKE_SEGMENT',
  'bike-carreau200': 'VITE_PM_TILES_BIKE_CARREAU200',
  perimeter: 'VITE_PM_TILES_PERIMETER',
} as const;

type TileAssetParam = keyof typeof TILE_ASSET_BY_PARAM;

function getAssetUrl(env: Env, asset: string | undefined) {
  if (!asset) return null;
  const envKey = TILE_ASSET_BY_PARAM[asset as TileAssetParam];
  if (!envKey) return null;

  const url = env[envKey];
  return typeof url === 'string' && url.trim() !== '' ? url : null;
}

function buildProxyHeaders(request: Request) {
  const headers = new Headers();
  const range = request.headers.get('Range');
  const ifNoneMatch = request.headers.get('If-None-Match');
  const ifModifiedSince = request.headers.get('If-Modified-Since');

  if (range) headers.set('Range', range);
  if (ifNoneMatch) headers.set('If-None-Match', ifNoneMatch);
  if (ifModifiedSince) headers.set('If-Modified-Since', ifModifiedSince);

  return headers;
}

function buildResponseHeaders(upstream: Response) {
  const headers = new Headers();

  for (const name of [
    'Accept-Ranges',
    'Cache-Control',
    'Content-Encoding',
    'Content-Length',
    'Content-Range',
    'Content-Type',
    'ETag',
    'Last-Modified',
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Range,If-None-Match,If-Modified-Since');
  headers.set('Vary', 'Origin, Range');

  return headers;
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': 'Range,If-None-Match,If-Modified-Since',
    },
  });
};

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        Allow: 'GET,HEAD,OPTIONS',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const assetUrl = getAssetUrl(env, params.asset);
  if (!assetUrl) {
    return new Response('PMTiles asset not configured', {
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const upstream = await fetch(assetUrl, {
    method: request.method,
    headers: buildProxyHeaders(request),
    cf: {
      cacheEverything: true,
    },
  });

  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: buildResponseHeaders(upstream),
  });
};