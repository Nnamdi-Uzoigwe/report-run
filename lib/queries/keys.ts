

export const keys = {
  // Auth
  me: ["me"] as const,

  // School
  school: {
    detail: (schoolId: string) => ["school", schoolId] as const,
  },

  // Subscriptions
  plans:        ["plans"] as const,
  subscription: {
    active:  (schoolId: string) => ["subscription", "active",  schoolId] as const,
    history: (schoolId: string) => ["subscription", "history", schoolId] as const,
  },

  // Users / Staff
  users: {
    school: (schoolId: string) => ["users", "school", schoolId] as const,
  },

  // Staff assignments
  assignments: {
    byClass: (classId: string) => ["assignments", "class", classId] as const,
    byUser:  (userId: string)  => ["assignments", "user",  userId]  as const,
  },

  // Classes
  classes: {
    all: (schoolId: string) => ["classes", schoolId] as const,
  },

  // Subjects
  subjects: {
    byClass: (classId: string) => ["subjects", "class", classId] as const,
  },

  // Grading
  grading: {
    all: (schoolId: string) => ["grading", schoolId] as const,
  },

  // Students
  students: {
    all:    (schoolId: string, classId?: string) =>
      classId ? ["students", schoolId, classId] as const
              : ["students", schoolId]          as const,
    detail: (studentId: string) => ["student", studentId] as const,
  },

  // Attendance
  attendance: {
    byClassAndDate: (classId: string, date: string) =>
      ["attendance", classId, date] as const,
    byStudent: (studentId: string, from: string, to: string) =>
      ["attendance", "student", studentId, from, to] as const,
  },

  // Scores
  scores: {
    bySubject: (subjectId: string, term: string, year: string) =>
      ["scores", "subject", subjectId, term, year] as const,
    byStudent: (studentId: string, term: string, year: string) =>
      ["scores", "student", studentId, term, year] as const,
  },

  // Reports
  reports: {
    byClass: (classId: string, term: string, year: string) =>
      ["reports", classId, term, year] as const,
  },

  // Fees
  fees: {
    dashboard: (schoolId: string, termLabel?: string) =>
      termLabel
        ? ["fees", "dashboard", schoolId, termLabel] as const
        : ["fees", "dashboard", schoolId]            as const,
    invoices: (schoolId: string, status?: string, termLabel?: string) =>
      ["fees", "invoices", schoolId, status ?? "all", termLabel ?? "all"] as const,
    invoice:  (invoiceId: string) => ["fees", "invoice", invoiceId]  as const,
    payments: (invoiceId: string) => ["fees", "payments", invoiceId] as const,
    dunning:  (schoolId: string)  => ["fees", "dunning",  schoolId]  as const,
  },
} as const;