import type {
  User, School, StaffMember, DutyAssignment, Student,
  Class, Subject, Result, Payment, FeeCategory,
  ReminderConfig, Message, DashboardMetrics, GradeScale,
  TermConfig, SchoolSettings,
} from "@/types";

export const mockUser: User = {
  id: "usr_001",
  email: "admin@greenfield.edu.ng",
  firstName: "Amaka",
  lastName: "Okonkwo",
  role: "admin",
  schoolId: "sch_001",
  createdAt: "2024-01-15T08:00:00Z",
  lastLoginAt: "2025-06-27T07:45:00Z",
};

export const mockSchool: School = {
  id: "sch_001",
  name: "Greenfield Academy",
  address: "14 Ahmadu Bello Way, Abuja, FCT",
  phone: "+234 803 000 1234",
  email: "info@greenfield.edu.ng",
  currentTerm: "Third Term",
  currentSession: "2024/2025",
  createdAt: "2024-01-15T08:00:00Z",
};

export const mockStaff: StaffMember[] = [
  {
    id: "stf_001", firstName: "Chukwuemeka", lastName: "Adeyemi",
    email: "c.adeyemi@greenfield.edu.ng", phone: "+234 803 111 2233",
    role: "teacher", subject: "Mathematics", classAssigned: "JSS 3A",
    status: "active", joinDate: "2022-09-01",
  },
  {
    id: "stf_002", firstName: "Ngozi", lastName: "Okafor",
    email: "n.okafor@greenfield.edu.ng", phone: "+234 803 222 3344",
    role: "teacher", subject: "English Language", classAssigned: "SSS 2B",
    status: "active", joinDate: "2021-01-10",
  },
  {
    id: "stf_003", firstName: "Babatunde", lastName: "Fashola",
    email: "b.fashola@greenfield.edu.ng", phone: "+234 803 333 4455",
    role: "teacher", subject: "Physics", classAssigned: "SSS 3A",
    status: "active", joinDate: "2023-01-05",
  },
  {
    id: "stf_004", firstName: "Fatima", lastName: "Aliyu",
    email: "f.aliyu@greenfield.edu.ng", phone: "+234 803 444 5566",
    role: "accountant", status: "active", joinDate: "2022-03-15",
  },
  {
    id: "stf_005", firstName: "Emeka", lastName: "Nwosu",
    email: "e.nwosu@greenfield.edu.ng", phone: "+234 803 555 6677",
    role: "teacher", subject: "Biology", classAssigned: "SSS 1A",
    status: "inactive", joinDate: "2020-09-01",
  },
];

export const mockDutyAssignments: DutyAssignment[] = [
  {
    id: "duty_001", staffId: "stf_001", staffName: "Chukwuemeka Adeyemi",
    dutyType: "morning_assembly", location: "School Hall",
    dayOfWeek: "monday", startTime: "07:30", endTime: "08:00",
    term: "Third Term", session: "2024/2025",
  },
  {
    id: "duty_002", staffId: "stf_002", staffName: "Ngozi Okafor",
    dutyType: "gate_duty", location: "Main Gate",
    dayOfWeek: "tuesday", startTime: "07:00", endTime: "07:45",
    term: "Third Term", session: "2024/2025",
  },
  {
    id: "duty_003", staffId: "stf_003", staffName: "Babatunde Fashola",
    dutyType: "exam_supervision", location: "Block A Hall",
    dayOfWeek: "wednesday", startTime: "09:00", endTime: "12:00",
    term: "Third Term", session: "2024/2025",
  },
  {
    id: "duty_004", staffId: "stf_001", staffName: "Chukwuemeka Adeyemi",
    dutyType: "cafeteria", location: "Cafeteria",
    dayOfWeek: "thursday", startTime: "12:00", endTime: "13:00",
    term: "Third Term", session: "2024/2025",
  },
  {
    id: "duty_005", staffId: "stf_002", staffName: "Ngozi Okafor",
    dutyType: "library", location: "School Library",
    dayOfWeek: "friday", startTime: "14:00", endTime: "15:00",
    term: "Third Term", session: "2024/2025",
  },
];

