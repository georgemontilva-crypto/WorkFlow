/**
 * BugReportChat - WhatsApp-style bug reporting chat interface
 * 
 * Features:
 * - Minimizable chat modal
 * - Persistent conversation
 * - Real-time message updates
 * - File attachment support
 * - Status indicators
 */

import { useState, useEffect, useRef } from "react";
import { X, Send, Paperclip, MessageCircle, Minimize2, Bug } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  conversation_id: number;
  sender_type: "user" | "admin" | "system";
  message: string;
  attachment_url: string | null;
  is_read: number;
  created_at: Date;
}

interface Conversation {
  id: number;
  user_id: number;
  status: "open" | "pending" | "closed";
  priority: "low" | "medium" | "high";
  last_message_at: Date;
  created_at: Date;
  updated_at: Date;
}

export function BugReportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Fetch conversations with auto-refresh every 3 seconds when open
  const { data: conversations, refetch: refetchConversations } = trpc.bugs.getConversations.useQuery(
    undefined,
    { 
      enabled: isOpen,
      refetchInterval: isOpen && !isMinimized ? 3000 : false // Poll every 3 seconds when chat is open
    }
  );

  // Fetch conversation details with auto-refresh
  const { data: conversationData, refetch: refetchConversation } = trpc.bugs.getConversation.useQuery(
    { id: conversation?.id || 0 },
    { 
      enabled: !!conversation,
      refetchInterval: conversation && isOpen && !isMinimized ? 3000 : false // Poll every 3 seconds
    }
  );

  // Send message mutation
  const sendMessageMutation = trpc.bugs.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessage("");
      refetchConversations();
      if (conversation) {
        refetchConversation();
      } else {
        // New conversation created, fetch it
        refetchConversations();
      }
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Error al enviar mensaje",
      });
    },
  });

  // Update conversation when conversations change
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      setConversation(conversations[0]);
    }
  }, [conversations]);

  // Update messages when conversation data changes
  useEffect(() => {
    if (conversationData) {
      setMessages(conversationData.messages);
    }
  }, [conversationData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      message: message.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = () => {
    if (!conversation) return null;

    const statusColors = {
      open: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };

    const statusText = {
      open: "Abierto",
      pending: "Pendiente",
      closed: "Resuelto",
    };

    return (
      <span className={cn(
        "px-2 py-1 text-xs rounded-full border",
        statusColors[conversation.status]
      )}>
        {statusText[conversation.status]}
      </span>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-4 md:right-4 z-40 flex items-center gap-2 px-4 py-3 bg-[#C4FF3D] text-black rounded-full shadow-lg hover:bg-[#b3ee2c] transition-all"
      >
        <Bug className="w-5 h-5" />
        <span className="font-medium">Reportar un bug</span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 md:bottom-4 md:right-4 z-40 flex items-center gap-2 px-4 py-3 bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] text-white rounded-full shadow-lg hover:bg-[#121212] transition-all"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium">Soporte Finwrk</span>
        {conversations && conversations[0]?.unreadCount > 0 && (
          <span className="px-2 py-0.5 bg-[#C4FF3D] text-black text-xs rounded-full font-medium">
            {conversations[0].unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-4 md:right-4 z-40 w-[calc(100vw-2rem)] md:w-96 h-[500px] bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C4FF3D] rounded-full flex items-center justify-center">
            <Bug className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-white font-medium">Soporte Finwrk</h3>
            <p className="text-[#8B92A8] text-xs">Describe el problema que estás experimentando</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-[rgba(255,255,255,0.06)] rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-[#8B92A8]" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-[rgba(255,255,255,0.06)] rounded transition-colors"
          >
            <X className="w-4 h-4 text-[#8B92A8]" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-[rgba(196,255,61,0.1)] rounded-full flex items-center justify-center mb-4">
              <Bug className="w-8 h-8 text-[#C4FF3D]" />
            </div>
            <h4 className="text-white font-medium mb-2">¿Encontraste un problema?</h4>
            <p className="text-[#8B92A8] text-sm max-w-xs">
              Describe el bug que encontraste y nuestro equipo te ayudará a resolverlo.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender_type === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  msg.sender_type === "user"
                    ? "bg-[#C4FF3D] text-black"
                    : msg.sender_type === "admin"
                    ? "bg-[#121212] text-white border border-[rgba(255,255,255,0.06)]"
                    : "bg-[rgba(139,146,168,0.1)] text-[#8B92A8] border border-[rgba(139,146,168,0.2)]"
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                <span
                  className={cn(
                    "text-xs mt-1 block",
                    msg.sender_type === "user"
                      ? "text-black/60"
                      : "text-[#8B92A8]"
                  )}
                >
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="w-full bg-transparent text-white placeholder-[#8B92A8] px-3 py-2 text-sm resize-none focus:outline-none"
              rows={1}
              maxLength={2000}
              disabled={sendMessageMutation.isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isLoading}
            className="p-3 bg-[#C4FF3D] text-black rounded-lg hover:bg-[#b3ee2c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[#8B92A8] text-xs mt-2">
          {message.length}/2000 caracteres
        </p>
      </div>
    </div>
  );
}
