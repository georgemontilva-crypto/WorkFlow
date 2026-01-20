import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { useNotification } from '../hooks/useNotification';

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [currentTicketId, setCurrentTicketId] = useState<number | null>(null);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotification();

  // Queries
  const { data: unreadCount } = trpc.chat.getUnreadCount.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: tickets } = trpc.chat.getUserTickets.useQuery(undefined, {
    enabled: isOpen,
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
    
    if (!tickets || tickets.length === 0) {
      const result = await createTicketMutation.mutateAsync({});
      setCurrentTicketId(result.ticketId);
      
      setTimeout(() => {
        sendWelcomeMutation.mutate({ ticketId: result.ticketId });
      }, 500);
    } else {
      const openTicket = tickets.find(t => t.status !== 'closed' && t.status !== 'resolved');
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
  };

  const handleClose = () => {
    setIsOpen(false);
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
    if (sendMessageMutation.isSuccess && messages) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.sender_type === 'user') {
        setIsAIResponding(true);
        const timeout = setTimeout(() => {
          setIsAIResponding(false);
        }, 5000);
        return () => clearTimeout(timeout);
      }
    }
  }, [sendMessageMutation.isSuccess, messages]);

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

      {/* Chat Window - WhatsApp Style */}
      {isOpen && (
        <>
          {/* Overlay for mobile */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={handleClose}
          />
          
          {/* Chat Container */}
          <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[600px] md:rounded-lg shadow-2xl z-50 flex flex-col bg-background md:border">
            {/* Header - Fixed at top (WhatsApp style) */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0 md:rounded-t-lg">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClose}
                  className="h-8 w-8 md:hidden hover:bg-primary-foreground/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Soporte</h3>
                    <p className="text-xs opacity-90">Asistente virtual</p>
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

            {/* Messages Area - Scrollable (WhatsApp background pattern) */}
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
                    msg.sender_type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {msg.sender_type !== 'user' && (
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                      msg.sender_type === 'ai' ? 'bg-primary' : 'bg-blue-500'
                    }`}>
                      {msg.sender_type === 'ai' ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
                      msg.sender_type === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card border rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] mt-1 text-right ${
                      msg.sender_type === 'user' ? 'opacity-80' : 'text-muted-foreground'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isAIResponding && (
                <div className="flex gap-2 items-end">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mb-1">
                    <Bot className="w-4 h-4 text-white" />
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

            {/* Request Agent Button */}
            {currentTicketId && (
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

            {/* Input Area - Fixed at bottom (WhatsApp style) */}
            <div className="px-4 py-3 border-t bg-background shrink-0">
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
          </div>
        </>
      )}
    </>
  );
}
