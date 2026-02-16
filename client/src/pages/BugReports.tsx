/**
 * BugReports - Admin panel for managing bug reports
 * Only accessible by super admin
 * 
 * Features:
 * - List all bug conversations
 * - View conversation details
 * - Reply to users
 * - Change status and priority
 * - Unread indicators
 */

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";
import { Bug, MessageCircle, Send, X, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface Conversation {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: "open" | "pending" | "closed";
  priority: "low" | "medium" | "high";
  lastMessageAt: Date;
  createdAt: Date;
  unreadCount: number;
  lastMessage: {
    id: number;
    message: string;
    sender_type: string;
    created_at: Date;
  } | null;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_type: "user" | "admin" | "system";
  message: string;
  attachment_url: string | null;
  is_read: number;
  created_at: Date;
}

export default function BugReports() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const { showToast } = useToast();

  // Fetch all conversations
  const { data: conversations, refetch: refetchConversations } = trpc.bugs.admin.getConversations.useQuery();

  // Fetch selected conversation details
  const { data: conversationData, refetch: refetchConversation } = trpc.bugs.admin.getConversation.useQuery(
    { id: selectedConversation || 0 },
    { enabled: !!selectedConversation }
  );

  // Reply mutation
  const replyMutation = trpc.bugs.admin.reply.useMutation({
    onSuccess: () => {
      setReplyMessage("");
      refetchConversation();
      refetchConversations();
      showToast({
        type: "success",
        title: "Respuesta enviada",
        message: "Tu respuesta ha sido enviada al usuario",
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Error al enviar respuesta",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = trpc.bugs.admin.updateStatus.useMutation({
    onSuccess: () => {
      refetchConversation();
      refetchConversations();
      showToast({
        type: "success",
        title: "Estado actualizado",
        message: "El estado de la conversación ha sido actualizado",
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Error al actualizar estado",
      });
    },
  });

  // Update priority mutation
  const updatePriorityMutation = trpc.bugs.admin.updatePriority.useMutation({
    onSuccess: () => {
      refetchConversation();
      refetchConversations();
      showToast({
        type: "success",
        title: "Prioridad actualizada",
        message: "La prioridad de la conversación ha sido actualizada",
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Error al actualizar prioridad",
      });
    },
  });

  const handleReply = () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    replyMutation.mutate({
      conversationId: selectedConversation,
      message: replyMessage.trim(),
    });
  };

  const handleUpdateStatus = (status: "open" | "pending" | "closed") => {
    if (!selectedConversation) return;

    updateStatusMutation.mutate({
      conversationId: selectedConversation,
      status,
    });
  };

  const handleUpdatePriority = (priority: "low" | "medium" | "high") => {
    if (!selectedConversation) return;

    updatePriorityMutation.mutate({
      conversationId: selectedConversation,
      priority,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "text-gray-500",
      medium: "text-yellow-500",
      high: "text-red-500",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      open: <AlertCircle className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      closed: <CheckCircle2 className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || icons.open;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: "text-green-500",
      pending: "text-yellow-500",
      closed: "text-gray-500",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bug className="w-6 h-6 text-[#C4FF3D]" />
            Reportes de Bugs
          </h1>
          <p className="text-[#8B92A8] mt-1">
            Gestiona los reportes de bugs de los usuarios
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h2 className="text-white font-medium mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Conversaciones
              {conversations && conversations.length > 0 && (
                <span className="text-[#8B92A8] text-sm">({conversations.length})</span>
              )}
            </h2>

            {!conversations || conversations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[rgba(139,146,168,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bug className="w-8 h-8 text-[#8B92A8]" />
                </div>
                <p className="text-[#8B92A8] text-sm">No hay reportes de bugs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      selectedConversation === conv.id
                        ? "bg-[#121212] border border-[#C4FF3D]/20"
                        : "hover:bg-[#121212] border border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{conv.userName}</p>
                        <p className="text-[#8B92A8] text-xs truncate">{conv.userEmail}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-[#C4FF3D] text-black text-xs rounded-full font-medium ml-2">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    {conv.lastMessage && (
                      <p className="text-[#8B92A8] text-sm truncate mb-2">
                        {conv.lastMessage.message}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn("flex items-center gap-1", getStatusColor(conv.status))}>
                        {getStatusIcon(conv.status)}
                        {conv.status}
                      </span>
                      <span className={cn("font-medium", getPriorityColor(conv.priority))}>
                        {conv.priority}
                      </span>
                      <span className="text-[#8B92A8] ml-auto">
                        {formatDate(conv.lastMessageAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversation Details */}
          <div className="lg:col-span-2 bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] flex flex-col max-h-[calc(100vh-200px)]">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[rgba(139,146,168,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-[#8B92A8]" />
                  </div>
                  <p className="text-[#8B92A8]">Selecciona una conversación para ver los detalles</p>
                </div>
              </div>
            ) : conversationData ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-medium">{conversationData.conversation.userName}</h3>
                      <p className="text-[#8B92A8] text-sm">{conversationData.conversation.userEmail}</p>
                    </div>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-1 hover:bg-[rgba(255,255,255,0.06)] rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-[#8B92A8]" />
                    </button>
                  </div>

                  {/* Status and Priority Controls */}
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={conversationData.conversation.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as any)}
                      className="px-3 py-1.5 bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg text-white text-sm focus:outline-none focus:border-[#C4FF3D]/50"
                    >
                      <option value="open">Abierto</option>
                      <option value="pending">Pendiente</option>
                      <option value="closed">Cerrado</option>
                    </select>

                    <select
                      value={conversationData.conversation.priority}
                      onChange={(e) => handleUpdatePriority(e.target.value as any)}
                      className="px-3 py-1.5 bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg text-white text-sm focus:outline-none focus:border-[#C4FF3D]/50"
                    >
                      <option value="low">Prioridad Baja</option>
                      <option value="medium">Prioridad Media</option>
                      <option value="high">Prioridad Alta</option>
                    </select>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {conversationData.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_type === "admin" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2",
                          msg.sender_type === "admin"
                            ? "bg-[#C4FF3D] text-black"
                            : msg.sender_type === "user"
                            ? "bg-[#121212] text-white border border-[rgba(255,255,255,0.06)]"
                            : "bg-[rgba(139,146,168,0.1)] text-[#8B92A8] border border-[rgba(139,146,168,0.2)]"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <span
                          className={cn(
                            "text-xs mt-1 block",
                            msg.sender_type === "admin"
                              ? "text-black/60"
                              : "text-[#8B92A8]"
                          )}
                        >
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="w-full bg-transparent text-white placeholder-[#8B92A8] px-3 py-2 text-sm resize-none focus:outline-none"
                        rows={2}
                        maxLength={2000}
                        disabled={replyMutation.isLoading}
                      />
                    </div>
                    <button
                      onClick={handleReply}
                      disabled={!replyMessage.trim() || replyMutation.isLoading}
                      className="p-3 bg-[#C4FF3D] text-black rounded-lg hover:bg-[#b3ee2c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-[#8B92A8] text-xs mt-2">
                    {replyMessage.length}/2000 caracteres
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[#8B92A8]">Cargando conversación...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
