import React from 'react'

export const FolderIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" fill="currentColor" opacity="0.2"/>
    <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

export const TerminalIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 9L10 11L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const FileTextIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V10L14 3H9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 3V9C14 9.55228 14.4477 10 15 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 15H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const BrowserIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 7H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 7H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M13 7H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const CodeIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 18L22 12L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CalculatorIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="7" y="5" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 11H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 11H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 19H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 19H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 19H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const CalendarIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 11H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const ClockIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const SettingsIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 21V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18.36 18.36L19.78 19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M1 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21 12H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const ActivityIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const NoteIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5C21 16.1944 17.1944 20 12.5 20H6L3 23V11.5C3 6.80558 6.80558 3 11.5 3H12.5C17.1944 3 21 6.80558 21 11.5Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 11H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const ImageIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const MusicIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18V5L21 3V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const VideoIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M15.5 12L11 9V15L15.5 12Z" fill="currentColor" opacity="0.5"/>
    <path d="M15.5 12L11 9V15L15.5 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

export const PDFIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V10L14 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 3V10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 14H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 17H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M13 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const PackageIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 7V17L12 22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M22 7V17L12 22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

export const ShoppingCartIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
    <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M1 1H5L7.5 13H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const HardDriveIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="7" width="20" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M6 12H6.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M10 12H10.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

export const ListTodoIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 8H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 16H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M5 8H5.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M5 12H5.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M5 16H5.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

export const ServerIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="6" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="15" width="18" height="6" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 6H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 18H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 6H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 18H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const WifiIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12.5555C8.17157 9.38393 13.0294 9.38393 16.201 12.5555" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M1.90991 8.55551C7.02257 3.44284 15.3107 3.44284 20.4234 8.55551" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 18C12.5523 18 13 17.5523 13 17C13 16.4477 12.5523 16 12 16C11.4477 16 11 16.4477 11 17C11 17.5523 11.4477 18 12 18Z" fill="currentColor"/>
  </svg>
)

export const ShieldIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L20 6V12C20 17.5228 15.5228 22 10 22H8C3.02944 22 0 17.5228 0 12V6L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M8 12L10 14L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const UserIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const CameraIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19C23 20.1046 22.1046 21 21 21H3C1.89543 21 1 20.1046 1 19V8C1 6.89543 1.89543 6 3 6H7L9 3H15L17 6H21C22.1046 6 23 6.89543 23 8V19Z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const PaintIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L2 13L12 22L22 13L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M2 7H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const GridIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const PresentationIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 21H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 21V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 21V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const MailIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 7L12 13L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const MessageIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5C21 16.1944 17.1944 20 12.5 20H6L3 23V11.5C3 6.80558 6.80558 3 11.5 3H12.5C17.1944 3 21 6.80558 21 11.5Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const ContactsIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 3.13C16.8604 3.35030973 17.623 3.85071 18.1676 4.5523C18.7122 5.25389 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75611 18.1676 9.4577C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const CheckListIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const LockIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const BackupIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 7L12 12L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const ZipIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V10L14 3H9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 3V10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 8H11V7H12V8H13V9H12V10H11V9H10V8Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12H11V11H12V12H13V13H12V14H11V13H10V12Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 16H11V15H12V16H13V17H12V18H11V17H10V16Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const FileIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V10L14 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 3V10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const FileSearchIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V10L14 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 3V10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="11" cy="14" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 18L21 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const SunIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 21V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18.36 18.36L19.78 19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M1 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21 12H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const CloudRainIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 13C17.6569 13 19 11.6569 19 10C19 8.34315 17.6569 7 16 7C15.2578 7 14.5757 7.27288 14.0503 7.73607C13.9178 7.51136 13.7368 7.31642 13.5173 7.16629C13.2979 7.01617 13.0452 6.91505 12.7793 6.86951C12.5134 6.82397 12.2396 6.8349 11.9768 6.90155C11.714 6.9682 11.4673 7.08941 11.25 7.25L10.75 7.6C10.5651 7.73854 10.4113 7.91399 10.3 8.11539C9.97623 7.42791 9.41452 6.87844 8.71191 6.55326C8.0093 6.22809 7.21391 6.14617 6.47321 6.32316C5.73251 6.50015 5.09435 6.92562 4.65457 7.52361C4.21479 8.1216 4 8.85128 4 9.6C4 10.1373 4.10738 10.6635 4.3104 11.1445C4.51341 11.6255 4.80651 12.0478 5.17066 12.38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 16V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 16V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 16V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const TypeIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7V4H20V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 20H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const BookIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const LanguagesIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L21 6V12C21 17.5228 16.5228 22 12 22H12C7.47715 22 3 17.5228 3 12V6L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7.5 9C10 6.5 13 6.5 15.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12C9 15 14.5 15 17.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const MapPinIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const VideoRecorderIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M17 9L21 6V18L17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="10" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const MicIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M19 11V12C19 14.1217 18.1571 16.1566 16.6569 17.6569C15.1566 19.1571 13.1217 20 11 20H9C6.87827 20 4.84344 19.1571 3.34315 17.6569C1.84285 16.1566 1 14.1217 1 12V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 20V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 23H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const BluetoothIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 6.5L17.5 17.5L11 24V8L17.5 14.5L6.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const BatteryIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="21" y="10" width="2" height="4" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="9" width="10" height="6" rx="1" fill="currentColor" opacity="0.5"/>
  </svg>
)

