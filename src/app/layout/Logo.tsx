export function Logo() {
  return (
    <svg viewBox="0 0 48 48" width="52" height="52" aria-hidden="true">
      <defs>
        <linearGradient id="larlink-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a6cf0" />
          <stop offset="1" stopColor="#21c3a5" />
        </linearGradient>
      </defs>
      <path d="M24 5 L44 22 L39 22 L39 42 L9 42 L9 22 L4 22 Z" fill="url(#larlink-logo)" strokeLinejoin="round" />
      <path d="M24 13 L35 22.5 L35 38 L13 38 L13 22.5 Z" fill="#fff" opacity="0.92" />
      <circle cx="20" cy="26" r="3" fill="#1a6cf0" />
      <path d="M15 35 C15 30 25 30 25 35 Z" fill="#1a6cf0" />
      <circle cx="29" cy="28" r="2.6" fill="#21c3a5" />
      <path d="M24.5 35 C24.5 31 33.5 31 33.5 35 Z" fill="#21c3a5" />
    </svg>
  )
}
