import { downloadCsv, downloadZip, slugify, toCsv, toTimestamp } from "./helpers";
import type {
  CourseSection,
  Enrollment,
  Institution,
  PaymentCode,
  Person,
  Publisher,
  ReportGroupBy,
  Template,
} from "./types";

export const REPORT_GROUP_OPTIONS: { value: ReportGroupBy; label: string }[] = [
  { value: "section", label: "Course sections" },
  { value: "template", label: "Templates" },
  { value: "institution", label: "Institutions" },
  { value: "publisher", label: "Publishers" },
];

export type ReportDownloadFormat = "combined" | "zip";

export interface ReportRow {
  id: string;
  name: string;
  subtitle?: string;
  templateName?: string;
  templateId?: string;
  institutionName?: string;
  institutionId?: string;
  publisherId?: string;
  publisherName?: string;
  instructorName?: string;
  validPaid: number;
  grace: number;
  unpaid: number;
  byCode: number;
  byCard: number;
  enrollments: Enrollment[];
}

export interface ReportingCatalog {
  people: Person[];
  templates: Template[];
  sections: CourseSection[];
  institutions: Institution[];
  publishers: Publisher[];
  codes: PaymentCode[];
}

export function parseReportGroup(value: string | null): ReportGroupBy {
  if (value === "template" || value === "institution" || value === "publisher" || value === "section") {
    return value;
  }
  return "section";
}

export function filterEnrollmentsByDate(
  enrollments: Enrollment[],
  after: string,
  before: string,
): Enrollment[] {
  const afterTime = after ? toTimestamp(after) : null;
  const beforeTime = before ? toTimestamp(before) : null;
  return enrollments.filter((enrollment) => {
    const time = toTimestamp(enrollment.enrolledAt);
    if (Number.isNaN(time)) return false;
    if (afterTime !== null && time < afterTime) return false;
    if (beforeTime !== null && time > beforeTime) return false;
    return true;
  });
}

function emptyMetrics() {
  return { validPaid: 0, grace: 0, unpaid: 0, byCode: 0, byCard: 0, enrollments: [] as Enrollment[] };
}

function addEnrollment(metrics: ReturnType<typeof emptyMetrics>, enrollment: Enrollment) {
  metrics.enrollments.push(enrollment);
  if (enrollment.status === "valid_paid") {
    metrics.validPaid += 1;
    if (enrollment.paymentMethod === "code") metrics.byCode += 1;
    if (enrollment.paymentMethod === "card") metrics.byCard += 1;
  } else if (enrollment.status === "grace") {
    metrics.grace += 1;
  } else {
    metrics.unpaid += 1;
  }
}

export function buildReportRows(
  enrollments: Enrollment[],
  groupBy: ReportGroupBy,
  catalog: ReportingCatalog,
): ReportRow[] {
  const groups = new Map<string, ReturnType<typeof emptyMetrics>>();

  enrollments.forEach((enrollment) => {
    const key =
      groupBy === "section"
        ? enrollment.sectionId
        : groupBy === "template"
          ? enrollment.templateId
          : groupBy === "institution"
            ? enrollment.institutionId
            : enrollment.publisherId;
    if (!key) return;
    const current = groups.get(key) ?? emptyMetrics();
    addEnrollment(current, enrollment);
    groups.set(key, current);
  });

  return [...groups.entries()].map(([id, metrics]) => {
    if (groupBy === "section") {
      const section = catalog.sections.find((item) => item.id === id);
      const template = catalog.templates.find((item) => item.id === section?.templateId);
      const institution = catalog.institutions.find((item) => item.id === section?.institutionId);
      const publisher = catalog.publishers.find((item) => item.id === template?.publisherId);
      const instructor = catalog.people.find((item) => item.id === section?.instructorId);
      return {
        id,
        name: section?.name ?? "Unknown section",
        subtitle: `ID: ${id}`,
        templateName: template?.name,
        templateId: template?.id,
        institutionName: institution?.name,
        institutionId: institution?.id,
        publisherId: publisher?.id,
        publisherName: publisher?.name,
        instructorName: instructor?.name,
        ...metrics,
      };
    }
    if (groupBy === "template") {
      const template = catalog.templates.find((item) => item.id === id);
      return {
        id,
        name: template?.name ?? "Unknown template",
        subtitle: `ID: ${id}`,
        ...metrics,
      };
    }
    if (groupBy === "institution") {
      const institution = catalog.institutions.find((item) => item.id === id);
      return {
        id,
        name: institution?.name ?? "Unknown institution",
        ...metrics,
      };
    }
    const publisher = catalog.publishers.find((item) => item.id === id);
    return {
      id,
      name: publisher?.name ?? "Unknown publisher",
      ...metrics,
    };
  });
}

