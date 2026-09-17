import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import CreateBatchPanel from "../components/CreateBatchPanel";
import { ChevronDownIcon, ChevronIcon, ChevronUpIcon } from "../components/Icons";
import PaymentsToolbar from "../components/PaymentsToolbar";
import tableStyles from "../components/PaymentsTable.module.css";
import toolbarStyles from "../components/PaymentsToolbar.module.css";
import Toast from "../components/Toast";
import { getPersonName, usePayments } from "../context/PaymentsContext";
import { downloadCsv, formatDate } from "../data/helpers";
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
  const { templates, batches, codes, people, createBatch, deactivateBatch } = usePayments();
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingBatchId, setPendingBatchId] = useState<string | null>(null);

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

  const visibleBatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchingBatchIdsFromCodes = new Set(
      codes
        .filter((item) => item.code.toLowerCase().includes(query))
        .map((item) => item.batchId),
    );

    const filtered = templateBatches.filter((batch) => {
      const matchesQuery =
        query === "" ||
        batch.name.toLowerCase().includes(query) ||
        matchingBatchIdsFromCodes.has(batch.id);
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
  }, [codes, createdBy, people, search, sortDir, sortKey, status, templateBatches]);

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

  function downloadBatches(rows: typeof visibleBatches, filename: string, message: string) {
    downloadCsv(filename, [
      ["Batch Name", "Created", "Created by", "Status"],
      ...rows.map((batch) => [
        batch.name,
        formatDate(batch.createdAt),
        getPersonName(people, batch.createdById),
        batch.status === "active" ? "Active" : "Deactivated",
      ]),
    ]);
    setToast(message);
  }

  const pendingBatch = templateBatches.find((batch) => batch.id === pendingBatchId);

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
        onDownloadSelected={() => {
          const rows = visibleBatches.filter((batch) => selected.includes(batch.id));
          downloadBatches(
            rows,
            `${template.name}-batches-selected.csv`,
            `Downloaded ${rows.length} selected batch${rows.length === 1 ? "" : "es"}.`,
          );
        }}
        onDownloadAll={() =>
          downloadBatches(
            visibleBatches,
            `${template.name}-batches.csv`,
            `Downloaded ${visibleBatches.length} batch${visibleBatches.length === 1 ? "" : "es"}.`,
          )
        }
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
              visibleBatches.map((batch) => (
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
                        navigate(`/templates/${templateId}/payments/batches/${batch.id}`, {
                          state: { listSearch: searchParams.toString() },
                        })
                      }
                    >
                      {batch.name}
                    </button>
                  </td>
                  <td>{formatDate(batch.createdAt)}</td>
                  <td>{getPersonName(people, batch.createdById)}</td>
                  <td className={tableStyles.actionsCell}>
                    {batch.status === "active" ? (
                      <button
                        type="button"
                        className={tableStyles.dangerButton}
                        onClick={() => setPendingBatchId(batch.id)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <span className={tableStyles.deactivatedLabel}>Deactivated</span>
                    )}
                  </td>
                </tr>
              ))
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

      {pendingBatch ? (
        <ConfirmDialog
          title="Deactivate this batch?"
          message={`Deactivate ${pendingBatch.name}? Unused codes in this batch will no longer be redeemable.`}
          confirmLabel="Deactivate"
          onCancel={() => setPendingBatchId(null)}
          onConfirm={() => {
            deactivateBatch(pendingBatch.id);
            setPendingBatchId(null);
            setToast(`${pendingBatch.name} was deactivated.`);
          }}
        />
      ) : null}

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}
