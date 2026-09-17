import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import AdminChrome from "../components/AdminChrome";
import { ExternalLinkIcon } from "../components/Icons";
import styles from "./AdminHomePage.module.css";

function AdminLink({
  to,
  children,
  badge,
  external,
}: {
  to?: string;
  children: ReactNode;
  badge?: string;
  external?: boolean;
}) {
  const content = (
    <>
      {children}
      {badge ? <span className={styles.badge}>{badge}</span> : null}
      {external ? <ExternalLinkIcon className={styles.externalIcon} /> : null}
    </>
  );

  if (to) {
    return (
      <Link className={styles.link} to={to}>
        {content}
      </Link>
    );
  }

  return <span className={styles.link}>{content}</span>;
}

function AdminSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.copy}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className={styles.links}>{children}</div>
    </section>
  );
}

export default function AdminHomePage() {
  return (
    <AdminChrome>
      <AdminSection title="Account Management" description="Access and manage all users and authors">
        <AdminLink>Manage Students and Instructor Accounts</AdminLink>
        <AdminLink>Manage Authoring Accounts</AdminLink>
        <AdminLink badge="1">Manage Institutions</AdminLink>
        <AdminLink to="/payments">Manage all Payments</AdminLink>
        <AdminLink>Invite New Authors</AdminLink>
        <AdminLink>Manage Communities</AdminLink>
        <AdminLink>Manage LTI 1.3 Registrations</AdminLink>
      </AdminSection>

      <AdminSection title="Content Management" description="Access and manage created content">
        <AdminLink>Browse all Projects</AdminLink>
        <AdminLink to="/templates">Browse all Templates</AdminLink>
        <AdminLink>Browse all Course Sections</AdminLink>
        <AdminLink>Ingest Project</AdminLink>
        <AdminLink>V2 Ingest Project</AdminLink>
        <AdminLink>Manage Branding</AdminLink>
        <AdminLink>Manage Publishers</AdminLink>
      </AdminSection>

      <AdminSection title="System Management" description="Manage and support system level functionality">
        <AdminLink>Manage Activities</AdminLink>
        <AdminLink>Manage System Message Banner</AdminLink>
        <AdminLink>Feature Flags and Logging</AdminLink>
        <AdminLink>Manage Third-Party API Keys</AdminLink>
        <AdminLink>Manage VR User Agents</AdminLink>
        <AdminLink>XAPI Upload Pipeline Stats</AdminLink>
        <AdminLink external>View System Performance Dashboard</AdminLink>
      </AdminSection>
    </AdminChrome>
  );
}