export const mockClasses: Class[] = [
  {
    id: "cls_001", name: "JSS 1", level: 1, studentCount: 120,
    formTeacherId: "stf_001", formTeacherName: "Chukwuemeka Adeyemi",
    sections: [
      { id: "sec_001", classId: "cls_001", name: "JSS 1A", studentCount: 40, formTeacherId: "stf_001", formTeacherName: "Chukwuemeka Adeyemi" },
      { id: "sec_002", classId: "cls_001", name: "JSS 1B", studentCount: 40 },
      { id: "sec_003", classId: "cls_001", name: "JSS 1C", studentCount: 40 },
    ],
  },
  {
    id: "cls_002", name: "JSS 2", level: 2, studentCount: 115,
    sections: [
      { id: "sec_004", classId: "cls_002", name: "JSS 2A", studentCount: 38 },
      { id: "sec_005", classId: "cls_002", name: "JSS 2B", studentCount: 38, formTeacherId: "stf_002", formTeacherName: "Ngozi Okafor" },
      { id: "sec_006", classId: "cls_002", name: "JSS 2C", studentCount: 39 },
    ],
  },
  {
    id: "cls_003", name: "JSS 3", level: 3, studentCount: 108,
    sections: [
      { id: "sec_007", classId: "cls_003", name: "JSS 3A", studentCount: 36 },
      { id: "sec_008", classId: "cls_003", name: "JSS 3B", studentCount: 36 },
      { id: "sec_009", classId: "cls_003", name: "JSS 3C", studentCount: 36 },
    ],
  },
  {
    id: "cls_004", name: "SSS 1", level: 4, studentCount: 98,
    formTeacherId: "stf_005", formTeacherName: "Emeka Nwosu",
    sections: [
      { id: "sec_010", classId: "cls_004", name: "SSS 1A", studentCount: 49, formTeacherId: "stf_005", formTeacherName: "Emeka Nwosu" },
      { id: "sec_011", classId: "cls_004", name: "SSS 1B", studentCount: 49 },
    ],
  },
  {
    id: "cls_005", name: "SSS 2", level: 5, studentCount: 90,
    sections: [
      { id: "sec_012", classId: "cls_005", name: "SSS 2A", studentCount: 45 },
      { id: "sec_013", classId: "cls_005", name: "SSS 2B", studentCount: 45 },
    ],
  },
  {
    id: "cls_006", name: "SSS 3", level: 6, studentCount: 85,
    formTeacherId: "stf_003", formTeacherName: "Babatunde Fashola",
    sections: [
      { id: "sec_014", classId: "cls_006", name: "SSS 3A", studentCount: 42, formTeacherId: "stf_003", formTeacherName: "Babatunde Fashola" },
      { id: "sec_015", classId: "cls_006", name: "SSS 3B", studentCount: 43 },
    ],
  },
];

export const mockStudents: Student[] = [
  {
    id: "stu_001", firstName: "Chidera", lastName: "Eze",
    admissionNumber: "GFA/2022/001", classId: "cls_004", className: "SSS 1",
    sectionId: "sec_010", sectionName: "SSS 1A",
    gender: "female", dateOfBirth: "2009-03-14",
    parentName: "Mr. Eze Chukwudi", parentPhone: "+234 803 100 2001",
    parentEmail: "eze.chukwudi@gmail.com", address: "5 Wuse Zone 3, Abuja",
    status: "active", admissionDate: "2022-09-05",
  },
  {
    id: "stu_002", firstName: "Abubakar", lastName: "Musa",
    admissionNumber: "GFA/2022/002", classId: "cls_004", className: "SSS 1",
    sectionId: "sec_010", sectionName: "SSS 1A",
    gender: "male", dateOfBirth: "2009-07-22",
    parentName: "Alhaji Musa Garba", parentPhone: "+234 803 100 2002",
    parentEmail: "musa.garba@yahoo.com", address: "22 Garki Area 1, Abuja",
    status: "active", admissionDate: "2022-09-05",
  },
  {
    id: "stu_003", firstName: "Toluwani", lastName: "Adebayo",
    admissionNumber: "GFA/2021/018", classId: "cls_005", className: "SSS 2",
    sectionId: "sec_012", sectionName: "SSS 2A",
    gender: "female", dateOfBirth: "2008-11-03",
    parentName: "Mrs. Adebayo Folake", parentPhone: "+234 803 100 2003",
    parentEmail: "adebayo.folake@gmail.com", address: "9 Maitama, Abuja",
    status: "active", admissionDate: "2021-09-06",
  },
  {
    id: "stu_004", firstName: "Emeka", lastName: "Obiora",
    admissionNumber: "GFA/2020/007", classId: "cls_006", className: "SSS 3",
    sectionId: "sec_014", sectionName: "SSS 3A",
    gender: "male", dateOfBirth: "2007-05-17",
    parentName: "Chief Obiora Emmanuel", parentPhone: "+234 803 100 2004",
    parentEmail: "obiora.chief@gmail.com", address: "3 Asokoro, Abuja",
    status: "active", admissionDate: "2020-09-07",
  },
  {
    id: "stu_005", firstName: "Zainab", lastName: "Ibrahim",
    admissionNumber: "GFA/2023/031", classId: "cls_003", className: "JSS 3",
    sectionId: "sec_007", sectionName: "JSS 3A",
    gender: "female", dateOfBirth: "2010-01-28",
    parentName: "Mallam Ibrahim Sule", parentPhone: "+234 803 100 2005",
    parentEmail: "ibrahim.sule@gmail.com", address: "17 Kubwa, Abuja",
    status: "active", admissionDate: "2023-09-04",
  },
];

