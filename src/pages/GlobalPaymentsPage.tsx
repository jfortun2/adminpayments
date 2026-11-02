import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDownIcon, ChevronIcon, ChevronUpIcon, DownloadIcon } from "../components/Icons";
import PaymentsToolbar from "../components/PaymentsToolbar";
import tableStyles from "../components/PaymentsTable.module.css";
import Toast from "../components/Toast";
import { getPersonName, usePayments } from "../context/PaymentsContext";
import { batchCodeDownloadToast, downloadCodesForBatches } from "../data/codeExport";
import { formatDate, matchingCodeCountsByBatch, matchingCodeLabel, slugify, withSearchQuery } from "../data/helpers";
import type { PaymentBatch, SortDirection } from "../data/types";
import styles from "./PaymentsPages.module.css";

type SortKey = "name" | "template" | "codes" | "redeemed" | "unused" | "createdAt" | "createdBy";

interface CodeCounts {
  total: number;
  redeemed: number;
  unused: number;
}

const EMPTY_COUNTS: CodeCounts = { total: 0, redeemed: 0, unused: 0 };

function parseList(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

export default function GlobalPaymentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { templates, batches, codes, people, sections } = usePayments();
  const [toast, setToast] = useState<string | null>(null);

  const search = searchParams.get("q") ?? "";
  const createdBy = parseList(searchParams.get("createdBy"));
  const templateFilter = parseList(searchParams.get("template"));
  const after = searchParams.get("after") ?? "";
  const before = searchParams.get("before") ?? "";
  const afterDate = after.slice(0, 10);
  const beforeDate = before.slice(0, 10);
  const sortKey = (searchParams.get("sort") as SortKey) || "createdAt";
  const sortDir = (searchParams.get("dir") as SortDirection) || "desc";

  function updateParams(next: Record<string, string | string[] | null>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === null || (Array.isArray(value) && value.length === 0) || value === "") {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
  }

  const creatorOptions = useMemo(() => {
    const ids = [...new Set(batches.map((batch) => batch.createdById))];
    return ids.map((id) => ({ value: id, label: getPersonName(people, id) }));
  }, [batches, people]);

  const templateOptions = useMemo(
    () =>
      templates
        .filter((template) => batches.some((batch) => batch.templateId === template.id))
        .map((template) => ({ value: template.id, label: template.name })),
    [batches, templates],
  );

  const codeCounts = useMemo(() => {
    const counts = new Map<string, CodeCounts>();
    codes.forEach((code) => {
      const current = counts.get(code.batchId) ?? { total: 0, redeemed: 0, unused: 0 };
      current.total += 1;
      if (code.status === "redeemed") current.redeemed += 1;
      if (code.status === "unused") current.unused += 1;
      counts.set(code.batchId, current);
    });
    return counts;
  }, [codes]);

  const matchingCodeCounts = useMemo(() => matchingCodeCountsByBatch(codes, search), [codes, search]);

  const visibleBatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = batches.filter((batch) => {
      const templateName = templates.find((item) => item.id === batch.templateId)?.name.toLowerCase() ?? "";
      const matchesQuery =
        query === "" ||
        batch.name.toLowerCase().includes(query) ||
        templateName.includes(query) ||
        (matchingCodeCounts.get(batch.id) ?? 0) > 0;
      const matchesCreator = createdBy.length === 0 || createdBy.includes(batch.createdById);
      const matchesTemplate = templateFilter.length === 0 || templateFilter.includes(batch.templateId);
      const matchesAfter = afterDate === "" || batch.createdAt >= afterDate;
      const matchesBefore = beforeDate === "" || batch.createdAt <= beforeDate;
      return matchesQuery && matchesCreator && matchesTemplate && matchesAfter && matchesBefore;
    });

    const valueOf = (batch: (typeof filtered)[number]): string | number => {
      const counts = codeCounts.get(batch.id) ?? EMPTY_COUNTS;
      if (sortKey === "name") return batch.name.toLowerCase();
      if (sortKey === "createdBy") return getPersonName(people, batch.createdById).toLowerCase();
      if (sortKey === "template") {
        return templates.find((item) => item.id === batch.templateId)?.name.toLowerCase() ?? "";
      }
      if (sortKey === "codes") return counts.total;
      if (sortKey === "redeemed") return counts.redeemed;
      if (sortKey === "unused") return counts.unused;
      return batch.createdAt;
    };

    return [...filtered].sort((a, b) => {
      const left = valueOf(a);
      const right = valueOf(b);
      const result = left < right ? -1 : left > right ? 1 : 0;
      return sortDir === "asc" ? result : -result;
    });
  }, [
    afterDate,
    batches,
    beforeDate,
    codeCounts,
    createdBy,
    matchingCodeCounts,
    people,
    search,
    sortDir,
    sortKey,
    templateFilter,
    templates,
  ]);

  const hasActiveFilters =
    createdBy.length > 0 || templateFilter.length > 0 || afterDate !== "" || beforeDate !== "";

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      updateParams({ dir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      updateParams({ sort: key, dir: key === "name" || key === "template" ? "asc" : "desc" });
    }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return <ChevronDownIcon />;
    return sortDir === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />;
  }

  function downloadBatch(batch: PaymentBatch) {
    const codeCount = codes.filter((code) => code.batchId === batch.id).length;
    const filename = slugify(batch.name) || batch.id;
    downloadCodesForBatches("combined", [batch], codes, { templates, people, sections }, {
      combinedFilename: `${filename}.csv`,
      zipFilename: `${filename}.zip`,
    });
    setToast(batchCodeDownloadToast("combined", 1, codeCount));
  }

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/">Admin Panel</Link>
        <ChevronIcon className={styles.crumbChevron} />
        <span aria-current="page">Manage All Payment Codes</span>
      </nav>
      <h1 className={styles.title}>Payment Codes</h1>
      <p className={styles.subtitle}>Manage and download payment codes and batches.</p>

      <PaymentsToolbar
        search={search}
        onSearchChange={(value) => updateParams({ q: value })}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() =>
          updateParams({ q: null, createdBy: [], template: [], after: null, before: null, status: null })
        }
        showBulkActions={false}
        batchFilters={{
          after,
          before,
          templateOptions,
          selectedTemplates: templateFilter,
          creatorOptions,
          selectedCreator: createdBy[0] ?? "",
          onApply: (draft) =>
            updateParams({
              after: draft.after || null,
              before: draft.before || null,
              template: draft.templates,
              createdBy: draft.creator ? [draft.creator] : [],
              status: null,
            }),
        }}
      />

      <div className={tableStyles.tableWrap}>
            <table className={`${tableStyles.table} ${tableStyles.batchTable}`}>
          <thead>
            <tr>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("name")}>
                  Batch Name
                  {sortIcon("name")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("template")}>
                  Template
                  {sortIcon("template")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("codes")}>
                  # Codes
                  {sortIcon("codes")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("redeemed")}>
                  # Redeemed
                  {sortIcon("redeemed")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("unused")}>
                  # Unused
                  {sortIcon("unused")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("createdAt")}>
                  Created
                  {sortIcon("createdAt")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("createdBy")}>
                  Created by
                  {sortIcon("createdBy")}
                </button>
              </th>
              <th className={tableStyles.downloadCell}>
                <span className="sr-only">Download</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleBatches.length === 0 ? (
              <tr>
                <td colSpan={8} className={tableStyles.empty}>
                  No payment batches match the current search or filters.
                </td>
              </tr>
            ) : (
              visibleBatches.map((batch) => {
                const template = templates.find((item) => item.id === batch.templateId);
                const counts = codeCounts.get(batch.id) ?? EMPTY_COUNTS;
                const matchCount = matchingCodeCounts.get(batch.id) ?? 0;
                return (
                  <tr key={batch.id} data-deactivated={batch.status === "deactivated"}>
                    <td>
                      <div className={tableStyles.stacked}>
                        <button
                          type="button"
                          className={tableStyles.nameButton}
                          aria-label={
                            matchCount > 0 ? `${batch.name}, ${matchingCodeLabel(matchCount)}` : batch.name
                          }
                          onClick={() =>
                            navigate(withSearchQuery(`/payments/batches/${batch.id}`, search), {
                              state: { listSearch: searchParams.toString() },
                            })
                          }
                        >
                          {batch.name}
                        </button>
                        {matchCount > 0 ? (
                          <span className={tableStyles.matchMeta}>{matchingCodeLabel(matchCount)}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      {template ? (
                        <Link className={tableStyles.linkName} to={`/templates/${template.id}/payments`}>
                          {template.name}
                        </Link>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className={tableStyles.metric}>{formatCount(counts.total)}</td>
                    <td className={tableStyles.metric}>{formatCount(counts.redeemed)}</td>
                    <td className={tableStyles.metric}>{formatCount(counts.unused)}</td>
                    <td>{formatDate(batch.createdAt)}</td>
                    <td>{getPersonName(people, batch.createdById)}</td>
                    <td className={tableStyles.downloadCell}>
                      <button
                        type="button"
                        className={tableStyles.downloadBatch}
                        aria-label={`Download batch ${batch.name}`}
                        onClick={() => downloadBatch(batch)}
                      >
                        <DownloadIcon />
                        Download Batch
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}
