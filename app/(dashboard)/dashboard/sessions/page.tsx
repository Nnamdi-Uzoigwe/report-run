"use client";

import { useState } from "react";
import {
  CalendarDays, Plus, CheckCircle,
  AlertCircle, ArrowRight, Users,
  RefreshCw,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, CardHeader, Badge, Button, Input, Modal, EmptyState,
} from "@/components/ui";
import {
  useSessions, useCreateSession, useActivateSession,
  useAdvanceTerm, useUpdateSession, usePreviewPromotion, useExecutePromotion,
} from "@/lib/queries/session";
import { useClasses } from "@/lib/queries/classes";
import { useAuthStore } from "@/lib/store";
import { usePermission } from "@/lib/hooks/usePermission";
import { classNames } from "@/lib/utils";
import type { AcademicSession, Term } from "@/types";

// ── Helpers ───────────────────────────────────────────────────

const TERM_LABELS: Record<Term, string> = {
  first:  "First Term",
  second: "Second Term",
  third:  "Third Term",
};

const TERM_ORDER: Term[] = ["first", "second", "third"];

function termBadge(term: Term) {
  const variants: Record<Term, "default" | "warning" | "success"> = {
    first:  "default",
    second: "warning",
    third:  "success",
  };
  return <Badge label={TERM_LABELS[term]} variant={variants[term]} />;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

// ── Create Session Form ───────────────────────────────────────

const sessionSchema = z.object({
  academicYear: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, "Format must be YYYY/YYYY e.g. 2024/2025"),
  currentTerm: z.enum(["first", "second", "third"] as const),
  startDate:   z.string().optional(),
  endDate:     z.string().optional(),
  notes:       z.string().optional(),
});
type SessionForm = z.infer<typeof sessionSchema>;