export const mockSubjects: Subject[] = [
  { id: "sub_001", name: "Mathematics", code: "MTH", classIds: ["cls_001", "cls_002", "cls_003", "cls_004", "cls_005", "cls_006"], teacherId: "stf_001", teacherName: "Chukwuemeka Adeyemi" },
  { id: "sub_002", name: "English Language", code: "ENG", classIds: ["cls_001", "cls_002", "cls_003", "cls_004", "cls_005", "cls_006"], teacherId: "stf_002", teacherName: "Ngozi Okafor" },
  { id: "sub_003", name: "Physics", code: "PHY", classIds: ["cls_004", "cls_005", "cls_006"], teacherId: "stf_003", teacherName: "Babatunde Fashola" },
  { id: "sub_004", name: "Biology", code: "BIO", classIds: ["cls_004", "cls_005", "cls_006"], teacherId: "stf_005", teacherName: "Emeka Nwosu" },
  { id: "sub_005", name: "Basic Science", code: "BSC", classIds: ["cls_001", "cls_002", "cls_003"] },
  { id: "sub_006", name: "Social Studies", code: "SST", classIds: ["cls_001", "cls_002", "cls_003"] },
  { id: "sub_007", name: "Chemistry", code: "CHM", classIds: ["cls_004", "cls_005", "cls_006"] },
  { id: "sub_008", name: "Economics", code: "ECO", classIds: ["cls_004", "cls_005", "cls_006"] },
];

export const mockResults: Result[] = [
  { id: "res_001", studentId: "stu_001", studentName: "Chidera Eze", admissionNumber: "GFA/2022/001", classId: "cls_004", className: "SSS 1", subjectId: "sub_001", subjectName: "Mathematics", ca: 28, exam: 62, total: 90, grade: "A1", remark: "Excellent", term: "Third Term", session: "2024/2025" },
  { id: "res_002", studentId: "stu_001", studentName: "Chidera Eze", admissionNumber: "GFA/2022/001", classId: "cls_004", className: "SSS 1", subjectId: "sub_002", subjectName: "English Language", ca: 25, exam: 58, total: 83, grade: "B2", remark: "Very Good", term: "Third Term", session: "2024/2025" },
  { id: "res_003", studentId: "stu_001", studentName: "Chidera Eze", admissionNumber: "GFA/2022/001", classId: "cls_004", className: "SSS 1", subjectId: "sub_003", subjectName: "Physics", ca: 22, exam: 54, total: 76, grade: "B3", remark: "Good", term: "Third Term", session: "2024/2025" },
  { id: "res_004", studentId: "stu_002", studentName: "Abubakar Musa", admissionNumber: "GFA/2022/002", classId: "cls_004", className: "SSS 1", subjectId: "sub_001", subjectName: "Mathematics", ca: 20, exam: 48, total: 68, grade: "C4", remark: "Credit", term: "Third Term", session: "2024/2025" },
  { id: "res_005", studentId: "stu_002", studentName: "Abubakar Musa", admissionNumber: "GFA/2022/002", classId: "cls_004", className: "SSS 1", subjectId: "sub_002", subjectName: "English Language", ca: 18, exam: 44, total: 62, grade: "C5", remark: "Credit", term: "Third Term", session: "2024/2025" },
];

