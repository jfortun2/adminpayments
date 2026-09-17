import { useEffect, useId, useRef, useState } from "react";
import type { ReportDownloadFormat } from "../data/reporting";
import styles from "./DownloadReportDialog.module.css";

interface DownloadReportDialogProps {
  summary: string;
  onCancel: () => void;
  onDownload: (format: ReportDownloadFormat) => void;
}

const FORMAT_OPTIONS: {
  value: ReportDownloadFormat;
  title: string;
  description: string;
}[] = [
  {
    value: "combined",
    title: "One combined CSV",
    description: "All enrollment records will be included in one file.",
  },
  {
    value: "zip",
    title: "Separate CSVs in a ZIP",
    description: "A separate file will be created for each course section.",
  },
];

export default function DownloadReportDialog({
  summary,
  onCancel,
  onDownload,
}: DownloadReportDialogProps) {
  const titleId = useId();
  const summaryId = useId();
  const formatId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRadioRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<ReportDownloadFormat>("combined");

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    firstRadioRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus();
    };
  }, [onCancel]);

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={summaryId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={styles.title}>
          Download enrollment report
        </h2>
        <p id={summaryId} className={styles.summary}>
          {summary}
        </p>

        <fieldset className={styles.fieldset}>
          <legend id={formatId} className={styles.legend}>
            File organization
          </legend>
          {FORMAT_OPTIONS.map((option, index) => {
            const optionId = `${formatId}-${option.value}`;
            const titleOptionId = `${optionId}-title`;
            const descriptionId = `${optionId}-description`;
            const selected = format === option.value;
            return (
              <label
                key={option.value}
                className={selected ? `${styles.option} ${styles.optionSelected}` : styles.option}
                htmlFor={optionId}
              >
                <input
                  ref={index === 0 ? firstRadioRef : undefined}
                  id={optionId}
                  className={styles.radio}
                  type="radio"
                  name={formatId}
                  value={option.value}
                  checked={selected}
                  aria-labelledby={titleOptionId}
                  aria-describedby={descriptionId}
                  onChange={() => setFormat(option.value)}
                />
                <span className={styles.optionCopy}>
                  <span id={titleOptionId} className={styles.optionTitle}>
                    {option.title}
                  </span>
                  <span id={descriptionId} className={styles.optionDescription}>
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.primary} onClick={() => onDownload(format)}>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
