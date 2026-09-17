import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { parseCodeCount } from "../data/helpers";
import styles from "./CreateBatchPanel.module.css";

interface CreateBatchPanelProps {
  onClose: () => void;
  onCreate: (input: { name: string; count: number }) => void;
}

export default function CreateBatchPanel({ onClose, onCreate }: CreateBatchPanelProps) {
  const titleId = useId();
  const descriptionId = useId();
  const countId = useId();
  const nameId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLInputElement>(null);
  const [count, setCount] = useState("100");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const parsedCount = parseCodeCount(count);
  const nameError = name.trim() === "";
  const countError =
    count.trim() === ""
      ? "Enter a whole number from 1 to 2,500."
      : parsedCount === null
        ? "Enter a whole number from 1 to 2,500."
        : null;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    countRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
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

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (parsedCount === null || nameError) return;
    onCreate({ name: name.trim(), count: parsedCount });
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div>
            <h2 id={titleId} className={styles.title}>
              Create New Batch of Payment Codes
            </h2>
            <p id={descriptionId} className={styles.support}>
              Create up to 2,500 codes in one batch
            </p>
          </div>

          <div className={styles.field}>
            <label htmlFor={countId} className={styles.label}>
              Number of codes
            </label>
            <input
              ref={countRef}
              id={countId}
              className={styles.input}
              inputMode="numeric"
              autoComplete="off"
              value={count}
              aria-invalid={submitted && Boolean(countError)}
              aria-describedby={submitted && countError ? `${countId}-error` : undefined}
              onChange={(event) => setCount(event.target.value)}
            />
            {submitted && countError ? (
              <p id={`${countId}-error`} className={styles.error}>
                {countError}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor={nameId} className={styles.label}>
              Batch name
            </label>
            <input
              id={nameId}
              className={styles.input}
              value={name}
              aria-invalid={submitted && nameError}
              aria-describedby={submitted && nameError ? `${nameId}-error` : undefined}
              onChange={(event) => setName(event.target.value)}
            />
            {submitted && nameError ? (
              <p id={`${nameId}-error`} className={styles.error}>
                Enter a batch name.
              </p>
            ) : null}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primary}>
              {parsedCount ? `Generate ${parsedCount.toLocaleString()} codes` : "Generate codes"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
