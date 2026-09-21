interface IconProps {
  className?: string;
  title?: string;
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.5 17.5L12.5 12.5M2.5 8.33333C2.5 9.09938 2.65088 9.85792 2.94404 10.5657C3.23719 11.2734 3.66687 11.9164 4.20854 12.4581C4.75022 12.9998 5.39328 13.4295 6.10101 13.7226C6.80875 14.0158 7.56729 14.1667 8.33333 14.1667C9.09938 14.1667 9.85792 14.0158 10.5657 13.7226C11.2734 13.4295 11.9164 12.9998 12.4581 12.4581C12.9998 11.9164 13.4295 11.2734 13.7226 10.5657C14.0158 9.85792 14.1667 9.09938 14.1667 8.33333C14.1667 7.56729 14.0158 6.80875 13.7226 6.10101C13.4295 5.39328 12.9998 4.75022 12.4581 4.20854C11.9164 3.66687 11.2734 3.23719 10.5657 2.94404C9.85792 2.65088 9.09938 2.5 8.33333 2.5C7.56729 2.5 6.80875 2.65088 6.10101 2.94404C5.39328 3.23719 4.75022 3.66687 4.20854 4.20854C3.66687 4.75022 3.23719 5.39328 2.94404 6.10101C2.65088 6.80875 2.5 7.56729 2.5 8.33333Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FilterIcon({ className }: IconProps) {
  return (
    <span className={className} style={{ display: "inline-flex", width: 24, height: 24, alignItems: "center", justifyContent: "center" }}>
      <svg width={15.3333} height={16.1667} viewBox="0 0 15.3333 16.1667" fill="none" aria-hidden="true">
        <path
          d="M1 1H14.3333V2.81C14.3332 3.25199 14.1576 3.67585 13.845 3.98833L10.1667 7.66667V13.5L5.16667 15.1667V8.08333L1.43333 3.97667C1.15454 3.66994 1.00004 3.27033 1 2.85583V1Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function ClearIcon({ className }: IconProps) {
  return (
    <svg className={className} width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.00001 7H20M10 11V17M14 11V17M5.00001 7L6.00001 19C6.00001 19.5304 6.21073 20.0391 6.5858 20.4142C6.96087 20.7893 7.46958 21 8.00001 21H16C16.5304 21 17.0392 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7M9.00001 7V4C9.00001 3.73478 9.10537 3.48043 9.29291 3.29289C9.48044 3.10536 9.7348 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8947 3.48043 15 3.73478 15 4V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5v7M5 7.2 8 10.5 11 7.2M3 13.5h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CombineIcon({ className }: IconProps) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 4h4M3 8h10M3 12h4M7 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 6.5h11" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 10H17M9 4L3 10L9 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.2 4.4L9.8 8L6.2 11.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 7L8 11L12 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 9L8 5L12 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ToolIcon({ className }: IconProps) {
  return (
    <svg className={className} width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WritingIcon({ className }: IconProps) {
  return (
    <svg className={className} width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 19L16 17V5C16 3.879 16.879 3 18 3C19.121 3 20 3.879 20 5V17L18 19ZM18 19H5C4.46957 19 3.96086 18.7893 3.58579 18.4142C3.21071 18.0391 3 17.5304 3 17C3 16.4696 3.21071 15.9609 3.58579 15.5858C3.96086 15.2107 4.46957 15 5 15H9C9.53043 15 10.0391 14.7893 10.4142 14.4142C10.7893 14.0391 11 13.5304 11 13C11 12.4696 10.7893 11.9609 10.4142 11.5858C10.0391 11.2107 9.53043 11 9 11H6M16 7H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.5 3.5H3.5A1.5 1.5 0 0 0 2 5v7.5A1.5 1.5 0 0 0 3.5 14H11a1.5 1.5 0 0 0 1.5-1.5V9.5M9.5 2H14v4.5M14 2 7 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
