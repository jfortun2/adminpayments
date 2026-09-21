import type { ReactNode } from "react";
import { WorkspaceHeader } from "./WorkspaceChrome";
import { WorkspaceNav, WorkspaceSupport } from "./WorkspaceSwitcher";
import styles from "./AdminChrome.module.css";

interface AdminChromeProps {
  children: ReactNode;
}

export default function AdminChrome({ children }: AdminChromeProps) {
  return (
    <div className={styles.shell}>
      <WorkspaceHeader />
      <div className={styles.body}>
        <aside className={styles.sidebar} aria-label="Workspace">
          <WorkspaceNav active="admin" />
          <div className={styles.sidebarFooter}>
            <WorkspaceSupport />
          </div>
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
