"use client";

import { useState } from "react";
import { Plus, MessageSquare, Send, CheckCircle, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, Badge, Button,
  Modal, Input, Select, EmptyState,
} from "@/components/ui";
import { useClasses } from "@/lib/queries/classes";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { formatDateTime } from "@/lib/utils";
import type { SelectOption } from "@/types";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  subject:       z.string().min(1, "Subject is required"),
  body:          z.string().min(10, "Message body is too short"),
  channel:       z.enum(["email", "sms", "both"]),
  recipientType: z.enum(["all", "class"]),
  classId:       z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Local message type (backend messaging not yet implemented) ─

interface LocalMessage {
  id:             string;
  subject:        string;
  body:           string;
  channel:        "email" | "sms" | "both";
  status:         "sent" | "scheduled" | "draft" | "failed";
  recipientCount: number;
  createdAt:      string;
  sentAt?:        string;
}

// ── Constants ─────────────────────────────────────────────────

const CHANNEL_OPTIONS: SelectOption[] = [
  { value: "email", label: "Email"          },
  { value: "sms",   label: "SMS"            },
  { value: "both",  label: "SMS and Email"  },
];

const RECIPIENT_OPTIONS: SelectOption[] = [
  { value: "all",   label: "All parents"    },
  { value: "class", label: "Specific class" },
];

const STATUS_STYLES: Record<
  string,
  { variant: "success" | "warning" | "default" | "info"; label: string }
> = {
  sent:      { variant: "success", label: "Sent"      },
  scheduled: { variant: "info",    label: "Scheduled" },
  draft:     { variant: "default", label: "Draft"     },
  failed:    { variant: "warning", label: "Failed"    },
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  sms:   "SMS",
  both:  "SMS & Email",
};

// ── Sub-component ─────────────────────────────────────────────

function MessageCard({
  message,
  onClick,
}: {
  message: LocalMessage;
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
            : `${message.recipientCount} recipients`}
        </span>
        <span>
          {message.sentAt
            ? formatDateTime(message.sentAt)
            : formatDateTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function MessagesPage() {
  // Messages live in local state until the backend messaging module is built
  const [messages,   setMessages  ] = useState<LocalMessage[]>([]);
  const [modalOpen,  setModalOpen ] = useState(false);
  const [detailMsg,  setDetailMsg ] = useState<LocalMessage | null>(null);
  const [saving,     setSaving    ] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const { can } = usePermission();
  // Admins can send messages — bursar and teacher cannot
  const readOnly = !can.manageSettings;

  const { data: classes = [] } = useClasses();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { channel: "email", recipientType: "all" },
  });

  const recipientType = watch("recipientType");

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      // Optimistic local insert until the backend messaging endpoint is built
      const message: LocalMessage = {
        id:             `msg_${Date.now()}`,
        subject:        data.subject,
        body:           data.body,
        channel:        data.channel,
        status:         "sent",
        recipientCount: data.recipientType === "all"
          ? messages.length + 1
          : classes.find((c) => c.id === data.classId)
            ? 1
            : 0,
        createdAt:      new Date().toISOString(),
        sentAt:         new Date().toISOString(),
      };
      setMessages((prev) => [message, ...prev]);
      reset({ channel: "email", recipientType: "all" });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const filtered = messages.filter(
    (m) => !statusFilter || m.status === statusFilter
  );

  const classOptions: SelectOption[] = classes.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const statusOptions: SelectOption[] = [
    { value: "",          label: "All messages" },
    { value: "sent",      label: "Sent"         },
    { value: "scheduled", label: "Scheduled"    },
    { value: "draft",     label: "Draft"        },
    { value: "failed",    label: "Failed"       },
  ];

  const sentCount    = messages.filter((m) => m.status === "sent").length;
  const totalReached = messages
    .filter((m) => m.status === "sent")
    .reduce((sum, m) => sum + m.recipientCount, 0);

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
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Messages sent",   value: sentCount    },
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

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-navy-50 border border-navy-100 rounded-lg text-sm text-navy-700">
          <MessageSquare size={16} className="shrink-0 mt-0.5" />
          <p>
            Full message history and delivery tracking will be available once
            the backend messaging module is enabled. Messages sent here are
            recorded locally for now.
          </p>
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
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No messages yet"
              description="Send your first message to parents."
              action={
                !readOnly ? (
                  <Button size="sm" onClick={() => setModalOpen(true)}>
                    <Plus size={14} />
                    New message
                  </Button>
                ) : undefined
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
        onClose={() => { setModalOpen(false); reset(); }}
        title="New message"
        subtitle="Send to all parents or a specific class"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); reset(); }}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSubmit(onSubmit)}>
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

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Message <span className="text-error">*</span>
            </label>
            <textarea
              placeholder="Dear Parent..."
              rows={5}
              className="w-full px-3 py-2 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 placeholder:text-text-muted resize-none"
              {...register("body")}
            />
            {errors.body && (
              <p className="text-xs text-error mt-1">{errors.body.message}</p>
            )}
          </div>

          <div className="p-3 bg-surface-secondary border border-border rounded text-xs text-text-muted">
            SMS messages are charged per recipient. Email is included in all plans.
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailMsg && (
        <Modal
          isOpen={!!detailMsg}
          onClose={() => setDetailMsg(null)}
          title={detailMsg.subject}
          subtitle={formatDateTime(detailMsg.createdAt)}
          size="md"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <Badge label={CHANNEL_LABELS[detailMsg.channel]} variant="navy" />
              <Badge
                label={STATUS_STYLES[detailMsg.status]?.label ?? detailMsg.status}
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
          </div>
        </Modal>
      )}
    </>
  );
}