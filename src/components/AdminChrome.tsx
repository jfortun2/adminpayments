import type { ReactNode } from "react";
import avatar from "../assets/admin/avatar.png";
import minimize from "../assets/admin/minimize.svg";
import { WorkspaceNav, WorkspaceSupport } from "./WorkspaceSwitcher";
import styles from "./AdminChrome.module.css";

interface AdminChromeProps {
  children: ReactNode;
}

export default function AdminChrome({ children }: AdminChromeProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Workspace">
        <div className={styles.brand}>
          <span className={styles.logoMark} aria-hidden="true" />
          <span className={styles.logoText}>OLI Torus</span>
        </div>
        <button type="button" className={styles.collapse} aria-label="Collapse sidebar">
          <img src={minimize} width={24} height={24} alt="" />
        </button>
        <WorkspaceNav active="admin" />
        <div className={styles.sidebarFooter}>
          <WorkspaceSupport />
        </div>
      </aside>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.avatar}>
            <img src={avatar} width={32} height={32} alt="Jessica Fortunato" />
          </div>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
