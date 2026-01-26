/**
 * Translation Service - Traducción automática con OpenAI
 * Cachea textos estáticos de UI, traduce datos dinámicos en tiempo real
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Cache de traducciones (solo para textos estáticos de UI)
const translationCache = new Map<string, string>();

// Detecta si un texto es dinámico (contiene variables, números, etc.)
function isDynamicText(text: string): boolean {
  // Si contiene números, símbolos de moneda, o es muy largo, es dinámico
  return /\d|[$€£¥]|{|}|\[|\]/.test(text) || text.length > 100;
}

/**
 * Traduce un texto usando OpenAI GPT
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

  // Crear clave de caché
  const cacheKey = `${text}:${targetLang}`;

  // Si es texto estático y está en caché, retornar del caché
  if (!isDynamicText(text) && translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const sourceLanguage = sourceLang === 'es' ? 'Spanish' : 'English';
    const targetLanguage = targetLang === 'es' ? 'Spanish' : 'English';

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator for a financial management app called Finwrk. 
Translate the following text from ${sourceLanguage} to ${targetLanguage}.
Rules:
- Maintain the same tone and formality
- Keep technical terms consistent
- Preserve any HTML tags, variables, or special characters
- If the text is already in the target language, return it unchanged
- Be concise and natural
- Only return the translated text, nothing else`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const translatedText = response.choices[0]?.message?.content?.trim() || text;

    // Cachear solo si es texto estático
    if (!isDynamicText(text)) {
      translationCache.set(cacheKey, translatedText);
    }

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
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
  sourceLang?: 'es' | 'en'
): Promise<string[]> {
  // Filtrar textos que ya están en caché
  const uncachedTexts: string[] = [];
  const results: (string | null)[] = texts.map(text => {
    const cacheKey = `${text}:${targetLang}`;
    if (!isDynamicText(text) && translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }
    uncachedTexts.push(text);
    return null;
  });

  // Si todos están en caché, retornar
  if (uncachedTexts.length === 0) {
    return results as string[];
  }

  // Traducir los que no están en caché
  try {
    const sourceLanguage = sourceLang === 'es' ? 'Spanish' : 'English';
    const targetLanguage = targetLang === 'es' ? 'Spanish' : 'English';

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator for a financial management app called Finwrk.
Translate the following texts from ${sourceLanguage} to ${targetLanguage}.
Return the translations as a JSON array in the same order, preserving any HTML tags or special characters.
Only return the JSON array, nothing else.`
        },
        {
          role: 'user',
          content: JSON.stringify(uncachedTexts)
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const translatedTexts = JSON.parse(
      response.choices[0]?.message?.content?.trim() || '[]'
    );

    // Llenar los resultados y cachear
    let uncachedIndex = 0;
    return results.map((cached, i) => {
      if (cached !== null) return cached;
      
      const translated = translatedTexts[uncachedIndex] || texts[i];
      uncachedIndex++;

      // Cachear si es texto estático
      if (!isDynamicText(texts[i])) {
        const cacheKey = `${texts[i]}:${targetLang}`;
        translationCache.set(cacheKey, translated);
      }

      return translated;
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    // En caso de error, retornar textos originales
    return texts;
  }
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
  const commonTexts = [
    // Botones
    'Guardar',
    'Cancelar',
    'Eliminar',
    'Editar',
    'Crear',
    'Actualizar',
    'Confirmar',
    'Cerrar',
    'Volver',
    'Siguiente',
    'Anterior',
    'Enviar',
    'Descargar',
    'Subir',
    
    // Navegación
    'Clientes',
    'Facturas',
    'Finanzas',
    'Ahorros',
    'Configuración',
    'Cerrar sesión',
    
    // Campos comunes
    'Nombre',
    'Email',
    'Teléfono',
    'Dirección',
    'Fecha',
    'Monto',
    'Descripción',
    'Notas',
    'Estado',
    
    // Estados
    'Borrador',
    'Enviada',
    'Pagada',
    'Cancelada',
    'Pendiente',
    
    // Mensajes
    'Cargando...',
    'Guardando...',
    'Enviando...',
    'Procesando...',
    'Error',
    'Éxito',
    'Advertencia',
  ];

  // Pre-cachear en background
  translateBatch(commonTexts, targetLang, targetLang === 'es' ? 'en' : 'es')
    .catch(err => console.error('Pre-cache error:', err));
}
