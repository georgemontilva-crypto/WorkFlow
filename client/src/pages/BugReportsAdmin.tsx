/**
 * BugReportsAdmin - Admin panel for managing bug reports (form submissions)
 * Separate from support chat - this is for one-way bug reports
 */

import { useState } from "react";
import { Bug, ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";

export function BugReportsAdmin() {
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { showToast } = useToast();

  const { data: reports, refetch } = trpc.bugReports.admin.getAllReports.useQuery();

  const updateStatusMutation = trpc.bugReports.admin.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      showToast({ type: "success", title: "Estado actualizado", message: "" });
    },
  });

  const updatePriorityMutation = trpc.bugReports.admin.updatePriority.useMutation({
    onSuccess: () => {
      refetch();
      showToast({ type: "success", title: "Prioridad actualizada", message: "" });
    },
  });

  const addNotesMutation = trpc.bugReports.admin.addNotes.useMutation({
    onSuccess: () => {
      refetch();
      setAdminNotes("");
      showToast({ type: "success", title: "Notas guardadas", message: "" });
    },
  });

  const selectedReportData = reports?.find((r) => r.id === selectedReport);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "in_progress":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="text-[#8B92A8] hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Reportes de Bugs</h1>
              <p className="text-[#8B92A8]">Gestiona los reportes de bugs de los usuarios</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-1 bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6">
            <h2 className="text-white font-medium mb-4">Todos los Reportes ({reports?.length || 0})</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {reports?.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedReport === report.id
                      ? "bg-[#121212] border-red-500"
                      : "bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium text-sm line-clamp-1">{report.title}</h3>
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(report.status)} flex-shrink-0 mt-1`} />
                  </div>
                  <p className="text-[#8B92A8] text-xs line-clamp-2 mb-2">{report.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${getPriorityColor(report.priority)}`}>
                      {report.priority.toUpperCase()}
                    </span>
                    <span className="text-[#8B92A8] text-xs">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
              {!reports || reports.length === 0 && (
                <div className="text-center py-8 text-[#8B92A8]">
                  <Bug className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay reportes de bugs</p>
                </div>
              )}
            </div>
          </div>

          {/* Report Details */}
          <div className="lg:col-span-2 bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6">
            {selectedReportData ? (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedReportData.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-[#8B92A8]">
                    <span>ID: #{selectedReportData.id}</span>
                    <span>•</span>
                    <span>{new Date(selectedReportData.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Status and Priority Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Estado</label>
                    <select
                      value={selectedReportData.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: selectedReportData.id,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500/50"
                    >
                      <option value="new">Nuevo</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="resolved">Resuelto</option>
                      <option value="closed">Cerrado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Prioridad</label>
                    <select
                      value={selectedReportData.priority}
                      onChange={(e) =>
                        updatePriorityMutation.mutate({
                          id: selectedReportData.id,
                          priority: e.target.value as any,
                        })
                      }
                      className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500/50"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-white font-medium mb-2">Descripción</h3>
                  <p className="text-[#8B92A8] whitespace-pre-wrap">{selectedReportData.description}</p>
                </div>

                {/* Steps to Reproduce */}
                {selectedReportData.steps_to_reproduce && (
                  <div>
                    <h3 className="text-white font-medium mb-2">Pasos para Reproducir</h3>
                    <p className="text-[#8B92A8] whitespace-pre-wrap">{selectedReportData.steps_to_reproduce}</p>
                  </div>
                )}

                {/* Expected Behavior */}
                {selectedReportData.expected_behavior && (
                  <div>
                    <h3 className="text-white font-medium mb-2">Comportamiento Esperado</h3>
                    <p className="text-[#8B92A8]">{selectedReportData.expected_behavior}</p>
                  </div>
                )}

                {/* Actual Behavior */}
                {selectedReportData.actual_behavior && (
                  <div>
                    <h3 className="text-white font-medium mb-2">Comportamiento Actual</h3>
                    <p className="text-[#8B92A8]">{selectedReportData.actual_behavior}</p>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <h3 className="text-white font-medium mb-2">Notas del Administrador</h3>
                  {selectedReportData.admin_notes && (
                    <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 mb-3">
                      <p className="text-[#8B92A8] whitespace-pre-wrap">{selectedReportData.admin_notes}</p>
                    </div>
                  )}
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Agregar notas internas..."
                    rows={3}
                    className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-red-500/50 resize-none mb-2"
                  />
                  <button
                    onClick={() =>
                      addNotesMutation.mutate({
                        id: selectedReportData.id,
                        notes: adminNotes,
                      })
                    }
                    disabled={!adminNotes || addNotesMutation.isLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Guardar Notas
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <AlertCircle className="w-16 h-16 text-[#8B92A8] mb-4" />
                <h3 className="text-white font-medium mb-2">Selecciona un reporte</h3>
                <p className="text-[#8B92A8]">Haz clic en un reporte de la lista para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BugReportsAdmin;
