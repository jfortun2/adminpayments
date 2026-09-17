export type BatchStatus = "active" | "deactivated";
export type CodeStatus = "unused" | "redeemed" | "deactivated";

export interface Person {
  id: string;
  name: string;
  initials: string;
}

export interface Template {
  id: string;
  name: string;
}

export interface CourseSection {
  id: string;
  name: string;
  templateId: string;
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

export interface PaymentsState {
  people: Person[];
  templates: Template[];
  sections: CourseSection[];
  batches: PaymentBatch[];
  codes: PaymentCode[];
}

export type SortDirection = "asc" | "desc";
