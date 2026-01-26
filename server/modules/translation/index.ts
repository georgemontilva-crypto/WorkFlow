/**
 * Translation Module - Traducción automática con OpenAI
 * Usa caché en Redis para optimizar rendimiento y costos
 */

import { publicProcedure, router } from '../../_core/trpc';
import { z } from 'zod';
import OpenAI from 'openai';
import { getRedisClient } from '../../config/redis';

const redis = getRedisClient();

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// TTL del caché: 30 días (textos de UI no cambian frecuentemente)
const CACHE_TTL = 60 * 60 * 24 * 30;

/**
 * Genera una clave de caché para una traducción
 */
function getCacheKey(text: string, targetLang: string): string {
  return `translation:${targetLang}:${text}`;
}

/**
 * Detecta si un texto es dinámico (contiene variables, números, etc.)
 */
function isDynamicText(text: string): boolean {
  return /\d|[$€£¥]|{|}|\[|\]/.test(text) || text.length > 100;
}

/**
 * Traduce un texto usando OpenAI con caché en Redis
 */
async function translateWithCache(
  text: string,
  targetLang: 'es' | 'en',
  sourceLang: 'es' | 'en' = 'es'
): Promise<string> {
  // Si el texto está vacío, retornarlo
  if (!text || text.trim() === '') return text;

  // Si el idioma objetivo es el mismo que el origen, retornar el texto
  if (targetLang === sourceLang) return text;

  // Intentar obtener del caché
  const cacheKey = getCacheKey(text, targetLang);
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    console.log(`[Translation] Cache hit: ${text.substring(0, 50)}...`);
    return cached;
  }

  console.log(`[Translation] Cache miss, translating: ${text.substring(0, 50)}...`);

  // Traducir con OpenAI
  try {
    const sourceLanguage = sourceLang === 'es' ? 'Spanish' : 'English';
    const targetLanguage = targetLang === 'es' ? 'Spanish' : 'English';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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

    // Guardar en caché (solo textos estáticos)
    if (!isDynamicText(text)) {
      await redis.setex(cacheKey, CACHE_TTL, translatedText);
      console.log(`[Translation] Cached: ${text.substring(0, 50)}...`);
    }

    return translatedText;
  } catch (error) {
    console.error('[Translation] Error:', error);
    // En caso de error, retornar el texto original
    return text;
  }
}

/**
 * Router de traducción
 */
export const translationRouter = router({
  /**
   * Traduce un texto individual
   */
  translate: publicProcedure
    .input(z.object({
      text: z.string(),
      targetLang: z.enum(['es', 'en']),
      sourceLang: z.enum(['es', 'en']).optional().default('es'),
    }))
    .mutation(async ({ input }) => {
      const { text, targetLang, sourceLang } = input;
      const translated = await translateWithCache(text, targetLang, sourceLang);
      return { translated };
    }),

  /**
   * Traduce múltiples textos en batch
   */
  translateBatch: publicProcedure
    .input(z.object({
      texts: z.array(z.string()),
      targetLang: z.enum(['es', 'en']),
      sourceLang: z.enum(['es', 'en']).optional().default('es'),
    }))
    .mutation(async ({ input }) => {
      const { texts, targetLang, sourceLang } = input;

      // Traducir todos los textos en paralelo
      const translations = await Promise.all(
        texts.map(text => translateWithCache(text, targetLang, sourceLang))
      );

      return { translations };
    }),

  /**
   * Pre-cachea traducciones comunes
   */
  preCacheCommon: publicProcedure
    .input(z.object({
      targetLang: z.enum(['es', 'en']),
    }))
    .mutation(async ({ input }) => {
      const { targetLang } = input;

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
        'Pago en Revisión',
        'Pago Parcial',
        
        // Mensajes
        'Cargando...',
        'Guardando...',
        'Enviando...',
        'Procesando...',
        'Error',
        'Éxito',
        'Advertencia',
      ];

      // Pre-cachear en background (no esperar)
      Promise.all(
        commonTexts.map(text => translateWithCache(text, targetLang, 'es'))
      ).catch(err => console.error('[Translation] Pre-cache error:', err));

      return { success: true, count: commonTexts.length };
    }),
});
