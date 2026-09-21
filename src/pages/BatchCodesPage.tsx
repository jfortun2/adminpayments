import { useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import DownloadReportDialog from "../components/DownloadReportDialog";
import { BackIcon, ChevronDownIcon, ChevronUpIcon } from "../components/Icons";
import PaymentsToolbar from "../components/PaymentsToolbar";
import tableStyles from "../components/PaymentsTable.module.css";
import Toast from "../components/Toast";
import { getPersonName, usePayments } from "../context/PaymentsContext";
import { PAYMENT_CODE_EXPORT_HEADERS, codeStatusLabel, paymentCodeExportRow } from "../data/codeExport";
import { downloadCsvOrZip, formatDate, slugify } from "../data/helpers";
import type { ReportDownloadFormat } from "../data/reporting";
import type { CodeStatus, SortDirection } from "../data/types";
import styles from "./PaymentsPages.module.css";

type SortKey = "code" | "status" | "createdAt" | "createdBy" | "redeemedBy" | "redeemedFor";

function parseList(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export default function BatchCodesPage() {
  const { templateId, batchId = "" } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { templates, batches, codes, people, sections, deactivateCode, reactivateCode } = usePayments();
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: "deactivate" | "reactivate"; codeId: string } | null>(
    null,
  );
  const [downloadScope, setDownloadScope] = useState<"selected" | "all" | null>(null);

  const batch = batches.find((item) => item.id === batchId);
  const template = templates.find((item) => item.id === (templateId ?? batch?.templateId));
  const isGlobal = !templateId;
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch;
  const backTo = isGlobal
    ? `/payments${listSearch ? `?${listSearch}` : ""}`
    : `/templates/${templateId}/payments${listSearch ? `?${listSearch}` : ""}`;
  const backLabel = isGlobal ? "Return to all batches" : "Return to template batches";

  const search = searchParams.get("q") ?? "";
  const status = parseList(searchParams.get("status")) as CodeStatus[];
  const sortKey = (searchParams.get("sort") as SortKey) || "createdAt";
  const sortDir = (searchParams.get("dir") as SortDirection) || "asc";

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
    setSelected([]);
  }

  const visibleCodes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = codes.filter((item) => {
      if (item.batchId !== batchId) return false;
      const redeemedBy = getPersonName(people, item.redeemedById).toLowerCase();
      const redeemedFor =
        sections.find((section) => section.id === item.redeemedForSectionId)?.name.toLowerCase() ?? "";
      const matchesQuery =
        query === "" ||
        item.code.toLowerCase().includes(query) ||
        batch?.name.toLowerCase().includes(query) ||
        redeemedBy.includes(query) ||
        redeemedFor.includes(query);
      const matchesStatus = status.length === 0 || status.includes(item.status);
      return matchesQuery && matchesStatus;
    });

    const statusRank: Record<CodeStatus, number> = {
      unused: 0,
      redeemed: 1,
      deactivated: 2,
    };

    const valueOf = (item: (typeof filtered)[number]): string | number => {
      switch (sortKey) {
        case "code":
          return item.code.toLowerCase();
        case "status":
          return statusRank[item.status];
        case "createdBy":
          return getPersonName(people, item.createdById).toLowerCase();
        case "redeemedBy":
          return getPersonName(people, item.redeemedById).toLowerCase();
        case "redeemedFor":
          return sections.find((section) => section.id === item.redeemedForSectionId)?.name.toLowerCase() ?? "";
        default:
          return item.createdAt;
      }
    };

    return [...filtered].sort((a, b) => {
      const result = valueOf(a) < valueOf(b) ? -1 : valueOf(a) > valueOf(b) ? 1 : 0;
      return sortDir === "asc" ? result : -result;
    });
  }, [batch?.name, batchId, codes, people, search, sections, sortDir, sortKey, status]);

  const visibleIds = visibleCodes.map((item) => item.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selected.includes(id));
  const pendingCode = codes.find((item) => item.id === pendingAction?.codeId);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      updateParams({ dir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      updateParams({ sort: key, dir: "asc" });
    }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return <ChevronDownIcon />;
    return sortDir === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />;
  }

  function statusClass(value: CodeStatus) {
    if (value === "unused") return tableStyles.statusUnused;
    if (value === "redeemed") return tableStyles.statusRedeemed;
    return tableStyles.statusDeactivated;
  }

  function downloadRows(rows: typeof visibleCodes, format: ReportDownloadFormat) {
    const noun = rows.length === 1 ? "code" : "codes";
    const prefix = slugify(batch?.name ?? "batch") || "batch";
    downloadCsvOrZip(format, {
      combinedFilename: downloadScope === "all" ? `${prefix}-codes.csv` : `${prefix}-codes-selected.csv`,
      zipFilename: downloadScope === "all" ? `${prefix}-codes.zip` : `${prefix}-codes-selected.zip`,
      headers: PAYMENT_CODE_EXPORT_HEADERS,
      items: rows.map((item) => ({
        filename: slugify(item.code) || item.id,
        rows: [paymentCodeExportRow(item, batch, { templates, people, sections })],
      })),
    });
    setToast(
      format === "zip"
        ? `Downloaded ${rows.length} ${noun} as separate files.`
        : `Downloaded ${rows.length} ${noun}.`,
    );
    setDownloadScope(null);
  }

  const downloadItems =
    downloadScope === "all" ? visibleCodes : visibleCodes.filter((item) => selected.includes(item.id));

  if (!batch || (!isGlobal && !template)) {
    return (
      <div className={styles.page}>
        <p>Batch not found.</p>
        <Link to={backTo}>{backLabel}</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to={backTo}>
        <BackIcon />
        {backLabel}
      </Link>
      <h1 className={styles.title}>Batch: {batch.name}</h1>

      <PaymentsToolbar
        search={search}
        onSearchChange={(value) => updateParams({ q: value })}
        hasActiveFilters={status.length > 0}
        onClearFilters={() => updateParams({ q: null, status: [] })}
        selectedCount={selected.length}
        allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        onToggleSelectAll={() => setSelected(allVisibleSelected ? [] : visibleIds)}
        onDownloadSelected={() => setDownloadScope("selected")}
        onDownloadAll={() => setDownloadScope("all")}
        downloadSelectedDisabled={selected.length === 0}
        downloadAllDisabled={visibleCodes.length === 0}
        filterGroups={[
          {
            id: "status",
            label: "Code status",
            options: [
              { value: "unused", label: "Unused" },
              { value: "redeemed", label: "Redeemed" },
              { value: "deactivated", label: "Deactivated" },
            ],
            selected: status,
            onChange: (value) => updateParams({ status: value }),
          },
        ]}
      />

      <div className={tableStyles.tableWrap}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.checkCell} />
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("code")}>
                  Payment code
                  {sortIcon("code")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("status")}>
                  Status
                  {sortIcon("status")}
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
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("redeemedBy")}>
                  Redeemed by
                  {sortIcon("redeemedBy")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("redeemedFor")}>
                  Redeemed for
                  {sortIcon("redeemedFor")}
                </button>
              </th>
              <th className={tableStyles.actionsCell} />
            </tr>
          </thead>
          <tbody>
            {visibleCodes.length === 0 ? (
              <tr>
                <td colSpan={8} className={tableStyles.empty}>
                  No payment codes match the current search or filters.
                </td>
              </tr>
            ) : (
              visibleCodes.map((item) => {
                const redeemedBy = getPersonName(people, item.redeemedById);
                const section = sections.find((entry) => entry.id === item.redeemedForSectionId);
                return (
                  <tr
                    key={item.id}
                    data-selected={selected.includes(item.id)}
                    data-deactivated={item.status === "deactivated"}
                  >
                    <td className={tableStyles.checkCell}>
                      <input
                        className={tableStyles.checkbox}
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        aria-label={`Select ${item.code}`}
                        onChange={() =>
                          setSelected((current) =>
                            current.includes(item.id)
                              ? current.filter((id) => id !== item.id)
                              : [...current, item.id],
                          )
                        }
                      />
                    </td>
                    <td className={tableStyles.nameCell}>{item.code}</td>
                    <td>
                      <span className={statusClass(item.status)}>{codeStatusLabel(item.status)}</span>
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>{getPersonName(people, item.createdById)}</td>
                    <td>
                      {redeemedBy ? (
                        <div className={tableStyles.stacked}>
                          <a className={tableStyles.linkName} href="#student">
                            {redeemedBy}
                          </a>
                          {item.redeemedAt ? (
                            <span className={tableStyles.secondaryDate}>{formatDate(item.redeemedAt)}</span>
                          ) : null}
                        </div>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td>
                      {section ? (
                        <a className={tableStyles.linkName} href="#section">
                          {section.name}
                        </a>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className={tableStyles.actionsCell}>
                      {item.status === "deactivated" ? (
                        <button
                          type="button"
                          className={tableStyles.reactivateButton}
                          onClick={() => setPendingAction({ type: "reactivate", codeId: item.id })}
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={tableStyles.dangerButton}
                          onClick={() => setPendingAction({ type: "deactivate", codeId: item.id })}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pendingCode && pendingAction?.type === "deactivate" ? (
        <ConfirmDialog
          title="Deactivate this payment code?"
          message={`Deactivate ${pendingCode.code}? This code will no longer be redeemable.`}
          confirmLabel="Deactivate"
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            deactivateCode(pendingCode.id);
            setPendingAction(null);
            setToast(`${pendingCode.code} was deactivated.`);
          }}
        />
      ) : null}

      {pendingCode && pendingAction?.type === "reactivate" ? (
        <ConfirmDialog
          title="Reactivate this payment code?"
          message={
            pendingCode.redeemedById
              ? `Reactivate ${pendingCode.code}? This code will remain redeemed.`
              : `Reactivate ${pendingCode.code}? This code will be redeemable again.`
          }
          confirmLabel="Reactivate"
          confirmTone="primary"
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            reactivateCode(pendingCode.id);
            setPendingAction(null);
            setToast(`${pendingCode.code} was reactivated.`);
          }}
        />
      ) : null}

      {downloadScope ? (
        <DownloadReportDialog
          title="Download payment codes"
          summary={`Includes ${downloadItems.length} ${downloadItems.length === 1 ? "code" : "codes"}${downloadScope === "all" ? " currently in view" : " selected"}, with batch information.`}
          combinedDescription="These payment codes will be included in one file, along with batch information."
          separateDescription="A separate file will be created for each payment code."
          onCancel={() => setDownloadScope(null)}
          onDownload={(format) => downloadRows(downloadItems, format)}
        />
      ) : null}

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}
