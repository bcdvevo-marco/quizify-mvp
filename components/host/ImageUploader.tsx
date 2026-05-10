'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  value: string | null
  onChange: (url: string | null) => void
}

export function ImageUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Sadece resim dosyaları yüklenebilir'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Dosya 5MB\'dan küçük olmalı'); return }

    setError(null)
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('quiz-images')
      .upload(path, file, { upsert: false })

    if (upErr) { setError('Yükleme başarısız'); setUploading(false); return }

    const { data } = supabase.storage.from('quiz-images').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    onChange(null)
    setError(null)
  }

  if (value) {
    return (
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#0f0c29' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Soru görseli" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
        <button
          type="button"
          onClick={handleRemove}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Kaldır
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed rgba(99,102,241,0.4)',
          borderRadius: 12,
          padding: '24px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'rgba(99,102,241,0.04)',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.7)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
      >
        {uploading ? (
          <p style={{ color: '#6366f1', fontSize: 13, fontWeight: 600 }}>Yükleniyor...</p>
        ) : (
          <>
            <p style={{ color: '#6366f1', fontSize: 13, fontWeight: 700 }}>Görsel yükle</p>
            <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>Sürükle bırak veya tıkla · Max 5MB</p>
          </>
        )}
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
