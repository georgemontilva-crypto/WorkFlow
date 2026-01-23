/**
 * Proactive AI Service
 * 
 * Genera mensajes proactivos basados en análisis real de datos financieros.
 * 
 * PRINCIPIO FUNDAMENTAL:
 * - Solo genera mensajes cuando hay insights relevantes
 * - El silencio es un resultado válido y deseado
 * - NO genera mensajes por calendario fijo ni reglas vacías
 * 
 * Actúa como un "analista silencioso" que observa con criterio.
 */

import OpenAI from 'openai';
import { getRedisClient } from '../config/redis';
import type { Redis } from 'ioredis';

// Initialize OpenAI client
const openai = new OpenAI();

// Types
export interface UserFinancialData {
  userId: number;
  
  // Profile
  businessType: 'freelancer' | 'empresa' | 'agencia';
  baseCurrency: string;
  monthlyIncomeGoal?: number;
  
  // Income data
  currentMonthIncome: number;
  previousMonthIncome: number;
  threeMonthAverageIncome: number;
  sixMonthAverageIncome: number;
  
  // Invoice data
  totalInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  paidInvoicesThisMonth: number;
  
  // Client data
  totalClients: number;
  activeClients: number;
  topClientRevenue: number;
  topClientPercentage: number; // % of total revenue from top client
  
  // Payment behavior
  averagePaymentDays: number;
  latePaymentRate: number; // % of invoices paid late
  
  // Activity
  daysSinceLastInvoice: number;
  daysSinceLastPayment: number;
  
  // Alerts history
  unresolvedAlerts: number;
  resolvedAlertsThisMonth: number;
}

export interface ProactiveInsight {
  // Insight type
  type: 'positive' | 'warning' | 'neutral' | 'opportunity';
  
  // Category
  category: 'income' | 'clients' | 'payments' | 'activity' | 'goals' | 'risk';
  
  // Content
  title: string;
  message: string;
  context?: string;
  suggestion?: string;
  
  // Metadata
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  
  // For email eligibility
  emailWorthy: boolean;
}

export interface ProactiveAnalysisResult {
  hasInsight: boolean;
  insight?: ProactiveInsight;
  analysisDate: string;
  dataHash: string;
}

// Cache configuration
const CACHE_PREFIX = 'ai:proactive:';
const CACHE_TTL = 86400; // 24 hours - don't repeat analysis if data hasn't changed
const LAST_INSIGHT_PREFIX = 'ai:lastinsight:';
const LAST_INSIGHT_TTL = 604800; // 7 days - prevent similar messages

// Rate limiting for proactive analysis
const PROACTIVE_RATE_PREFIX = 'ai:proactive:rate:';
const PROACTIVE_RATE_MAX = 3; // Max 3 proactive analyses per day per user
const PROACTIVE_RATE_TTL = 86400; // 24 hours

class ProactiveAIService {
  private redis: Redis;
  
  constructor() {
    this.redis = getRedisClient();
  }
  
