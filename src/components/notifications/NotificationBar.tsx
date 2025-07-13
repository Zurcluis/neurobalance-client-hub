import { useState } from 'react';
import { Bell, MessageCircle, Calendar, Trophy, X, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { NotificationDetail } from './NotificationDetail';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'chat':
      return <MessageCircle className="h-4 w-4 text-blue-500" />;
    case 'appointment':
      return <Calendar className="h-4 w-4 text-orange-500" />;
    case 'session_milestone':
      return <Trophy className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'chat':
      return 'border-l-blue-500';
    case 'appointment':
      return 'border-l-orange-500';
    case 'session_milestone':
      return 'border-l-green-500';
    default:
      return 'border-l-gray-500';
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Agora';
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d atrás`;
  
  return date.toLocaleDateString('pt-BR');
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (notification: Notification) => void;
}

const NotificationItem = ({ notification, onMarkAsRead, onDelete, onOpenDetail }: NotificationItemProps) => {
  return (
    <div
      className={cn(
        "p-3 border-l-4 bg-card hover:bg-accent/50 transition-colors cursor-pointer",
        getNotificationColor(notification.type),
        !notification.read && "bg-blue-50/50"
      )}
      onClick={() => onOpenDetail(notification)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {getNotificationIcon(notification.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-foreground">
                {notification.title}
              </h4>
              {!notification.read && (
                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatTimeAgo(notification.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="h-8 w-8 p-0"
              title="Marcar como lida"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            title="Remover"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const NotificationBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleOpenDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetail(true);
    setIsOpen(false);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative h-9 w-9 p-0"
            title="Notificações"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96 p-0" 
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Notificações</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="h-8 px-2 text-xs"
                      title="Marcar todas como lidas"
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Marcar todas
                    </Button>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} não lidas
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Carregando notificações...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhuma notificação
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        onOpenDetail={handleOpenDetail}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
      
      <NotificationDetail
        notification={selectedNotification}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
}; 