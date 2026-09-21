import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DownloadReportDialog from "./DownloadReportDialog";
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon, ClearIcon, DownloadIcon, SearchIcon } from "./Icons";
import tableStyles from "./PaymentsTable.module.css";
import toolbarStyles from "./PaymentsToolbar.module.css";
import Toast from "./Toast";
import { usePayments } from "../context/PaymentsContext";
import { formatCount } from "../data/helpers";
import {
  REPORT_GROUP_OPTIONS,
  buildReportRows,
  downloadReport,
  downloadSelectedReports,
  filterEnrollmentsByDate,
  matchesReportQuery,
  parseReportGroup,
  pluralize,
  reportFilename,
  sectionRowsFromReports,
  summarizeSelection,
  type ReportDownloadFormat,
  type ReportRow,
} from "../data/reporting";
import type { SortDirection } from "../data/types";
import styles from "./EnrollmentReporting.module.css";

type SortKey =
  | "name"
  | "template"
  | "institution"
  | "students"
  | "validPaid"
  | "grace"
  | "unpaid"
  | "byCode"
  | "byCard";

function parseSortKey(value: string | null): SortKey {
  if (
    value === "name" ||
    value === "template" ||
    value === "institution" ||
    value === "students" ||
    value === "validPaid" ||
    value === "grace" ||
    value === "unpaid" ||
    value === "byCode" ||
    value === "byCard"
  ) {
    return value;
  }
  return "name";
}

function rowStudentCount(row: ReportRow): number {
  return row.enrollments.length;
}

