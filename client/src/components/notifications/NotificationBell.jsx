import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../hooks/useNotifications.js';
import { Button } from '../ui/Button.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { formatRelativeTime } from '../../utils/formatRelativeTime.js';
import {
  getNotificationHref,
  NOTIFICATION_TYPE_LABELS,
} from '../../utils/notificationLinks.js';
import { cn } from '../../utils/cn.js';

function BellIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoadingList,
    markRead,
    markAllRead,
    isMarkingAllRead,
    refetchList,
  } = useNotifications({ listEnabled: open });

  useEffect(() => {
    if (open) {
      refetchList();
    }
  }, [open, refetchList]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markRead(notification.id);
      } catch {
        // Navigation still works if mark-read fails
      }
    }

    setOpen(false);

    const href = getNotificationHref(notification);

    if (href) {
      navigate(href);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch {
      // Errors surface via toast in parent if needed
    }
  };

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900',
          'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
          open && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
        )}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={isMarkingAllRead}
                  onClick={handleMarkAllRead}
                  className="h-8 px-2 text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoadingList ? (
                <div className="space-y-2 p-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    All caught up
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    New activity will show up here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          'flex w-full gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/60',
                          !notification.read && 'bg-brand-50/60 dark:bg-brand-950/20',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            notification.read ? 'bg-transparent' : 'bg-brand-500',
                          )}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                          </span>
                          <span className="mt-0.5 block text-sm text-gray-900 dark:text-gray-100">
                            {notification.message}
                          </span>
                          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
