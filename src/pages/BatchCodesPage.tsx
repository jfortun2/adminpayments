import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { BackIcon, ChevronDownIcon, ChevronUpIcon, DownloadIcon } from "../components/Icons";
import PaymentsToolbar from "../components/PaymentsToolbar";
import tableStyles from "../components/PaymentsTable.module.css";
import Toast from "../components/Toast";
import { getPersonName, usePayments } from "../context/PaymentsContext";
import { batchCodeDownloadToast, codeStatusLabel, downloadCodesForBatches } from "../data/codeExport";
import { formatDate, paymentCodeMatchesQuery, slugify } from "../data/helpers";
import type { CodeStatus, SortDirection } from "../data/types";
import styles from "./PaymentsPages.module.css";

type SortKey = "code" | "status" | "createdAt" | "createdBy" | "redeemedBy" | "redeemedFor";

function highlightPaymentCode(code: string, query: string): ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return code;
  const index = code.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) return code;
  return (
    <>
      {code.slice(0, index)}
      <mark className={tableStyles.codeMatch}>{code.slice(index, index + trimmed.length)}</mark>
      {code.slice(index + trimmed.length)}
    </>
  );
}

export default function BatchCodesPage() {
  const { templateId, batchId = "" } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { templates, batches, codes, people, sections, deactivateCode, reactivateCode } = usePayments();
  const [toast, setToast] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: "deactivate" | "reactivate"; codeId: string } | null>(
    null,
  );
  const firstMatchRef = useRef<HTMLTableRowElement>(null);

  const batch = batches.find((item) => item.id === batchId);
  const template = templates.find((item) => item.id === (templateId ?? batch?.templateId));
  const isGlobal = !templateId;
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch;
  const backTo = isGlobal
    ? `/payments${listSearch ? `?${listSearch}` : ""}`
    : `/templates/${templateId}/payments${listSearch ? `?${listSearch}` : ""}`;
  const backLabel = isGlobal ? "Return to all batches" : "Return to template batches";

  const search = searchParams.get("q") ?? "";
  const statusParam = searchParams.get("status") ?? "";
  const status = (["unused", "redeemed", "deactivated"].includes(statusParam) ? statusParam : "") as CodeStatus | "";
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
      const matchesStatus = status === "" || item.status === status;
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
      const aMatch = paymentCodeMatchesQuery(a.code, search) ? 0 : 1;
      const bMatch = paymentCodeMatchesQuery(b.code, search) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      const result = valueOf(a) < valueOf(b) ? -1 : valueOf(a) > valueOf(b) ? 1 : 0;
      return sortDir === "asc" ? result : -result;
    });
  }, [batch?.name, batchId, codes, people, search, sections, sortDir, sortKey, status]);

  const pendingCode = codes.find((item) => item.id === pendingAction?.codeId);
  const firstMatchId = visibleCodes.find((item) => paymentCodeMatchesQuery(item.code, search))?.id;

  useEffect(() => {
    firstMatchRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [firstMatchId]);

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

  function downloadBatch() {
    if (!batch) return;
    const codeCount = codes.filter((item) => item.batchId === batch.id).length;
    const filename = slugify(batch.name) || batch.id;
    downloadCodesForBatches("combined", [batch], codes, { templates, people, sections }, {
      combinedFilename: `${filename}.csv`,
      zipFilename: `${filename}.zip`,
    });
    setToast(batchCodeDownloadToast("combined", 1, codeCount));
  }

  const batchCodeCount = codes.filter((item) => item.batchId === batchId).length;

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
      <h1 className={`${styles.title} ${styles.batchTitle}`}>Batch: {batch.name}</h1>

      <PaymentsToolbar
        search={search}
        onSearchChange={(value) => updateParams({ q: value })}
        hasActiveFilters={status !== ""}
        onClearFilters={() => updateParams({ q: null, status: null })}
        showBulkActions={false}
        statusFilter={{
          selected: status,
          options: [
            { value: "unused", label: "Unused" },
            { value: "redeemed", label: "Redeemed" },
            { value: "deactivated", label: "Deactivated" },
          ],
          onChange: (value) => updateParams({ status: value || null }),
        }}
        primaryAction={
          <button
            type="button"
            className={tableStyles.downloadBatch}
            disabled={batchCodeCount === 0}
            onClick={downloadBatch}
          >
            <DownloadIcon />
            Download Batch
          </button>
        }
      />

      <div className={tableStyles.tableWrap}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
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
              <th className={tableStyles.actionsCell}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleCodes.length === 0 ? (
              <tr>
                <td colSpan={5} className={tableStyles.empty}>
                  No payment codes match the current search or filters.
                </td>
              </tr>
            ) : (
              visibleCodes.map((item) => {
                const redeemedBy = getPersonName(people, item.redeemedById);
                const section = sections.find((entry) => entry.id === item.redeemedForSectionId);
                const isCodeMatch = paymentCodeMatchesQuery(item.code, search);
                return (
                  <tr
                    key={item.id}
                    ref={item.id === firstMatchId ? firstMatchRef : undefined}
                    data-deactivated={item.status === "deactivated"}
                    data-match={isCodeMatch}
                  >
                    <td className={tableStyles.nameCell}>{highlightPaymentCode(item.code, search)}</td>
                    <td>
                      <span className={statusClass(item.status)}>{codeStatusLabel(item.status)}</span>
                    </td>
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
                          className={
                            item.status === "redeemed"
                              ? `${tableStyles.dangerButton} ${tableStyles.dangerButtonMuted}`
                              : tableStyles.dangerButton
                          }
                          disabled={item.status === "redeemed"}
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

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}
