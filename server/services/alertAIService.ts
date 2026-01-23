/**
 * Alert AI Service
 * Provides AI-powered analysis for alerts
 * 
 * Role: Contextual analyst, decision assistant, explanation generator
 * Does NOT: Generate new alerts, modify financial data, execute actions automatically
 */

import OpenAI from 'openai';
import { getRedisClient } from '../config/redis';
import type { Redis } from 'ioredis';

// Initialize OpenAI client
const openai = new OpenAI();

// Types
export interface AlertContext {
  // Alert info
  alertId: number;
  alertType: 'info' | 'warning' | 'critical';
  event: string;
  message: string;
  relatedId?: number;
  relatedType?: string;
  
  // User profile
  businessType: 'freelancer' | 'empresa' | 'agencia';
  baseCurrency: string;
  monthlyIncomeGoal?: number;
  
  // Related data
  invoiceData?: {
    id: number;
    clientName: string;
    total: number;
    dueDate: string;
    status: string;
    daysOverdue?: number;
  };
  
  clientHistory?: {
    totalInvoices: number;
    paidInvoices: number;
    averagePaymentDays: number;
    latePayments: number;
    totalRevenue: number;
  };
  
  financialContext?: {
    monthlyIncome: number;
    monthlyGoal: number;
    percentageOfGoal: number;
    previousMonthIncome: number;
    trend: 'up' | 'down' | 'stable';
  };
  
  similarAlerts?: {
    count: number;
    lastOccurrence: string;
    resolved: number;
  };
}

export interface AIAnalysisResult {
  // Explanation
  explanation: string;
  relevance: string;
  
  // Impact assessment
  impact: {
    financial: 'alto' | 'medio' | 'bajo' | 'ninguno';
    operational: 'alto' | 'medio' | 'bajo' | 'ninguno';
    urgency: 'inmediata' | 'alta' | 'media' | 'baja';
  };
  
  // Recommendation
  recommendation: {
    action: string;
    alternative?: string;
    consequence: string;
  };
  
  // Quick actions
  suggestedActions: Array<{
    label: string;
    action: string;
    type: 'primary' | 'secondary';
  }>;
  
  // Metadata
  confidence: number;
  processingTime: number;
  cached: boolean;
}

// Cache configuration
const CACHE_PREFIX = 'ai:analysis:';
const CACHE_TTL = 3600; // 1 hour

// Rate limiting
const RATE_LIMIT_PREFIX = 'ai:ratelimit:';
const RATE_LIMIT_MAX = 20; // Max AI calls per hour per user
const RATE_LIMIT_TTL = 3600; // 1 hour

class AlertAIService {
  private redis: Redis;
  
  constructor() {
    this.redis = getRedisClient();
  }
  
