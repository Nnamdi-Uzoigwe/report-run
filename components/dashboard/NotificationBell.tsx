"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CreditCard, MessageSquare, AlertCircle, X } from "lucide-react";
import { classNames, formatDateTime, formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
// import { mockPayments, mockMessages } from "@/lib/mock-data";

// ── Types ─────────────────────────────────────────────────────

type NotifType = "payment" | "message" | "alert";

interface Notification {
  id:        string;
  type:      NotifType;
  title:     string;
  body:      string;
  timestamp: string;
  read:      boolean;
}

// ── Build notifications from mock data ────────────────────────

// function buildNotifications(): Notification[] {
//   const paymentNotifs: Notification[] = mockPayments
//     .filter((p) => p.paidAt)
//     .slice(0, 3)
//     .map((p) => ({
//       id:        `notif_pay_${p.id}`,
//       type:      "payment",
//       title:     "Payment received",
//       body:      `${p.studentName} — ${formatCurrency(p.amountPaid)} for ${p.feeCategoryName}`,
//       timestamp: p.paidAt!,
//       read:      false,
//     }));

//   const messageNotifs: Notification[] = mockMessages
//     .filter((m) => m.status === "sent")
//     .slice(0, 2)
//     .map((m) => ({
//       id:        `notif_msg_${m.id}`,
//       type:      "message",
//       title:     "Message sent",
//       body:      `"${m.subject}" delivered to ${m.recipientCount} parents`,
//       timestamp: m.sentAt ?? m.createdAt,
//       read:      true,
//     }));

//   const alertNotifs: Notification[] = [
//     {
//       id:        "notif_alert_001",
//       type:      "alert",
//       title:     "3 students with unpaid fees",
//       body:      "Toluwani Adebayo and 2 others have outstanding balances this term.",
//       timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
//       read:      false,
//     },
//   ];

//   return [...alertNotifs, ...paymentNotifs, ...messageNotifs].sort(
//     (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//   );
// }

// ── Icon per type ─────────────────────────────────────────────

function NotifIcon({ type }: { type: NotifType }) {
  const styles: Record<NotifType, { bg: string; icon: React.ReactNode }> = {
    payment: {
      bg:   "bg-success-light",
      icon: <CreditCard size={13} className="text-success" />,
    },
    message: {
      bg:   "bg-info-light",
      icon: <MessageSquare size={13} className="text-info" />,
    },
    alert: {
      bg:   "bg-warning-light",
      icon: <AlertCircle size={13} className="text-warning" />,
    },
  };

  const s = styles[type];
  return (
    <div className={classNames("p-2 rounded-lg shrink-0", s.bg)}>
      {s.icon}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────

export function NotificationBell() {
  const [open,          setOpen         ] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current  && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-error-light text-error text-xs font-semibold rounded">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-navy-600 hover:text-navy-700 font-medium transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="p-3 bg-surface-secondary rounded-xl border border-border mb-3">
                  <Bell size={20} className="text-text-muted" />
                </div>
                <p className="text-sm font-medium text-text-primary">
                  All caught up
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  No new notifications
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={classNames(
                      "flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors duration-100 cursor-pointer",
                      notif.read
                        ? "bg-surface hover:bg-surface-secondary"
                        : "bg-navy-50 hover:bg-navy-100"
                    )}
                    onClick={() => markRead(notif.id)}
                  >
                    <NotifIcon type={notif.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-text-primary">
                          {notif.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(notif.id);
                          }}
                          className="shrink-0 text-text-muted hover:text-text-primary transition-colors cursor-pointer mt-0.5"
                          aria-label="Dismiss notification"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-[10px] text-text-muted mt-1">
                        {formatDateTime(notif.timestamp)}
                      </p>
                    </div>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-navy-600 shrink-0 mt-1.5" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-surface-secondary">
              <p className="text-xs text-text-muted text-center">
                Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}