type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function jsonResponse(payload: JsonValue | Record<string, unknown> | unknown[], status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: JSON_HEADERS,
  });
}

export function noContentResponse() {
  return new Response(null, {
    status: 204,
    headers: JSON_HEADERS,
  });
}

export function methodNotAllowed(allowed: string[]) {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      ...JSON_HEADERS,
      Allow: allowed.join(', '),
    },
  });
}

export function badRequest(message: string) {
  return jsonResponse({ error: message }, 400);
}

export function notFound(message = 'Resource not found') {
  return jsonResponse({ error: message }, 404);
}

export function serviceUnavailable(message: string) {
  return jsonResponse({ error: message }, 503);
}

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function handleOptions() {
  return noContentResponse();
}