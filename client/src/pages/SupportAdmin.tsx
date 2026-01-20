import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { trpc } from '../lib/trpc';
import { MessageSquare, Clock, CheckCircle, XCircle, User, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportAdmin() {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Queries
  const { data: tickets, refetch: refetchTickets } = trpc.chat.getAllTickets.useQuery(
    { status: statusFilter || undefined },
    { refetchInterval: 5000 }
  );

  const { data: messages, refetch: refetchMessages } = trpc.chat.getMessages.useQuery(
    { ticketId: selectedTicketId! },
    { enabled: !!selectedTicketId, refetchInterval: 3000 }
  );

  const selectedTicket = tickets?.find(t => t.id === selectedTicketId);

  // Mutations
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      refetchTickets();
      setMessage('');
      toast.success('Mensaje enviado');
    },
  });

  const updateStatusMutation = trpc.chat.updateTicketStatus.useMutation({
    onSuccess: () => {
      refetchTickets();
      toast.success('Estado actualizado');
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedTicketId) return;

    await sendMessageMutation.mutateAsync({
      ticketId: selectedTicketId,
      message: message.trim(),
    });
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicketId) return;

    await updateStatusMutation.mutateAsync({
      ticketId: selectedTicketId,
      status: status as any,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      open: { variant: 'default', icon: MessageSquare, label: 'Abierto' },
      in_progress: { variant: 'secondary', icon: Clock, label: 'En progreso' },
      waiting_user: { variant: 'outline', icon: User, label: 'Esperando usuario' },
      waiting_agent: { variant: 'destructive', icon: Clock, label: 'Esperando agente' },
      resolved: { variant: 'default', icon: CheckCircle, label: 'Resuelto' },
      closed: { variant: 'secondary', icon: XCircle, label: 'Cerrado' },
    };

    const config = variants[status] || variants.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500',
    };

    return (
      <Badge className={`${colors[priority] || colors.medium} text-white`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Administración de Soporte</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tickets</span>
                <Badge variant="secondary">{tickets?.length || 0}</Badge>
              </CardTitle>
              
              {/* Status Filter */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant={statusFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('')}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'waiting_agent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('waiting_agent')}
                >
                  Urgentes
                </Button>
                <Button
                  variant={statusFilter === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('open')}
                >
                  Abiertos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {tickets?.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedTicketId === ticket.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">Ticket #{ticket.id}</p>
                        <p className="text-sm text-muted-foreground">{ticket.subject}</p>
                      </div>
                      {ticket.has_unread_agent === 1 && (
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(ticket.updated_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                ))}

                {(!tickets || tickets.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay tickets disponibles
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedTicket ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Ticket #{selectedTicket.id}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTicket.subject}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus('in_progress')}
                      disabled={updateStatusMutation.isLoading}
                    >
                      En progreso
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus('waiting_user')}
                      disabled={updateStatusMutation.isLoading}
                    >
                      Esperar usuario
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleUpdateStatus('resolved')}
                      disabled={updateStatusMutation.isLoading}
                    >
                      Resolver
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleUpdateStatus('closed')}
                      disabled={updateStatusMutation.isLoading}
                    >
                      Cerrar
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${
                          msg.sender_type === 'agent' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            msg.sender_type === 'ai'
                              ? 'bg-primary'
                              : msg.sender_type === 'agent'
                              ? 'bg-blue-500'
                              : 'bg-gray-500'
                          }`}
                        >
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.sender_type === 'agent'
                              ? 'bg-blue-500 text-white'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Escribe tu respuesta..."
                        disabled={sendMessageMutation.isLoading}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isLoading}
                        size="icon"
                      >
                        {sendMessageMutation.isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un ticket para ver la conversación</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
