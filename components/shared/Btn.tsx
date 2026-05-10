import React from 'react'
import { Icon } from './Icon'

type BtnKind = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger' | 'success' | 'glass' | 'outline'
type BtnSize = 'sm' | 'md' | 'lg' | 'xl'
type IconName = Parameters<typeof Icon>[0]['name']

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: BtnKind
  size?: BtnSize
  icon?: IconName
  iconRight?: IconName
  full?: boolean
  loading?: boolean
  children?: React.ReactNode
}

const kindStyles: Record<BtnKind, string> = {
  primary:   'text-white font-bold transition-all hover:brightness-110 active:scale-95',
  secondary: 'bg-white text-[#4338ca] border-2 border-[#c7d2fe] font-bold hover:bg-[#eef2ff] transition-all active:scale-95',
  ghost:     'bg-transparent text-[#6366f1] font-semibold hover:bg-[#eef2ff] transition-all active:scale-95',
  dark:      'bg-[#1e1b4b] text-white font-bold hover:bg-[#312e81] transition-all active:scale-95',
  danger:    'bg-[#ef4444] text-white font-bold hover:bg-[#b91c1c] transition-all active:scale-95',
  success:   'bg-[#10b981] text-white font-bold hover:bg-[#047857] transition-all active:scale-95',
  glass:     'text-white font-bold transition-all hover:brightness-110 active:scale-95',
  outline:   'bg-transparent text-white border-2 border-white/40 font-semibold hover:bg-white/10 transition-all active:scale-95',
}

const sizeStyles: Record<BtnSize, { padding: string; text: string; iconSize: number; radius: string }> = {
  sm:  { padding: 'px-3 py-1.5',  text: 'text-sm',   iconSize: 14, radius: 'rounded-lg' },
  md:  { padding: 'px-5 py-2.5',  text: 'text-base',  iconSize: 16, radius: 'rounded-xl' },
  lg:  { padding: 'px-6 py-3',    text: 'text-lg',    iconSize: 18, radius: 'rounded-2xl' },
  xl:  { padding: 'px-8 py-4',    text: 'text-xl',    iconSize: 20, radius: 'rounded-2xl' },
}

export function Btn({
  kind = 'primary',
  size = 'md',
  icon,
  iconRight,
  full = false,
  loading = false,
  children,
  className = '',
  disabled,
  style,
  ...rest
}: BtnProps) {
  const sz = sizeStyles[size]
  const kd = kindStyles[kind]

  const gradStyle = (kind === 'primary')
    ? { background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', boxShadow: '0 4px 14px rgba(99,102,241,.35)', ...style }
    : kind === 'glass'
    ? { background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.22)', ...style }
    : style

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        ${sz.padding} ${sz.text} ${sz.radius} ${kd}
        ${full ? 'w-full' : ''}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={gradStyle}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin" width={sz.iconSize} height={sz.iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : icon ? (
        <Icon name={icon} size={sz.iconSize} />
      ) : null}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={sz.iconSize} />}
    </button>
  )
}
