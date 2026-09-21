import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import DownloadReportDialog from "../components/DownloadReportDialog";
import EnrollmentReporting from "../components/EnrollmentReporting";
import { ChevronDownIcon, ChevronIcon, ChevronUpIcon } from "../components/Icons";
import PaymentsToolbar from "../components/PaymentsToolbar";
import tableStyles from "../components/PaymentsTable.module.css";
import Toast from "../components/Toast";
import { getPersonName, usePayments } from "../context/PaymentsContext";
import {
  batchCodeDownloadSummary,
  batchCodeDownloadToast,
  codesInBatches,
  downloadCodesForBatches,
} from "../data/codeExport";
import { formatDate } from "../data/helpers";
import type { ReportDownloadFormat } from "../data/reporting";
import type { BatchStatus, SortDirection } from "../data/types";
import styles from "./PaymentsPages.module.css";

type SortKey = "name" | "template" | "createdAt" | "createdBy";

function parseList(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export default function GlobalPaymentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { templates, batches, codes, people, sections, deactivateBatch, reactivateBatch } = usePayments();
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: "deactivate" | "reactivate"; batchId: string } | null>(
    null,
  );
  const [downloadScope, setDownloadScope] = useState<"selected" | "all" | null>(null);

  const tab = searchParams.get("tab") === "reporting" ? "reporting" : "codes";
  const search = searchParams.get("q") ?? "";
  const createdBy = parseList(searchParams.get("createdBy"));
  const templateFilter = parseList(searchParams.get("template"));
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

  const visibleBatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchingBatchIdsFromCodes = new Set(
      codes
        .filter((item) => item.code.toLowerCase().includes(query))
        .map((item) => item.batchId),
    );

    const filtered = batches.filter((batch) => {
      const templateName = templates.find((item) => item.id === batch.templateId)?.name.toLowerCase() ?? "";
      const matchesQuery =
        query === "" ||
        batch.name.toLowerCase().includes(query) ||
        templateName.includes(query) ||
        matchingBatchIdsFromCodes.has(batch.id);
      const matchesCreator = createdBy.length === 0 || createdBy.includes(batch.createdById);
      const matchesTemplate = templateFilter.length === 0 || templateFilter.includes(batch.templateId);
      const matchesStatus = status.length === 0 || status.includes(batch.status);
      return matchesQuery && matchesCreator && matchesTemplate && matchesStatus;
    });

    const valueOf = (batch: (typeof filtered)[number]): string => {
      if (sortKey === "name") return batch.name.toLowerCase();
      if (sortKey === "createdBy") return getPersonName(people, batch.createdById).toLowerCase();
      if (sortKey === "template") {
        return templates.find((item) => item.id === batch.templateId)?.name.toLowerCase() ?? "";
      }
      return batch.createdAt;
    };

    return [...filtered].sort((a, b) => {
      const result = valueOf(a) < valueOf(b) ? -1 : valueOf(a) > valueOf(b) ? 1 : 0;
      return sortDir === "asc" ? result : -result;
    });
  }, [batches, codes, createdBy, people, search, sortDir, sortKey, status, templateFilter, templates]);

  const visibleIds = visibleBatches.map((batch) => batch.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selected.includes(id));
  const hasActiveFilters = createdBy.length > 0 || status.length > 0 || templateFilter.length > 0;
  const pendingBatch = batches.find((batch) => batch.id === pendingAction?.batchId);

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
    const codeCount = codesInBatches(codes, rows).length;
    downloadCodesForBatches(format, rows, codes, { templates, people, sections }, {
      combinedFilename: scope === "all" ? "payment-codes.csv" : "payment-codes-selected.csv",
      zipFilename: scope === "all" ? "payment-codes.zip" : "payment-codes-selected.zip",
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

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/">Admin Panel</Link>
        <ChevronIcon className={styles.crumbChevron} />
        <span aria-current="page">Manage All Payments</span>
      </nav>
      <h1 className={styles.title}>Payments</h1>
      <p className={styles.subtitle}>Manage all payment codes and review paid enrollment activity.</p>

      <div className={styles.tabs} role="tablist" aria-label="Payments">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "codes"}
          className={tab === "codes" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => updateParams({ tab: null })}
        >
          Payment codes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "reporting"}
          className={tab === "reporting" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => updateParams({ tab: "reporting" })}
        >
          Enrollment reporting
        </button>
        <div className={styles.tabSpacer} />
      </div>

      {tab === "reporting" ? (
        <EnrollmentReporting />
      ) : (
        <>
          <PaymentsToolbar
            search={search}
            onSearchChange={(value) => updateParams({ q: value })}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => updateParams({ q: null, createdBy: [], status: [], template: [] })}
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
                id: "template",
                label: "Template",
                options: templateOptions,
                selected: templateFilter,
                onChange: (value) => updateParams({ template: value }),
              },
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
                    <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("template")}>
                      Template
                      {sortIcon("template")}
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
                    <td colSpan={6} className={tableStyles.empty}>
                      No payment batches match the current search or filters.
                    </td>
                  </tr>
                ) : (
                  visibleBatches.map((batch) => {
                    const template = templates.find((item) => item.id === batch.templateId);
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
                          <button
                            type="button"
                            className={tableStyles.nameButton}
                            onClick={() =>
                              navigate(`/payments/batches/${batch.id}`, {
                                state: { listSearch: searchParams.toString() },
                              })
                            }
                          >
                            {batch.name}
                          </button>
                        </td>
                        <td>
                          {template ? (
                            <div className={tableStyles.stacked}>
                              <Link className={tableStyles.linkName} to={`/templates/${template.id}/payments`}>
                                {template.name}
                              </Link>
                              <span className={tableStyles.templateMeta}>Template</span>
                            </div>
                          ) : (
                            "--"
                          )}
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
        </>
      )}

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
