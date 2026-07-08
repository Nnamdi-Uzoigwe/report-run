"use client";

import { useState, useRef, useEffect, type ReactNode, type ChangeEvent } from "react";
import {
  Plus, Search, GraduationCap, Upload, Download,
  X, AlertCircle, CheckCircle, Eye, Trash2, Printer,
  FileSpreadsheet, ChevronRight, Pencil,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, CardHeader, Badge,
  Button, Modal, Input, EmptyState,
} from "@/components/ui";
import {
  useStudents, useCreateStudent, useUpdateStudent, useDeactivateStudent,
  usePreviewExcelImport, useConfirmStudentImport, useGraduateClass,
} from "@/lib/queries/students";
import { useActiveSubscription } from "@/lib/queries/school";
import { useClasses } from "@/lib/queries/classes";
import { useAuthStore } from "@/lib/store";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { classNames } from "@/lib/utils";
import type { Student } from "@/types";

// ── Schema — matches every field in CreateStudentDto ─────────

const studentSchema = z.object({
  // Personal
  firstName:             z.string().min(1, "First name is required"),
  middleName:            z.string().optional(),
  lastName:              z.string().min(1, "Last name is required"),
  admissionNumber:       z.string().optional(),
  dateOfBirth:           z.string().optional(),
  gender:                z.enum(["male", "female", "other"]).optional(),
  bloodGroup:            z.enum(["A+","A-","B+","B-","AB+","AB-","O+","O-"]).optional(),
  nationality:           z.string().optional(),
  stateOfOrigin:         z.string().optional(),
  religion:              z.string().optional(),
  // Address
  addressLine1:          z.string().optional(),
  addressLine2:          z.string().optional(),
  city:                  z.string().optional(),
  state:                 z.string().optional(),
  country:               z.string().optional(),
  // Medical
  allergies:             z.string().optional(),
  medicalConditions:     z.string().optional(),
  emergencyContact:      z.string().optional(),
  // Parent / Guardian
  parentEmail:           z.string().email("Enter a valid email"),
  parentPhone:           z.string().min(7, "Parent phone is required"),
  parentName:            z.string().optional(),
  parentRelationship:    z.string().optional(),
  secondaryGuardianName: z.string().optional(),
  secondaryGuardianPhone:z.string().optional(),
  // Academic
  classId:               z.string().optional(),
  admissionDate:         z.string().optional(),
  previousSchool:        z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

// ── Spreadsheet template ──────────────────────────────────────

const TEMPLATE_COLUMNS = [
  { key: "first_name",              required: true,  example: "Amina"                 },
  { key: "middle_name",             required: false, example: "Tunde"                 },
  { key: "last_name",               required: true,  example: "Bello"                 },
  { key: "admission_number",        required: false, example: "GFA/JSS1/001"          },
  { key: "gender",                  required: false, example: "female"                },
  { key: "date_of_birth",           required: false, example: "2012-03-14"            },
  { key: "blood_group",             required: false, example: "O+"                    },
  { key: "nationality",             required: false, example: "Nigerian"              },
  { key: "state_of_origin",         required: false, example: "Lagos"                 },
  { key: "religion",                required: false, example: "Christianity"          },
  { key: "address_line1",           required: false, example: "12 Bode Thomas Street" },
  { key: "address_line2",           required: false, example: "Surulere"              },
  { key: "city",                    required: false, example: "Lagos"                 },
  { key: "state",                   required: false, example: "Lagos State"           },
  { key: "country",                 required: false, example: "Nigeria"               },
  { key: "allergies",               required: false, example: "Penicillin"            },
  { key: "medical_conditions",      required: false, example: "Asthma"               },
  { key: "emergency_contact",       required: false, example: "Dr Adeola +234..."     },
  { key: "parent_email",            required: true,  example: "parent@gmail.com"      },
  { key: "parent_phone",            required: true,  example: "+2348012345601"        },
  { key: "parent_name",             required: false, example: "Mrs Halima Bello"      },
  { key: "parent_relationship",     required: false, example: "Mother"               },
  { key: "secondary_guardian_name", required: false, example: "Mr Bello"             },
  { key: "secondary_guardian_phone",required: false, example: "+2348099887766"       },
  { key: "admission_date",          required: false, example: "2024-09-01"            },
  { key: "previous_school",         required: false, example: "Lagos Island Academy"  },
];

function downloadTemplate() {
  const headers = TEMPLATE_COLUMNS.map((c) => c.key).join(",");
  const example = TEMPLATE_COLUMNS.map((c) => c.example).join(",");
  const csv     = `${headers}\n${example}\n`;
  const blob    = new Blob([csv], { type: "text/csv" });
  const link    = document.createElement("a");
  link.href     = URL.createObjectURL(blob);
  link.download = "student_import_template.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function formatDate(d?: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Form field groups for reuse in add + edit ─────────────────

function StudentFormFields({
  register,
  errors,
  classes,
}: {
  register: any;
  errors:   any;
  classes:  { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-col gap-6">

      {/* Personal */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Personal Information
        </p>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Input label="First name" required error={errors.firstName?.message} {...register("firstName")} />
            <Input label="Middle name" {...register("middleName")} />
            <Input label="Last name" required error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Admission number" placeholder="GFA/JSS1/001" {...register("admissionNumber")} />
            <Input label="Date of birth" type="date" {...register("dateOfBirth")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">Gender</label>
              <select className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600" {...register("gender")}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">Blood group</label>
              <select className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600" {...register("bloodGroup")}>
                <option value="">—</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <Input label="Religion" placeholder="Optional" {...register("religion")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nationality" placeholder="Nigerian" {...register("nationality")} />
            <Input label="State of origin" placeholder="Lagos" {...register("stateOfOrigin")} />
          </div>
        </div>
      </section>

      {/* Academic */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Academic
        </p>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">Class</label>
              <select className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600" {...register("classId")}>
                <option value="">No class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Input label="Admission date" type="date" {...register("admissionDate")} />
          </div>
          <Input label="Previous school" placeholder="Optional" {...register("previousSchool")} />
        </div>
      </section>

      {/* Address */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Address
        </p>
        <div className="flex flex-col gap-3">
          <Input label="Address line 1" {...register("addressLine1")} />
          <Input label="Address line 2" {...register("addressLine2")} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="City"    {...register("city")}    />
            <Input label="State"   {...register("state")}   />
            <Input label="Country" {...register("country")} />
          </div>
        </div>
      </section>

      {/* Medical */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Medical / Emergency
        </p>
        <div className="flex flex-col gap-3">
          <Input label="Allergies" placeholder="e.g. Penicillin" {...register("allergies")} />
          <Input label="Medical conditions" placeholder="e.g. Asthma" {...register("medicalConditions")} />
          <Input label="Emergency contact" placeholder="Name and phone number" {...register("emergencyContact")} />
        </div>
      </section>

      {/* Parent */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Parent / Guardian
        </p>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full name" {...register("parentName")} />
            <Input label="Relationship" placeholder="Mother / Father / Guardian" {...register("parentRelationship")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" type="tel" required error={errors.parentPhone?.message} {...register("parentPhone")} />
            <Input label="Email" type="email" required error={errors.parentEmail?.message} {...register("parentEmail")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Secondary guardian name"  placeholder="Optional" {...register("secondaryGuardianName")}  />
            <Input label="Secondary guardian phone" type="tel" placeholder="Optional" {...register("secondaryGuardianPhone")} />
          </div>
        </div>
      </section>

    </div>
  );
}

// ── Student detail / edit slide-over ─────────────────────────

function StudentPanel({
  student,
  onClose,
  classes,
  readOnly,
}: {
  student:  Student;
  onClose:  () => void;
  classes:  { id: string; name: string }[];
  readOnly: boolean;
}) {
  const [tab,       setTab      ] = useState<"details" | "edit">("details");
  const [saved,     setSaved    ] = useState(false);
  const [error,     setError    ] = useState<string | null>(null);
  const [deleting,  setDeleting ] = useState(false);
  const updateStudent    = useUpdateStudent();
  const deactivateStudent = useDeactivateStudent();

  const form = useForm<StudentForm>({
    resolver:      zodResolver(studentSchema) as any,
    defaultValues: {
      firstName:              student.firstName,
      middleName:             student.middleName  ?? "",
      lastName:               student.lastName,
      admissionNumber:        student.admissionNumber ?? "",
      dateOfBirth:            student.dateOfBirth?.split("T")[0] ?? "",
      gender:                 student.gender as any,
      bloodGroup:             student.bloodGroup as any,
      nationality:            student.nationality  ?? "",
      stateOfOrigin:          student.stateOfOrigin ?? "",
      religion:               student.religion ?? "",
      addressLine1:           student.addressLine1 ?? "",
      addressLine2:           student.addressLine2 ?? "",
      city:                   student.city    ?? "",
      state:                  student.state   ?? "",
      country:                student.country ?? "",
      allergies:              student.allergies          ?? "",
      medicalConditions:      student.medicalConditions  ?? "",
      emergencyContact:       student.emergencyContact   ?? "",
      parentEmail:            student.parentEmail ?? "",
      parentPhone:            student.parentPhone ?? "",
      parentName:             student.parentName  ?? "",
      parentRelationship:     student.parentRelationship     ?? "",
      secondaryGuardianName:  student.secondaryGuardianName  ?? "",
      secondaryGuardianPhone: student.secondaryGuardianPhone ?? "",
      classId:                student.classId ?? "",
      admissionDate:          student.admissionDate?.split("T")[0] ?? "",
      previousSchool:         student.previousSchool ?? "",
    },
  });

  async function onSubmit(data: StudentForm) {
    setError(null);
    try {
      await updateStudent.mutateAsync({ studentId: student.id, data: data as any });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete() {
    if (!confirm(
      `Remove ${student.firstName} ${student.lastName} from active students?\n\n` +
      `Their historical scores and reports will remain accessible.`
    )) return;
    setDeleting(true);
    try {
      await deactivateStudent.mutateAsync(student.id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  }

  const cls = classes.find((c) => c.id === student.classId);

  function InfoRow({ label, value, cap }: { label: string; value?: string; cap?: boolean }) {
    if (!value) return null;
    return (
      <div className="flex justify-between gap-4 py-1.5 border-b border-border last:border-0">
        <span className="text-xs text-text-muted shrink-0">{label}</span>
        <span className={classNames("text-xs text-text-primary text-right", cap ? "capitalize" : "")}>
          {value}
        </span>
      </div>
    );
  }

  function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{title}</p>
        <div className="p-3 bg-surface-secondary rounded-lg border border-border">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-navy-600">
              {student.firstName[0]}{student.lastName[0]}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {student.firstName} {student.middleName ? student.middleName + " " : ""}{student.lastName}
            </p>
            <p className="text-xs text-text-muted">
              {student.admissionNumber ?? "—"} · {cls?.name ?? "No class"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!readOnly && student.isActive && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Remove student"
              className="p-1.5 rounded hover:bg-error-light text-text-muted hover:text-error cursor-pointer transition-colors disabled:opacity-40"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded hover:bg-surface-secondary text-text-muted cursor-pointer">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {!readOnly && (
        <div className="flex border-b border-border shrink-0">
          {(["details","edit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={classNames(
                "flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide border-b-2 -mb-px transition-colors cursor-pointer",
                tab === t ? "border-navy-600 text-navy-600" : "border-transparent text-text-muted hover:text-text-primary",
              )}
            >
              {t === "details" ? "View Details" : "Edit"}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">

        {(tab === "details" || readOnly) && (
          <div className="flex flex-col gap-5">
            <Section title="Personal Information">
              <InfoRow label="First name"    value={student.firstName}      />
              <InfoRow label="Middle name"   value={student.middleName}     />
              <InfoRow label="Last name"     value={student.lastName}       />
              <InfoRow label="Adm. number"   value={student.admissionNumber}/>
              <InfoRow label="Date of birth" value={formatDate(student.dateOfBirth)} />
              <InfoRow label="Gender"        value={student.gender}    cap  />
              <InfoRow label="Blood group"   value={student.bloodGroup}     />
              <InfoRow label="Nationality"   value={student.nationality}    />
              <InfoRow label="State of origin" value={student.stateOfOrigin} />
              <InfoRow label="Religion"      value={student.religion}       />
              <InfoRow label="Status"        value={student.isActive ? "Active" : "Inactive"} />
            </Section>

            <Section title="Academic">
              <InfoRow label="Class"           value={cls?.name}               />
              <InfoRow label="Admission date"  value={formatDate(student.admissionDate)} />
              <InfoRow label="Previous school" value={student.previousSchool}  />
            </Section>

            <Section title="Address">
              <InfoRow label="Address line 1"  value={student.addressLine1}   />
              <InfoRow label="Address line 2"  value={student.addressLine2}   />
              <InfoRow label="City"            value={student.city}            />
              <InfoRow label="State"           value={student.state}           />
              <InfoRow label="Country"         value={student.country}         />
            </Section>

            <Section title="Medical / Emergency">
              <InfoRow label="Allergies"         value={student.allergies}         />
              <InfoRow label="Medical conditions" value={student.medicalConditions} />
              <InfoRow label="Emergency contact" value={student.emergencyContact}  />
            </Section>

            <Section title="Parent / Guardian">
              <InfoRow label="Name"         value={student.parentName}         />
              <InfoRow label="Relationship" value={student.parentRelationship}  />
              <InfoRow label="Phone"        value={student.parentPhone}         />
              <InfoRow label="Email"        value={student.parentEmail}         />
              <InfoRow label="2nd guardian" value={student.secondaryGuardianName}  />
              <InfoRow label="2nd phone"    value={student.secondaryGuardianPhone} />
            </Section>
          </div>
        )}

        {tab === "edit" && !readOnly && (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-light border border-error rounded text-sm text-error">
                <AlertCircle size={14} className="shrink-0" />{error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 p-3 bg-success-light border border-success rounded text-sm text-success">
                <CheckCircle size={14} className="shrink-0" />Student updated successfully.
              </div>
            )}
            <StudentFormFields
              register={form.register}
              errors={form.formState.errors}
              classes={classes}
            />
          </div>
        )}
      </div>

      {tab === "edit" && !readOnly && (
        <div className="px-5 py-4 border-t border-border shrink-0">
          <Button fullWidth loading={updateStudent.isPending} onClick={form.handleSubmit(onSubmit)}>
            Save changes
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Import Modal ──────────────────────────────────────────────

function ImportModal({
  isOpen,
  onClose,
  classes,
}: {
  isOpen:  boolean;
  onClose: () => void;
  classes: { id: string; name: string }[];
}) {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const fileRef     = useRef<HTMLInputElement>(null);
  const [classId,   setClassId ] = useState("");
  const [step,      setStep    ] = useState<"upload" | "preview">("upload");
  const [preview,   setPreview ] = useState<Partial<Student>[]>([]);
  const [error,     setError   ] = useState<string | null>(null);

  const previewImport = usePreviewExcelImport();
  const confirmImport = useConfirmStudentImport();

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!classId) { setError("Please select a class first."); return; }
    setError(null);
    try {
      // previewExcelImport expects a File directly
      const result = await previewImport.mutateAsync(f);
      setPreview(result);
      setStep("preview");
    } catch (err) { setError((err as Error).message); }
  }

  async function handleConfirm() {
    if (!schoolId || !classId || preview.length === 0) return;
    try {
      // Inject schoolId and classId into every parsed student row
      const studentsWithClass = preview.map((s) => ({
        ...s,
        schoolId,
        classId,
      }));
      await confirmImport.mutateAsync(studentsWithClass);
      handleClose();
    } catch (err) { setError((err as Error).message); }
  }

  function handleClose() {
    setStep("upload"); setPreview([]);
    setError(null); setClassId("");
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  }

  const selectedClass = classes.find((c) => c.id === classId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import students from spreadsheet"
      subtitle="Select a class, then upload your CSV or Excel file"
      size="xl"
      footer={
        step === "upload" ? (
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setStep("upload")}>Back</Button>
            <Button loading={confirmImport.isPending} onClick={handleConfirm}>
              Import {preview.length} students into {selectedClass?.name}
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-5">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-error-light border border-error rounded text-sm text-error">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        {step === "upload" && (
          <>
            {/* Step 1 — class */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wide">
                Step 1 — Select class to import into <span className="text-error">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
              >
                <option value="">Select a class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {classId && (
                <p className="text-xs text-success mt-1.5 flex items-center gap-1">
                  <CheckCircle size={11} />
                  All students will be added to <strong>{selectedClass?.name}</strong>
                </p>
              )}
            </div>

            {/* Step 2 — format */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-text-primary uppercase tracking-wide flex items-center gap-2">
                  <FileSpreadsheet size={14} className="text-navy-600" />
                  Step 2 — Required column headers
                </label>
                <Button size="sm" variant="secondary" onClick={downloadTemplate}>
                  <Download size={12} />
                  Download template
                </Button>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="text-xs w-full">
                    <thead className="sticky top-0">
                      <tr className="bg-navy-600 text-white">
                        <th className="px-3 py-2 text-left font-semibold">Column header</th>
                        <th className="px-3 py-2 text-left font-semibold">Required</th>
                        <th className="px-3 py-2 text-left font-semibold">Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TEMPLATE_COLUMNS.map((col, i) => (
                        <tr key={col.key} className={i % 2 === 0 ? "bg-surface" : "bg-surface-secondary"}>
                          <td className="px-3 py-1.5 font-mono font-semibold text-navy-600">{col.key}</td>
                          <td className="px-3 py-1.5">
                            {col.required
                              ? <span className="text-error font-semibold">Yes</span>
                              : <span className="text-text-muted">Optional</span>
                            }
                          </td>
                          <td className="px-3 py-1.5 text-text-secondary">{col.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-2">
                No class column needed — class is set by your selection above.
              </p>
            </div>

            {/* Step 3 — upload */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wide">
                Step 3 — Upload file
              </label>
              <div
                onClick={() => {
                  if (!classId) { setError("Select a class first."); return; }
                  fileRef.current?.click();
                }}
                className={classNames(
                  "flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg transition-colors",
                  classId
                    ? "border-border cursor-pointer hover:border-navy-400 hover:bg-surface-secondary"
                    : "border-border bg-surface-secondary opacity-50 cursor-not-allowed",
                )}
              >
                {previewImport.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-text-muted">Reading file...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center">
                      <Upload size={22} className="text-navy-600" />
                    </div>
                    <p className="text-sm font-medium text-text-primary text-center">
                      {classId ? "Click to upload" : "Select a class above first"}
                    </p>
                    <p className="text-xs text-text-muted">CSV, XLSX or XLS</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>
            </div>
          </>
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 p-3 bg-success-light border border-success rounded text-sm text-success">
              <CheckCircle size={14} className="shrink-0" />
              {preview.length} student{preview.length !== 1 ? "s" : ""} detected —
              all go into <strong>{selectedClass?.name}</strong>. Review and confirm.
            </div>
            <div className="overflow-x-auto border border-border rounded-lg max-h-72">
              <table className="w-full text-xs">
                <thead className="bg-surface-secondary sticky top-0">
                  <tr>
                    {["Name","Adm. No.","Gender","Parent","Phone","Email"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-text-muted border-b border-border whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-surface" : "bg-surface-secondary"}>
                      <td className="px-3 py-2 font-medium text-text-primary whitespace-nowrap">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="px-3 py-2 text-text-muted">{row.admissionNumber ?? "—"}</td>
                      <td className="px-3 py-2 capitalize">{row.gender ?? "—"}</td>
                      <td className="px-3 py-2">{row.parentName ?? "—"}</td>
                      <td className="px-3 py-2">{row.parentPhone ?? "—"}</td>
                      <td className="px-3 py-2">{row.parentEmail ?? "—"}</td>
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

// ── Graduate Modal ────────────────────────────────────────────

function GraduateModal({
  isOpen, onClose, classId, className, studentCount, onConfirm, loading,
}: {
  isOpen:        boolean;
  onClose:       () => void;
  classId:       string;
  className:     string;
  studentCount:  number;
  onConfirm:     (year: number) => void;
  loading:       boolean;
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (year < 2000 || year > 2100) {
      setError("Enter a valid year between 2000 and 2100.");
      return;
    }
    setError(null);
    onConfirm(year);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Graduate class"
      subtitle={`Move all students in ${className} to Alumni`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={handleConfirm}>
            🎓 Confirm graduation
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* What will happen */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-semibold text-amber-800 mb-2">What will happen:</p>
          <ul className="text-xs text-amber-700 flex flex-col gap-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              {studentCount} active student{studentCount !== 1 ? "s" : ""} will be moved to the Alumni class
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              They will be marked as graduated and hidden from active lists
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              All their scores, reports and attendance remain accessible
            </li>
          </ul>
        </div>

        {/* Year input */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wide">
            Graduation year <span className="text-error">*</span>
          </label>
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setError(null); }}
            className="w-full h-10 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 font-mono text-lg"
          />
          {error && (
            <p className="text-xs text-error mt-1.5 flex items-center gap-1">
              <AlertCircle size={11} /> {error}
            </p>
          )}
          <p className="text-xs text-text-muted mt-1.5">
            Students will be recorded as the <strong>Class of {year}</strong>.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function StudentsPage() {
  const [addModal,        setAddModal       ] = useState(false);
  const [importModal,     setImportModal    ] = useState(false);
  const [graduateModal,   setGraduateModal  ] = useState(false);
  const [activeStudent,   setActiveStudent  ] = useState<Student | null>(null);
  const [search,       setSearch      ] = useState("");
  const [classFilter,  setClassFilter ] = useState("");

  const schoolId = useAuthStore((s) => s.schoolId);
  const { can }  = usePermission();
  const readOnly = !can.manageStudents;

  const { data: subscription } = useActiveSubscription();
  const studentLimit = subscription?.plan?.studentLimit ?? null;

  const { data: classes  = [] }                   = useClasses();
  const createStudent = useCreateStudent();
  const graduateClass = useGraduateClass();

  const selectedClass = classes.find((c) => c.id === classFilter);
  const isAlumniClass = selectedClass?.name === "Alumni";

  const { data: students = [], isLoading, error } = useStudents(
    classFilter || undefined,
    isAlumniClass,
  );

  const isAtLimit = studentLimit !== null && students.length >= studentLimit;

  const form = useForm<StudentForm>({ resolver: zodResolver(studentSchema) as any });

  async function onAddSubmit(data: StudentForm) {
    await createStudent.mutateAsync({ ...data, schoolId: schoolId! } as any);
    form.reset();
    setAddModal(false);
  }

  const filtered = students.filter((s) => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    return !search ||
      name.includes(search.toLowerCase()) ||
      (s.admissionNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.parentName ?? "").toLowerCase().includes(search.toLowerCase());
  });

  const PAGE_SIZE                   = 20;
  const [page, setPage]             = useState(1);
  const totalPages                  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated                   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when search or filter changes
  useEffect(() => { setPage(1); }, [search, classFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="h-96 bg-surface-tertiary rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-error text-sm">
        Failed to load students.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {readOnly && <ReadOnlyBanner message="Only admins can add or edit students." />}

        <PageHeader
          title="Students"
          subtitle={`${students.length} students enrolled`}
          action={
            <div className="flex items-center gap-2">
              {/* Print class list — visible to all when a class is selected */}
              {classFilter && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    try {
                      const params = new URLSearchParams({
                        classId:   classFilter,
                        schoolId:  schoolId!,
                        className: selectedClass?.name ?? "Class",
                      });
                      const base = process.env.NEXT_PUBLIC_API_URL
                        ?? "https://school-mgt-server.vercel.app/api/v1";
                      const token = document.cookie
                        .split("; ")
                        .find((c) => c.startsWith("rr_access="))
                        ?.split("=")[1];
                      const res = await fetch(
                        `${base}/students/export/class-list?${params.toString()}`,
                        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
                      );
                      if (!res.ok) throw new Error("Failed");
                      const blob = await res.blob();
                      const url  = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href     = url;
                      link.download = `students_${selectedClass?.name ?? "class"}.pdf`;
                      link.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      alert("Failed to generate class list. Please try again.");
                    }
                  }}
                >
                  <Printer size={14} />
                  Print class list
                </Button>
              )}

              {!readOnly && (
                <>
                  {classFilter && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setGraduateModal(true)}
                    >
                      🎓 Graduate class
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    title={isAtLimit ? `Student limit of ${studentLimit} reached — upgrade to add more` : undefined}
                    onClick={() => {
                      if (isAtLimit) {
                        alert(`You've reached your plan limit of ${studentLimit} students.\nUpgrade your subscription to add more.`);
                        return;
                      }
                      setImportModal(true);
                    }}
                  >
                    <Upload size={14} />
                    Import from spreadsheet
                  </Button>
                  <Button
                    size="sm"
                    disabled={!!isAtLimit}
                    title={isAtLimit ? `Student limit of ${studentLimit} reached — upgrade to add more` : undefined}
                    onClick={() => !isAtLimit && setAddModal(true)}
                  >
                    <Plus size={14} />
                    {isAtLimit ? "Limit reached" : "Add student"}
                  </Button>
                </>
              )}
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total enrolled", value: students.length },
            { label: "Active",         value: students.filter((s) => s.isActive).length },
            { label: "Male",           value: students.filter((s) => s.gender === "male").length },
            { label: "Female",         value: students.filter((s) => s.gender === "female").length },
          ].map((stat) => (
            <Card key={stat.label} padding="sm">
              <p className="text-xs text-text-muted mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-text-primary">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card padding="none">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                placeholder="Search by name, admission number or parent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600 placeholder:text-text-muted"
              />
            </div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {(search || classFilter) && (
              <button
                onClick={() => { setSearch(""); setClassFilter(""); }}
                className="text-xs text-text-muted hover:text-text-primary cursor-pointer"
              >
                Clear
              </button>
            )}
            <span className="text-xs text-text-muted ml-auto">
              {filtered.length} of {students.length}
            </span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={search || classFilter ? "No students match" : "No students yet"}
              description={
                search || classFilter
                  ? "Try adjusting your search or filter."
                  : "Add your first student manually or import from a spreadsheet."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    {["Student","Class","Gender","Parent / Guardian","Status",""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((student, i) => {
                    const isActive = activeStudent?.id === student.id;
                    return (
                      <tr
                        key={student.id}
                        onClick={() => setActiveStudent(isActive ? null : student)}
                        className={classNames(
                          "border-b border-border last:border-0 cursor-pointer transition-colors",
                          isActive ? "bg-navy-50" : i % 2 === 0 ? "" : "bg-surface-secondary",
                          "hover:bg-navy-50",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold text-navy-600">
                                {student.firstName[0]}{student.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-xs text-text-muted">{student.admissionNumber ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{student.class?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-text-secondary capitalize">{student.gender ?? "—"}</td>
                        <td className="px-4 py-3">
                          <p className="text-text-primary">{student.parentName ?? "—"}</p>
                          <p className="text-xs text-text-muted">{student.parentPhone ?? ""}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={student.isActive ? "Active" : "Inactive"} variant={student.isActive ? "success" : "default"} />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveStudent(isActive ? null : student); }}
                            className={classNames(
                              "flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer",
                              isActive ? "text-navy-600" : "text-text-muted hover:text-navy-600",
                            )}
                          >
                            {isActive ? <X size={13} /> : <Eye size={13} />}
                            {isActive ? "Close" : "View"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-text-muted">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} students
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary cursor-pointer"
                >
                  «
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary cursor-pointer"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-text-muted">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={classNames(
                          "px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer",
                          page === p
                            ? "bg-navy-600 text-white border-navy-600 font-semibold"
                            : "border-border hover:bg-surface-secondary text-text-primary",
                        )}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary cursor-pointer"
                >
                  ›
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary cursor-pointer"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Student slide-over */}
      {activeStudent && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-surface border-l border-border shadow-xl flex flex-col">
          <StudentPanel
            student={activeStudent}
            onClose={() => setActiveStudent(null)}
            classes={classes}
            readOnly={readOnly}
          />
        </div>
      )}

      {/* Add Student Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => { setAddModal(false); form.reset(); }}
        title="Add student"
        subtitle="Fill in the student's details — required fields are marked *"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAddModal(false); form.reset(); }}>Cancel</Button>
            <Button loading={createStudent.isPending} onClick={form.handleSubmit(onAddSubmit)}>
              Save student
            </Button>
          </>
        }
      >
        {createStudent.error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-error-light border border-error rounded text-sm text-error">
            <AlertCircle size={14} className="shrink-0" />
            {(createStudent.error as Error).message}
          </div>
        )}
        <StudentFormFields
          register={form.register}
          errors={form.formState.errors}
          classes={classes}
        />
      </Modal>

      {/* Import Modal */}
      <ImportModal isOpen={importModal} onClose={() => setImportModal(false)} classes={classes} />

      {/* Graduate Modal */}
      <GraduateModal
        isOpen={graduateModal}
        onClose={() => setGraduateModal(false)}
        classId={classFilter}
        className={selectedClass?.name ?? ""}
        studentCount={students.filter(s => s.isActive !== false).length}
        onConfirm={(year) => {
          graduateClass.mutate(
            { classId: classFilter, graduationYear: year },
            { onSuccess: () => setGraduateModal(false) },
          );
        }}
        loading={graduateClass.isPending}
      />
    </>
  );
}