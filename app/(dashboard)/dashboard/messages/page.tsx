"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  AlertCircle,
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader,
  Card,
  CardHeader,
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  EmptyState,
  Table,
} from "@/components/ui";
import { fetchMessages, fetchClasses, sendMessage } from "@/lib/api";
import { formatDateTime, truncate } from "@/lib/utils";
import type { Message, Class, MessageChannel, SelectOption } from "@/types";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(10, "Message body is too short"),
  channel: z.string().min(1, "Select a channel"),
  recipientType: z.string().min(1, "Select recipients"),
  classId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Constants ─────────────────────────────────────────────────

const CHANNEL_OPTIONS: SelectOption[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "both", label: "SMS and Email" },
];

const RECIPIENT_OPTIONS: SelectOption[] = [
  { value: "all", label: "All parents" },
  { value: "class", label: "Specific class" },
];

const STATUS_STYLES: Record<
  string,
  { variant: "success" | "warning" | "default" | "info"; label: string }
> = {
  sent: { variant: "success", label: "Sent" },
  scheduled: { variant: "info", label: "Scheduled" },
  draft: { variant: "default", label: "Draft" },
  failed: { variant: "warning", label: "Failed" },
};

const CHANNEL_LABELS: Record<MessageChannel, string> = {
  email: "Email",
  sms: "SMS",
  push: "Push",
};

// ── Sub-components ────────────────────────────────────────────

