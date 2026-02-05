/**
 * Investment Tracker Component
 * Premium horizontal cards design for crypto portfolio tracking
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, FileText } from 'lucide-react';
import PurchaseHistoryModal from './PurchaseHistoryModal';

interface ProjectSummary {
  symbol: string;
  name: string;
  total_quantity: number;
  avg_buy_price: number;
  current_price: number;
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  price_change_24h: number;
}

interface InvestmentTrackerProps {
  projectSummaries: ProjectSummary[];
}

export function InvestmentTracker({ projectSummaries }: InvestmentTrackerProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (project: ProjectSummary) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  if (!projectSummaries || projectSummaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-[#121212] rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-[#8B92A8]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No tienes activos registrados</h3>
        <p className="text-sm text-[#8B92A8] max-w-md">
          Comienza a registrar tus compras de criptomonedas para hacer seguimiento de tu portafolio
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectSummaries.map((project) => (
          <div
            key={project.symbol}
            className="bg-[#121212] border border-[rgba(255,255,255,0.04)] rounded-2xl p-5 hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)] transition-all group"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0A0A0A] rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-[#C4FF3D]">{project.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{project.name}</h3>
                  <p className="text-xs text-[#8B92A8]">{project.symbol}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#8B92A8] group-hover:text-[#C4FF3D] group-hover:translate-x-1 transition-all" />
            </div>

            {/* Value */}
            <div className="mb-4">
              <p className="text-xs text-[#8B92A8] mb-1">Valor total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {project.total_quantity.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 8 
                  })}
                </span>
                <span className="text-sm text-[#8B92A8]">{project.symbol}</span>
              </div>
              <p className="text-sm text-[#8B92A8] mt-1">
                ${project.current_value.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <div>
                <p className="text-xs text-[#8B92A8] mb-1">Precio</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    ${project.current_price.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-[#8B92A8] mb-1">Ganancia/Pérdida</p>
                <div
                  className={`flex items-center gap-1.5 text-sm font-semibold ${
                    project.profit_loss_percentage >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {project.profit_loss_percentage >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(project.profit_loss_percentage).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Registros Button */}
            <button
              onClick={() => handleOpenModal(project)}
              className="w-full mt-4 border border-[rgba(255,255,255,0.1)] text-white py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)] transition-all font-medium text-sm flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Registros
            </button>
          </div>
        ))}
      </div>

      {/* Purchase History Modal */}
      {selectedProject && (
        <PurchaseHistoryModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          symbol={selectedProject.symbol}
          name={selectedProject.name}
        />
      )}
    </>
  );
}
