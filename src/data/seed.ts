import type {
  CourseSection,
  Enrollment,
  Institution,
  PaymentBatch,
  PaymentCode,
  Person,
  Publisher,
  Template,
} from "./types";

export const CURRENT_USER_ID = "jessica";

export const people: Person[] = [
  { id: "hal", name: "Hal Turner", initials: "HT", email: "hal@xyz.edu" },
  { id: "mia", name: "Mia B", initials: "MB", email: "mia@xyz.edu" },
  { id: "jessica", name: "Jessica Fortunato", initials: "JF", email: "jess@xyz.edu" },
  { id: "joe", name: "Joe Smith", initials: "JS", email: "joe@xyz.edu" },
  { id: "priya", name: "Priya Nair", initials: "PN", email: "priya@xyz.edu" },
  { id: "omar", name: "Omar Alvarez", initials: "OA", email: "omar@xyz.edu" },
  { id: "alex", name: "Alex Chen", initials: "AC", email: "alex@xyz.edu" },
  { id: "sam", name: "Sam Ortiz", initials: "SO", email: "sam@xyz.edu" },
  { id: "rina", name: "Rina Patel", initials: "RP", email: "rina@xyz.edu" },
  { id: "devon", name: "Devon Blake", initials: "DB", email: "devon@xyz.edu" },
  { id: "nia", name: "Nia Brooks", initials: "NB", email: "nia@xyz.edu" },
  { id: "chris", name: "Chris Young", initials: "CY", email: "chris@xyz.edu" },
  { id: "lee", name: "Lee Park", initials: "LP", email: "lee@xyz.edu" },
  { id: "ana", name: "Ana Silva", initials: "AS", email: "ana@xyz.edu" },
  { id: "miles", name: "Miles Grant", initials: "MG", email: "miles@xyz.edu" },
  { id: "tara", name: "Tara Nguyen", initials: "TN", email: "tara@xyz.edu" },
];

export const institutions: Institution[] = [
  { id: "asu", name: "Arizona State University" },
  { id: "cmu", name: "Carnegie Mellon University" },
  { id: "osu", name: "Ohio State University" },
];

export const publishers: Publisher[] = [
  { id: "oli", name: "Open Learning Initiative" },
  { id: "openstax", name: "OpenStax" },
];

export const templates: Template[] = [
  { id: "intro-to-gardening", name: "Intro to Gardening", publisherId: "oli" },
  { id: "coffee-101", name: "Coffee 101", publisherId: "oli" },
  { id: "intro-biology", name: "Introduction to Biology", publisherId: "openstax" },
  { id: "stats-foundations", name: "Statistics Foundations", publisherId: "openstax" },
];

export const sections: CourseSection[] = [
  { id: "gardening-fall-26", name: "Gardening 101", templateId: "intro-to-gardening", institutionId: "asu", instructorId: "hal" },
  { id: "gardening-summer-26", name: "Intro to Gardening — Summer", templateId: "intro-to-gardening", institutionId: "cmu", instructorId: "mia" },
  { id: "coffee-101-section", name: "Coffee 101", templateId: "coffee-101", institutionId: "cmu", instructorId: "jessica" },
  { id: "coffee-asu", name: "Coffee 101 ASU", templateId: "coffee-101", institutionId: "asu", instructorId: "hal" },
  { id: "bio-section-a", name: "Biology A", templateId: "intro-biology", institutionId: "asu", instructorId: "mia" },
  { id: "stats-osu", name: "Statistics Foundations", templateId: "stats-foundations", institutionId: "osu", instructorId: "jessica" },
];

function batch(
  id: string,
  templateId: string,
  name: string,
  createdAt: string,
  createdById: string,
  status: PaymentBatch["status"] = "active",
): PaymentBatch {
  return { id, templateId, name, createdAt, createdById, status };
}

export const seedBatches: PaymentBatch[] = [
  batch("fall-partner", "intro-to-gardening", "Fall partner Codes", "2026-08-26", "hal"),
  batch("summer-pilot", "intro-to-gardening", "Summer pilot", "2026-05-12", "mia"),
  batch("spring-trial", "intro-to-gardening", "Spring trial", "2026-03-03", "hal", "deactivated"),
  batch("publisher-preview", "intro-to-gardening", "Publisher preview", "2026-01-15", "mia"),
  batch("coffee-launch", "coffee-101", "Campus launch codes", "2026-08-01", "jessica"),
  batch("coffee-partners", "coffee-101", "Partner bookstore", "2026-06-18", "hal"),
  batch("bio-orientation", "intro-biology", "Orientation week", "2026-07-22", "mia"),
  batch("stats-pilot", "stats-foundations", "Dept pilot", "2026-04-09", "jessica"),
];

