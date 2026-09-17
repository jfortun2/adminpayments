import { useMemo, useState } from "react";
import { EyeIcon } from "../components/Icons";
import WorkspaceChrome, {
  ActionLink,
  ActionRow,
  OverviewRow,
  PrimaryButton,
  SecondaryButton,
} from "../components/WorkspaceChrome";
import { usePayments } from "../context/PaymentsContext";
import styles from "./TemplateOverviewPage.module.css";

const TEMPLATE_ID = "intro-to-gardening";

export default function TemplateOverviewPage() {
  const { templates } = usePayments();
  const template = templates.find((item) => item.id === TEMPLATE_ID);
  const [notesOn, setNotesOn] = useState(true);
  const [discussionsOn, setDiscussionsOn] = useState(true);

  const paymentsPath = `/templates/${TEMPLATE_ID}/payments`;

  const title = template?.name ?? "Intro to Gardening";

  const note = useMemo(
    () => (notesOn ? "6 pages currently have Notes enabled." : "Notes are disabled for this template."),
    [notesOn],
  );

  return (
    <WorkspaceChrome title={title}>
      <OverviewRow
        title="Notes"
        description="Enable students to annotate content for saving and sharing within the class community."
      >
        <label className={styles.toggle}>
          <button
            type="button"
            className={notesOn ? styles.switchOn : styles.switchOff}
            aria-pressed={notesOn}
            onClick={() => setNotesOn((value) => !value)}
          >
            <span />
          </button>
          Enable Notes for all pages in the course
        </label>
        <p className={styles.helper}>{note}</p>
      </OverviewRow>

      <OverviewRow title="Course Discussions" description="Give students a course discussion board.">
        <label className={styles.toggle}>
          <button
            type="button"
            className={discussionsOn ? styles.switchOn : styles.switchOff}
            aria-pressed={discussionsOn}
            onClick={() => setDiscussionsOn((value) => !value)}
          >
            <span />
          </button>
          Enable Course Discussions
        </label>
        <label className={styles.check}>
          <input type="checkbox" defaultChecked />
          Allow posts to be visible without approval
        </label>
        <label className={styles.check}>
          <input type="checkbox" defaultChecked />
          Show anonymous posts
        </label>
      </OverviewRow>

      <OverviewRow
        title="Required Survey"
        description="Show a required survey to students who access the course for the first time."
      >
        <p className={styles.helper}>
          The base project does not have a survey configured. Please contact the project author to add one.
        </p>
      </OverviewRow>

      <OverviewRow title="Actions">
        <ActionRow control={<ActionLink to="#">View Usage</ActionLink>} text="View course section usage." />
        <ActionRow control={<SecondaryButton>Duplicate</SecondaryButton>} text="Create a complete copy of this template." />
        <ActionRow
          control={<ActionLink to={paymentsPath}>Manage Payments</ActionLink>}
          text="Audit payments and manage payment codes."
        />
        <ActionRow
          control={
            <PrimaryButton>
              <EyeIcon />
              Preview Template
            </PrimaryButton>
          }
          text="Open the student delivery experience for this template in a new tab."
        />
      </OverviewRow>
    </WorkspaceChrome>
  );
}