export const InfoIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

export const HelpIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.04069C13.1255 7.16244 13.7588 7.52825 14.2151 8.07298C14.6713 8.61771 14.9211 9.30614 14.92 10.02C14.92 12 12 13 12 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 17H12.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

export const CommandIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 3H15C13.6739 3 12.4021 3.52678 11.4645 4.46447C10.5268 5.40215 10 6.67392 10 8V16C10 17.3261 10.5268 18.5979 11.4645 19.5355C12.4021 20.4732 13.6739 21 15 21H18C19.3261 21 20.5979 20.4732 21.5355 19.5355C22.4732 18.5979 23 17.3261 23 16V8C23 6.67392 22.4732 5.40215 21.5355 4.46447C20.5979 3.52678 19.3261 3 18 3Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M18 3H6C4.67392 3 3.40215 3.52678 2.46447 4.46447C1.52678 5.40215 1 6.67392 1 8V16C1 17.3261 1.52678 18.5979 2.46447 19.5355C3.40215 20.4732 4.67392 21 6 21H9" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const PaletteIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.9999C10.6522 21.9937 9.32469 21.6057 8.14985 20.8727C6.97501 20.1397 5.99893 19.0856 5.32547 17.8263C4.65201 16.567 4.30842 15.1477 4.33 13.7199C4.33 13.1899 4.77 12.7799 5.3 12.7799H9.11C9.64 12.7799 10.07 13.2099 10.08 13.7399C10.1 14.4099 10.39 15.0499 10.91 15.5599C11.16 15.8099 11.34 16.1099 11.43 16.4299C11.56 16.8699 11.99 17.1799 12.45 17.1299C12.84 17.0799 13.17 16.7899 13.28 16.4099C13.39 16.0299 13.32 15.5999 13.11 15.2599C12.89 14.9199 12.58 14.6499 12.22 14.4899C11.58 14.2099 11.11 13.6299 11.04 12.9599C10.99 12.2999 11.34 11.6799 11.96 11.3099C13.33 10.4599 14.19 8.88993 14.19 7.15993C14.19 4.40993 12.1 2.16993 9.41 2.01993C5.36 1.77993 1.98 4.97993 2.03 8.99993C2.09 14.1599 6.19 18.9499 11.14 20.4899C11.41 20.5699 11.7 20.6099 12 20.6099" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="11" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="16" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="19.5" cy="9" r="1.5" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const MagnifierIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const SnakeIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="7" cy="8" r="1" fill="currentColor"/>
    <circle cx="11" cy="8" r="1" fill="currentColor"/>
    <circle cx="15" cy="8" r="1" fill="currentColor"/>
    <circle cx="15" cy="12" r="1" fill="currentColor"/>
    <circle cx="11" cy="12" r="1" fill="currentColor"/>
    <circle cx="7" cy="12" r="1" fill="currentColor"/>
    <circle cx="7" cy="16" r="1" fill="currentColor"/>
    <circle cx="11" cy="16" r="1" fill="currentColor"/>
    <circle cx="15" cy="16" r="1" fill="currentColor"/>
  </svg>
)

export const TetrisIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="5" y="5" width="4" height="4" fill="currentColor" opacity="0.5"/>
    <rect x="9" y="5" width="4" height="4" fill="currentColor" opacity="0.3"/>
    <rect x="13" y="5" width="4" height="4" fill="currentColor" opacity="0.7"/>
    <rect x="7" y="9" width="4" height="4" fill="currentColor" opacity="0.5"/>
    <rect x="5" y="13" width="4" height="4" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="13" width="4" height="4" fill="currentColor" opacity="0.6"/>
    <rect x="13" y="13" width="4" height="4" fill="currentColor" opacity="0.3"/>
  </svg>
)