function code(partial: Omit<PaymentCode, "status"> & { status?: PaymentCode["status"] }): PaymentCode {
  return { status: "unused", ...partial };
}

export const seedCodes: PaymentCode[] = [
  code({
    id: "c1",
    batchId: "fall-partner",
    code: "H7k4-92QT",
    createdAt: "2026-08-26",
    createdById: "hal",
  }),
  code({
    id: "c2",
    batchId: "fall-partner",
    code: "N3p8-14KA",
    createdAt: "2026-08-26",
    createdById: "hal",
    status: "redeemed",
    redeemedById: "joe",
    redeemedAt: "2026-08-27",
    redeemedForSectionId: "coffee-101-section",
  }),
  code({
    id: "c3",
    batchId: "fall-partner",
    code: "Q9m2-77LX",
    createdAt: "2026-08-26",
    createdById: "hal",
  }),
  code({
    id: "c4",
    batchId: "fall-partner",
    code: "B6t1-03VW",
    createdAt: "2026-08-26",
    createdById: "hal",
    status: "redeemed",
    redeemedById: "priya",
    redeemedAt: "2026-08-29",
    redeemedForSectionId: "gardening-fall-26",
  }),
  code({
    id: "c5",
    batchId: "fall-partner",
    code: "R2c8-55YH",
    createdAt: "2026-08-26",
    createdById: "hal",
  }),
  code({
    id: "c6",
    batchId: "fall-partner",
    code: "K8d4-19ZP",
    createdAt: "2026-08-26",
    createdById: "hal",
    status: "redeemed",
    redeemedById: "joe",
    redeemedAt: "2026-09-02",
    redeemedForSectionId: "coffee-101-section",
  }),
  code({
    id: "c7",
    batchId: "fall-partner",
    code: "F5w7-88NM",
    createdAt: "2026-08-26",
    createdById: "hal",
  }),
  code({
    id: "c8",
    batchId: "fall-partner",
    code: "J1a9-42ST",
    createdAt: "2026-08-26",
    createdById: "hal",
    status: "redeemed",
    redeemedById: "omar",
    redeemedAt: "2026-09-04",
    redeemedForSectionId: "gardening-fall-26",
  }),
  code({
    id: "c9",
    batchId: "fall-partner",
    code: "P4e6-61BQ",
    createdAt: "2026-08-26",
    createdById: "hal",
  }),
  code({
    id: "c10",
    batchId: "fall-partner",
    code: "M7h3-28DR",
    createdAt: "2026-08-26",
    createdById: "hal",
    status: "deactivated",
  }),
  code({
    id: "c11",
    batchId: "summer-pilot",
    code: "S2k9-17FG",
    createdAt: "2026-05-12",
    createdById: "mia",
    status: "redeemed",
    redeemedById: "priya",
    redeemedAt: "2026-05-20",
    redeemedForSectionId: "gardening-summer-26",
  }),
  code({
    id: "c12",
    batchId: "summer-pilot",
    code: "T8n5-90UJ",
    createdAt: "2026-05-12",
    createdById: "mia",
  }),
  code({
    id: "c13",
    batchId: "summer-pilot",
    code: "V3q1-46CE",
    createdAt: "2026-05-12",
    createdById: "mia",
    status: "redeemed",
    redeemedById: "joe",
    redeemedAt: "2026-06-01",
    redeemedForSectionId: "gardening-summer-26",
  }),
  code({
    id: "c14",
    batchId: "summer-pilot",
    code: "W6y4-73HK",
    createdAt: "2026-05-12",
    createdById: "mia",
  }),
  code({
    id: "c15",
    batchId: "summer-pilot",
    code: "X1b8-22LM",
    createdAt: "2026-05-12",
    createdById: "mia",
    status: "deactivated",
  }),
  code({
    id: "c16",
    batchId: "spring-trial",
    code: "A9c2-11OP",
    createdAt: "2026-03-03",
    createdById: "hal",
    status: "deactivated",
  }),
  code({
    id: "c17",
    batchId: "spring-trial",
    code: "C4d7-65QR",
    createdAt: "2026-03-03",
    createdById: "hal",
    status: "redeemed",
    redeemedById: "omar",
    redeemedAt: "2026-03-18",
    redeemedForSectionId: "gardening-fall-26",
  }),
  code({
    id: "c18",
    batchId: "publisher-preview",
    code: "D5f3-38ST",
    createdAt: "2026-01-15",
    createdById: "mia",
  }),
  code({
    id: "c19",
    batchId: "publisher-preview",
    code: "E8g6-49UV",
    createdAt: "2026-01-15",
    createdById: "mia",
  }),
  code({
    id: "c20",
    batchId: "publisher-preview",
    code: "G2h9-70WX",
    createdAt: "2026-01-15",
    createdById: "mia",
    status: "redeemed",
    redeemedById: "priya",
    redeemedAt: "2026-02-02",
    redeemedForSectionId: "gardening-fall-26",
  }),
  code({
    id: "c21",
    batchId: "coffee-launch",
    code: "L3j1-15YZ",
    createdAt: "2026-08-01",
    createdById: "jessica",
  }),
  code({
    id: "c22",
    batchId: "coffee-partners",
    code: "U7k5-84AB",
    createdAt: "2026-06-18",
    createdById: "hal",
    status: "redeemed",
    redeemedById: "joe",
    redeemedAt: "2026-07-01",
    redeemedForSectionId: "coffee-101-section",
  }),
  code({
    id: "c23",
    batchId: "bio-orientation",
    code: "Y4m8-27CD",
    createdAt: "2026-07-22",
    createdById: "mia",
  }),
  code({
    id: "c24",
    batchId: "stats-pilot",
    code: "Z6n2-93EF",
    createdAt: "2026-04-09",
    createdById: "jessica",
  }),
];