export default function EnrollmentReporting() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { people, templates, sections, institutions, publishers, codes, enrollments } = usePayments();
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [downloadScope, setDownloadScope] = useState<"selected" | "all" | null>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const searchId = useId();
  const viewAllId = useId();
  const selectAllId = useId();

  const search = searchParams.get("rq") ?? "";
  const groupBy = parseReportGroup(searchParams.get("group"));
  const after = searchParams.get("after") ?? "";
  const before = searchParams.get("before") ?? "";
  const sortKey = parseSortKey(searchParams.get("rsort"));
  const sortDir = (searchParams.get("rdir") as SortDirection) || "asc";
  const hasDateFilter = after !== "" || before !== "";
  const hasActiveFilters = hasDateFilter || search.trim() !== "";

  const catalog = useMemo(
    () => ({ people, templates, sections, institutions, publishers, codes }),
    [codes, institutions, people, publishers, sections, templates],
  );

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    params.set("tab", "reporting");
    Object.entries(next).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
    setSelected([]);
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!dateRef.current?.contains(event.target as Node)) setDateOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !downloadScope) {
        setDateOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [downloadScope]);

  const datedEnrollments = useMemo(
    () => filterEnrollmentsByDate(enrollments, after, before),
    [after, before, enrollments],
  );

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = buildReportRows(datedEnrollments, groupBy, catalog).filter((row) =>
      matchesReportQuery(row, query),
    );

    const valueOf = (row: ReportRow): string | number => {
      if (sortKey === "template") return (row.templateName ?? "").toLowerCase();
      if (sortKey === "institution") return (row.institutionName ?? "").toLowerCase();
      if (sortKey === "students") return rowStudentCount(row);
      if (sortKey === "validPaid") return row.validPaid;
      if (sortKey === "grace") return row.grace;
      if (sortKey === "unpaid") return row.unpaid;
      if (sortKey === "byCode") return row.byCode;
      if (sortKey === "byCard") return row.byCard;
      return row.name.toLowerCase();
    };

    return [...rows].sort((a, b) => {
      const left = valueOf(a);
      const right = valueOf(b);
      const result = left < right ? -1 : left > right ? 1 : 0;
      return sortDir === "asc" ? result : -result;
    });
  }, [catalog, datedEnrollments, groupBy, search, sortDir, sortKey]);

  const visibleEnrollments = useMemo(
    () => visibleRows.flatMap((row) => row.enrollments),
    [visibleRows],
  );
  const totalInstitutions = new Set(visibleEnrollments.map((item) => item.institutionId)).size;
  const totalStudents = visibleEnrollments.length;
  const visibleIds = visibleRows.map((row) => row.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selected.includes(id));
  const selectedRows = visibleRows.filter((row) => selected.includes(row.id));
  const columnCount = groupBy === "section" ? 11 : 9;
  const downloadRows = downloadScope === "all" ? visibleRows : selectedRows;
  const downloadSectionRows = sectionRowsFromReports(downloadRows, catalog);
  const visibleSectionRows = sectionRowsFromReports(visibleRows, catalog);
  const selectionSummary = summarizeSelection(downloadSectionRows, visibleSectionRows);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      updateParams({ rdir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      updateParams({ rsort: key, rdir: key === "name" || key === "template" || key === "institution" ? "asc" : "desc" });
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

  const closeDownloadDialog = useCallback(() => {
    setDownloadScope(null);
  }, []);

  function completeDownload(rows: ReportRow[], format: ReportDownloadFormat) {
    const sectionRows = sectionRowsFromReports(rows, catalog);
    downloadSelectedReports(rows, format, catalog, groupBy);
    setToast(
      format === "zip"
        ? `Downloaded ${pluralize(sectionRows.length, "section report")}.`
        : rows.length === 1
          ? `Downloaded report for ${rows[0].name}.`
          : `Downloaded combined report for ${pluralize(sectionRows.length, "section")}.`,
    );
  }

  function requestDownload(scope: "selected" | "all") {
    const rows = scope === "all" ? visibleRows : selectedRows;
    if (rows.length === 1) {
      completeDownload(rows, "combined");
      return;
    }
    setDownloadScope(scope);
  }

  function handleDownload(format: ReportDownloadFormat) {
    completeDownload(downloadRows, format);
    closeDownloadDialog();
  }

  function identityHeading() {
    if (groupBy === "template") return "Template";
    if (groupBy === "institution") return "Institution";
    if (groupBy === "publisher") return "Publisher";
    return "Course section";
  }

  function identityCell(row: ReportRow) {
    const name = <span className={tableStyles.linkName}>{row.name}</span>;
    if (groupBy === "template" && row.id) {
      return (
        <div className={tableStyles.stacked}>
          <Link className={tableStyles.linkName} to={`/templates/${row.id}`}>
            {row.name}
          </Link>
          {row.subtitle ? <span className={tableStyles.idMeta}>{row.subtitle}</span> : null}
        </div>
      );
    }
    if (groupBy === "section") {
      return (
        <div className={tableStyles.stacked}>
          {name}
          {row.subtitle ? <span className={tableStyles.idMeta}>{row.subtitle}</span> : null}
        </div>
      );
    }
    return name;
  }

  return (
    <div className={styles.reporting}>
      <dl className={styles.summary} aria-live="polite">
        <div className={styles.summaryCard}>
          <dt className={styles.summaryLabel}>Total Institutions</dt>
          <dd className={styles.summaryValue}>{formatCount(totalInstitutions)}</dd>
        </div>
        <div className={styles.summaryCard}>
          <dt className={styles.summaryLabel}>Total Students</dt>
          <dd className={styles.summaryValue}>{formatCount(totalStudents)}</dd>
        </div>
      </dl>

      <div className={toolbarStyles.toolbar}>
        <div className={styles.viewAll}>
          <p className={styles.viewAllLabel} id={viewAllId}>
            View all:
          </p>
          <div className={styles.viewAllOptions} role="group" aria-labelledby={viewAllId}>
            {REPORT_GROUP_OPTIONS.map((option) => {
              const selectedView = groupBy === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={
                    selectedView ? `${styles.viewAllOption} ${styles.viewAllOptionSelected}` : styles.viewAllOption
                  }
                  aria-pressed={selectedView}
                  onClick={() => {
                    if (selectedView) return;
                    updateParams({
                      group: option.value === "section" ? null : option.value,
                      rsort: null,
                      rdir: null,
                    });
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className={toolbarStyles.topRow}>
          <div className={toolbarStyles.searchGroup}>
          <div className={toolbarStyles.searchBox}>
            <SearchIcon className={toolbarStyles.searchIcon} />
            <label className="sr-only" htmlFor={searchId}>
              Search report
            </label>
            <input
              id={searchId}
              className={toolbarStyles.searchInput}
              value={search}
              placeholder="Search report"
              onChange={(event) => updateParams({ rq: event.target.value })}
            />
          </div>

          <div className={toolbarStyles.filterControls}>
            <div className={styles.dropdownWrap} ref={dateRef}>
              <button
                type="button"
                className={toolbarStyles.toolButton}
                aria-expanded={dateOpen}
                aria-haspopup="dialog"
                onClick={() => setDateOpen((current) => !current)}
              >
                Filter by Date
                {hasDateFilter ? <span className={toolbarStyles.filterDot} aria-hidden="true" /> : null}
                <ChevronDownIcon />
              </button>
          {dateOpen ? (
            <div className={styles.datePopover} role="dialog" aria-label="Date">
              <h2 className={styles.dateTitle}>Date</h2>
              <p className={styles.dateHelp}>If both dates are specified, they will be interpreted as a range.</p>
              <div className={styles.dateFields}>
                <span>is after</span>
                <label className={styles.dateField}>
                  <span className="sr-only">Is after</span>
                  <input
                    className={styles.dateInput}
                    type="datetime-local"
                    value={after}
                    onChange={(event) => updateParams({ after: event.target.value })}
                  />
                  <CalendarIcon className={styles.calendarIcon} />
                </label>
                <span>and/or before</span>
                <label className={styles.dateField}>
                  <span className="sr-only">And/or before</span>
                  <input
                    className={styles.dateInput}
                    type="datetime-local"
                    value={before}
                    onChange={(event) => updateParams({ before: event.target.value })}
                  />
                  <CalendarIcon className={styles.calendarIcon} />
                </label>
              </div>
              <button
                type="button"
                className={styles.dateClear}
                disabled={!hasDateFilter}
                onClick={() => updateParams({ after: null, before: null })}
              >
                Clear dates
              </button>
            </div>
          ) : null}
            </div>
            <button
              type="button"
              className={toolbarStyles.toolButton}
              onClick={() => {
                updateParams({ rq: null, after: null, before: null });
                setDateOpen(false);
              }}
              disabled={!hasActiveFilters}
            >
              <ClearIcon className={toolbarStyles.toolIcon} />
              Clear All Filters
            </button>
          </div>
        </div>
        </div>

        <div className={toolbarStyles.selectionRow}>
        <div className={toolbarStyles.selectedCount}>
          <input
            id={selectAllId}
            className={toolbarStyles.checkbox}
            type="checkbox"
            checked={allVisibleSelected}
            ref={(element) => {
              if (element) element.indeterminate = someVisibleSelected && !allVisibleSelected;
            }}
            onChange={() => setSelected(allVisibleSelected ? [] : visibleIds)}
          />
          <label htmlFor={selectAllId} className={toolbarStyles.selectedLabel} role="status">
            <strong>{selected.length}</strong> selected
          </label>
        </div>
        <div className={toolbarStyles.downloadActions}>
          <button
            type="button"
            className={toolbarStyles.downloadMuted}
            onClick={() => requestDownload("selected")}
            disabled={selected.length === 0}
          >
            <DownloadIcon />
            Download selected
          </button>
          <button
            type="button"
            className={toolbarStyles.downloadAll}
            onClick={() => requestDownload("all")}
            disabled={visibleRows.length === 0}
          >
            <DownloadIcon />
            Download all
          </button>
        </div>
      </div>
      </div>

      <div className={tableStyles.tableWrap}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th className={tableStyles.checkCell} />
              <th className={styles.identityWide}>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("name")}>
                  {identityHeading()}
                  {sortIcon("name")}
                </button>
              </th>
              {groupBy === "section" ? (
                <>
                  <th>
                    <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("template")}>
                      Template
                      {sortIcon("template")}
                    </button>
                  </th>
                  <th>
                    <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("institution")}>
                      Institution
                      {sortIcon("institution")}
                    </button>
                  </th>
                </>
              ) : null}
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("students")}>
                  Total students
                  {sortIcon("students")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("validPaid")}>
                  Valid paid
                  {sortIcon("validPaid")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("grace")}>
                  Grace
                  {sortIcon("grace")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("unpaid")}>
                  Unpaid
                  {sortIcon("unpaid")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("byCode")}>
                  By code
                  {sortIcon("byCode")}
                </button>
              </th>
              <th>
                <button type="button" className={tableStyles.sortButton} onClick={() => toggleSort("byCard")}>
                  By card
                  {sortIcon("byCard")}
                </button>
              </th>
              <th className={tableStyles.downloadCell} />
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className={tableStyles.empty}>
                  No enrollment reports match the current search or date range.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id} data-selected={selected.includes(row.id)}>
                  <td className={tableStyles.checkCell}>
                    <input
                      className={tableStyles.checkbox}
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      aria-label={`Select ${row.name}`}
                      onChange={() => toggleRow(row.id)}
                    />
                  </td>
                  <td>{identityCell(row)}</td>
                  {groupBy === "section" ? (
                    <>
                      <td>
                        {row.templateId ? (
                          <div className={tableStyles.stacked}>
                            <Link className={tableStyles.linkName} to={`/templates/${row.templateId}`}>
                              {row.templateName}
                            </Link>
                            <span className={tableStyles.idMeta}>ID: {row.templateId}</span>
                          </div>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td>
                        <span className={tableStyles.linkName}>{row.institutionName ?? "--"}</span>
                      </td>
                    </>
                  ) : null}
                  <td className={tableStyles.metric}>{formatCount(rowStudentCount(row))}</td>
                  <td className={tableStyles.metric}>{formatCount(row.validPaid)}</td>
                  <td className={tableStyles.metric}>{formatCount(row.grace)}</td>
                  <td className={tableStyles.metric}>{formatCount(row.unpaid)}</td>
                  <td className={tableStyles.metric}>{formatCount(row.byCode)}</td>
                  <td className={tableStyles.metric}>{formatCount(row.byCard)}</td>
                  <td className={tableStyles.downloadCell}>
                    <button
                      type="button"
                      className={toolbarStyles.downloadAll}
                      onClick={() => {
                        downloadReport(reportFilename([row], false), row.enrollments, catalog, groupBy);
                        setToast(`Downloaded report for ${row.name}.`);
                      }}
                    >
                      <DownloadIcon />
                      Download report
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {downloadScope ? (
        <DownloadReportDialog
          summary={selectionSummary}
          onCancel={closeDownloadDialog}
          onDownload={handleDownload}
        />
      ) : null}

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}
