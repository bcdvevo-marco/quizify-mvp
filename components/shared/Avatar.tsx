const AVATAR_COLORS: [string, string][] = [
  ['#6366f1', '#4338ca'],
  ['#7c3aed', '#5b21b6'],
  ['#3b82f6', '#1d4ed8'],
  ['#10b981', '#047857'],
  ['#f59e0b', '#b45309'],
  ['#ef4444', '#b91c1c'],
  ['#ec4899', '#be185d'],
  ['#14b8a6', '#0f766e'],
]

function getColorPair(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

interface AvatarProps {
  name: string
  size?: number
  className?: string
}

export function Avatar({ name, size = 40, className = '' }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
  const [from, to] = getColorPair(name)
  const fontSize = Math.round(size * 0.38)

  return (
    <div
      className={`inline-flex items-center justify-center flex-none rounded-full font-bold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        fontSize,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}
    >
      {initials || '?'}
    </div>
  )
}
