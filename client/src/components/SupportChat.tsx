import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '@/_core/hooks/useAuth';

const ADMIN_EMAIL = 'soportehiwork@gmail.com';

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [currentTicketId, setCurrentTicketId] = useState<number | null>(null);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'chat'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotification();
  const { user } = useAuth();

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Queries
  const { data: unreadCount } = trpc.chat.getUnreadCount.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Admin: Get all tickets
  const { data: allTickets } = trpc.chat.getAllTickets.useQuery(
    { status: undefined },
    { enabled: isOpen && isAdmin, refetchInterval: 3000 }
  );

  // User: Get own tickets
  const { data: userTickets } = trpc.chat.getUserTickets.useQuery(undefined, {
    enabled: isOpen && !isAdmin,
  });

  const { data: messages, refetch: refetchMessages } = trpc.chat.getMessages.useQuery(
    { ticketId: currentTicketId! },
    { enabled: !!currentTicketId, refetchInterval: 3000 }
  );

  // Mutations
  const createTicketMutation = trpc.chat.createTicket.useMutation({
    onSuccess: (data) => {
      setCurrentTicketId(data.ticketId);
    },
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setMessage('');
    },
  });

  const sendWelcomeMutation = trpc.chat.sendWelcomeMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
    },
  });

  const requestAgentMutation = trpc.chat.requestAgent.useMutation({
    onSuccess: () => {
      toast.success('Un asistente humano se unirá pronto');
      refetchMessages();
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Open chat and create ticket if needed
  const handleOpen = async () => {
    setIsOpen(true);
    
    if (isAdmin) {
      // Admin sees list of tickets
      setViewMode('list');
    } else {
      // Regular user sees their chat
      setViewMode('chat');
      
      if (!userTickets || userTickets.length === 0) {
        const result = await createTicketMutation.mutateAsync({});
        setCurrentTicketId(result.ticketId);
        
        setTimeout(() => {
          sendWelcomeMutation.mutate({ ticketId: result.ticketId });
        }, 500);
      } else {
        const openTicket = userTickets.find(t => t.status !== 'closed' && t.status !== 'resolved');
        if (openTicket) {
          setCurrentTicketId(openTicket.id);
        } else {
          const result = await createTicketMutation.mutateAsync({});
          setCurrentTicketId(result.ticketId);
          
          setTimeout(() => {
            sendWelcomeMutation.mutate({ ticketId: result.ticketId });
          }, 500);
        }
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setViewMode('chat');
    setCurrentTicketId(null);
  };

  const handleSelectTicket = (ticketId: number) => {
    setCurrentTicketId(ticketId);
    setViewMode('chat');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setCurrentTicketId(null);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentTicketId) return;

    const userMessage = message.trim();
    setMessage('');

    await sendMessageMutation.mutateAsync({
      ticketId: currentTicketId,
      message: userMessage,
    });
  };

  useEffect(() => {
    if (sendMessageMutation.isSuccess && messages && !isAdmin) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.sender_type === 'user') {
        setIsAIResponding(true);
        const timeout = setTimeout(() => {
          setIsAIResponding(false);
        }, 5000);
        return () => clearTimeout(timeout);
      }
    }
  }, [sendMessageMutation.isSuccess, messages, isAdmin]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.sender_type === 'ai') {
        setIsAIResponding(false);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (messages && messages.length > previousMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage && (lastMessage.sender_type === 'agent' || lastMessage.sender_type === 'ai')) {
        if (!isOpen || document.hidden) {
          notify(
            lastMessage.sender_type === 'agent' ? 'Nuevo mensaje del asistente' : 'Respuesta de IA',
            lastMessage.message.substring(0, 100),
            { sound: true, vibrate: true, desktop: true }
          );
        } else {
          notify('', '', { sound: true, vibrate: false, desktop: false });
        }
      }
      
      previousMessageCountRef.current = messages.length;
    }
  }, [messages, isOpen, notify]);

  useEffect(() => {
    if (isOpen && messages) {
      previousMessageCountRef.current = messages.length;
    }
  }, [isOpen, messages]);

  const handleRequestAgent = async () => {
    if (!currentTicketId) return;
    
    await requestAgentMutation.mutateAsync({ ticketId: currentTicketId });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      waiting_agent: { color: 'bg-red-500', label: 'Urgente' },
      in_progress: { color: 'bg-yellow-500', label: 'En progreso' },
      open: { color: 'bg-blue-500', label: 'Abierto' },
      waiting_user: { color: 'bg-gray-500', label: 'Esperando' },
      resolved: { color: 'bg-green-500', label: 'Resuelto' },
      closed: { color: 'bg-gray-400', label: 'Cerrado' },
    };

    const { color, label } = config[status] || config.open;
    return <Badge className={`${color} text-white text-xs`}>{label}</Badge>;
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={handleOpen}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
              {unreadCount}
            </span>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <>
          {/* Overlay for mobile */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={handleClose}
          />
          
          {/* Chat Container */}
          <div className="fixed top-0 left-0 right-0 bottom-0 md:top-auto md:left-auto md:bottom-6 md:right-6 md:w-96 md:h-[600px] md:rounded-lg shadow-2xl z-50 flex flex-col bg-background md:border">
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0 md:rounded-t-lg">
              <div className="flex items-center gap-3">
                {viewMode === 'chat' && isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleBackToList}
                    className="h-8 w-8 hover:bg-primary-foreground/10"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                {viewMode === 'chat' && !isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleClose}
                    className="h-8 w-8 md:hidden hover:bg-primary-foreground/10"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-1">
                    <img src="/logo.png" alt="HiWork" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {viewMode === 'list' ? 'Tickets de Soporte' : 'Soporte'}
                    </h3>
                    <p className="text-xs opacity-90">
                      {viewMode === 'list' ? `${allTickets?.length || 0} conversaciones` : 'Asistente virtual'}
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClose}
                className="hidden md:flex h-8 w-8 hover:bg-primary-foreground/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content Area */}
            {viewMode === 'list' && isAdmin ? (
              // Admin: Ticket List
              <div className="flex-1 overflow-y-auto">
                {allTickets && allTickets.length > 0 ? (
                  <div className="divide-y">
                    {allTickets
                      .sort((a, b) => {
                        // Urgentes primero
                        if (a.status === 'waiting_agent' && b.status !== 'waiting_agent') return -1;
                        if (a.status !== 'waiting_agent' && b.status === 'waiting_agent') return 1;
                        // Luego por fecha
                        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                      })
                      .map((ticket) => (
                        <div
                          key={ticket.id}
                          onClick={() => handleSelectTicket(ticket.id)}
                          className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">Ticket #{ticket.id}</p>
                                {ticket.status === 'waiting_agent' && (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{ticket.subject}</p>
                            </div>
                            {ticket.has_unread_agent === 1 && (
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-1" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            {getStatusBadge(ticket.status)}
                            <p className="text-xs text-muted-foreground">
                              {new Date(ticket.updated_at).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <Clock className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-center">No hay tickets disponibles</p>
                  </div>
                )}
              </div>
            ) : (
              // Chat View (for both admin and users)
              <>
                {/* Messages Area */}
                <div 
                  className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    backgroundColor: 'hsl(var(--muted) / 0.3)',
                  }}
                >
                  {messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 items-end ${
                        (isAdmin && msg.sender_type === 'agent') || (!isAdmin && msg.sender_type === 'user')
                          ? 'flex-row-reverse' 
                          : 'flex-row'
                      }`}
                    >
                      {((isAdmin && msg.sender_type !== 'agent') || (!isAdmin && msg.sender_type !== 'user')) && (
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 p-1">
                          <img src="/logo.png" alt="HiWork" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
                          (isAdmin && msg.sender_type === 'agent') || (!isAdmin && msg.sender_type === 'user')
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-card border rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                        <p className={`text-[10px] mt-1 text-right ${
                          (isAdmin && msg.sender_type === 'agent') || (!isAdmin && msg.sender_type === 'user')
                            ? 'opacity-80' 
                            : 'text-muted-foreground'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isAIResponding && !isAdmin && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center mb-1 p-1">
                        <img src="/logo.png" alt="HiWork" className="w-full h-full object-contain" />
                      </div>
                      <div className="bg-card border rounded-lg rounded-bl-none px-3 py-2 shadow-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Request Agent Button (only for users) */}
                {currentTicketId && !isAdmin && (
                  <div className="px-4 py-2 border-t bg-background shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={handleRequestAgent}
                    >
                      🤝 Hablar con un asistente humano
                    </Button>
                  </div>
                )}

                {/* Input Area */}
                <div className="px-4 py-3 border-t bg-background shrink-0 safe-area-inset-bottom">
                  <div className="flex gap-2 items-center">
                    <Input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Escribe un mensaje..."
                      disabled={!currentTicketId || sendMessageMutation.isLoading}
                      className="flex-1 rounded-full border-2 focus-visible:ring-0 focus-visible:border-primary"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || !currentTicketId || sendMessageMutation.isLoading}
                      size="icon"
                      className="h-10 w-10 rounded-full shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
