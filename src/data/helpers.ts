export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string): string {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function toTimestamp(value: string): number {
  return new Date(value.includes("T") ? value : `${value}T00:00:00`).getTime();
}

export function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function randomSegment(length: number): string {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return value;
}

export function generatePaymentCode(existing: Set<string>): string {
  let next = `${randomSegment(4)}-${randomSegment(4)}`;
  while (existing.has(next)) {
    next = `${randomSegment(4)}-${randomSegment(4)}`;
  }
  existing.add(next);
  return next;
}

export function parseCodeCount(value: string): number | null {
  if (value.trim() === "") return null;
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 2500) return null;
  return parsed;
}

export function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replaceAll('"', '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(","),
    )
    .join("\n");
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, rows: string[][]): void {
  downloadBlob(filename, new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" }));
}

export function downloadCsvOrZip(
  format: "combined" | "zip",
  {
    combinedFilename,
    zipFilename,
    headers,
    items,
  }: {
    combinedFilename: string;
    zipFilename: string;
    headers: string[];
    items: { filename: string; rows: string[][] }[];
  },
) {
  if (format === "zip") {
    const used = new Set<string>();
    downloadZip(
      zipFilename,
      items.map((item, index) => {
        let name = item.filename.endsWith(".csv") ? item.filename : `${item.filename}.csv`;
        if (used.has(name)) {
          name = name.replace(/\.csv$/, `-${index + 1}.csv`);
        }
        used.add(name);
        return { name, content: toCsv([headers, ...item.rows]) };
      }),
    );
    return;
  }

  downloadCsv(combinedFilename, [headers, ...items.flatMap((item) => item.rows)]);
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[index] = crc >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function u16(value: number): Uint8Array {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function u32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

export function downloadZip(filename: string, files: { name: string; content: string }[]): void {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const checksum = crc32(data);
    const localHeader = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      data,
    ]);
    const centralHeader = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    localParts.push(localHeader);
    centralParts.push(centralHeader);
    offset += localHeader.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const zip = concatBytes([
    ...localParts,
    centralDirectory,
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  ]);

  downloadBlob(filename, new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" }));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