  /**
   * Check if user can make AI requests (rate limiting)
   */
  async checkRateLimit(userId: number): Promise<boolean> {
    const key = `${RATE_LIMIT_PREFIX}${userId}`;
    const count = await this.redis.get(key);
    
    if (count && parseInt(count) >= RATE_LIMIT_MAX) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Increment rate limit counter
   */
  async incrementRateLimit(userId: number): Promise<void> {
    const key = `${RATE_LIMIT_PREFIX}${userId}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, RATE_LIMIT_TTL);
    }
  }
  
  /**
   * Get cached analysis if available
   */
  async getCachedAnalysis(alertId: number, contextHash: string): Promise<AIAnalysisResult | null> {
    const key = `${CACHE_PREFIX}${alertId}:${contextHash}`;
    const cached = await this.redis.get(key);
    
    if (cached) {
      const result = JSON.parse(cached) as AIAnalysisResult;
      result.cached = true;
      return result;
    }
    
    return null;
  }
  
  /**
   * Cache analysis result
   */
  async cacheAnalysis(alertId: number, contextHash: string, result: AIAnalysisResult): Promise<void> {
    const key = `${CACHE_PREFIX}${alertId}:${contextHash}`;
    await this.redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL);
  }
  
  /**
   * Generate context hash for cache key
   */
  generateContextHash(context: AlertContext): string {
    // Create a simple hash based on key context elements
    const hashInput = [
      context.alertId,
      context.alertType,
      context.event,
      context.invoiceData?.status,
      context.invoiceData?.daysOverdue,
      context.financialContext?.percentageOfGoal,
    ].join(':');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Build system prompt based on business type
   */
  private buildSystemPrompt(businessType: string): string {
    const basePrompt = `Eres un asistente financiero experto que analiza alertas y proporciona recomendaciones claras y accionables.

Tu rol es:
- Explicar qué está pasando y por qué es relevante
- Evaluar el impacto financiero y operativo
- Sugerir acciones concretas

Reglas importantes:
- Sé conciso y directo
- Usa lenguaje profesional pero accesible
- Nunca inventes datos, usa solo la información proporcionada
- Las recomendaciones deben ser prácticas y ejecutables
- Responde siempre en español`;

    const businessSpecific = {
      freelancer: `
      
Contexto: El usuario es un freelancer independiente.
- Enfatiza el impacto inmediato en el flujo de caja personal
- Usa lenguaje directo y personal
- Prioriza la liquidez y estabilidad financiera
- Considera que cada factura puede representar un porcentaje significativo del ingreso`,
      
      empresa: `
      
Contexto: El usuario representa una empresa.
- Enfatiza tendencias, estabilidad y gestión de riesgo
- Usa lenguaje formal y analítico
- Considera el impacto en la operación general
- Proporciona análisis más detallados`,
      
      agencia: `
      
Contexto: El usuario es una agencia.
- Enfatiza orden, volumen y eficiencia operativa
- Usa lenguaje organizacional
- Considera la gestión de múltiples clientes
- Prioriza la optimización de procesos`,
    };
    
    return basePrompt + (businessSpecific[businessType as keyof typeof businessSpecific] || businessSpecific.freelancer);
  }
  
  /**
   * Build user prompt with context
   */
  private buildUserPrompt(context: AlertContext): string {
    let prompt = `Analiza la siguiente alerta y proporciona tu análisis:

## Alerta
- Tipo: ${context.alertType.toUpperCase()}
- Evento: ${context.event}
- Mensaje: ${context.message}`;

    if (context.invoiceData) {
      prompt += `

## Datos de la Factura
- Cliente: ${context.invoiceData.clientName}
- Monto: ${context.baseCurrency} ${context.invoiceData.total.toLocaleString()}
- Fecha de vencimiento: ${context.invoiceData.dueDate}
- Estado: ${context.invoiceData.status}`;
      
      if (context.invoiceData.daysOverdue) {
        prompt += `
- Días de retraso: ${context.invoiceData.daysOverdue}`;
      }
    }
    
    if (context.clientHistory) {
      prompt += `

## Historial del Cliente
- Total de facturas: ${context.clientHistory.totalInvoices}
- Facturas pagadas: ${context.clientHistory.paidInvoices}
- Promedio de días de pago: ${context.clientHistory.averagePaymentDays}
- Pagos tardíos: ${context.clientHistory.latePayments}
- Ingresos totales del cliente: ${context.baseCurrency} ${context.clientHistory.totalRevenue.toLocaleString()}`;
    }
    
    if (context.financialContext) {
      prompt += `

## Contexto Financiero
- Ingreso mensual actual: ${context.baseCurrency} ${context.financialContext.monthlyIncome.toLocaleString()}
- Meta mensual: ${context.baseCurrency} ${context.financialContext.monthlyGoal.toLocaleString()}
- Progreso: ${context.financialContext.percentageOfGoal}%
- Tendencia: ${context.financialContext.trend === 'up' ? 'Al alza' : context.financialContext.trend === 'down' ? 'A la baja' : 'Estable'}`;
    }
    
    if (context.similarAlerts && context.similarAlerts.count > 0) {
      prompt += `

## Alertas Similares Previas
- Cantidad: ${context.similarAlerts.count}
- Última ocurrencia: ${context.similarAlerts.lastOccurrence}
- Resueltas: ${context.similarAlerts.resolved}`;
    }
    
    prompt += `

## Formato de Respuesta
Responde en formato JSON con la siguiente estructura:
{
  "explanation": "Explicación clara de qué está pasando",
  "relevance": "Por qué esto es relevante para el usuario",
  "impact": {
    "financial": "alto|medio|bajo|ninguno",
    "operational": "alto|medio|bajo|ninguno",
    "urgency": "inmediata|alta|media|baja"
  },
  "recommendation": {
    "action": "Acción recomendada principal",
    "alternative": "Alternativa si aplica (opcional)",
    "consequence": "Posible consecuencia de no actuar"
  },
  "suggestedActions": [
    {
      "label": "Texto del botón",
      "action": "identificador_accion",
      "type": "primary|secondary"
    }
  ],
  "confidence": 0.0-1.0
}`;

    return prompt;
  }
  
  /**
   * Analyze an alert with AI
   */
  async analyzeAlert(context: AlertContext, userId: number): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    // Check rate limit
    const canProceed = await this.checkRateLimit(userId);
    if (!canProceed) {
      throw new Error('Has alcanzado el límite de análisis de IA por hora. Intenta más tarde.');
    }
    
    // Check cache
    const contextHash = this.generateContextHash(context);
    const cached = await this.getCachedAnalysis(context.alertId, contextHash);
    if (cached) {
      return cached;
    }
    
    // Build prompts
    const systemPrompt = this.buildSystemPrompt(context.businessType);
    const userPrompt = this.buildUserPrompt(context);
    
    try {
      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });
      
      // Increment rate limit
      await this.incrementRateLimit(userId);
      
      // Parse response
      const responseText = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);
      
      const result: AIAnalysisResult = {
        explanation: parsed.explanation || 'No se pudo generar una explicación.',
        relevance: parsed.relevance || '',
        impact: {
          financial: parsed.impact?.financial || 'bajo',
          operational: parsed.impact?.operational || 'bajo',
          urgency: parsed.impact?.urgency || 'baja',
        },
        recommendation: {
          action: parsed.recommendation?.action || 'Revisar la alerta manualmente.',
          alternative: parsed.recommendation?.alternative,
          consequence: parsed.recommendation?.consequence || 'Sin consecuencias significativas.',
        },
        suggestedActions: parsed.suggestedActions || [],
        confidence: parsed.confidence || 0.7,
        processingTime: Date.now() - startTime,
        cached: false,
      };
      
      // Cache result
      await this.cacheAnalysis(context.alertId, contextHash, result);
      
      return result;
      
    } catch (error) {
      console.error('[Alert AI] Error analyzing alert:', error);
      
      // Return fallback response
      return {
        explanation: 'No se pudo completar el análisis automático.',
        relevance: 'Revisa la alerta manualmente para más detalles.',
        impact: {
          financial: context.alertType === 'critical' ? 'alto' : context.alertType === 'warning' ? 'medio' : 'bajo',
          operational: 'medio',
          urgency: context.alertType === 'critical' ? 'alta' : 'media',
        },
        recommendation: {
          action: 'Revisar la alerta y tomar acción según corresponda.',
          consequence: 'Depende del tipo de alerta.',
        },
        suggestedActions: [],
        confidence: 0.3,
        processingTime: Date.now() - startTime,
        cached: false,
      };
    }
  }
  
  /**
   * Mark analysis as used (for metrics)
   */
  async markAnalysisUsed(alertId: number, actionTaken: string): Promise<void> {
    const key = `ai:metrics:used:${alertId}`;
    await this.redis.hset(key, {
      actionTaken,
      timestamp: Date.now(),
    });
    await this.redis.expire(key, 86400 * 30); // Keep for 30 days
  }
  
  /**
   * Get AI usage stats for a user
   */
  async getUserStats(userId: number): Promise<{
    callsThisHour: number;
    remainingCalls: number;
  }> {
    const key = `${RATE_LIMIT_PREFIX}${userId}`;
    const count = await this.redis.get(key);
    const calls = count ? parseInt(count) : 0;
    
    return {
      callsThisHour: calls,
      remainingCalls: Math.max(0, RATE_LIMIT_MAX - calls),
    };
  }
  
  /**
   * Clear cache for an alert (when context changes)
   */
  async clearAlertCache(alertId: number): Promise<void> {
    const pattern = `${CACHE_PREFIX}${alertId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Export singleton instance
export const alertAIService = new AlertAIService();
