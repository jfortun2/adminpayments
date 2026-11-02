import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import BatchFilterPanel, { type BatchFilterDraft } from "./BatchFilterPanel";
import checkIcon from "../assets/check.svg";
import { ChevronDownIcon, ClearIcon, DownloadIcon, FilterIcon, SearchIcon } from "./Icons";
import styles from "./PaymentsToolbar.module.css";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export interface StatusFilter {
  selected: string;
  options: FilterOption[];
  onChange: (selected: string) => void;
}

export interface BatchFilters {
  after: string;
  before: string;
  showTemplate?: boolean;
  templateOptions?: FilterOption[];
  selectedTemplates?: string[];
  creatorOptions: FilterOption[];
  selectedCreator: string;
  onApply: (draft: BatchFilterDraft) => void;
}

interface PaymentsToolbarProps {
  search: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  filterGroups?: FilterGroup[];
  statusFilter?: StatusFilter;
  batchFilters?: BatchFilters;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  showBulkActions?: boolean;
  selectedCount?: number;
  allVisibleSelected?: boolean;
  someVisibleSelected?: boolean;
  onToggleSelectAll?: () => void;
  onDownloadSelected?: () => void;
  onDownloadAll?: () => void;
  downloadSelectedDisabled?: boolean;
  downloadAllDisabled?: boolean;
  primaryAction?: ReactNode;
}

export default function PaymentsToolbar({
  search,
  searchPlaceholder = "Search code or batch",
  onSearchChange,
  filterGroups = [],
  statusFilter,
  batchFilters,
  onClearFilters,
  hasActiveFilters,
  showBulkActions = true,
  selectedCount = 0,
  allVisibleSelected = false,
  someVisibleSelected = false,
  onToggleSelectAll,
  onDownloadSelected,
  onDownloadAll,
  downloadSelectedDisabled = false,
  downloadAllDisabled = false,
  primaryAction,
}: PaymentsToolbarProps) {
  const [open, setOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchId = useId();
  const selectAllId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!filterRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function toggleOption(group: FilterGroup, value: string) {
    if (group.selected.includes(value)) {
      group.onChange(group.selected.filter((item) => item !== value));
    } else {
      group.onChange([...group.selected, value]);
    }
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.topRow}>
        <div className={styles.searchGroup}>
          <div className={styles.searchBox}>
            <SearchIcon className={styles.searchIcon} />
            <label className="sr-only" htmlFor={searchId}>
              {searchPlaceholder}
            </label>
            <input
              id={searchId}
              className={styles.searchInput}
              value={search}
              placeholder={searchPlaceholder}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <div className={styles.filterControls} ref={filterRef}>
            {statusFilter ? (
              <div className={styles.statusFilterWrap}>
                <button
                  ref={filterButtonRef}
                  type="button"
                  className={styles.statusFilter}
                  data-active={statusFilter.selected ? "true" : undefined}
                  aria-expanded={open}
                  aria-haspopup="listbox"
                  aria-controls={open ? `${searchId}-status` : undefined}
                  onClick={() => setOpen((current) => !current)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setOpen(false);
                    }
                  }}
                >
                  {statusFilter.options.find((option) => option.value === statusFilter.selected)?.label ?? "Status"}
                  <ChevronDownIcon />
                </button>
                {open ? (
                  <div className={styles.statusMenu} id={`${searchId}-status`} role="listbox" aria-label="Status">
                    {statusFilter.options.map((option) => {
                      const isSelected = option.value === statusFilter.selected;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={styles.statusOption}
                          onClick={() => {
                            statusFilter.onChange(isSelected ? "" : option.value);
                            setOpen(false);
                            filterButtonRef.current?.focus();
                          }}
                        >
                          {option.label}
                          {isSelected ? <img src={checkIcon} alt="" width={16} height={16} /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
            <button
              ref={filterButtonRef}
              type="button"
              className={styles.toolButton}
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpen((current) => !current)}
            >
              <FilterIcon className={styles.toolIcon} />
              Filter
              {hasActiveFilters ? <span className={styles.filterDot} aria-hidden="true" /> : null}
            </button>
            )}
            {open && !statusFilter && batchFilters ? (
              <BatchFilterPanel
                after={batchFilters.after}
                before={batchFilters.before}
                showTemplate={batchFilters.showTemplate}
                templateOptions={batchFilters.templateOptions}
                selectedTemplates={batchFilters.selectedTemplates}
                creatorOptions={batchFilters.creatorOptions}
                selectedCreator={batchFilters.selectedCreator}
                onCancel={() => setOpen(false)}
                onApply={(draft) => {
                  batchFilters.onApply(draft);
                  setOpen(false);
                }}
              />
            ) : null}
            {open && !statusFilter && !batchFilters ? (
              <div className={styles.popover} role="dialog" aria-label="Filters">
                {filterGroups.map((group) => (
                  <fieldset key={group.id} className={styles.fieldset}>
                    <legend className={styles.legend}>{group.label}</legend>
                    {group.options.map((option) => {
                      const optionId = `${group.id}-${option.value}`;
                      return (
                        <label key={option.value} className={styles.option} htmlFor={optionId}>
                          <input
                            id={optionId}
                            type="checkbox"
                            checked={group.selected.includes(option.value)}
                            onChange={() => toggleOption(group, option.value)}
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </fieldset>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              className={styles.toolButton}
              onClick={onClearFilters}
              disabled={!hasActiveFilters && search.trim() === ""}
            >
              <ClearIcon className={styles.toolIcon} />
              Clear All Filters
            </button>
          </div>
        </div>
        {primaryAction}
      </div>

      {showBulkActions ? (
      <div className={styles.selectionRow}>
        <div className={styles.selectedCount}>
          <input
            id={selectAllId}
            className={styles.checkbox}
            type="checkbox"
            checked={allVisibleSelected}
            ref={(element) => {
              if (element) element.indeterminate = someVisibleSelected && !allVisibleSelected;
            }}
            onChange={onToggleSelectAll}
          />
          <label htmlFor={selectAllId} className={styles.selectedLabel}>
            <strong>{selectedCount}</strong> selected
          </label>
        </div>
        <div className={styles.downloadActions}>
          <button
            type="button"
            className={styles.downloadMuted}
            onClick={onDownloadSelected}
            disabled={downloadSelectedDisabled}
          >
            <DownloadIcon />
            Download selected
          </button>
          <button
            type="button"
            className={styles.downloadAll}
            onClick={onDownloadAll}
            disabled={downloadAllDisabled}
          >
            <DownloadIcon />
            Download all
          </button>
        </div>
      </div>
      ) : null}
    </div>
  );
}
