import type { ReactNode } from "react";
import { WorkspaceHeader } from "./WorkspaceChrome";
import styles from "./AdminChrome.module.css";

interface AdminChromeProps {
  children: ReactNode;
}

export default function AdminChrome({ children }: AdminChromeProps) {
  return (
    <div className={styles.shell}>
      <WorkspaceHeader />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
