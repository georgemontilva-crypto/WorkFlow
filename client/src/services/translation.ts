/**
 * Translation Service - Sistema de traducción simplificado
 * Por ahora solo soporta español (idioma por defecto)
 * TODO: Implementar traducción con OpenAI desde el backend
 */

// Cache de traducciones (solo para textos estáticos de UI)
const translationCache = new Map<string, string>();

// Detecta si un texto es dinámico (contiene variables, números, etc.)
function isDynamicText(text: string): boolean {
  // Si contiene números, símbolos de moneda, o es muy largo, es dinámico
  return /\d|[$€£¥]|{|}|\[|\]/.test(text) || text.length > 100;
}

/**
 * Traduce un texto (por ahora solo retorna el texto original en español)
 * @param text - Texto a traducir
 * @param targetLang - Idioma destino ('es' o 'en')
 * @param sourceLang - Idioma origen (opcional, se detecta automáticamente)
 */
export async function translateText(
  text: string,
  targetLang: 'es' | 'en',
  sourceLang?: 'es' | 'en'
): Promise<string> {
  // Si el texto está vacío, retornarlo
  if (!text || text.trim() === '') return text;

  // Por ahora, solo retornar el texto original
  // TODO: Implementar traducción real con OpenAI desde el backend
  return text;
}

/**
 * Traduce múltiples textos en batch (más eficiente)
 */
export async function translateBatch(
  texts: string[],
  targetLang: 'es' | 'en',
  sourceLang?: 'es' | 'en'
): Promise<string[]> {
  // Por ahora, solo retornar los textos originales
  // TODO: Implementar traducción real con OpenAI desde el backend
  return texts;
}

/**
 * Limpia el caché de traducciones
 */
export function clearTranslationCache() {
  translationCache.clear();
}

/**
 * Pre-cachea traducciones comunes de UI
 */
export async function preCacheCommonTranslations(targetLang: 'es' | 'en') {
  // Por ahora no hace nada
  // TODO: Implementar pre-caché cuando tengamos traducción real
  return Promise.resolve();
}
