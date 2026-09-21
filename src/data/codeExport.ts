import { downloadCsvOrZip, formatDate, slugify } from "./helpers";
import type { ReportDownloadFormat } from "./reporting";
import type { CourseSection, PaymentBatch, PaymentCode, Template } from "./types";

export const PAYMENT_CODE_EXPORT_HEADERS = [
  "Batch name",
  "Template",
  "Batch status",
  "Payment code",
  "Code status",
  "Created",
  "Created by",
  "Redeemed by",
  "Redeemed at",
  "Redeemed for",
];

export interface CodeExportCatalog {
  templates: Template[];
  people: { id: string; name: string }[];
  sections: CourseSection[];
}

export function codeStatusLabel(status: PaymentCode["status"]): string {
  if (status === "unused") return "Unused";
  if (status === "redeemed") return "Redeemed";
  return "Deactivated";
}

function personName(people: { id: string; name: string }[], id?: string) {
  if (!id) return "";
  return people.find((person) => person.id === id)?.name ?? "Unknown";
}

export function paymentCodeExportRow(
  code: PaymentCode,
  batch: PaymentBatch | undefined,
  catalog: CodeExportCatalog,
): string[] {
  return [
    batch?.name ?? "",
    catalog.templates.find((item) => item.id === batch?.templateId)?.name ?? "",
    batch?.status === "deactivated" ? "Deactivated" : batch ? "Active" : "",
    code.code,
    codeStatusLabel(code.status),
    formatDate(code.createdAt),
    personName(catalog.people, code.createdById),
    personName(catalog.people, code.redeemedById) || "--",
    code.redeemedAt ? formatDate(code.redeemedAt) : "",
    catalog.sections.find((section) => section.id === code.redeemedForSectionId)?.name ?? "--",
  ];
}

export function codesInBatches(codes: PaymentCode[], batches: PaymentBatch[]): PaymentCode[] {
  const ids = new Set(batches.map((batch) => batch.id));
  return codes.filter((code) => ids.has(code.batchId));
}

function sortCodes(codes: PaymentCode[]): PaymentCode[] {
  return [...codes].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.code.localeCompare(b.code);
  });
}

export function downloadCodesForBatches(
  format: ReportDownloadFormat,
  batches: PaymentBatch[],
  codes: PaymentCode[],
  catalog: CodeExportCatalog,
  filenames: { combinedFilename: string; zipFilename: string },
) {
  downloadCsvOrZip(format, {
    combinedFilename: filenames.combinedFilename,
    zipFilename: filenames.zipFilename,
    headers: PAYMENT_CODE_EXPORT_HEADERS,
    items: batches.map((batch) => ({
      filename: slugify(batch.name) || batch.id,
      rows: sortCodes(codes.filter((code) => code.batchId === batch.id)).map((code) =>
        paymentCodeExportRow(code, batch, catalog),
      ),
    })),
  });
}

export function batchCodeDownloadSummary(
  batches: PaymentBatch[],
  codeCount: number,
  scope: "selected" | "all",
): string {
  const codeNoun = codeCount === 1 ? "code" : "codes";
  if (batches.length === 1) {
    return `Includes all ${codeCount} payment ${codeNoun} from ${batches[0].name}.`;
  }
  if (scope === "all") {
    return `Includes all ${codeCount} payment ${codeNoun} from ${batches.length} batches currently in view.`;
  }
  return `Includes all ${codeCount} payment ${codeNoun} from ${batches.length} selected batches.`;
}

export function batchCodeDownloadToast(
  format: ReportDownloadFormat,
  batchCount: number,
  codeCount: number,
): string {
  const batchNoun = batchCount === 1 ? "batch" : "batches";
  const codeNoun = codeCount === 1 ? "code" : "codes";
  if (format === "zip") {
    return `Downloaded ${batchCount} ${batchNoun} as separate files (${codeCount} payment ${codeNoun}).`;
  }
  return `Downloaded all ${codeCount} payment ${codeNoun} from ${batchCount} ${batchNoun}.`;
}
