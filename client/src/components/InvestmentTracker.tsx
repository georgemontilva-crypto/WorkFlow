/**
 * Investment Tracker Component
 * Displays cryptocurrency investment portfolio with real-time profit/loss calculations
 */

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface Crypto {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

interface Project {
  id: number;
  user_id: number;
  symbol: string;
  created_at: Date;
}

interface ProjectWithCrypto {
  project: Project;
  crypto: Crypto | undefined;
  currentPrice: number;
}

interface InvestmentTrackerProps {
  projectSummaries: ProjectWithCrypto[];
}

interface ProjectSummary {
  symbol: string;
  totalQuantity: number;
  totalInvestment: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  purchaseCount: number;
}

export function InvestmentTracker({ projectSummaries }: InvestmentTrackerProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [summaries, setSummaries] = useState<Map<string, ProjectSummary>>(new Map());

  const toggleProject = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  if (!projectSummaries || projectSummaries.length === 0) {
    return (
      <div className="text-center py-8 text-[#8B92A8]">
        No tienes inversiones registradas. Haz clic en "Registrar Compra" para comenzar a rastrear tus inversiones.
      </div>
    );
  }

  // Calculate totals from summaries
  let totalInvestment = 0;
  let totalCurrentValue = 0;

  summaries.forEach((summary) => {
    totalInvestment += summary.totalInvestment;
    totalCurrentValue += summary.currentValue;
  });

  const totalProfitLoss = totalCurrentValue - totalInvestment;
  const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Global Summary */}
      {summaries.size > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
            <div className="text-sm text-[#8B92A8] mb-1">Proyectos Activos</div>
            <div className="text-xl font-bold text-white">
              {summaries.size}
            </div>
          </div>
          
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
            <div className="text-sm text-[#8B92A8] mb-1">Inversión Total</div>
            <div className="text-xl font-bold text-white">
              ${totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
            <div className="text-sm text-[#8B92A8] mb-1">Valor Actual</div>
            <div className="text-xl font-bold text-white">
              ${totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
            <div className="text-sm text-[#8B92A8] mb-1">Ganancia/Pérdida Total</div>
            <div className={`text-xl font-bold ${totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${Math.abs(totalProfitLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-sm ml-2">
                ({totalProfitLossPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Individual Projects */}
      <div className="space-y-3">
        {projectSummaries.map(({ project, crypto, currentPrice }) => (
          <ProjectCard
            key={project.id}
            project={project}
            crypto={crypto}
            currentPrice={currentPrice}
            isExpanded={expandedProjects.has(project.id)}
            onToggle={() => toggleProject(project.id)}
            onSummaryLoaded={(summary) => {
              setSummaries(prev => {
                const newMap = new Map(prev);
                newMap.set(project.symbol, summary);
                return newMap;
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  crypto: Crypto | undefined;
  currentPrice: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSummaryLoaded: (summary: ProjectSummary) => void;
}

function ProjectCard({ project, crypto, currentPrice, isExpanded, onToggle, onSummaryLoaded }: ProjectCardProps) {
  const { data: summary } = trpc.crypto.getProjectSummary.useQuery(
    {
      symbol: project.symbol,
      currentPrice: currentPrice,
    },
    {
      enabled: currentPrice > 0,
    }
  );

  const { data: projectData } = trpc.crypto.getProject.useQuery(
    { id: project.id },
    { enabled: isExpanded }
  );

  // Notify parent when summary is loaded
  useEffect(() => {
    if (summary) {
      onSummaryLoaded(summary);
    }
  }, [summary, onSummaryLoaded]);

  if (!summary) {
    return (
      <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
        <div className="flex items-center gap-3">
          {crypto?.image && (
            <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
          )}
          <div className="text-left">
            <div className="font-bold text-white">{crypto?.name || project.symbol}</div>
            <div className="text-sm text-[#8B92A8]">Cargando...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden">
      {/* Project Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[rgba(255,255,255,0.02)] transition-colors"
      >
        <div className="flex items-center gap-3">
          {crypto?.image && (
            <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
          )}
          <div className="text-left">
            <div className="font-bold text-white">{crypto?.name || project.symbol}</div>
            <div className="text-sm text-[#8B92A8]">{project.symbol}</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm text-[#8B92A8]">Inversión</div>
            <div className="font-medium text-white">
              ${summary.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-[#8B92A8]">Valor Actual</div>
            <div className="font-medium text-white">
              ${summary.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-right min-w-[120px]">
            <div className="text-sm text-[#8B92A8]">Ganancia/Pérdida</div>
            <div className={`font-bold ${summary.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {summary.profitLoss >= 0 ? '+' : '-'}${Math.abs(summary.profitLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-sm ml-1">
                ({summary.profitLossPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>

          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[#8B92A8]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#8B92A8]" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && projectData && (
        <div className="border-t border-[rgba(255,255,255,0.06)] p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-[#121212] rounded-lg p-3">
              <div className="text-xs text-[#8B92A8] mb-1">Cantidad Total</div>
              <div className="text-lg font-bold text-white">
                {summary.totalQuantity.toFixed(8)} {project.symbol}
              </div>
            </div>
            
            <div className="bg-[#121212] rounded-lg p-3">
              <div className="text-xs text-[#8B92A8] mb-1">Precio Promedio</div>
              <div className="text-lg font-bold text-white">
                ${summary.averagePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="bg-[#121212] rounded-lg p-3">
              <div className="text-xs text-[#8B92A8] mb-1">Precio Actual</div>
              <div className="text-lg font-bold text-white">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div>
            <h4 className="text-sm font-medium text-[#8B92A8] mb-2">Historial de Compras</h4>
            <div className="space-y-2">
              {projectData.purchases.map((purchase) => {
                const quantity = parseFloat(purchase.quantity);
                const buyPrice = parseFloat(purchase.buy_price);
                const invested = quantity * buyPrice;
                const currentValue = quantity * currentPrice;
                const profitLoss = currentValue - invested;
                const profitLossPercentage = (profitLoss / invested) * 100;

                return (
                  <div
                    key={purchase.id}
                    className="bg-[#121212] rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="text-sm text-white">
                        {quantity.toFixed(8)} {project.symbol}
                      </div>
                      <div className="text-xs text-[#8B92A8]">
                        @ ${buyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-white">
                        ${invested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`text-xs ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        ({profitLossPercentage.toFixed(2)}%)
                      </div>
                    </div>

                    <div className="text-xs text-[#8B92A8] ml-4">
                      {new Date(purchase.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
