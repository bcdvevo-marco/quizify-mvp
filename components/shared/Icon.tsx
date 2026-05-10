'use client'
import React from 'react'

type IconName =
  | 'plus' | 'arrow-r' | 'arrow-l' | 'check' | 'x' | 'play' | 'edit' | 'trash'
  | 'sparkle' | 'clock' | 'users' | 'qr' | 'download' | 'crown' | 'copy'
  | 'share' | 'chevron-r' | 'chevron-l' | 'chevron-d' | 'logout' | 'settings'
  | 'search' | 'menu' | 'image' | 'drag' | 'star' | 'trophy' | 'chart-bar'
  | 'eye' | 'eye-off'

interface IconProps {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
}

const paths: Record<IconName, string | string[]> = {
  'plus':       'M12 5v14M5 12h14',
  'arrow-r':    'M5 12h14M13 6l6 6-6 6',
  'arrow-l':    'M19 12H5M11 18l-6-6 6-6',
  'check':      'M20 6L9 17l-5-5',
  'x':          'M18 6L6 18M6 6l12 12',
  'play':       'M5 3l14 9-14 9V3z',
  'edit':       ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  'trash':      ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
  'sparkle':    ['M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z'],
  'clock':      ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z', 'M12 6v6l4 2'],
  'users':      ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M16 3.13a4 4 0 0 1 0 7.75'],
  'qr':         ['M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z', 'M15 15h2v2h-2zM17 17h4v4h-4zM19 15h2'],
  'download':   ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  'crown':      'M2 20h20M5 20l2-10 5 5 5-5 2 10',
  'copy':       ['M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1'],
  'share':      ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'],
  'chevron-r':  'M9 18l6-6-6-6',
  'chevron-l':  'M15 18l-6-6 6-6',
  'chevron-d':  'M6 9l6 6 6-6',
  'logout':     ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  'settings':   ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'],
  'search':     ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.35-4.35'],
  'menu':       'M3 12h18M3 6h18M3 18h18',
  'image':      ['M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h4l2 3h3a2 2 0 0 1 2 2z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  'drag':       'M9 5h2M9 12h2M9 19h2M13 5h2M13 12h2M13 19h2',
  'star':       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'trophy':     ['M6 9H3V2h18v7h-3', 'M6 9a6 6 0 0 0 12 0', 'M12 15v4', 'M8 19h8'],
  'chart-bar':  ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  'eye':        ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  'eye-off':    ['M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94', 'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19', 'M1 1l22 22'],
}

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps) {
  const d = paths[name]
  const dArr = Array.isArray(d) ? d : [d]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {dArr.map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}
