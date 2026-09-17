export type BatchStatus = "active" | "deactivated";
export type CodeStatus = "unused" | "redeemed" | "deactivated";
export type EnrollmentStatus = "valid_paid" | "grace" | "unpaid";
export type PaymentMethod = "code" | "card";
export type ReportGroupBy = "section" | "template" | "institution" | "publisher";

export interface Person {
  id: string;
  name: string;
  initials: string;
}

export interface Institution {
  id: string;
  name: string;
}

export interface Publisher {
  id: string;
  name: string;
}

export interface Template {
  id: string;
  name: string;
  publisherId: string;
}

export interface CourseSection {
  id: string;
  name: string;
  templateId: string;
  institutionId: string;
}

export interface PaymentBatch {
  id: string;
  templateId: string;
  name: string;
  createdAt: string;
  createdById: string;
  status: BatchStatus;
}

export interface PaymentCode {
  id: string;
  batchId: string;
  code: string;
  status: CodeStatus;
  createdAt: string;
  createdById: string;
  redeemedById?: string;
  redeemedAt?: string;
  redeemedForSectionId?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  sectionId: string;
  templateId: string;
  institutionId: string;
  publisherId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  paymentMethod?: PaymentMethod;
  codeId?: string;
}

export interface PaymentsState {
  people: Person[];
  institutions: Institution[];
  publishers: Publisher[];
  templates: Template[];
  sections: CourseSection[];
  batches: PaymentBatch[];
  codes: PaymentCode[];
  enrollments: Enrollment[];
}

export type SortDirection = "asc" | "desc";
