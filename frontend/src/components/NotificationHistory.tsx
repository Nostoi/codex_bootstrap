import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotificationHistory, NotificationHistoryFilter } from '@/hooks/useNotificationHistory';
import { NotificationData } from '@/contexts/WebSocketContext';
import {
  Bell,
  BellOff,
  Clock,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface NotificationHistoryProps {
  className?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'task-update':
      return <CheckCircle className="w-4 h-4" />;
    case 'calendar-sync':
      return <Calendar className="w-4 h-4" />;
    case 'deadline-reminder':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
};

const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case 'task-update':
      return 'Task Update';
    case 'calendar-sync':
      return 'Calendar Sync';
    case 'deadline-reminder':
      return 'Deadline Reminder';
    default:
      return 'General';
  }
};

const NotificationItem: React.FC<{
  notification: NotificationData;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}> = ({ notification, onMarkRead, onDelete, selected, onSelect }) => {
  const [isMarking, setIsMarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMarkRead = async () => {
    if (notification.read) return;

    setIsMarking(true);
    await onMarkRead(notification.id);
    setIsMarking(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(notification.id);
    setIsDeleting(false);
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        notification.read ? 'bg-muted/30' : 'bg-background border-primary/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={checked => onSelect(notification.id, !!checked)}
          className="mt-1"
        />

        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={notification.read ? 'secondary' : 'default'} className="text-xs">
              {getNotificationTypeLabel(notification.type)}
            </Badge>
            {!notification.read && (
              <Badge variant="destructive" className="text-xs">
                Unread
              </Badge>
            )}
          </div>

          <h4
            className={`font-medium text-sm mb-1 ${
              notification.read ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {notification.title}
          </h4>

          <p
            className={`text-sm mb-2 ${
              notification.read ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {notification.message}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
              </span>
              {notification.read && notification.readAt && (
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Read {formatDistanceToNow(new Date(notification.readAt), { addSuffix: true })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkRead}
                  disabled={isMarking}
                  className="h-7 px-2 text-xs"
                >
                  {isMarking ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Mark Read
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({ className }) => {
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<NotificationHistoryFilter>({});
  const [searchTerm, setSearchTerm] = useState('');

  const {
    notifications,
    pagination,
    unreadCount,
    loading,
    error,
    markAsRead,
    markMultipleAsRead,
    deleteNotification,
    loadMore,
    refresh,
    updateFilters,
    hasMore,
    isEmpty,
  } = useNotificationHistory({
    pageSize: 20,
    filters,
  });

  // Filter notifications by search term
  const filteredNotifications = useMemo(() => {
    if (!searchTerm) return notifications;

    const term = searchTerm.toLowerCase();
    return notifications.filter(
      notification =>
        notification.title.toLowerCase().includes(term) ||
        notification.message.toLowerCase().includes(term)
    );
  }, [notifications, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    } else {
      setSelectedNotifications(new Set());
    }
  };

  const handleSelectNotification = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedNotifications);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedNotifications(newSelected);
  };

  const handleMarkSelectedAsRead = async () => {
    const unreadSelected = Array.from(selectedNotifications).filter(id => {
      const notification = notifications.find(n => n.id === id);
      return notification && !notification.read;
    });

    if (unreadSelected.length > 0) {
      await markMultipleAsRead(unreadSelected);
      setSelectedNotifications(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    const promises = Array.from(selectedNotifications).map(id => deleteNotification(id));
    await Promise.all(promises);
    setSelectedNotifications(new Set());
  };

  const handleApplyFilters = (newFilters: NotificationHistoryFilter) => {
    setFilters(newFilters);
    updateFilters(newFilters);
    setShowFilters(false);
  };

  const hasSelection = selectedNotifications.size > 0;
  const allFilteredSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every(n => selectedNotifications.has(n.id));

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification History
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" />
              Filters
            </Button>

            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <Select
              value={filters.type || 'all'}
              onValueChange={value =>
                setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Notification Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task-update">Task Updates</SelectItem>
                <SelectItem value="calendar-sync">Calendar Sync</SelectItem>
                <SelectItem value="deadline-reminder">Deadline Reminders</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.read === undefined ? 'all' : filters.read ? 'read' : 'unread'}
              onValueChange={value =>
                setFilters(prev => ({
                  ...prev,
                  read: value === 'all' ? undefined : value === 'read',
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Read Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => handleApplyFilters(filters)}>Apply Filters</Button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1"
          />

          {filteredNotifications.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox checked={allFilteredSelected} onCheckedChange={handleSelectAll} />
              <span className="text-sm text-muted-foreground">
                Select All ({selectedNotifications.size})
              </span>
            </div>
          )}
        </div>

        {hasSelection && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{selectedNotifications.size} selected</span>
            <Button variant="outline" size="sm" onClick={handleMarkSelectedAsRead}>
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark as Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-4 mb-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            Error: {error}
          </div>
        )}

        {loading && isEmpty && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading notifications...
          </div>
        )}

        {isEmpty && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BellOff className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notifications found</h3>
            <p className="text-muted-foreground">
              {Object.keys(filters).length > 0 || searchTerm
                ? 'Try adjusting your filters or search term'
                : "You don't have any notifications yet"}
            </p>
          </div>
        )}

        {filteredNotifications.length > 0 && (
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                  selected={selectedNotifications.has(notification.id)}
                  onSelect={handleSelectNotification}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {filteredNotifications.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
            <span>
              Showing {filteredNotifications.length} of {pagination.total} notifications
            </span>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
