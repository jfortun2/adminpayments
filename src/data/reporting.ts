import { downloadCsv, formatDateTime, slugify, toTimestamp } from "./helpers";
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
  { value: "section", label: "Course Section" },
  { value: "template", label: "Template" },
  { value: "institution", label: "Institution" },
  { value: "publisher", label: "Publisher" },
];

export interface ReportRow {
  id: string;
  name: string;
  subtitle?: string;
  templateName?: string;
  templateId?: string;
  institutionName?: string;
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
      return {
        id,
        name: section?.name ?? "Unknown section",
        subtitle: `ID: ${id}`,
        templateName: template?.name,
        templateId: template?.id,
        institutionName: institution?.name,
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

export function matchesReportQuery(row: ReportRow, query: string): boolean {
  if (query === "") return true;
  const haystack = [row.name, row.subtitle, row.templateName, row.templateId, row.institutionName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function statusLabel(status: Enrollment["status"]): string {
  if (status === "valid_paid") return "Valid paid";
  if (status === "grace") return "Grace";
  return "Unpaid";
}

function methodLabel(enrollment: Enrollment): string {
  if (enrollment.paymentMethod === "code") return "Code";
  if (enrollment.paymentMethod === "card") return "Card";
  return "";
}

export function enrollmentCsvRows(enrollments: Enrollment[], catalog: ReportingCatalog): string[][] {
  const personName = (id: string) => catalog.people.find((person) => person.id === id)?.name ?? "";
  const sectionName = (id: string) => catalog.sections.find((item) => item.id === id)?.name ?? "";
  const templateName = (id: string) => catalog.templates.find((item) => item.id === id)?.name ?? "";
  const institutionName = (id: string) => catalog.institutions.find((item) => item.id === id)?.name ?? "";
  const publisherName = (id: string) => catalog.publishers.find((item) => item.id === id)?.name ?? "";
  const codeValue = (id?: string) => catalog.codes.find((item) => item.id === id)?.code ?? "";

  const sorted = [...enrollments].sort((a, b) => toTimestamp(a.enrolledAt) - toTimestamp(b.enrolledAt));

  return [
    [
      "Student",
      "Course section",
      "Section ID",
      "Template",
      "Template ID",
      "Institution",
      "Publisher",
      "Status",
      "Payment method",
      "Enrolled at",
      "Payment code",
    ],
    ...sorted.map((enrollment) => [
      personName(enrollment.studentId),
      sectionName(enrollment.sectionId),
      enrollment.sectionId,
      templateName(enrollment.templateId),
      enrollment.templateId,
      institutionName(enrollment.institutionId),
      publisherName(enrollment.publisherId),
      statusLabel(enrollment.status),
      methodLabel(enrollment),
      formatDateTime(enrollment.enrolledAt),
      codeValue(enrollment.codeId),
    ]),
  ];
}

export function downloadReport(filename: string, enrollments: Enrollment[], catalog: ReportingCatalog) {
  downloadCsv(filename, enrollmentCsvRows(enrollments, catalog));
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