  /**
   * Generate a hash of the financial data to detect changes
   */
  generateDataHash(data: UserFinancialData): string {
    const hashInput = [
      data.currentMonthIncome,
      data.previousMonthIncome,
      data.pendingInvoices,
      data.overdueInvoices,
      data.topClientPercentage,
      data.averagePaymentDays,
      data.latePaymentRate,
      data.daysSinceLastInvoice,
      data.unresolvedAlerts,
    ].join(':');
    
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Check if we should run analysis (data has changed)
   */
  async shouldAnalyze(userId: number, dataHash: string): Promise<boolean> {
    const key = `${CACHE_PREFIX}${userId}:hash`;
    const lastHash = await this.redis.get(key);
    
    // If data hasn't changed, skip analysis
    if (lastHash === dataHash) {
      console.log(`[ProactiveAI] User ${userId}: Data unchanged, skipping analysis`);
      return false;
    }
    
    // Check rate limit
    const rateKey = `${PROACTIVE_RATE_PREFIX}${userId}`;
    const count = await this.redis.get(rateKey);
    if (count && parseInt(count) >= PROACTIVE_RATE_MAX) {
      console.log(`[ProactiveAI] User ${userId}: Rate limit reached`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Mark analysis as done
   */
  async markAnalysisDone(userId: number, dataHash: string): Promise<void> {
    const hashKey = `${CACHE_PREFIX}${userId}:hash`;
    await this.redis.set(hashKey, dataHash, 'EX', CACHE_TTL);
    
    const rateKey = `${PROACTIVE_RATE_PREFIX}${userId}`;
    const current = await this.redis.incr(rateKey);
    if (current === 1) {
      await this.redis.expire(rateKey, PROACTIVE_RATE_TTL);
    }
  }
  
  /**
   * Check if a similar insight was recently generated
   */
  async isSimilarInsightRecent(userId: number, category: string): Promise<boolean> {
    const key = `${LAST_INSIGHT_PREFIX}${userId}:${category}`;
    const lastInsight = await this.redis.get(key);
    return !!lastInsight;
  }
  
  /**
   * Mark insight as generated
   */
  async markInsightGenerated(userId: number, category: string): Promise<void> {
    const key = `${LAST_INSIGHT_PREFIX}${userId}:${category}`;
    await this.redis.set(key, Date.now().toString(), 'EX', LAST_INSIGHT_TTL);
  }
  
  /**
   * Build system prompt based on business type
   */
  private buildSystemPrompt(businessType: string): string {
    const basePrompt = `Eres un analista financiero silencioso y observador. Tu trabajo es detectar insights relevantes en los datos financieros de un usuario.

REGLAS FUNDAMENTALES:
1. Solo genera un mensaje si hay algo REALMENTE relevante que comunicar
2. El silencio es un resultado válido - si no hay nada importante, responde con hasInsight: false
3. NO inventes datos ni hagas suposiciones
4. NO generes mensajes genéricos o motivacionales vacíos
5. Solo habla cuando el insight aporta valor real

TIPOS DE INSIGHTS A DETECTAR:
- Cambios significativos (mejoras o empeoramientos)
- Riesgos reales (no hipotéticos)
- Patrones repetidos que merecen atención
- Logros o hitos dignos de reconocimiento
- Dependencias peligrosas (ej: un cliente representa >50% de ingresos)

TIPOS DE INSIGHTS A EVITAR:
- "Todo va bien, sigue así" (vacío)
- Recordatorios genéricos
- Mensajes que no aportan información nueva
- Predicciones sin base en datos

Responde siempre en español.`;

    const businessSpecific = {
      freelancer: `

CONTEXTO: Usuario freelancer independiente.
- Enfatiza impacto inmediato en flujo de caja personal
- Usa lenguaje directo y personal
- Considera que cada factura puede ser un % significativo del ingreso
- Prioriza liquidez y estabilidad`,
      
      empresa: `

CONTEXTO: Usuario representa una empresa.
- Enfatiza tendencias, estabilidad y gestión de riesgo
- Usa lenguaje formal y analítico
- Considera el impacto en la operación general
- Proporciona análisis más detallados`,
      
      agencia: `

CONTEXTO: Usuario es una agencia.
- Enfatiza orden, volumen y eficiencia operativa
- Usa lenguaje organizacional
- Considera la gestión de múltiples clientes
- Prioriza optimización de procesos`,
    };
    
    return basePrompt + (businessSpecific[businessType as keyof typeof businessSpecific] || businessSpecific.freelancer);
  }
  
  /**
   * Build user prompt with financial data
   */
  private buildUserPrompt(data: UserFinancialData): string {
    const incomeChange = data.previousMonthIncome > 0 
      ? ((data.currentMonthIncome - data.previousMonthIncome) / data.previousMonthIncome * 100).toFixed(1)
      : 'N/A';
    
    const goalProgress = data.monthlyIncomeGoal && data.monthlyIncomeGoal > 0
      ? ((data.currentMonthIncome / data.monthlyIncomeGoal) * 100).toFixed(1)
      : 'N/A';

    return `Analiza los siguientes datos financieros y determina si hay algún insight relevante que comunicar.

## Datos del Usuario

### Ingresos
- Ingreso mes actual: ${data.baseCurrency} ${data.currentMonthIncome.toLocaleString()}
- Ingreso mes anterior: ${data.baseCurrency} ${data.previousMonthIncome.toLocaleString()}
- Cambio: ${incomeChange}%
- Promedio 3 meses: ${data.baseCurrency} ${data.threeMonthAverageIncome.toLocaleString()}
- Promedio 6 meses: ${data.baseCurrency} ${data.sixMonthAverageIncome.toLocaleString()}
${data.monthlyIncomeGoal ? `- Meta mensual: ${data.baseCurrency} ${data.monthlyIncomeGoal.toLocaleString()} (${goalProgress}% alcanzado)` : ''}

### Facturas
- Total facturas: ${data.totalInvoices}
- Pendientes: ${data.pendingInvoices}
- Vencidas: ${data.overdueInvoices}
- Pagadas este mes: ${data.paidInvoicesThisMonth}

### Clientes
- Total clientes: ${data.totalClients}
- Clientes activos: ${data.activeClients}
- Ingresos del cliente principal: ${data.baseCurrency} ${data.topClientRevenue.toLocaleString()}
- % de ingresos del cliente principal: ${data.topClientPercentage.toFixed(1)}%

### Comportamiento de Pagos
- Promedio días de pago: ${data.averagePaymentDays} días
- Tasa de pagos tardíos: ${data.latePaymentRate.toFixed(1)}%

### Actividad
- Días desde última factura: ${data.daysSinceLastInvoice}
- Días desde último pago recibido: ${data.daysSinceLastPayment}

### Alertas
- Alertas sin resolver: ${data.unresolvedAlerts}
- Alertas resueltas este mes: ${data.resolvedAlertsThisMonth}

## Instrucciones

Si detectas un insight relevante, responde con:
{
  "hasInsight": true,
  "insight": {
    "type": "positive|warning|neutral|opportunity",
    "category": "income|clients|payments|activity|goals|risk",
    "title": "Título breve del insight",
    "message": "Mensaje principal explicando el insight",
    "context": "Comparación o contexto adicional si aplica",
    "suggestion": "Sugerencia suave si aplica (no acción automática)",
    "confidence": 0.0-1.0,
    "priority": "high|medium|low",
    "emailWorthy": true/false
  }
}

Si NO hay nada relevante que comunicar, responde con:
{
  "hasInsight": false
}

RECUERDA: El silencio es válido. Solo genera un insight si realmente aporta valor.`;
  }
  
  /**
   * Analyze user's financial data and generate proactive insight if relevant
   */
  async analyzeUserData(data: UserFinancialData): Promise<ProactiveAnalysisResult> {
    const dataHash = this.generateDataHash(data);
    
    // Check if we should analyze
    const shouldRun = await this.shouldAnalyze(data.userId, dataHash);
    if (!shouldRun) {
      return {
        hasInsight: false,
        analysisDate: new Date().toISOString(),
        dataHash,
      };
    }
    
    // Build prompts
    const systemPrompt = this.buildSystemPrompt(data.businessType);
    const userPrompt = this.buildUserPrompt(data);
    
    try {
      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      });
      
      // Mark analysis as done
      await this.markAnalysisDone(data.userId, dataHash);
      
      // Parse response
      const responseText = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);
      
      if (!parsed.hasInsight) {
        console.log(`[ProactiveAI] User ${data.userId}: No insight generated (silence is valid)`);
        return {
          hasInsight: false,
          analysisDate: new Date().toISOString(),
          dataHash,
        };
      }
      
      // Check if similar insight was recently generated
      const category = parsed.insight?.category || 'general';
      const isSimilar = await this.isSimilarInsightRecent(data.userId, category);
      if (isSimilar) {
        console.log(`[ProactiveAI] User ${data.userId}: Similar insight recently generated, skipping`);
        return {
          hasInsight: false,
          analysisDate: new Date().toISOString(),
          dataHash,
        };
      }
      
      // Mark this insight category as generated
      await this.markInsightGenerated(data.userId, category);
      
      const insight: ProactiveInsight = {
        type: parsed.insight.type || 'neutral',
        category: parsed.insight.category || 'general',
        title: parsed.insight.title || 'Insight',
        message: parsed.insight.message || '',
        context: parsed.insight.context,
        suggestion: parsed.insight.suggestion,
        confidence: parsed.insight.confidence || 0.7,
        priority: parsed.insight.priority || 'medium',
        emailWorthy: parsed.insight.emailWorthy || false,
      };
      
      console.log(`[ProactiveAI] User ${data.userId}: Insight generated - ${insight.title}`);
      
      return {
        hasInsight: true,
        insight,
        analysisDate: new Date().toISOString(),
        dataHash,
      };
      
    } catch (error) {
      console.error('[ProactiveAI] Error analyzing data:', error);
      return {
        hasInsight: false,
        analysisDate: new Date().toISOString(),
        dataHash,
      };
    }
  }
  
  /**
   * Get remaining proactive analyses for user today
   */
  async getRemainingAnalyses(userId: number): Promise<number> {
    const rateKey = `${PROACTIVE_RATE_PREFIX}${userId}`;
    const count = await this.redis.get(rateKey);
    return PROACTIVE_RATE_MAX - (count ? parseInt(count) : 0);
  }
}

// Export singleton instance
export const proactiveAIService = new ProactiveAIService();
