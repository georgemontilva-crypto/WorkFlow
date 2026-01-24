/**
 * AlertAIAnalysis - Component to display AI analysis for alerts
 * Shows explanation, impact assessment, and recommendations
 * Design: Outline-only, consistent with AlertCenter
 */

import { useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

interface AlertAIAnalysisProps {
  alertId: number;
  alertType: 'warning' | 'critical';
  onActionClick?: (action: string) => void;
}

// Impact level colors and labels
const impactConfig = {
  alto: { color: 'text-red-400 border-red-500', label: 'Alto' },
  medio: { color: 'text-yellow-400 border-yellow-500', label: 'Medio' },
  bajo: { color: 'text-blue-400 border-blue-500', label: 'Bajo' },
  ninguno: { color: 'text-gray-400 border-gray-500', label: 'Ninguno' },
};

const urgencyConfig = {
  inmediata: { color: 'text-red-400', label: 'Inmediata' },
  alta: { color: 'text-orange-400', label: 'Alta' },
  media: { color: 'text-yellow-400', label: 'Media' },
  baja: { color: 'text-green-400', label: 'Baja' },
};

export function AlertAIAnalysis({ alertId, alertType, onActionClick }: AlertAIAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  const utils = trpc.useUtils();
  
  // AI Analysis mutation
  const analyzeMutation = trpc.alerts.analyzeWithAI.useMutation({
    onSuccess: () => {
      setHasAnalyzed(true);
    },
  });
  
  // Mark analysis as used
  const markUsedMutation = trpc.alerts.markAIAnalysisUsed.useMutation();
  
  // Get AI stats
  const { data: aiStats } = trpc.alerts.aiStats.useQuery(undefined, {
    enabled: isExpanded,
  });
  
  const handleAnalyze = async () => {
    if (!hasAnalyzed) {
      await analyzeMutation.mutateAsync({ alertId });
    }
    setIsExpanded(true);
  };
  
  const handleActionClick = (action: string) => {
    markUsedMutation.mutate({ alertId, actionTaken: action });
    onActionClick?.(action);
  };
  
  const analysis = analyzeMutation.data;
  
  // Collapsed state - just show the button
  if (!isExpanded) {
    return (
      <button
        onClick={handleAnalyze}
        disabled={analyzeMutation.isPending}
        className={`
          w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
          font-medium text-sm transition-all
          border-2 border-dashed
          ${alertType === 'critical' 
            ? 'border-red-500/50 text-red-400 hover:border-red-400 hover:bg-red-500/5' 
            : 'border-yellow-500/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-500/5'
          }
          ${analyzeMutation.isPending ? 'opacity-70 cursor-wait' : ''}
        `}
      >
        {analyzeMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analizando...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            ¿Por qué veo esta alerta?
          </>
        )}
      </button>
    );
  }
  
  // Loading state
  if (analyzeMutation.isPending) {
    return (
      <div className="mt-3 p-4 rounded-lg border-2 border-dashed border-border bg-[#141414]">
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Analizando contexto...</span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (analyzeMutation.isError) {
    return (
      <div className="mt-3 p-4 rounded-lg border-2 border-red-500/30 bg-red-500/5">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400 font-medium">No se pudo analizar</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analyzeMutation.error?.message || 'Error al procesar el análisis'}
            </p>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Analysis result
  if (!analysis) return null;
  
  return (
    <div className={`
      mt-3 rounded-lg border-2 overflow-hidden
      ${alertType === 'critical' ? 'border-red-500/30' : 'border-yellow-500/30'}
      bg-[#141414]
    `}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${alertType === 'critical' ? 'text-red-400' : 'text-yellow-400'}`} />
          <span className="text-sm font-medium">Análisis IA</span>
          {analysis.cached && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">
              En caché
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {analysis.processingTime}ms
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Explanation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Qué está pasando
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              {analysis.explanation}
            </p>
            {analysis.relevance && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                {analysis.relevance}
              </p>
            )}
          </div>
          
          {/* Impact Assessment */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Evaluación de Impacto
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* Financial Impact */}
              <div className={`
                p-2 rounded-lg border-2 text-center
                ${impactConfig[analysis.impact.financial].color}
              `}>
                <p className="text-[10px] uppercase tracking-wide opacity-70">Financiero</p>
                <p className="text-sm font-semibold mt-0.5">
                  {impactConfig[analysis.impact.financial].label}
                </p>
              </div>
              
              {/* Operational Impact */}
              <div className={`
                p-2 rounded-lg border-2 text-center
                ${impactConfig[analysis.impact.operational].color}
              `}>
                <p className="text-[10px] uppercase tracking-wide opacity-70">Operativo</p>
                <p className="text-sm font-semibold mt-0.5">
                  {impactConfig[analysis.impact.operational].label}
                </p>
              </div>
              
              {/* Urgency */}
              <div className={`
                p-2 rounded-lg border-2 border-border text-center
              `}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Urgencia</p>
                <p className={`text-sm font-semibold mt-0.5 ${urgencyConfig[analysis.impact.urgency].color}`}>
                  {urgencyConfig[analysis.impact.urgency].label}
                </p>
              </div>
            </div>
          </div>
          
          {/* Recommendation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recomendación
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-border">
              <p className="text-sm font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                {analysis.recommendation.action}
              </p>
              {analysis.recommendation.alternative && (
                <p className="text-sm text-muted-foreground mt-2 pl-6">
                  <span className="text-xs uppercase tracking-wide">Alternativa:</span>{' '}
                  {analysis.recommendation.alternative}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2 pl-6 flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>Si no actúas: {analysis.recommendation.consequence}</span>
              </p>
            </div>
          </div>
          
          {/* Suggested Actions */}
          {analysis.suggestedActions && analysis.suggestedActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {analysis.suggestedActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleActionClick(action.action)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-colors border-2
                    ${action.type === 'primary'
                      ? alertType === 'critical'
                        ? 'border-red-500 text-red-400 hover:bg-red-500/10'
                        : 'border-yellow-500 text-yellow-400 hover:bg-yellow-500/10'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }
                  `}
                >
                  {action.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
          
          {/* Confidence & Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Confianza: {Math.round(analysis.confidence * 100)}%
              </span>
              {aiStats && (
                <span className="text-xs text-muted-foreground">
                  • {aiStats.remainingCalls} análisis restantes esta hora
                </span>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