export function sectionRowsFromReports(rows: ReportRow[], catalog: ReportingCatalog): ReportRow[] {
  return buildReportRows(
    rows.flatMap((row) => row.enrollments),
    "section",
    catalog,
  );
}

export function matchesReportQuery(row: ReportRow, query: string): boolean {
  if (query === "") return true;
  const haystack = [
    row.name,
    row.subtitle,
    row.templateName,
    row.templateId,
    row.institutionName,
    row.publisherName,
    row.instructorName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function pluralize(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function summarizeSelection(selectedRows: ReportRow[], visibleRows: ReportRow[]): string {
  const count = selectedRows.length;
  if (count === 0) return "";

  const selectedIds = new Set(selectedRows.map((row) => row.id));
  const selectedTemplateIds = [...new Set(selectedRows.map((row) => row.templateId).filter(Boolean))];
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id));

  function allVisibleMatching(
    predicate: (row: ReportRow) => boolean,
    name: string | undefined,
  ): string | null {
    if (!name) return null;
    const matching = visibleRows.filter(predicate);
    if (matching.length === 0 || matching.length !== count) return null;
    if (!matching.every((row) => selectedIds.has(row.id))) return null;
    return `Includes all ${pluralize(count, "section")} in ${name}`;
  }

  if (selectedTemplateIds.length === 1) {
    const templateId = selectedTemplateIds[0];
    const templateName = selectedRows[0]?.templateName ?? "this template";
    const complete = allVisibleMatching((row) => row.templateId === templateId, templateName);
    if (complete) return complete;
    return `Includes ${pluralize(count, "section")} in ${templateName}`;
  }

  const institutionId = selectedRows[0]?.institutionId;
  const sameInstitution = Boolean(institutionId) && selectedRows.every((row) => row.institutionId === institutionId);
  if (sameInstitution) {
    const complete = allVisibleMatching(
      (row) => row.institutionId === institutionId,
      selectedRows[0]?.institutionName,
    );
    if (complete) return complete;
  }

  const publisherId = selectedRows[0]?.publisherId;
  const samePublisher = Boolean(publisherId) && selectedRows.every((row) => row.publisherId === publisherId);
  if (samePublisher) {
    const complete = allVisibleMatching(
      (row) => row.publisherId === publisherId,
      selectedRows[0]?.publisherName,
    );
    if (complete) return complete;
  }

  if (allVisibleSelected) {
    return `Includes all ${pluralize(count, "section")}`;
  }

  return `Includes ${pluralize(count, "section")} across ${pluralize(selectedTemplateIds.length, "template")}`;
}

const EMPTY_CELL = "--";

function display(value: string | undefined): string {
  return value?.trim() ? value : EMPTY_CELL;
}

function enrollmentStatusLabel(status: Enrollment["status"]): string {
  if (status === "valid_paid") return "Paid";
  if (status === "grace") return "Grace";
  return "Unpaid";
}

function paymentStatusLabel(enrollment: Enrollment): string {
  if (enrollment.paymentStatus === "bypassed") return "Bypassed";
  if (enrollment.paymentStatus === "complete") return "Complete";
  if (enrollment.paymentStatus === "paid") return "Paid";
  return EMPTY_CELL;
}

function bypassedLabel(enrollment: Enrollment): string {
  if (enrollment.paymentStatus === "bypassed") return "Yes";
  if (enrollment.status === "valid_paid") return "No";
  return EMPTY_CELL;
}

function methodLabel(enrollment: Enrollment): string {
  if (enrollment.paymentMethod === "code") return "Code";
  if (enrollment.paymentMethod === "card") return "Card";
  return EMPTY_CELL;
}

function paymentDateLabel(enrollment: Enrollment): string {
  const value = enrollment.paidAt ?? (enrollment.paymentStatus ? enrollment.enrolledAt : "");
  if (!value) return EMPTY_CELL;
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return EMPTY_CELL;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function enrollmentCsvRows(
  enrollments: Enrollment[],
  catalog: ReportingCatalog,
  groupBy: ReportGroupBy = "section",
): string[][] {
  const person = (id: string) => catalog.people.find((item) => item.id === id);
  const personName = (id: string) => person(id)?.name ?? "";
  const personEmail = (id: string) => person(id)?.email ?? "";
  const section = (id: string) => catalog.sections.find((item) => item.id === id);
  const sectionName = (id: string) => section(id)?.name ?? "";
  const instructorName = (id: string) => {
    const instructorId = section(id)?.instructorId;
    return instructorId ? personName(instructorId) : "";
  };
  const templateName = (id: string) => catalog.templates.find((item) => item.id === id)?.name ?? "";
  const institutionName = (id: string) => catalog.institutions.find((item) => item.id === id)?.name ?? "";
  const codeValue = (id?: string) => catalog.codes.find((item) => item.id === id)?.code ?? "";

  const uniqueSectionCount = new Set(enrollments.map((item) => item.sectionId)).size;
  const includeContext = groupBy !== "section" || uniqueSectionCount > 1;
  const includeTemplate = groupBy === "publisher" || (groupBy === "section" && uniqueSectionCount > 1);

  const headers = [
    "Student name",
    "Student email",
    "Enrollment status",
    "Payment status",
    "Bypassed",
    "Payment date",
    "Payment method",
    "Payment code",
    "Payment reference",
  ];
  if (includeTemplate) {
    headers.push("Template", "Template ID");
  }
  if (includeContext) {
    headers.push("Course section", "Section ID", "Instructor(s)", "Institution");
  }

  const sorted = [...enrollments].sort((a, b) => toTimestamp(a.enrolledAt) - toTimestamp(b.enrolledAt));

  return [
    headers,
    ...sorted.map((enrollment) => {
      const row = [
        display(personName(enrollment.studentId)),
        display(personEmail(enrollment.studentId)),
        enrollmentStatusLabel(enrollment.status),
        paymentStatusLabel(enrollment),
        bypassedLabel(enrollment),
        paymentDateLabel(enrollment),
        methodLabel(enrollment),
        display(codeValue(enrollment.codeId)),
        display(enrollment.paymentReference),
      ];
      if (includeTemplate) {
        row.push(display(templateName(enrollment.templateId)), display(enrollment.templateId));
      }
      if (includeContext) {
        row.push(
          display(sectionName(enrollment.sectionId)),
          display(enrollment.sectionId),
          display(instructorName(enrollment.sectionId)),
          display(institutionName(enrollment.institutionId)),
        );
      }
      return row;
    }),
  ];
}

export function downloadReport(
  filename: string,
  enrollments: Enrollment[],
  catalog: ReportingCatalog,
  groupBy: ReportGroupBy = "section",
) {
  downloadCsv(filename, enrollmentCsvRows(enrollments, catalog, groupBy));
}

export function reportFilename(rows: ReportRow[], combined: boolean): string {
  if (!combined && rows.length === 1) {
    return `enrollment-report-${slugify(rows[0].name) || rows[0].id}.csv`;
  }
  if (combined) {
    return "enrollment-report-combined.csv";
  }
  return "enrollment-report-all.csv";
}

function uniqueReportFilenames(rows: ReportRow[]): { row: ReportRow; name: string }[] {
  const used = new Set<string>();
  return rows.map((row) => {
    let name = reportFilename([row], false);
    if (used.has(name)) {
      name = `enrollment-report-${slugify(row.name) || "section"}-${row.id}.csv`;
    }
    used.add(name);
    return { row, name };
  });
}

export function downloadSelectedReports(
  rows: ReportRow[],
  format: ReportDownloadFormat,
  catalog: ReportingCatalog,
  groupBy: ReportGroupBy = "section",
) {
  const sectionRows = sectionRowsFromReports(rows, catalog);
  if (format === "zip") {
    downloadZip(
      "enrollment-reports.zip",
      uniqueReportFilenames(sectionRows).map(({ row, name }) => ({
        name,
        content: toCsv(enrollmentCsvRows(row.enrollments, catalog, "section")),
      })),
    );
    return;
  }

  downloadReport(
    reportFilename(rows, rows.length !== 1),
    rows.flatMap((row) => row.enrollments),
    catalog,
    groupBy,
  );
}