function CreateSessionModal({
  isOpen,
  onClose,
}: {
  isOpen:  boolean;
  onClose: () => void;
}) {
  const createSession = useCreateSession();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SessionForm>({
    resolver:      zodResolver(sessionSchema),
    defaultValues: { currentTerm: "first" },
  });

  async function onSubmit(data: SessionForm) {
    setError(null);
    try {
      await createSession.mutateAsync(data as any);
      reset();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create academic session"
      subtitle="Define a new session for your school"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={createSession.isPending} onClick={handleSubmit(onSubmit)}>
            Create session
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-error-light border border-error rounded text-sm text-error">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        <Input
          label="Academic year"
          placeholder="2024/2025"
          required
          error={errors.academicYear?.message}
          {...register("academicYear")}
        />

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Starting term <span className="text-error">*</span>
          </label>
          <select
            className="w-full h-9 px-3 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
            {...register("currentTerm")}
          >
            <option value="first">First Term</option>
            <option value="second">Second Term</option>
            <option value="third">Third Term</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" type="date" {...register("startDate")} />
          <Input label="End date"   type="date" {...register("endDate")} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">Notes</label>
          <textarea
            rows={2}
            placeholder="Optional notes about this session"
            className="w-full px-3 py-2 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600 resize-none"
            {...register("notes")}
          />
        </div>
      </div>
    </Modal>
  );
}

// ── Promotion Wizard ──────────────────────────────────────────

type Mapping = { fromClassId: string; toClassId: string };

function PromotionWizard({
  isOpen,
  onClose,
  sessions,
  classes,
}: {
  isOpen:    boolean;
  onClose:   () => void;
  sessions:  AcademicSession[];
  classes:   { id: string; name: string }[];
}) {
  const schoolId       = useAuthStore((s) => s.schoolId);
  const [step,         setStep        ] = useState<"map" | "preview" | "done">("map");
  const [newSessionId, setNewSessionId] = useState("");
  const [mappings,     setMappings    ] = useState<Mapping[]>([{ fromClassId: "", toClassId: "" }]);
  const [preview,      setPreview     ] = useState<any>(null);
  const [result,       setResult      ] = useState<any>(null);
  const [error,        setError       ] = useState<string | null>(null);

  const previewMutation = usePreviewPromotion();
  const executeMutation = useExecutePromotion();

  const futureSessions = sessions.filter((s) => !s.isActive);

  function updateMapping(idx: number, key: keyof Mapping, value: string) {
    setMappings((prev) => prev.map((m, i) => i === idx ? { ...m, [key]: value } : m));
  }

  function addMapping() {
    setMappings((prev) => [...prev, { fromClassId: "", toClassId: "" }]);
  }

  function removeMapping(idx: number) {
    setMappings((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handlePreview() {
    setError(null);
    const validMappings = mappings.filter((m) => m.fromClassId && m.toClassId);
    if (!validMappings.length) { setError("Add at least one class mapping."); return; }
    if (!newSessionId)         { setError("Select the new session to activate."); return; }

    try {
      const data = await previewMutation.mutateAsync({
        schoolId:    schoolId!,
        mappings:    validMappings,
        newSessionId,
      });
      setPreview(data);
      setStep("preview");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleExecute() {
    setError(null);
    const validMappings = mappings.filter((m) => m.fromClassId && m.toClassId);
    try {
      const data = await executeMutation.mutateAsync({
        schoolId:    schoolId!,
        mappings:    validMappings,
        newSessionId,
      });
      setResult(data);
      setStep("done");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleClose() {
    setStep("map"); setMappings([{ fromClassId: "", toClassId: "" }]);
    setNewSessionId(""); setPreview(null); setResult(null); setError(null);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="End-of-year student promotion"
      subtitle="Move students to their new classes and activate the next session"
      size="xl"
      footer={
        step === "map" ? (
          <>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button loading={previewMutation.isPending} onClick={handlePreview}>
              Preview promotion
            </Button>
          </>
        ) : step === "preview" ? (
          <>
            <Button variant="secondary" onClick={() => setStep("map")}>Back</Button>
            <Button loading={executeMutation.isPending} onClick={handleExecute}>
              Execute promotion
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>Done</Button>
        )
      }
    >
      <div className="flex flex-col gap-5">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-error-light border border-error rounded text-sm text-error">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        {step === "map" && (
          <>
            {/* New session */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wide">
                New session to activate after promotion <span className="text-error">*</span>
              </label>
              <select
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
              >
                <option value="">Select next session...</option>
                {futureSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.academicYear} — {TERM_LABELS[s.currentTerm]}
                  </option>
                ))}
              </select>
              {futureSessions.length === 0 && (
                <p className="text-xs text-text-muted mt-1">
                  Create the new session first (e.g. 2025/2026) before running promotion.
                </p>
              )}
            </div>

            {/* Class mappings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                  Class mappings
                </label>
                <button
                  onClick={addMapping}
                  className="text-xs text-navy-600 font-medium cursor-pointer hover:text-navy-700"
                >
                  + Add mapping
                </button>
              </div>
              <p className="text-xs text-text-muted mb-3">
                Map each current class to its destination. Use your alumni class for final-year students.
              </p>

              <div className="flex flex-col gap-2">
                {mappings.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={m.fromClassId}
                      onChange={(e) => updateMapping(idx, "fromClassId", e.target.value)}
                      className="flex-1 h-9 px-3 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                    >
                      <option value="">From class...</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ArrowRight size={14} className="text-text-muted shrink-0" />
                    <select
                      value={m.toClassId}
                      onChange={(e) => updateMapping(idx, "toClassId", e.target.value)}
                      className="flex-1 h-9 px-3 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                    >
                      <option value="">To class...</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {mappings.length > 1 && (
                      <button
                        onClick={() => removeMapping(idx)}
                        className="text-text-muted hover:text-error cursor-pointer text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <strong>Note:</strong> Historical scores, reports, and attendance are never modified.
              Only each student's current class assignment is updated.
              Add a student to the exclude list after promotion to handle repeaters.
            </div>
          </>
        )}

        {step === "preview" && preview && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 p-3 bg-success-light border border-success rounded text-sm text-success">
              <CheckCircle size={14} className="shrink-0" />
              {preview.totalEligible} students eligible for promotion. Review before confirming.
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary">
                  <tr>
                    {["From class","To class","Eligible","Excluded (stay)"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.breakdown.map((row: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? "" : "bg-surface-secondary"}>
                      <td className="px-4 py-2 font-medium">{row.fromClass}</td>
                      <td className="px-4 py-2 text-text-secondary">
                        <span className="flex items-center gap-1">
                          <ArrowRight size={12} className="text-text-muted" />
                          {row.toClass}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-success font-medium">{row.eligible}</td>
                      <td className="px-4 py-2 text-text-muted">{row.excluded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-error-light border border-error rounded text-xs text-error">
              <strong>This action cannot be undone.</strong> Students will be moved to their new
              classes and the new session will be activated immediately.
            </div>
          </div>
        )}

        {step === "done" && result && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-success" />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">Promotion complete!</p>
              <p className="text-sm text-text-muted mt-1">
                {result.promoted} students promoted · {result.excluded} repeaters kept back
              </p>
              <p className="text-sm text-text-muted">
                New session: <strong>{result.newSession.academicYear}</strong> —{" "}
                {TERM_LABELS[result.newSession.currentTerm as Term]} is now active.
              </p>
            </div>
            <div className="w-full border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-surface-secondary">
                  <tr>
                    {["From","To","Moved"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((row: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? "" : "bg-surface-secondary"}>
                      <td className="px-3 py-2">{row.fromClass}</td>
                      <td className="px-3 py-2">{row.toClass}</td>
                      <td className="px-3 py-2 font-medium">{row.studentsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Session Card ──────────────────────────────────────────────

function SessionCard({
  session,
  canManage,
}: {
  session:   AcademicSession;
  canManage: boolean;
}) {
  const activateMutation = useActivateSession();
  const updateMutation   = useUpdateSession();

  async function handleTermChange(newTerm: Term) {
    if (newTerm === session.currentTerm) return;
    if (!confirm(`Change term to ${TERM_LABELS[newTerm]}?`)) return;
    try {
      await updateMutation.mutateAsync({ id: session.id, data: { currentTerm: newTerm } });
    } catch {}
  }

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text-primary">{session.academicYear}</p>
              {session.isActive && <Badge label="Active" variant="success" />}
            </div>
            {/* Term — dropdown if can manage, badge if read-only */}
            <div className="mt-1">
              {canManage ? (
                <select
                  value={session.currentTerm}
                  onChange={(e) => handleTermChange(e.target.value as Term)}
                  disabled={updateMutation.isPending}
                  className="text-xs border border-border rounded px-2 py-1 bg-surface focus:outline-2 focus:outline-navy-600 cursor-pointer"
                >
                  {TERM_ORDER.map((t) => (
                    <option key={t} value={t}>{TERM_LABELS[t]}</option>
                  ))}
                </select>
              ) : (
                termBadge(session.currentTerm)
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {!session.isActive && (
              <Button
                size="sm"
                variant="secondary"
                loading={activateMutation.isPending}
                onClick={() => {
                  if (confirm(`Activate ${session.academicYear}? This will deactivate the current session.`)) {
                    activateMutation.mutate(session.id);
                  }
                }}
              >
                Activate
              </Button>
            )}
            {session.isActive && session.currentTerm === "third" && (
              <span className="text-xs text-text-muted italic">
                Run promotion to start new year
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-border text-xs">
        <div className="px-4 py-2.5">
          <p className="text-text-muted mb-0.5">Start date</p>
          <p className="font-medium text-text-primary">{formatDate(session.startDate)}</p>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-text-muted mb-0.5">End date</p>
          <p className="font-medium text-text-primary">{formatDate(session.endDate)}</p>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-text-muted mb-0.5">Notes</p>
          <p className="font-medium text-text-primary truncate">{session.notes ?? "—"}</p>
        </div>
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function SessionsPage() {
  const [createModal,    setCreateModal   ] = useState(false);
  const [promotionModal, setPromotionModal] = useState(false);

  const { can }    = usePermission();
  const canManage  = can.manageSettings;

  const { data: sessions = [], isLoading } = useSessions();
  const { data: classes  = []            } = useClasses();

  const active   = sessions.find((s) => s.isActive);
  const inactive = sessions.filter((s) => !s.isActive).sort(
    (a, b) => b.academicYear.localeCompare(a.academicYear),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="h-40 bg-surface-tertiary rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Academic Sessions"
        subtitle={active
          ? `Current: ${active.academicYear} — ${TERM_LABELS[active.currentTerm]}`
          : "No active session — create one to start recording scores"}
        action={
          canManage ? (
            <div className="flex items-center gap-2">
              {active?.currentTerm === "third" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPromotionModal(true)}
                >
                  <Users size={14} />
                  End-of-year promotion
                </Button>
              )}
              {active && active.currentTerm !== "third" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPromotionModal(true)}
                >
                  <RefreshCw size={14} />
                  Run promotion
                </Button>
              )}
              <Button size="sm" onClick={() => setCreateModal(true)}>
                <Plus size={14} />
                New session
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Active session banner */}
      {active && (
        <div className="flex items-center gap-4 p-4 bg-navy-50 border border-navy-200 rounded-xl">
          <div className="w-10 h-10 bg-navy-600 rounded-lg flex items-center justify-center shrink-0">
            <CalendarDays size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-navy-700">
              {active.academicYear} — {TERM_LABELS[active.currentTerm]}
            </p>
            <p className="text-xs text-navy-600 mt-0.5">
              All score entry and report generation uses this session automatically.
              {active.endDate && ` Ends ${formatDate(active.endDate)}.`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-navy-500">Term</p>
            <p className="text-lg font-bold text-navy-700 capitalize">{active.currentTerm}</p>
          </div>
        </div>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="No sessions yet"
            description="Create your first academic session to get started. Once active, all score entry will use it automatically."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {active && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                Active session
              </p>
              <SessionCard session={active} canManage={canManage} />
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                Other sessions
              </p>
              <div className="flex flex-col gap-3">
                {inactive.map((s) => (
                  <SessionCard key={s.id} session={s} canManage={canManage} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateSessionModal isOpen={createModal} onClose={() => setCreateModal(false)} />
      <PromotionWizard
        isOpen={promotionModal}
        onClose={() => setPromotionModal(false)}
        sessions={sessions}
        classes={classes}
      />
    </div>
  );
}