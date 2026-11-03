/**
 * Best-effort translation of raw English error messages coming from Buffer's
 * and Pollinations' APIs. Not a full machine-translation service: it matches
 * known phrases/vocabulary from those APIs' documented errors first, then
 * falls back to generic word substitutions. Unrecognized technical text may
 * still show through untranslated.
 */

const PHRASES: Array<[RegExp, string]> = [
  [/too many requests from this client\.?\s*please try again later\.?/gi, "demasiadas solicitudes desde este cliente. Inténtalo de nuevo más tarde."],
  [/query exceeds maximum allowed complexity\.?\s*please simplify your query\.?/gi, "la consulta excede la complejidad máxima permitida. Simplifícala."],
  [/failed to fetch image dimensions/gi, "no se pudieron leer las dimensiones de la imagen"],
  [/failed to create post/gi, "no se pudo crear la publicación"],
  [/failed to edit post/gi, "no se pudo editar la publicación"],
  [/failed to delete post/gi, "no se pudo eliminar la publicación"],
  [/text is required/gi, "se requiere un texto"],
  [/not authorized/gi, "no autorizado"],
  [/rate limit exceeded/gi, "se superó el límite de solicitudes"],
  [/rate limited/gi, "límite de solicitudes alcanzado"],
];

const WORDS: Array<[RegExp, string]> = [
  [/\bfailed to\b/gi, "no se pudo"],
  [/\bcould not\b/gi, "no se pudo"],
  [/\bcannot\b/gi, "no se puede"],
  [/\bis required\b/gi, "es obligatorio"],
  [/\bare required\b/gi, "son obligatorios"],
  [/\binvalid\b/gi, "inválido"],
  [/\bunauthorized\b/gi, "no autorizado"],
  [/\bforbidden\b/gi, "prohibido"],
  [/\bnot found\b/gi, "no encontrado"],
  [/\btimed out\b/gi, "se agotó el tiempo de espera"],
  [/\btimeout\b/gi, "tiempo de espera agotado"],
  [/\bplease try again\b/gi, "inténtalo de nuevo"],
  [/\blater\b/gi, "más tarde"],
  [/\bexceeded\b/gi, "superado"],
  [/\bexceeds\b/gi, "supera"],
  [/\blimit\b/gi, "límite"],
  [/\bsimplify\b/gi, "simplifica"],
  [/\bmaximum\b/gi, "máximo"],
  [/\bserver error\b/gi, "error del servidor"],
  [/\bunexpected error\b/gi, "error inesperado"],
  [/\bbad request\b/gi, "solicitud inválida"],
];

const CODES: Record<string, string> = {
  UNAUTHORIZED: "Clave de API inválida o faltante.",
  FORBIDDEN: "No tienes permiso para acceder a este recurso.",
  NOT_FOUND: "El recurso solicitado no existe.",
  UNEXPECTED: "Error inesperado del servidor. Inténtalo de nuevo en unos minutos.",
  RATE_LIMIT_EXCEEDED: "Se superó el límite de solicitudes. Espera un momento e inténtalo de nuevo.",
};

export function translateErrorCode(code?: string | null): string | undefined {
  if (!code) return undefined;
  return CODES[code.toUpperCase()];
}

export function translateApiError(message: string | undefined | null): string {
  if (!message) return "Error desconocido.";
  let out = message;
  for (const [pattern, replacement] of PHRASES) {
    out = out.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of WORDS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
