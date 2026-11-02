import { useRef, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./DemoLevelSwitch.module.css";

const TEMPLATE_HOME = "/templates/intro-to-gardening";

export default function DemoLevelSwitch() {
  const location = useLocation();
  const navigate = useNavigate();
  const adminRef = useRef<HTMLButtonElement>(null);
  const templateRef = useRef<HTMLButtonElement>(null);
  const templateLevel = location.pathname.startsWith("/templates");

  function selectAdmin() {
    if (templateLevel) navigate("/");
  }

  function selectTemplate() {
    if (!templateLevel) navigate(TEMPLATE_HOME);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      templateRef.current?.focus();
      selectTemplate();
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      adminRef.current?.focus();
      selectAdmin();
    }
  }

  return (
    <div className={styles.bar}>
      <p className={styles.label} id="demo-level-label">
        Demo only
      </p>
      <div
        className={styles.switch}
        role="radiogroup"
        aria-labelledby="demo-level-label"
        onKeyDown={onKeyDown}
      >
        <button
          ref={adminRef}
          type="button"
          role="radio"
          className={styles.option}
          aria-checked={!templateLevel}
          tabIndex={templateLevel ? -1 : 0}
          onClick={selectAdmin}
        >
          Admin
        </button>
        <button
          ref={templateRef}
          type="button"
          role="radio"
          className={styles.option}
          aria-checked={templateLevel}
          tabIndex={templateLevel ? 0 : -1}
          onClick={selectTemplate}
        >
          Template
        </button>
      </div>
    </div>
  );
}