function enroll(
  id: string,
  studentId: string,
  sectionId: string,
  status: Enrollment["status"],
  enrolledAt: string,
  extras: Pick<Enrollment, "paymentMethod" | "codeId" | "paymentStatus" | "paymentReference" | "paidAt"> = {},
): Enrollment {
  const section = sections.find((item) => item.id === sectionId);
  const template = templates.find((item) => item.id === section?.templateId);
  const paymentStatus =
    extras.paymentStatus ??
    (extras.paymentMethod === "card" ? "complete" : extras.paymentMethod === "code" ? "paid" : undefined);
  const paymentReference =
    extras.paymentReference ??
    (extras.paymentMethod === "card" ? `CASHNET-${id.replace(/\D/g, "").padStart(5, "0")}` : undefined);
  return {
    id,
    studentId,
    sectionId,
    templateId: template?.id ?? "",
    institutionId: section?.institutionId ?? "",
    publisherId: template?.publisherId ?? "",
    status,
    enrolledAt,
    paidAt: extras.paidAt ?? (paymentStatus ? enrolledAt : undefined),
    paymentStatus,
    paymentReference,
    paymentMethod: extras.paymentMethod,
    codeId: extras.codeId,
  };
}

export const seedEnrollments: Enrollment[] = [
  enroll("e1", "joe", "gardening-fall-26", "valid_paid", "2026-08-29T09:12", { paymentMethod: "code", codeId: "c4" }),
  enroll("e2", "omar", "gardening-fall-26", "valid_paid", "2026-09-04T14:40", { paymentMethod: "code", codeId: "c8" }),
  enroll("e3", "priya", "gardening-fall-26", "valid_paid", "2026-02-02T11:05", { paymentMethod: "code", codeId: "c20" }),
  enroll("e4", "alex", "gardening-fall-26", "valid_paid", "2026-08-30T16:22", { paymentStatus: "bypassed" }),
  enroll("e5", "sam", "gardening-fall-26", "valid_paid", "2026-09-01T10:18", { paymentMethod: "card" }),
  enroll("e6", "rina", "gardening-fall-26", "valid_paid", "2026-08-28T13:47", { paymentMethod: "card" }),
  enroll("e7", "devon", "gardening-fall-26", "valid_paid", "2026-09-03T08:05", { paymentMethod: "card" }),
  enroll("e8", "nia", "gardening-fall-26", "valid_paid", "2026-09-05T15:31", { paymentMethod: "card" }),
  enroll("e9", "chris", "gardening-fall-26", "grace", "2026-09-10T09:00"),
  enroll("e10", "lee", "gardening-fall-26", "unpaid", "2026-09-12T12:14"),

  enroll("e11", "priya", "gardening-summer-26", "valid_paid", "2026-05-20T10:02", { paymentMethod: "code", codeId: "c11" }),
  enroll("e12", "joe", "gardening-summer-26", "valid_paid", "2026-06-01T09:44", { paymentMethod: "code", codeId: "c13" }),
  enroll("e13", "ana", "gardening-summer-26", "valid_paid", "2026-05-22T14:11", { paymentMethod: "card" }),
  enroll("e14", "miles", "gardening-summer-26", "valid_paid", "2026-05-28T11:26", { paymentMethod: "card" }),
  enroll("e15", "tara", "gardening-summer-26", "valid_paid", "2026-06-02T16:08", { paymentMethod: "card" }),
  enroll("e16", "alex", "gardening-summer-26", "grace", "2026-06-10T08:30"),
  enroll("e17", "sam", "gardening-summer-26", "unpaid", "2026-06-15T13:19"),

  enroll("e18", "joe", "coffee-101-section", "valid_paid", "2026-07-01T09:15", { paymentMethod: "code", codeId: "c22" }),
  enroll("e19", "joe", "coffee-101-section", "valid_paid", "2026-08-27T10:41", { paymentMethod: "code", codeId: "c2" }),
  enroll("e20", "priya", "coffee-101-section", "valid_paid", "2026-08-12T15:03", {
    paymentMethod: "code",
    codeId: "c1",
    paymentStatus: "bypassed",
  }),
  enroll("e21", "rina", "coffee-101-section", "valid_paid", "2026-07-10T11:22", { paymentMethod: "card" }),
  enroll("e22", "devon", "coffee-101-section", "valid_paid", "2026-08-05T14:55", { paymentMethod: "card" }),
  enroll("e23", "nia", "coffee-101-section", "valid_paid", "2026-08-20T09:37", { paymentMethod: "card" }),
  enroll("e24", "chris", "coffee-101-section", "grace", "2026-08-22T08:12"),
  enroll("e25", "lee", "coffee-101-section", "grace", "2026-08-24T16:40"),
  enroll("e26", "ana", "coffee-101-section", "unpaid", "2026-08-25T12:05"),

  enroll("e27", "sam", "coffee-asu", "valid_paid", "2026-08-18T09:48", { paymentStatus: "bypassed" }),
  enroll("e28", "ana", "coffee-asu", "valid_paid", "2026-08-19T13:21", { paymentMethod: "card" }),
  enroll("e29", "miles", "coffee-asu", "valid_paid", "2026-08-21T10:09", { paymentMethod: "card" }),
  enroll("e30", "tara", "coffee-asu", "valid_paid", "2026-08-26T15:44", { paymentMethod: "card" }),
  enroll("e31", "alex", "coffee-asu", "valid_paid", "2026-09-02T11:17", { paymentMethod: "card" }),
  enroll("e32", "priya", "coffee-asu", "grace", "2026-09-06T09:28"),
  enroll("e33", "omar", "coffee-asu", "unpaid", "2026-09-08T14:02"),

  enroll("e34", "devon", "bio-section-a", "valid_paid", "2026-07-24T08:55", { paymentMethod: "card" }),
  enroll("e35", "nia", "bio-section-a", "valid_paid", "2026-07-26T10:13", { paymentMethod: "card" }),
  enroll("e36", "chris", "bio-section-a", "valid_paid", "2026-07-29T16:01", { paymentMethod: "card" }),
  enroll("e37", "lee", "bio-section-a", "valid_paid", "2026-08-03T09:42", { paymentMethod: "card" }),
  enroll("e38", "ana", "bio-section-a", "valid_paid", "2026-08-08T13:36", { paymentStatus: "bypassed" }),
  enroll("e39", "miles", "bio-section-a", "grace", "2026-08-11T11:08"),
  enroll("e40", "tara", "bio-section-a", "unpaid", "2026-08-14T15:27"),
  enroll("e41", "sam", "bio-section-a", "unpaid", "2026-08-16T10:50"),

  enroll("e42", "alex", "stats-osu", "valid_paid", "2026-04-12T09:20", { paymentMethod: "card" }),
  enroll("e43", "rina", "stats-osu", "valid_paid", "2026-04-18T14:33", { paymentMethod: "card" }),
  enroll("e44", "joe", "stats-osu", "valid_paid", "2026-04-22T11:47", { paymentStatus: "bypassed" }),
  enroll("e45", "priya", "stats-osu", "valid_paid", "2026-05-02T08:16", { paymentMethod: "card" }),
  enroll("e46", "devon", "stats-osu", "grace", "2026-05-08T13:05"),
  enroll("e47", "nia", "stats-osu", "unpaid", "2026-05-14T10:29"),
];
