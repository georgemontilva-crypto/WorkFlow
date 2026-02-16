/**
 * Support Admin Page
 * Admin panel for managing support conversations
 * Split view: conversations list + chat interface
 */

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/_core/hooks/useAuth';
import { Send, X, CheckCircle, Clock, MessageCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Message {
  id: number;
  conversationId: number;
  senderType: 'user' | 'bot' | 'agent';
  senderId: number | null;
  message: string;
  readByUser: boolean;
  readByAgent: boolean;
  createdAt: Date;
}

interface Conversation {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: 'bot' | 'waiting_agent' | 'active' | 'closed';
  assignedAgentId: number | null;
  lastMessageAt: Date;
  createdAt: Date;
  unreadCount: number;
  lastMessage: Message | null;
}

export default function SupportAdmin() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useContext();

  // Get all conversations
  const { data: conversations, refetch: refetchConversations } = trpc.support.admin.getConversations.useQuery(undefined, {
    refetchInterval: 3000,
  });

  // Get selected conversation details
  const { data: conversationData } = trpc.support.admin.getConversation.useQuery(
    { id: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );

  // Initialize Socket.IO
  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const newSocket = io(socketUrl, {
      auth: {
        userId: user.id,
        userRole: user.role,
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[Support Admin] Connected to Socket.IO');
    });

    newSocket.on('new_message', () => {
      refetchConversations();
      if (selectedConversationId) {
        utils.support.admin.getConversation.invalidate({ id: selectedConversationId });
      }
    });

    newSocket.on('conversation_updated', () => {
      refetchConversations();
    });

    newSocket.on('message_sent', () => {
      if (selectedConversationId) {
        utils.support.admin.getConversation.invalidate({ id: selectedConversationId });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, selectedConversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationData?.messages]);

  const handleTakeConversation = () => {
    if (!socket || !selectedConversationId) return;
    socket.emit('take_conversation', { conversationId: selectedConversationId });
  };

  const handleSendMessage = () => {
    if (!socket || !selectedConversationId || !inputMessage.trim()) return;
    socket.emit('agent_reply', {
      conversationId: selectedConversationId,
      message: inputMessage.trim(),
    });
    setInputMessage('');
  };

  const handleCloseConversation = () => {
    if (!socket || !selectedConversationId) return;
    socket.emit('close_conversation', { conversationId: selectedConversationId });
    setSelectedConversationId(null);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      bot: { label: 'Bot', color: 'bg-blue-500/10 text-blue-500' },
      waiting_agent: { label: 'En Cola', color: 'bg-yellow-500/10 text-yellow-500' },
      active: { label: 'Activo', color: 'bg-green-500/10 text-green-500' },
      closed: { label: 'Cerrado', color: 'bg-gray-500/10 text-gray-500' },
    };
    const badge = badges[status as keyof typeof badges] || badges.bot;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] flex gap-4">
        {/* Left: Conversations List */}
        <div className="w-80 bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-xl font-bold text-white">Conversaciones</h2>
            <p className="text-sm text-[#8B92A8] mt-1">
              {conversations?.filter(c => c.status !== 'closed').length || 0} activas
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`w-full p-4 border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.03)] transition-colors text-left ${
                  selectedConversationId === conv.id ? 'bg-[rgba(255,255,255,0.06)]' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#C4FF3D] rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-black" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{conv.userName}</p>
                      <p className="text-xs text-[#8B92A8]">{conv.userEmail}</p>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-2">
                  {getStatusBadge(conv.status)}
                  <span className="text-xs text-[#8B92A8]">
                    {format(new Date(conv.lastMessageAt), 'HH:mm', { locale: es })}
                  </span>
                </div>

                {conv.lastMessage && (
                  <p className="text-sm text-[#8B92A8] truncate">
                    {conv.lastMessage.senderType === 'user' ? 'Usuario: ' : 'Agente: '}
                    {conv.lastMessage.message}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Chat Interface */}
        <div className="flex-1 bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] flex flex-col overflow-hidden">
          {selectedConversationId && conversationData ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">{conversationData.conversation.userName}</h3>
                  <p className="text-sm text-[#8B92A8]">{conversationData.conversation.userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(conversationData.conversation.status)}
                  
                  {conversationData.conversation.status === 'waiting_agent' && (
                    <button
                      onClick={handleTakeConversation}
                      className="px-4 py-2 bg-[#C4FF3D] text-black rounded-lg hover:bg-[#b3ee2c] transition-colors text-sm font-medium"
                    >
                      Tomar Conversación
                    </button>
                  )}

                  {(conversationData.conversation.status === 'active' || 
                    conversationData.conversation.status === 'bot') && (
                    <button
                      onClick={handleCloseConversation}
                      className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                      Cerrar
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversationData.messages.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                        msg.senderType === 'user'
                          ? 'bg-[#121212] text-white border border-[rgba(255,255,255,0.06)]'
                          : msg.senderType === 'bot'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-[#C4FF3D] text-black'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {format(new Date(msg.createdAt), 'HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {(conversationData.conversation.status === 'active' || 
                conversationData.conversation.status === 'waiting_agent') && (
                <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Escribe tu respuesta..."
                      className="flex-1 bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white placeholder-[#8B92A8] focus:outline-none focus:border-[#C4FF3D]"
                      maxLength={2000}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className="p-2 bg-[#C4FF3D] text-black rounded-lg hover:bg-[#b3ee2c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-[#8B92A8] mx-auto mb-4" />
                <p className="text-[#8B92A8]">Selecciona una conversación para comenzar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
