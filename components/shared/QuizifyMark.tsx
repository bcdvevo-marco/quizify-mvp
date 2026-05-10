import React from 'react'

interface QuizifyMarkProps {
  size?: number
  className?: string
}

export function QuizifyMark({ size = 40, className = '' }: QuizifyMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="12" fill="url(#qm-grad)" />
      <path
        d="M12 28 C12 28 10 26 10 22 C10 15 14 11 20 11 C26 11 30 15 30 21 C30 27 26 31 20 31 L18 31 L14 35 Z"
        fill="white"
        opacity="0.95"
      />
      <circle cx="17" cy="21" r="2" fill="url(#qm-grad)" />
      <circle cx="23" cy="21" r="2" fill="url(#qm-grad)" />
      <defs>
        <linearGradient id="qm-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  )
}

interface QuizifyLockupProps {
  size?: number
  dark?: boolean
  className?: string
}

export function QuizifyLockup({ size = 32, dark = false, className = '' }: QuizifyLockupProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <QuizifyMark size={size} />
      <span
        style={{
          fontSize: size * 0.65,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          background: dark ? 'white' : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: 'var(--font-display)',
        }}
      >
        Quizify
      </span>
    </div>
  )
}
