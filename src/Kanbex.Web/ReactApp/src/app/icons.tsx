import type { ReactNode } from 'react'

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      style={{ fill: 'none' }}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function HomeIcon() {
  return (
    <Icon>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />
    </Icon>
  )
}

export function SchoolIcon() {
  return (
    <Icon>
      <path d="m12 5 10 4.5L12 14 2 9.5 12 5z" />
      <path d="M6.5 11.6V16c0 1.3 2.5 2.5 5.5 2.5s5.5-1.2 5.5-2.5v-4.4" />
      <path d="M22 9.5V15" />
    </Icon>
  )
}

export function CodeIcon() {
  return (
    <Icon>
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4" />
      <path d="m13.5 5.5-3 13" />
    </Icon>
  )
}

export function GroupsIcon() {
  return (
    <Icon>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.6-2.8 2.9-4.5 5.5-4.5s4.9 1.7 5.5 4.5" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M16.4 14.6c2.1.3 3.8 1.8 4.3 4.4" />
    </Icon>
  )
}

export function PersonIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5" />
    </Icon>
  )
}

export function GitHubIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

export function EyeIcon() {
  return (
    <Icon>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </Icon>
  )
}

export function EyeOffIcon() {
  return (
    <Icon>
      <path d="m4 4 16 16" />
      <path d="M9.9 5.9A9.4 9.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.3 17.3 0 0 1-3.2 3.9M6.1 7A16.2 16.2 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 3.9-.9" />
      <path d="M10 10a2.8 2.8 0 0 0 3.9 4" />
    </Icon>
  )
}

export function EditIcon() {
  return (
    <Icon>
      <path d="M4 20h4L20 8l-4-4L4 16v4z" />
      <path d="m13.5 6.5 4 4" />
    </Icon>
  )
}

export function InfoIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Icon>
  )
}

export function SettingsIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Icon>
  )
}

export function FolderIcon() {
  return (
    <Icon>
      <path d="M3 8a2 2 0 0 1 2-2h4.5l2 2H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Icon>
  )
}

export function PlusIcon() {
  return (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function MenuIcon() {
  return (
    <Icon>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  )
}

export function MenuOpenIcon() {
  return (
    <Icon>
      <path d="M4 7h9M4 12h9M4 17h9" />
      <path d="M19.5 8.5 16 12l3.5 3.5" />
    </Icon>
  )
}

export function MoreIcon() {
  return (
    <Icon>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function ArrowForwardIcon() {
  return (
    <Icon>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  )
}

export function ClockIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  )
}

export function ArrowBackIcon() {
  return (
    <Icon>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Icon>
  )
}

export function CheckIcon() {
  return (
    <Icon>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  )
}

export function DragIndicatorIcon() {
  return (
    <Icon>
      <circle cx="9.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function NoteIcon() {
  return (
    <Icon>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 10h8M8 14h5" />
    </Icon>
  )
}
