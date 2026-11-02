import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarIcon, ChevronDownIcon, SearchIcon } from "./Icons";
import styles from "./BatchFilterPanel.module.css";

interface FilterOption {
  value: string;
  label: string;
}

export interface BatchFilterDraft {
  after: string;
  before: string;
  templates: string[];
  creator: string;
}

interface BatchFilterPanelProps {
  after: string;
  before: string;
  showTemplate?: boolean;
  templateOptions?: FilterOption[];
  selectedTemplates?: string[];
  creatorOptions: FilterOption[];
  selectedCreator: string;
  onApply: (draft: BatchFilterDraft) => void;
  onCancel: () => void;
}

export default function BatchFilterPanel({
  after,
  before,
  showTemplate = true,
  templateOptions = [],
  selectedTemplates = [],
  creatorOptions,
  selectedCreator,
  onApply,
  onCancel,
}: BatchFilterPanelProps) {
  const afterId = useId();
  const beforeId = useId();
  const afterRef = useRef<HTMLInputElement>(null);
  const [draftAfter, setDraftAfter] = useState(after);
  const [draftBefore, setDraftBefore] = useState(before);
  const [draftTemplates, setDraftTemplates] = useState(selectedTemplates);
  const [draftCreator, setDraftCreator] = useState(selectedCreator);

  useEffect(() => {
    afterRef.current?.focus();
  }, []);

  function onPanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onCancel();
    }
  }

  return (
    <div
      className={styles.panel}
      role="dialog"
      aria-label="Filter batches"
      onKeyDown={onPanelKeyDown}
    >
      <div className={styles.section}>
        <p className={styles.sectionLabel} id="creation-date-label">
          Creation Date
        </p>
        <p className={styles.hint} id="creation-date-hint">
          If both dates are specified, they will be interpreted as a range.
        </p>
        <div className={styles.dateRow}>
          <label className={styles.dateLabel} htmlFor={afterId}>
            After
          </label>
          <span className={styles.dateField}>
            <input
              ref={afterRef}
              id={afterId}
              className={styles.dateInput}
              type="datetime-local"
              value={draftAfter}
              aria-describedby="creation-date-hint"
              onChange={(event) => setDraftAfter(event.target.value)}
            />
            <CalendarIcon className={styles.dateIcon} />
          </span>
          <label className={styles.dateLabel} htmlFor={beforeId}>
            and/or before
          </label>
          <span className={styles.dateField}>
            <input
              id={beforeId}
              className={styles.dateInput}
              type="datetime-local"
              value={draftBefore}
              aria-describedby="creation-date-hint"
              onChange={(event) => setDraftBefore(event.target.value)}
            />
            <CalendarIcon className={styles.dateIcon} />
          </span>
        </div>
      </div>

      {showTemplate ? (
        <SearchSelect
          label="Template"
          options={templateOptions}
          selected={draftTemplates}
          onChange={setDraftTemplates}
        />
      ) : null}

      <SingleSelect
        label="Created by"
        options={creatorOptions}
        selected={draftCreator}
        onChange={setDraftCreator}
      />

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.apply}
          onClick={() =>
            onApply({
              after: draftAfter,
              before: draftBefore,
              templates: showTemplate ? draftTemplates : [],
              creator: draftCreator,
            })
          }
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function SearchSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const labelId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function toggleValue(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && matches[activeIndex]) {
      event.preventDefault();
      toggleValue(matches[activeIndex].value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setQuery("");
    } else if (event.key === "Backspace" && query === "" && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }
  }

  const selectedLabels = selected
    .map((value) => options.find((option) => option.value === value)?.label ?? value)
    .join(", ");

  function openMenu() {
    setOpen(true);
  }

  return (
    <div className={styles.field}>
      <span className={styles.sectionLabel} id={labelId}>
        {label}
      </span>
      <div
        className={open ? `${styles.selectBox} ${styles.selectBoxOpen}` : styles.selectBox}
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest("button, input")) return;
          event.preventDefault();
          openMenu();
        }}
      >
        <div className={styles.selectValue}>
          {selected.map((value) => {
            const optionLabel = options.find((option) => option.value === value)?.label ?? value;
            return (
              <span key={value} className={styles.chip}>
                <span className={styles.chipLabel}>{optionLabel}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  aria-label={`Remove ${optionLabel}`}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={() => onChange(selected.filter((item) => item !== value))}
                >
                  ×
                </button>
              </span>
            );
          })}
          {open ? (
            <div className={styles.inlineSearch}>
              <SearchIcon className={styles.menuSearchIcon} />
              <label className="sr-only" htmlFor={`${listId}-search`}>
                Search {label}
              </label>
              <input
                ref={inputRef}
                id={`${listId}-search`}
                className={styles.menuSearchInput}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={matches[activeIndex] ? `${listId}-${matches[activeIndex].value}` : undefined}
                value={query}
                placeholder={selected.length === 0 ? "Search" : ""}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onSearchKeyDown}
              />
            </div>
          ) : selected.length === 0 ? (
            <span className={styles.placeholder}>Select option</span>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.chevron}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={selectedLabels ? `${label}: ${selectedLabels}` : `${label}: Select option`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => {
            setOpen((current) => !current);
            setQuery("");
          }}
        >
          <ChevronDownIcon />
        </button>
      </div>
      {open ? (
        <ul className={`${styles.optionList} ${styles.optionListAttached}`} id={listId} role="listbox" aria-multiselectable="true" aria-labelledby={labelId}>
          {matches.length === 0 ? (
            <li className={styles.emptyOption}>No matches</li>
          ) : (
            matches.map((option, index) => {
              const isSelected = selected.includes(option.value);
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-${option.value}`}
                    role="option"
                    aria-selected={isSelected}
                    className={index === activeIndex ? `${styles.option} ${styles.optionActive}` : styles.option}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => toggleValue(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

function SingleSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  selected: string;
  onChange: (selected: string) => void;
}) {
  const labelId = useId();
  const valueId = useId();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === selected)?.label;

  return (
    <div className={styles.field}>
      <span className={styles.sectionLabel} id={labelId}>
        {label}
      </span>
      <button
        type="button"
        className={styles.selectBox}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span id={valueId} className={selectedLabel ? styles.selectedText : styles.placeholder}>
          {selectedLabel ?? "Select option"}
        </span>
        <ChevronDownIcon />
      </button>
      {open ? (
        <ul className={styles.optionList} id={listId} role="listbox" aria-labelledby={labelId}>
          {options.map((option) => (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={option.value === selected}
                className={option.value === selected ? `${styles.option} ${styles.optionActive}` : styles.option}
                onClick={() => {
                  onChange(option.value === selected ? "" : option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
