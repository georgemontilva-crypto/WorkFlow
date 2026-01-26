/**
 * Translation Service - Cliente para traducción automática
 * Usa el backend con OpenAI y caché en Redis
 */

import { trpc } from '@/lib/trpc';

// Cache local para traducciones instantáneas (evita llamadas duplicadas)
const localCache = new Map<string, string>();

// Detecta si un texto es dinámico (contiene variables, números, etc.)
function isDynamicText(text: string): boolean {
  return /\d|[$€£¥]|{|}|\[|\]/.test(text) || text.length > 100;
}

/**
 * Genera una clave de caché local
 */
function getCacheKey(text: string, targetLang: string): string {
  return `${targetLang}:${text}`;
}

/**
 * Traduce un texto usando el backend
 * @param text - Texto a traducir
 * @param targetLang - Idioma destino ('es' o 'en')
 * @param sourceLang - Idioma origen (opcional, se detecta automáticamente)
 */
export async function translateText(
  text: string,
  targetLang: 'es' | 'en',
  sourceLang: 'es' | 'en' = 'es'
): Promise<string> {
  // Si el texto está vacío, retornarlo
  if (!text || text.trim() === '') return text;

  // Si el idioma objetivo es el mismo que el origen, retornar el texto
  if (targetLang === sourceLang) return text;

  // Verificar caché local
  const cacheKey = getCacheKey(text, targetLang);
  if (localCache.has(cacheKey)) {
    return localCache.get(cacheKey)!;
  }

  try {
    // Llamar al backend para traducir
    const result = await trpc.translation.translate.mutate({
      text,
      targetLang,
      sourceLang,
    });

    const translated = result.translated;

    // Guardar en caché local (solo textos estáticos)
    if (!isDynamicText(text)) {
      localCache.set(cacheKey, translated);
    }

    return translated;
  } catch (error) {
    console.error('[Translation] Error:', error);
    // En caso de error, retornar el texto original
    return text;
  }
}

/**
 * Traduce múltiples textos en batch (más eficiente)
 */
export async function translateBatch(
  texts: string[],
  targetLang: 'es' | 'en',
  sourceLang: 'es' | 'en' = 'es'
): Promise<string[]> {
  // Si el idioma objetivo es el mismo que el origen, retornar los textos
  if (targetLang === sourceLang) return texts;

  // Filtrar textos que ya están en caché local
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];
  const results: string[] = texts.map((text, i) => {
    const cacheKey = getCacheKey(text, targetLang);
    if (localCache.has(cacheKey)) {
      return localCache.get(cacheKey)!;
    }
    uncachedIndices.push(i);
    uncachedTexts.push(text);
    return ''; // Placeholder
  });

  // Si todos están en caché, retornar
  if (uncachedTexts.length === 0) {
    return results;
  }

  try {
    // Llamar al backend para traducir los que no están en caché
    const result = await trpc.translation.translateBatch.mutate({
      texts: uncachedTexts,
      targetLang,
      sourceLang,
    });

    const translations = result.translations;

    // Llenar los resultados y actualizar caché local
    uncachedIndices.forEach((originalIndex, i) => {
      const translated = translations[i];
      results[originalIndex] = translated;

      // Guardar en caché local (solo textos estáticos)
      const text = texts[originalIndex];
      if (!isDynamicText(text)) {
        const cacheKey = getCacheKey(text, targetLang);
        localCache.set(cacheKey, translated);
      }
    });

    return results;
  } catch (error) {
    console.error('[Translation] Batch error:', error);
    // En caso de error, retornar textos originales
    return texts;
  }
}

/**
 * Limpia el caché local de traducciones
 */
export function clearTranslationCache() {
  localCache.clear();
}

/**
 * Pre-cachea traducciones comunes de UI
 */
export async function preCacheCommonTranslations(targetLang: 'es' | 'en') {
  try {
    await trpc.translation.preCacheCommon.mutate({ targetLang });
    console.log(`[Translation] Pre-cached common translations for ${targetLang}`);
  } catch (error) {
    console.error('[Translation] Pre-cache error:', error);
  }
}
