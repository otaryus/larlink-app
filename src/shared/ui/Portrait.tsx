import { useId } from 'react'

const SKIN = ['#6f4428', '#7d4b2b', '#8a5634', '#5e3a22']
const UNIFORM = ['#6b6f76', '#f2a6c2', '#26386a', '#7a6658', '#2f6f73']
const BACKDROP = [
  ['#efe7dc', '#f8f4ee'],
  ['#e7ecf3', '#f6f8fb'],
  ['#ece6df', '#faf7f2'],
]

function hash(value: string): number {
  let h = 0
  for (const ch of value) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

interface Props {
  seed: string
  label?: string
  className?: string
  short?: boolean
}

export function Portrait({ seed, label, className, short = false }: Props) {
  const id = useId()
  const h = hash(seed)
  const skin = SKIN[h % SKIN.length]
  const uniform = UNIFORM[(h >>> 3) % UNIFORM.length]
  const [bgFrom, bgTo] = BACKDROP[(h >>> 6) % BACKDROP.length]

  return (
    <svg
      viewBox="0 0 200 170"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bgFrom} />
          <stop offset="1" stopColor={bgTo} />
        </linearGradient>
      </defs>
      <rect width="200" height="170" fill={`url(#${id}-bg)`} />
      <path d="M28 170 C32 128 62 112 100 112 C138 112 168 128 172 170 Z" fill={uniform} />
      <path d="M80 114 L100 144 L120 114 L111 111 L100 127 L89 111 Z" fill="#fff" />
      <rect x="88" y="90" width="24" height="28" rx="10" fill={skin} />
      {short ? (
        <path d="M70 66 C68 36 132 36 130 66 C128 50 72 50 70 66 Z" fill="#1c1511" />
      ) : (
        <>
          <ellipse cx="128" cy="44" rx="13" ry="12" fill="#1c1511" />
          <ellipse cx="100" cy="62" rx="35" ry="37" fill="#1c1511" />
        </>
      )}
      <ellipse cx="100" cy="70" rx="27" ry="32" fill={skin} />
      {!short && <path d="M68 54 Q100 22 132 54" stroke="#121212" strokeWidth="9" fill="none" strokeLinecap="round" />}
      <circle cx="90" cy="68" r="2.6" fill="#1b1410" />
      <circle cx="110" cy="68" r="2.6" fill="#1b1410" />
      <path d="M89 83 Q100 93 111 83" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}
