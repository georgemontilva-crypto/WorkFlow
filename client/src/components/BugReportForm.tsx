/**
 * BugReportForm - Simple one-way bug report form
 * Users fill out the form and submit, no conversation thread
 */

import { useState } from "react";
import { X, Bug, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";

export function BugReportForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const { showToast } = useToast();

  const submitMutation = trpc.bugReports.submit.useMutation({
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Reporte enviado",
        message: "Tu reporte de bug ha sido enviado. Gracias por tu ayuda!",
      });
      // Reset form
      setTitle("");
      setDescription("");
      setStepsToReproduce("");
      setExpectedBehavior("");
      setActualBehavior("");
      setIsOpen(false);
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Error al enviar el reporte",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) {
      showToast({
        type: "error",
        title: "Campos requeridos",
        message: "Por favor completa el título y la descripción",
      });
      return;
    }

    submitMutation.mutate({
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 right-4 md:bottom-20 md:right-4 z-40 flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
      >
        <Bug className="w-5 h-5" />
        <span className="font-medium">Reportar Bug</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <Bug className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium">Reportar un Bug</h3>
              <p className="text-[#8B92A8] text-xs">Ayúdanos a mejorar Finwrk</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[#8B92A8] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Título del Bug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Error al crear factura"
              className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-red-500/50"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el problema que encontraste..."
              rows={4}
              className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-red-500/50 resize-none"
              required
            />
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Pasos para Reproducir (Opcional)
            </label>
            <textarea
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Ve a...&#10;2. Haz clic en...&#10;3. Observa que..."
              rows={3}
              className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-red-500/50 resize-none"
            />
          </div>

          {/* Expected Behavior */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Comportamiento Esperado (Opcional)
            </label>
            <input
              type="text"
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              placeholder="Qué debería pasar..."
              className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Actual Behavior */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Comportamiento Actual (Opcional)
            </label>
            <input
              type="text"
              value={actualBehavior}
              onChange={(e) => setActualBehavior(e.target.value)}
              placeholder="Qué está pasando..."
              className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-3 bg-[#121212] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitMutation.isLoading}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitMutation.isLoading ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Reporte
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
