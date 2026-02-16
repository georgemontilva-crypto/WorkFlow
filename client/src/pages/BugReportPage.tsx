/**
 * BugReportPage - Página dedicada para reportar bugs
 */

import { useState } from "react";
import { Bug, Send, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function BugReportPage() {
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard">
            <a className="inline-flex items-center gap-2 text-[#8B92A8] hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <Bug className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Reportar Bug</h1>
              <p className="text-[#8B92A8] mt-1">
                Ayúdanos a mejorar reportando cualquier problema que encuentres
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6">
            {/* Title */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Título del Bug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Error al guardar factura"
                className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-red-500/50"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
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
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Pasos para Reproducir (Opcional)
              </label>
              <textarea
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="1. Ir a la sección de facturas&#10;2. Hacer clic en 'Nueva Factura'&#10;3. ..."
                rows={4}
                className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>

            {/* Expected Behavior */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Comportamiento Esperado (Opcional)
              </label>
              <textarea
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                placeholder="¿Qué esperabas que sucediera?"
                rows={3}
                className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>

            {/* Actual Behavior */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Comportamiento Actual (Opcional)
              </label>
              <textarea
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                placeholder="¿Qué sucedió en realidad?"
                rows={3}
                className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitMutation.isLoading || !title || !description}
              className="w-full bg-red-500 text-white rounded-lg px-6 py-3 font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {submitMutation.isLoading ? "Enviando..." : "Enviar Reporte"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
