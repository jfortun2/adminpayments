import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import CreateBatchPanel from "../components/CreateBatchPanel";
import DownloadReportDialog from "../components/DownloadReportDialog";
import { ChevronDownIcon, ChevronIcon, ChevronUpIcon } from "../components/Icons";
import PaymentsToolbar from "../components/PaymentsToolbar";
import tableStyles from "../components/PaymentsTable.module.css";
import toolbarStyles from "../components/PaymentsToolbar.module.css";
import Toast from "../components/Toast";
import { getPersonName, usePayments } from "../context/PaymentsContext";
import {
  batchCodeDownloadSummary,
  batchCodeDownloadToast,
  codesInBatches,
  downloadCodesForBatches,
} from "../data/codeExport";
import { formatDate, matchingCodeCountsByBatch, matchingCodeLabel, slugify, withSearchQuery } from "../data/helpers";
import type { ReportDownloadFormat } from "../data/reporting";
import type { BatchStatus, SortDirection } from "../data/types";
import styles from "./PaymentsPages.module.css";

type SortKey = "name" | "createdAt" | "createdBy";

function parseList(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export default function TemplatePaymentsPage() {
  const { templateId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { templates, batches, codes, people, sections, createBatch, deactivateBatch, reactivateBatch } =
    usePayments();
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<{ type: "deactivate" | "reactivate"; batchId: string } | null>(
    null,
  );
  const [downloadScope, setDownloadScope] = useState<"selected" | "all" | null>(null);

  const template = templates.find((item) => item.id === templateId);
  const search = searchParams.get("q") ?? "";
  const createdBy = parseList(searchParams.get("createdBy"));
  const status = parseList(searchParams.get("status")) as BatchStatus[];
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
    setSelected([]);
  }

  const templateBatches = useMemo(
    () => batches.filter((batch) => batch.templateId === templateId),
    [batches, templateId],
  );

  const creatorOptions = useMemo(() => {
    const ids = [...new Set(templateBatches.map((batch) => batch.createdById))];
    return ids.map((id) => ({ value: id, label: getPersonName(people, id) }));
  }, [people, templateBatches]);

  const matchingCodeCounts = useMemo(() => matchingCodeCountsByBatch(codes, search), [codes, search]);

  const visibleBatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = templateBatches.filter((batch) => {
      const matchesQuery =
        query === "" ||
        batch.name.toLowerCase().includes(query) ||
        (matchingCodeCounts.get(batch.id) ?? 0) > 0;
      const matchesCreator = createdBy.length === 0 || createdBy.includes(batch.createdById);
      const matchesStatus = status.length === 0 || status.includes(batch.status);
      return matchesQuery && matchesCreator && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      const left =
        sortKey === "name"
          ? a.name.toLowerCase()
          : sortKey === "createdBy"
            ? getPersonName(people, a.createdById).toLowerCase()
            : a.createdAt;
      const right =
        sortKey === "name"
          ? b.name.toLowerCase()
          : sortKey === "createdBy"
            ? getPersonName(people, b.createdById).toLowerCase()
            : b.createdAt;
      const result = left < right ? -1 : left > right ? 1 : 0;
      return sortDir === "asc" ? result : -result;
    });

    return sorted;
  }, [createdBy, matchingCodeCounts, people, search, sortDir, sortKey, status, templateBatches]);

  const visibleIds = visibleBatches.map((batch) => batch.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selected.includes(id));
  const hasActiveFilters = createdBy.length > 0 || status.length > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      updateParams({ dir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      updateParams({ sort: key, dir: key === "name" ? "asc" : "desc" });
    }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return <ChevronDownIcon />;
    return sortDir === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />;
  }

  function toggleRow(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function downloadBatches(
    rows: typeof visibleBatches,
    format: ReportDownloadFormat,
    scope: "selected" | "all",
  ) {
    const prefix = slugify(template?.name ?? "template") || "template";
    const codeCount = codesInBatches(codes, rows).length;
    downloadCodesForBatches(format, rows, codes, { templates, people, sections }, {
      combinedFilename: scope === "all" ? `${prefix}-codes.csv` : `${prefix}-codes-selected.csv`,
      zipFilename: scope === "all" ? `${prefix}-codes.zip` : `${prefix}-codes-selected.zip`,
    });
    setToast(batchCodeDownloadToast(format, rows.length, codeCount));
    setDownloadScope(null);
  }

  function requestDownload(scope: "selected" | "all") {
    const rows = scope === "all" ? visibleBatches : visibleBatches.filter((batch) => selected.includes(batch.id));
    if (rows.length === 1) {
      downloadBatches(rows, "combined", scope);
      return;
    }
    setDownloadScope(scope);
  }

  const downloadRows =
    downloadScope === "all" ? visibleBatches : visibleBatches.filter((batch) => selected.includes(batch.id));
  const downloadCodeCount = codesInBatches(codes, downloadRows).length;

  const pendingBatch = templateBatches.find((batch) => batch.id === pendingAction?.batchId);

  if (!template) {
    return (
      <div className={styles.page}>
        <p>Template not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to={`/templates/${templateId}`}>Template overview</Link>
        <ChevronIcon className={styles.crumbChevron} />
        <span aria-current="page">Manage Template Payments</span>
      </nav>
      <h1 className={styles.title}>{template.name} Payment Codes</h1>
      <p className={styles.subtitle}>Manage payment codes for this template.</p>

      <PaymentsToolbar
        search={search}
        onSearchChange={(value) => updateParams({ q: value })}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => updateParams({ q: null, createdBy: [], status: [] })}
        selectedCount={selected.length}
        allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        onToggleSelectAll={() => setSelected(allVisibleSelected ? [] : visibleIds)}
        onDownloadSelected={() => requestDownload("selected")}
        onDownloadAll={() => requestDownload("all")}
        downloadSelectedDisabled={selected.length === 0}
        downloadAllDisabled={visibleBatches.length === 0}
        filterGroups={[
          {
            id: "createdBy",
            label: "Created by",
            options: creatorOptions,
            selected: createdBy,
            onChange: (value) => updateParams({ createdBy: value }),
          },
          {
            id: "status",
            label: "Batch status",
            options: [
              { value: "active", label: "Active" },
              { value: "deactivated", label: "Deactivated" },
            ],
            selected: status,
            onChange: (value) => updateParams({ status: value }),
          },
        ]}
        primaryAction={
          <button
            ref={createButtonRef}
            type="button"
            className={toolbarStyles.primaryButton}
            onClick={() => setPanelOpen(true)}
          >
            Create New Batch
          </button>
        }
      />

      <div className={tableStyles.tableWrap}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.checkCell} />
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("name")}>
                  Batch Name
                  {sortIcon("name")}
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
              <th className={tableStyles.actionsCell} />
            </tr>
          </thead>
          <tbody>
            {visibleBatches.length === 0 ? (
              <tr>
                <td colSpan={5} className={tableStyles.empty}>
                  No payment batches match the current search or filters.
                </td>
              </tr>
            ) : (
              visibleBatches.map((batch) => {
                const matchCount = matchingCodeCounts.get(batch.id) ?? 0;
                return (
                  <tr
                    key={batch.id}
                    data-selected={selected.includes(batch.id)}
                    data-deactivated={batch.status === "deactivated"}
                  >
                    <td className={tableStyles.checkCell}>
                      <input
                        className={tableStyles.checkbox}
                        type="checkbox"
                        checked={selected.includes(batch.id)}
                        aria-label={`Select ${batch.name}`}
                        onChange={() => toggleRow(batch.id)}
                      />
                    </td>
                    <td>
                      <div className={tableStyles.stacked}>
                        <button
                          type="button"
                          className={tableStyles.nameButton}
                          aria-label={
                            matchCount > 0 ? `${batch.name}, ${matchingCodeLabel(matchCount)}` : batch.name
                          }
                          onClick={() =>
                            navigate(
                              withSearchQuery(`/templates/${templateId}/payments/batches/${batch.id}`, search),
                              {
                                state: { listSearch: searchParams.toString() },
                              },
                            )
                          }
                        >
                          {batch.name}
                        </button>
                        {matchCount > 0 ? (
                          <span className={tableStyles.matchMeta}>{matchingCodeLabel(matchCount)}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>{formatDate(batch.createdAt)}</td>
                    <td>{getPersonName(people, batch.createdById)}</td>
                    <td className={tableStyles.actionsCell}>
                      {batch.status === "active" ? (
                        <button
                          type="button"
                          className={tableStyles.dangerButton}
                          onClick={() => setPendingAction({ type: "deactivate", batchId: batch.id })}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={tableStyles.reactivateButton}
                          onClick={() => setPendingAction({ type: "reactivate", batchId: batch.id })}
                        >
                          Reactivate
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

      {panelOpen ? (
        <CreateBatchPanel
          onClose={() => {
            setPanelOpen(false);
            createButtonRef.current?.focus();
          }}
          onCreate={({ name, count }) => {
            const created = createBatch({ templateId, name, count });
            setPanelOpen(false);
            setToast(`Created ${created.name} with ${count.toLocaleString()} codes.`);
            createButtonRef.current?.focus();
          }}
        />
      ) : null}

      {pendingBatch && pendingAction?.type === "deactivate" ? (
        <ConfirmDialog
          title="Deactivate this batch?"
          message={`Deactivate ${pendingBatch.name}? Unused codes in this batch will no longer be redeemable.`}
          confirmLabel="Deactivate"
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            deactivateBatch(pendingBatch.id);
            setPendingAction(null);
            setToast(`${pendingBatch.name} was deactivated.`);
          }}
        />
      ) : null}

      {pendingBatch && pendingAction?.type === "reactivate" ? (
        <ConfirmDialog
          title="Reactivate this batch?"
          message={`Reactivate ${pendingBatch.name}? Unused codes in this batch will be redeemable again.`}
          confirmLabel="Reactivate"
          confirmTone="primary"
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            reactivateBatch(pendingBatch.id);
            setPendingAction(null);
            setToast(`${pendingBatch.name} was reactivated.`);
          }}
        />
      ) : null}

      {downloadScope ? (
        <DownloadReportDialog
          title="Download payment codes"
          summary={batchCodeDownloadSummary(downloadRows, downloadCodeCount, downloadScope)}
          combinedDescription="Every payment code from these batches will be included in one file, along with batch information."
          separateDescription="A separate file will be created for each batch, containing all of its payment codes and batch information."
          onCancel={() => setDownloadScope(null)}
          onDownload={(format) => downloadScope && downloadBatches(downloadRows, format, downloadScope)}
        />
      ) : null}

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}