export const mockFeeCategories: FeeCategory[] = [
  { id: "fee_001", name: "School Fees", amount: 45000, term: "Third Term", session: "2024/2025", classIds: ["cls_001", "cls_002", "cls_003"], dueDate: "2025-04-15" },
  { id: "fee_002", name: "School Fees", amount: 55000, term: "Third Term", session: "2024/2025", classIds: ["cls_004", "cls_005", "cls_006"], dueDate: "2025-04-15" },
  { id: "fee_003", name: "PTA Levy", amount: 5000, term: "Third Term", session: "2024/2025", classIds: ["cls_001", "cls_002", "cls_003", "cls_004", "cls_005", "cls_006"], dueDate: "2025-04-15" },
  { id: "fee_004", name: "Exam Levy", amount: 8000, term: "Third Term", session: "2024/2025", classIds: ["cls_004", "cls_005", "cls_006"], dueDate: "2025-05-01" },
];

export const mockPayments: Payment[] = [
  { id: "pay_001", studentId: "stu_001", studentName: "Chidera Eze", admissionNumber: "GFA/2022/001", className: "SSS 1", feeCategoryId: "fee_002", feeCategoryName: "School Fees", amountDue: 55000, amountPaid: 55000, balance: 0, status: "paid", method: "bank_transfer", paidAt: "2025-04-10T10:30:00Z", receiptNumber: "RCP-2025-0041", term: "Third Term", session: "2024/2025" },
  { id: "pay_002", studentId: "stu_002", studentName: "Abubakar Musa", admissionNumber: "GFA/2022/002", className: "SSS 1", feeCategoryId: "fee_002", feeCategoryName: "School Fees", amountDue: 55000, amountPaid: 30000, balance: 25000, status: "partial", method: "cash", paidAt: "2025-04-12T09:00:00Z", receiptNumber: "RCP-2025-0042", term: "Third Term", session: "2024/2025" },
  { id: "pay_003", studentId: "stu_003", studentName: "Toluwani Adebayo", admissionNumber: "GFA/2021/018", className: "SSS 2", feeCategoryId: "fee_002", feeCategoryName: "School Fees", amountDue: 55000, amountPaid: 0, balance: 55000, status: "unpaid", term: "Third Term", session: "2024/2025" },
  { id: "pay_004", studentId: "stu_004", studentName: "Emeka Obiora", admissionNumber: "GFA/2020/007", className: "SSS 3", feeCategoryId: "fee_002", feeCategoryName: "School Fees", amountDue: 55000, amountPaid: 55000, balance: 0, status: "paid", method: "pos", paidAt: "2025-04-08T14:00:00Z", receiptNumber: "RCP-2025-0039", term: "Third Term", session: "2024/2025" },
  { id: "pay_005", studentId: "stu_005", studentName: "Zainab Ibrahim", admissionNumber: "GFA/2023/031", className: "JSS 3", feeCategoryId: "fee_001", feeCategoryName: "School Fees", amountDue: 45000, amountPaid: 45000, balance: 0, status: "paid", method: "online", paidAt: "2025-04-09T11:15:00Z", receiptNumber: "RCP-2025-0040", term: "Third Term", session: "2024/2025" },
];

export const mockReminderConfigs: ReminderConfig[] = [
  { id: "rem_001", feeCategoryId: "fee_002", feeCategoryName: "School Fees (SSS)", channel: "both", triggerDaysBefore: 7, message: "Dear Parent, this is a reminder that school fees of ₦55,000 is due in 7 days. Please make payment to avoid disruption.", isActive: true },
  { id: "rem_002", feeCategoryId: "fee_001", feeCategoryName: "School Fees (JSS)", channel: "sms", triggerDaysBefore: 3, message: "Reminder: School fees payment is due in 3 days. Contact the bursar for payment details.", isActive: true },
  { id: "rem_003", feeCategoryId: "fee_004", feeCategoryName: "Exam Levy", channel: "email", triggerDaysBefore: 5, message: "Dear Parent, the exam levy of ₦8,000 is due in 5 days. Students with outstanding fees may not be allowed to sit exams.", isActive: false },
];

