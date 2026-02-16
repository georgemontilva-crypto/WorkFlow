/**
 * Support Chat Component
 * Real-time support chat with WebSocket connection
 * Crisp/Intercom style widget
 */

import { useState, useEffect, useRef } from 'react';
import { Headphones, X, Send, Minimize2, MessageCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { io, Socket } from 'socket.io-client';

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
  status: 'bot' | 'waiting_agent' | 'active' | 'closed';
  assignedAgentId: number | null;
  lastMessageAt: Date;
  createdAt: Date;
}

const QUICK_OPTIONS = [
  { id: 'billing', label: 'Facturación', icon: '💳' },
  { id: 'payments', label: 'Pagos', icon: '💰' },
  { id: 'technical', label: 'Problemas técnicos', icon: '🔧' },
  { id: 'other', label: 'Otro', icon: '💬' },
];

export function SupportChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const utils = trpc.useContext();

  // Get existing conversation
  const { data: conversationData } = trpc.support.getMyConversation.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: isOpen ? false : 5000, // Only poll when closed
  });

  // Start conversation mutation
  const startConversation = trpc.support.startConversation.useMutation({
    onSuccess: (data) => {
      utils.support.getMyConversation.invalidate();
    },
  });

  // Request agent mutation
  const requestAgent = trpc.support.requestAgent.useMutation();

  // Initialize Socket.IO connection
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
      console.log('[Support Chat] Connected to Socket.IO');
    });

    newSocket.on('message_sent', (data: { message: Message; conversation: Conversation }) => {
      setMessages((prev) => [...prev, data.message]);
      setConversation(data.conversation);
    });

    newSocket.on('new_message', (data: { message: Message; conversation: Conversation }) => {
      setMessages((prev) => [...prev, data.message]);
      setConversation(data.conversation);
      
      // Increment unread count if chat is closed
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    newSocket.on('agent_joined', (data: { conversationId: number; agentId: number }) => {
      // Refresh conversation data
      utils.support.getMyConversation.invalidate();
    });

    newSocket.on('conversation_closed', () => {
      setConversation(null);
      setMessages([]);
      setIsOpen(false);
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('[Support Chat] Socket error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Load conversation data
  useEffect(() => {
    if (conversationData) {
      setConversation(conversationData.conversation);
      setMessages(conversationData.messages as Message[]);
      setUnreadCount(conversationData.unreadCount);
    }
  }, [conversationData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when opening chat
  useEffect(() => {
    if (isOpen && conversation && socket) {
      socket.emit('mark_read', { conversationId: conversation.id });
      setUnreadCount(0);
    }
  }, [isOpen, conversation, socket]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);

    // Start conversation if doesn't exist
    if (!conversation) {
      startConversation.mutate();
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const messageToSend = inputMessage.trim();
    setInputMessage(''); // Clear input immediately

    if (!conversation) {
      // Start conversation first
      startConversation.mutate(undefined, {
        onSuccess: (data) => {
          if (socket) {
            socket.emit('send_message', {
              conversationId: data.conversationId,
              message: messageToSend,
            });
          }
        },
      });
    } else {
      if (socket) {
        socket.emit('send_message', {
          conversationId: conversation.id,
          message: messageToSend,
        });
      }
    }
  };

  const handleRequestAgent = () => {
    if (!conversation) return;
    requestAgent.mutate({ conversationId: conversation.id });
  };

  // Floating button (closed state)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed right-4 z-[60] flex items-center justify-center bg-transparent border border-[#C4FF3D] text-[#C4FF3D] rounded-full hover:bg-[#C4FF3D] hover:text-black transition-all duration-300"
        style={{
          width: '56px',
          height: '56px',
          padding: '0',
          top: 'auto',
          bottom: isMobile ? '88px' : '16px',
          position: 'fixed',
        }}
      >
        <Headphones className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-10">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed right-4 z-[60] flex items-center gap-2 px-4 py-3 bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] text-white rounded-full shadow-lg hover:bg-[#121212] transition-all"
        style={{
          top: 'auto',
          bottom: isMobile ? '88px' : '16px',
          position: 'fixed',
        }}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium">Soporte</span>
        {unreadCount > 0 && (
          <span className="px-2 py-0.5 bg-[#C4FF3D] text-black text-xs rounded-full font-medium">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Chat window (open state)
  return (
    <div 
      className="fixed right-4 z-[60] w-[calc(100vw-2rem)] md:w-96 h-[500px] bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] shadow-2xl flex flex-col overflow-hidden"
      style={{
        top: 'auto',
        bottom: isMobile ? '88px' : '16px',
        position: 'fixed',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C4FF3D] rounded-full flex items-center justify-center">
            <Headphones className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Soporte Finwrk</h3>
            <p className="text-xs text-[#8B92A8]">
              {conversation?.status === 'active' ? 'Agente en línea' : 'En línea'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-[rgba(255,255,255,0.06)] rounded-lg transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-[#8B92A8]" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[rgba(255,255,255,0.06)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[#8B92A8]" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                msg.senderType === 'user'
                  ? 'bg-[#C4FF3D] text-black'
                  : 'bg-[#121212] text-white border border-[rgba(255,255,255,0.06)]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
              <p className="text-xs opacity-60 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Options (Bot Mode) */}
      {conversation?.status === 'bot' && messages.length <= 1 && (
        <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-xs text-[#8B92A8] mb-2">¿En qué puedo ayudarte?</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setInputMessage(option.label);
                  handleSendMessage();
                }}
                className="px-3 py-2 bg-[#121212] border border-[rgba(255,255,255,0.06)] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors text-sm flex items-center gap-2"
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleRequestAgent}
            className="w-full mt-2 px-4 py-2 bg-[#121212] border border-[rgba(255,255,255,0.06)] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors text-xs"
          >
            Hablar con un agente humano
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe tu mensaje..."
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
    </div>
  );
}
