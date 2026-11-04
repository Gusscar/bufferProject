/**
 * Best-effort translation of raw English error messages coming from Buffer's
 * and Pollinations' APIs. Not a full machine-translation service: it only
 * replaces whole, known phrases with their full Spanish equivalent. Mixing
 * in word-by-word substitutions produced garbled half-English/half-Spanish
 * sentences, so unrecognized messages are now left in their original
 * (clean, readable) English rather than partially mangled.
 */

const PHRASES: Array<[RegExp, string]> = [
  [/too many requests from this client\.?\s*please try again later\.?/gi, "Demasiadas solicitudes. Inténtalo de nuevo más tarde."],
  [/query exceeds maximum allowed complexity\.?\s*please simplify your query\.?/gi, "La consulta excede la complejidad máxima permitida. Simplifícala."],
  [/invalid post,?\s*image could not be read from its url/gi, "La imagen no se pudo leer desde su URL. Puede que el enlace no sea público o haya fallado al generarse; genera o sube la imagen de nuevo."],
  [/failed to fetch image dimensions/gi, "no se pudieron leer las dimensiones de la imagen"],
  [/image could not be read from its url/gi, "no se pudo leer la imagen desde su URL"],
  [/failed to create post/gi, "no se pudo crear la publicación"],
  [/failed to edit post/gi, "no se pudo editar la publicación"],
  [/failed to delete post/gi, "no se pudo eliminar la publicación"],
  [/text is required/gi, "se requiere un texto"],
  [/not authorized/gi, "no autorizado"],
  [/rate limit exceeded/gi, "se superó el límite de solicitudes"],
  [/rate limited/gi, "límite de solicitudes alcanzado"],
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
  // .replace() with a /g regex resets its internal match state per call, unlike
  // .test()/.exec(), which would leak lastIndex across calls on these shared,
  // module-level regex objects and cause intermittent missed matches.
  for (const [pattern, replacement] of PHRASES) {
    const translated: string = message.replace(pattern, replacement);
    if (translated !== message) return translated;
  }
  return message;
}
