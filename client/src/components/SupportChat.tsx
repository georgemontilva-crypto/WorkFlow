import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  const { notify } = useNotification();

  // Queries
  const { data: unreadCount } = trpc.chat.getUnreadCount.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds
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
    
    // If no tickets exist, create one
    if (!tickets || tickets.length === 0) {
      const result = await createTicketMutation.mutateAsync({});
      setCurrentTicketId(result.ticketId);
      
      // Send AI welcome message
      setTimeout(() => {
        sendWelcomeMutation.mutate({ ticketId: result.ticketId });
      }, 500);
    } else {
      // Use the most recent open ticket
      const openTicket = tickets.find(t => t.status !== 'closed' && t.status !== 'resolved');
      if (openTicket) {
        setCurrentTicketId(openTicket.id);
      } else {
        // Create new ticket if all are closed
        const result = await createTicketMutation.mutateAsync({});
        setCurrentTicketId(result.ticketId);
        
        // Send welcome message
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

    // Send user message
    await sendMessageMutation.mutateAsync({
      ticketId: currentTicketId,
      message: userMessage,
    });

    // AI response is handled automatically by the backend
  };

  // AI response is now handled automatically by the backend
  // Just show loading state while waiting
  useEffect(() => {
    if (sendMessageMutation.isSuccess && messages) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.sender_type === 'user') {
        setIsAIResponding(true);
        // Wait for AI response
        const timeout = setTimeout(() => {
          setIsAIResponding(false);
        }, 5000);
        return () => clearTimeout(timeout);
      }
    }
  }, [sendMessageMutation.isSuccess, messages]);

  // Turn off AI responding when new message arrives
  useEffect(() => {
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.sender_type === 'ai') {
        setIsAIResponding(false);
      }
    }
  }, [messages]);

  // Notify when new message arrives (from agent or AI)
  useEffect(() => {
    if (messages && messages.length > previousMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      
      // Only notify if message is from agent or AI (not user's own message)
      if (lastMessage && (lastMessage.sender_type === 'agent' || lastMessage.sender_type === 'ai')) {
        // Show notification if chat is closed or window is not focused
        if (!isOpen || document.hidden) {
          notify(
            lastMessage.sender_type === 'agent' ? 'Nuevo mensaje del asistente' : 'Respuesta de IA',
            lastMessage.message.substring(0, 100),
            { sound: true, vibrate: true, desktop: true }
          );
        } else {
          // Just play sound if chat is open
          notify('', '', { sound: true, vibrate: false, desktop: false });
        }
      }
      
      previousMessageCountRef.current = messages.length;
    }
  }, [messages, isOpen, notify]);

  // Update previous message count when opening chat
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
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <CardTitle className="text-lg">Soporte</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.sender_type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.sender_type === 'ai' ? 'bg-primary' : 
                    msg.sender_type === 'agent' ? 'bg-blue-500' : 
                    'bg-gray-500'
                  }`}>
                    {msg.sender_type === 'ai' ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.sender_type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isAIResponding && (
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Request Agent Button */}
            {currentTicketId && (
              <div className="px-4 py-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleRequestAgent}
                >
                  🤝 Hablar con un asistente humano
                </Button>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe tu mensaje..."
                  disabled={!currentTicketId || sendMessageMutation.isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !currentTicketId || sendMessageMutation.isLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
