import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Ticket,
  Heart,
  ChatCircle,
  UserPlus,
  Sparkle
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MOCK_NOTIFICATIONS } from '../mocks';
import type { NotificationItem, NotificationType } from '../types/social';

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success('Todas as notificações foram marcadas como lidas.');
  };

  const handleMarkOne = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    return true;
  });

  const grouped = {
    today: filtered.filter((n) => n.group === 'today'),
    yesterday: filtered.filter((n) => n.group === 'yesterday'),
    this_week: filtered.filter((n) => n.group === 'this_week'),
    older: filtered.filter((n) => n.group === 'older'),
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'TICKET_REMINDER':
        return <Ticket size={20} weight="fill" className="text-secondary" />;
      case 'LIKE':
        return <Heart size={20} weight="fill" className="text-primary" />;
      case 'COMMENT':
        return <ChatCircle size={20} weight="fill" className="text-secondary" />;
      case 'FOLLOW':
        return <UserPlus size={20} weight="bold" className="text-primary" />;
      case 'PRE_SALE_ALERT':
      case 'FRIEND_SESSION':
      default:
        return <Sparkle size={20} weight="fill" className="text-primary" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-display">
      
      {/* ─── 1. HEADER ─── */}
      <section className="bg-background border-b-2 border-foreground/30 px-4 sm:px-0 py-6">
        <div className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bell size={24} weight="bold" className="text-primary" />
                <span className="text-xs font-black uppercase text-foreground/60 tracking-wider">
                  Central de Alertas &amp; Atividades
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase text-foreground tracking-tight">
                Notificações {unreadCount > 0 && <span className="text-secondary">({unreadCount})</span>}
              </h1>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-3.5 py-1.5 bg-background hover:bg-muted border-2 border-foreground/40 text-foreground font-black text-xs uppercase transition-all shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle size={16} weight="bold" />
                <span>Marcar Todas como Lidas</span>
              </button>
            )}
          </div>

          {/* Filter Subtabs */}
          <div className="flex items-center gap-2 border-b-2 border-foreground/10 pb-1">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 ${
                filter === 'ALL'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              Todas ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 ${
                filter === 'UNREAD'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                  : 'bg-background text-foreground/70 border-transparent hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              Não Lidas ({unreadCount})
            </button>
          </div>

        </div>
      </section>

      {/* ─── 2. GROUPED LIST ─── */}
      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 py-8 space-y-8">
        
        {filtered.length === 0 ? (
          <div className="p-12 bg-background border-4 border-foreground/40 text-center space-y-3 shadow-[6px_6px_0px_0px_var(--border)] max-w-md mx-auto">
            <Bell size={44} className="text-foreground/40 mx-auto" />
            <h3 className="text-xl font-black uppercase text-foreground">Nenhuma notificação</h3>
            <p className="font-sans text-xs text-foreground/70">
              Você está em dia com todas as sessões, lembretes e interações no screeK.
            </p>
          </div>
        ) : (
          <>
            {/* HOJE */}
            {grouped.today.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b-2 border-foreground/20 pb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-primary">Hoje</span>
                  <span className="text-xs text-foreground/40">({grouped.today.length})</span>
                </div>

                <div className="space-y-2.5">
                  {grouped.today.map((notif) => (
                    <NotificationRow key={notif.id} item={notif} onMarkRead={handleMarkOne} getIcon={getNotificationIcon} />
                  ))}
                </div>
              </section>
            )}

            {/* ONTEM */}
            {grouped.yesterday.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b-2 border-foreground/20 pb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground/60">Ontem</span>
                  <span className="text-xs text-foreground/40">({grouped.yesterday.length})</span>
                </div>

                <div className="space-y-2.5">
                  {grouped.yesterday.map((notif) => (
                    <NotificationRow key={notif.id} item={notif} onMarkRead={handleMarkOne} getIcon={getNotificationIcon} />
                  ))}
                </div>
              </section>
            )}

            {/* ESTA SEMANA */}
            {grouped.this_week.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b-2 border-foreground/20 pb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground/60">Esta Semana</span>
                  <span className="text-xs text-foreground/40">({grouped.this_week.length})</span>
                </div>

                <div className="space-y-2.5">
                  {grouped.this_week.map((notif) => (
                    <NotificationRow key={notif.id} item={notif} onMarkRead={handleMarkOne} getIcon={getNotificationIcon} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

      </main>
    </div>
  );
}

interface NotificationRowProps {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  getIcon: (type: NotificationType) => React.ReactNode;
}

function NotificationRow({ item, onMarkRead, getIcon }: NotificationRowProps) {
  return (
    <div
      onClick={() => onMarkRead(item.id)}
      className={`p-4 border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        !item.is_read
          ? 'bg-muted/30 border-primary shadow-[3px_3px_0px_0px_var(--border)]'
          : 'bg-background border-foreground/20 shadow-[1px_1px_0px_0px_var(--border)]'
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        
        {/* Avatar or Icon */}
        <div className="w-10 h-10 border-2 border-foreground/40 shrink-0 flex items-center justify-center bg-background overflow-hidden">
          {item.avatar_url ? (
            <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            getIcon(item.type)
          )}
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-black uppercase truncate ${!item.is_read ? 'text-primary' : 'text-foreground'}`}>
              {item.title}
            </h4>
            {!item.is_read && (
              <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
            )}
          </div>

          <p className="font-sans text-xs text-foreground/80 leading-snug">
            {item.description}
          </p>

          <span className="text-[10px] font-mono text-foreground/50 block">
            {item.timeAgo}
          </span>
        </div>

      </div>

      {/* Action link if present */}
      {item.link_to && (
        <Link
          to={item.link_to}
          className="px-3 py-1.5 bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-wider border border-primary shrink-0 self-end sm:self-center hover:bg-primary/90 transition-colors shadow-[1px_1px_0px_0px_var(--border)]"
        >
          {item.action_label || 'Ver'}
        </Link>
      )}
    </div>
  );
}