function MessageCard({
  message,
  onClick,
}: {
  message: Message;
  onClick: () => void;
}) {
  const status = STATUS_STYLES[message.status] ?? STATUS_STYLES.draft;

  return (
    <div
      onClick={onClick}
      className="p-5 bg-surface border border-border rounded-lg hover:border-border-strong transition-colors duration-150 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <p className="text-sm font-semibold text-text-primary line-clamp-1">
          {message.subject}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Badge label={CHANNEL_LABELS[message.channel]} variant="navy" />
          <Badge label={status.label} variant={status.variant} />
        </div>
      </div>
      <p className="text-sm text-text-secondary mb-3 line-clamp-2">
        {message.body}
      </p>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          {message.status === "sent" && (
            <CheckCircle size={11} className="text-success" />
          )}
          {message.status === "scheduled" && (
            <Clock size={11} className="text-info" />
          )}
          {message.status === "sent"
            ? `Sent to ${message.recipientCount} parents`
            : message.status === "scheduled"
              ? `Scheduled — ${message.recipientCount} recipients`
              : `${message.recipientCount} recipients`}
        </span>
        <span>
          {message.sentAt
            ? formatDateTime(message.sentAt)
            : message.scheduledAt
              ? `Scheduled: ${formatDateTime(message.scheduledAt)}`
              : formatDateTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailMsg, setDetailMsg] = useState<Message | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { can } = usePermission();
  const readOnly = !can.sendMessages;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { channel: "email", recipientType: "all" },
  });

  const recipientType = watch("recipientType");

  useEffect(() => {
    Promise.all([fetchMessages(), fetchClasses()])
      .then(([m, c]) => {
        setMessages(m);
        setClasses(c);
      })
      .catch(() => setError("Failed to load messages."))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const cls = classes.find((c) => c.id === data.classId);
      const recipientCount =
        data.recipientType === "all" ? 616 : (cls?.studentCount ?? 0);

      const created = await sendMessage({
        subject: data.subject,
        body: data.body,
        channel: data.channel as MessageChannel,
        recipients: [
          data.recipientType === "class" && data.classId
            ? { type: "class", classId: data.classId }
            : { type: "all" },
        ],
        recipientCount,
      });
      setMessages((prev) => [created, ...prev]);
      reset({ channel: "email", recipientType: "all" });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  // Filtered
  const filtered = messages.filter(
    (m) => statusFilter === "" || m.status === statusFilter,
  );

  // Stats
  const sentCount = messages.filter((m) => m.status === "sent").length;
  const scheduledCount = messages.filter(
    (m) => m.status === "scheduled",
  ).length;
  const totalReached = messages
    .filter((m) => m.status === "sent")
    .reduce((sum, m) => sum + m.recipientCount, 0);

  // Options
  const classOptions: SelectOption[] = classes.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const statusOptions: SelectOption[] = [
    { value: "", label: "All messages" },
    { value: "sent", label: "Sent" },
    { value: "scheduled", label: "Scheduled" },
    { value: "draft", label: "Draft" },
    { value: "failed", label: "Failed" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-surface-tertiary rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-surface-tertiary rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-error">
          <AlertCircle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {readOnly && (
          <ReadOnlyBanner message="Only admins can send messages to parents." />
        )}
        <PageHeader
          title="Communication Center"
          subtitle="Send messages to parents via SMS or email"
          action={
            !readOnly ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={15} />
                New message
              </Button>
            ) : undefined
          }
        />

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Messages sent", value: sentCount },
            { label: "Scheduled", value: scheduledCount },
            { label: "Parents reached", value: totalReached },
          ].map((stat) => (
            <Card key={stat.label} padding="sm">
              <p className="text-xs text-text-muted mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-text-primary">
                {stat.value.toLocaleString()}
              </p>
            </Card>
          ))}
        </div>

        {/* Filter + list */}
        <Card padding="none">
          <div className="p-4 border-b border-border flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-text-primary">
              Message history
            </h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No messages yet"
              description="Send your first message to parents."
              action={
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  <Plus size={14} />
                  New message
                </Button>
              }
            />
          ) : (
            <div className="p-4 flex flex-col gap-3">
              {filtered.map((m) => (
                <MessageCard
                  key={m.id}
                  message={m}
                  onClick={() => setDetailMsg(m)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Compose Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title="New message"
        subtitle="Send to all parents or a specific class"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSubmit(onSubmit as any)}>
              <Send size={14} />
              Send now
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Channel"
              required
              options={CHANNEL_OPTIONS}
              error={errors.channel?.message}
              {...register("channel")}
            />
            <Select
              label="Recipients"
              required
              options={RECIPIENT_OPTIONS}
              error={errors.recipientType?.message}
              {...register("recipientType")}
            />
          </div>

          {recipientType === "class" && (
            <Select
              label="Class"
              required
              options={classOptions}
              placeholder="Select class"
              error={errors.classId?.message}
              {...register("classId")}
            />
          )}

          <Input
            label="Subject"
            placeholder="e.g. Third Term Examination Timetable"
            required
            error={errors.subject?.message}
            {...register("subject")}
          />

          <Textarea
            label="Message"
            placeholder="Dear Parent..."
            required
            error={errors.body?.message}
            {...register("body")}
          />

          <div className="p-3 bg-surface-secondary border border-border rounded text-xs text-text-muted">
            SMS messages are charged per recipient. Email is included in all
            plans.
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailMsg && (
        <Modal
          isOpen={!!detailMsg}
          onClose={() => setDetailMsg(null)}
          title={detailMsg.subject}
          subtitle={`Sent by ${detailMsg.createdBy}`}
          size="md"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <Badge label={CHANNEL_LABELS[detailMsg.channel]} variant="navy" />
              <Badge
                label={
                  STATUS_STYLES[detailMsg.status]?.label ?? detailMsg.status
                }
                variant={STATUS_STYLES[detailMsg.status]?.variant ?? "default"}
              />
              <Badge
                label={`${detailMsg.recipientCount} recipients`}
                variant="default"
              />
            </div>

            <div className="p-4 bg-surface-secondary border border-border rounded text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {detailMsg.body}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Created",
                  value: formatDateTime(detailMsg.createdAt),
                },
                {
                  label: detailMsg.sentAt ? "Sent" : "Scheduled",
                  value: detailMsg.sentAt
                    ? formatDateTime(detailMsg.sentAt)
                    : detailMsg.scheduledAt
                      ? formatDateTime(detailMsg.scheduledAt)
                      : "—",
                },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-xs text-text-muted mb-0.5">{row.label}</p>
                  <p className="text-sm text-text-primary">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
