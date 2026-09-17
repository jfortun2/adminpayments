import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./WorkspaceChrome.module.css";

interface WorkspaceChromeProps {
  title: string;
  children: ReactNode;
}

export default function WorkspaceChrome({ title, children }: WorkspaceChromeProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button type="button" className={styles.collapse} aria-label="Collapse sidebar">
          ‹
        </button>
        <div className={styles.brand}>
          <span className={styles.logoMark} aria-hidden="true" />
          <span className={styles.logoText}>OLI Torus</span>
          <span className={styles.testBadge}>TEST</span>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.avatar} aria-label="Jessica Fortunato">
          JF
        </div>
      </header>
      <div className={styles.body}>
        <aside className={styles.sidebar} aria-label="Workspace">
          <p className={styles.sectionLabel}>Workspace</p>
          <nav className={styles.workspaceNav}>
            <span className={`${styles.navItem} ${styles.navItemActive}`}>Course Author</span>
            <span className={styles.navItem}>Instructor</span>
            <span className={styles.navItem}>Student</span>
          </nav>
          <p className={styles.sectionLabel}>{title}</p>
          <nav className={styles.projectNav} aria-label="Project">
            <span className={styles.navItem}>Overview</span>
            <span className={styles.navItem}>Create</span>
            <span className={styles.navItem}>Publish</span>
            <span className={`${styles.navItem} ${styles.subNavActive}`}>Templates</span>
            <span className={styles.navItem}>Improve</span>
          </nav>
          <div className={styles.sidebarFooter}>
            <span className={styles.navItem}>Support</span>
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
