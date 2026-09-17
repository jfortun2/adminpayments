import { Link } from "react-router-dom";
import chartBar from "../assets/admin/chart-bar.svg";
import school from "../assets/admin/school.svg";
import supportIcon from "../assets/admin/support.svg";
import writing from "../assets/admin/writing.svg";
import { ToolIcon } from "./Icons";
import styles from "./WorkspaceSwitcher.module.css";

export type WorkspaceId = "admin" | "author";

export function WorkspaceNav({
  active,
  authorTo = "/templates/intro-to-gardening",
}: {
  active: WorkspaceId;
  authorTo?: string;
}) {
  return (
    <>
      <p className={styles.sectionLabel}>Workspace</p>
      <nav className={styles.workspaceNav} aria-label="Workspace roles">
        <Link
          className={`${styles.workspaceItem} ${active === "admin" ? styles.workspaceItemActive : ""}`}
          to="/"
          aria-current={active === "admin" ? "page" : undefined}
        >
          <span className={styles.workspaceIcon}>
            <ToolIcon />
          </span>
          Admin
        </Link>
        <Link
          className={`${styles.workspaceItem} ${active === "author" ? styles.workspaceItemActive : ""}`}
          to={authorTo}
          aria-current={active === "author" ? "page" : undefined}
        >
          <span className={styles.workspaceIcon}>
            <img src={writing} width={24} height={24} alt="" />
          </span>
          Course Author
        </Link>
        <span className={styles.workspaceItem}>
          <span className={styles.workspaceIcon}>
            <img src={chartBar} width={24} height={24} alt="" />
          </span>
          Instructor
        </span>
        <span className={styles.workspaceItem}>
          <span className={styles.workspaceIcon}>
            <img src={school} width={24} height={24} alt="" />
          </span>
          Student
        </span>
      </nav>
    </>
  );
}

export function WorkspaceSupport() {
  return (
    <span className={styles.supportItem}>
      <span className={styles.supportIcon}>
        <span className={styles.supportIconLeaf}>
          <img src={supportIcon} width={16.5} height={16.5} alt="" />
        </span>
      </span>
      Support
    </span>
  );
}
