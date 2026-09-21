import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WorkspaceNav, WorkspaceSupport } from "./WorkspaceSwitcher";
import styles from "./WorkspaceChrome.module.css";

interface WorkspaceChromeProps {
  title: string;
  authorPath?: string;
  children: ReactNode;
}

function goBack(navigate: ReturnType<typeof useNavigate>, fallback = "/") {
  const idx = window.history.state?.idx;
  if (typeof idx === "number" && idx > 0) {
    navigate(-1);
    return;
  }
  navigate(fallback);
}

export function WorkspaceHeader({ title }: { title?: string }) {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <button type="button" className={styles.back} aria-label="Back" onClick={() => goBack(navigate)}>
        ‹
      </button>
      <div className={styles.brand}>
        <span className={styles.logoMark} aria-hidden="true" />
        <span className={styles.logoText}>OLI Torus</span>
        <span className={styles.testBadge}>TEST</span>
      </div>
      {title ? <h1 className={styles.title}>{title}</h1> : <span />}
      <div className={styles.avatar} aria-label="Jessica Fortunato">
        JF
      </div>
    </header>
  );
}

export default function WorkspaceChrome({ title, authorPath, children }: WorkspaceChromeProps) {
  return (
    <div className={styles.shell}>
      <WorkspaceHeader title={title} />
      <div className={styles.body}>
        <aside className={styles.sidebar} aria-label="Workspace">
          <WorkspaceNav active="author" authorTo={authorPath} />
          <p className={styles.sectionLabel}>{title}</p>
          <nav className={styles.projectNav} aria-label="Project">
            <span className={styles.navItem}>Overview</span>
            <span className={styles.navItem}>Create</span>
            <span className={styles.navItem}>Publish</span>
            <span className={`${styles.navItem} ${styles.subNavActive}`}>Templates</span>
            <span className={styles.navItem}>Improve</span>
          </nav>
          <div className={styles.sidebarFooter}>
            <WorkspaceSupport />
            <button type="button" className={styles.exit}>
              ← Exit Project
            </button>
          </div>
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

export function OverviewRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.row}>
      <div className={styles.rowCopy}>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className={styles.rowBody}>{children}</div>
    </section>
  );
}

export function ActionRow({
  control,
  text,
}: {
  control: ReactNode;
  text: string;
}) {
  return (
    <div className={styles.actionRow}>
      <div className={styles.actionControl}>{control}</div>
      <p>{text}</p>
    </div>
  );
}

export function ActionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className={styles.actionLink} to={to}>
      {children}
    </Link>
  );
}

export function SecondaryButton({ children }: { children: ReactNode }) {
  return (
    <button type="button" className={styles.secondaryButton}>
      {children}
    </button>
  );
}

export function PrimaryButton({ children }: { children: ReactNode }) {
  return (
    <button type="button" className={styles.primaryButton}>
      {children}
    </button>
  );
}