export const mockMessages: Message[] = [
  { id: "msg_001", subject: "Third Term Examination Timetable", body: "Dear Parents, please find attached the examination timetable for the Third Term 2024/2025. All students are expected to be punctual.", channel: "email", recipients: [{ type: "all" }], recipientCount: 616, status: "sent", sentAt: "2025-06-01T08:00:00Z", createdBy: "Amaka Okonkwo", createdAt: "2025-06-01T07:50:00Z" },
  { id: "msg_002", subject: "School Fees Reminder", body: "This is a reminder that school fees are due. Please ensure payment before the deadline.", channel: "sms", recipients: [{ type: "class", classId: "cls_006" }], recipientCount: 85, status: "sent", sentAt: "2025-06-10T09:00:00Z", createdBy: "Amaka Okonkwo", createdAt: "2025-06-10T08:55:00Z" },
  { id: "msg_003", subject: "PTA Meeting Notice", body: "A PTA meeting is scheduled for Saturday June 28, 2025 at 10am. All parents are required to attend.", channel: "push", recipients: [{ type: "all" }], recipientCount: 616, status: "scheduled", scheduledAt: "2025-06-25T08:00:00Z", createdBy: "Amaka Okonkwo", createdAt: "2025-06-20T10:00:00Z" },
];

export const mockDashboardMetrics: DashboardMetrics = {
  totalStudents: 616,
  totalStaff: 42,
  collectionRate: 74,
  pendingFees: 3850000,
  activeClasses: 6,
  recentPayments: mockPayments,
  attendanceSummary: { present: 558, absent: 38, late: 20, total: 616 },
  feeCollectionByMonth: [
    { month: "Jan", collected: 2100000, expected: 3200000 },
    { month: "Feb", collected: 2800000, expected: 3200000 },
    { month: "Mar", collected: 3000000, expected: 3200000 },
    { month: "Apr", collected: 2400000, expected: 3200000 },
    { month: "May", collected: 1900000, expected: 3200000 },
    { month: "Jun", collected: 1200000, expected: 3200000 },
  ],
};

export const mockGradeScales: GradeScale[] = [
  { id: "gs_001", label: "A1", minScore: 75, maxScore: 100, remark: "Excellent" },
  { id: "gs_002", label: "B2", minScore: 70, maxScore: 74, remark: "Very Good" },
  { id: "gs_003", label: "B3", minScore: 65, maxScore: 69, remark: "Good" },
  { id: "gs_004", label: "C4", minScore: 60, maxScore: 64, remark: "Credit" },
  { id: "gs_005", label: "C5", minScore: 55, maxScore: 59, remark: "Credit" },
  { id: "gs_006", label: "C6", minScore: 50, maxScore: 54, remark: "Credit" },
  { id: "gs_007", label: "D7", minScore: 45, maxScore: 49, remark: "Pass" },
  { id: "gs_008", label: "E8", minScore: 40, maxScore: 44, remark: "Pass" },
  { id: "gs_009", label: "F9", minScore: 0,  maxScore: 39, remark: "Fail" },
];

export const mockTermConfigs: TermConfig[] = [
  { id: "trm_001", name: "First Term",  session: "2024/2025", startDate: "2024-09-09", endDate: "2024-12-13", isCurrent: false },
  { id: "trm_002", name: "Second Term", session: "2024/2025", startDate: "2025-01-13", endDate: "2025-04-04", isCurrent: false },
  { id: "trm_003", name: "Third Term",  session: "2024/2025", startDate: "2025-04-28", endDate: "2025-07-25", isCurrent: true },
];

export const mockSchoolSettings: SchoolSettings = {
  school: mockSchool,
  gradeScales: mockGradeScales,
  terms: mockTermConfigs,
  notificationPreferences: {
    emailOnPayment: true,
    smsOnPayment: true,
    emailOnResult: false,
    reminderLeadDays: 7,
  },
};