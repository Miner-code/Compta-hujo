import React, { useEffect, useRef } from 'react'

export default function BackgroundFilm({ videoSrc = '/background.mp4', overlay = 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.08))' }) {
  const videoRef = useRef(null)

  useEffect(() => {
    // Respect prefers-reduced-motion: pause video / animations
    const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq && mq.matches) {
      try { if (videoRef.current) videoRef.current.pause() } catch (e) {}
    } else {
      try { if (videoRef.current) videoRef.current.play().catch(() => {}) } catch (e) {}
    }
    const handler = (ev) => {
      if (ev.matches) { try { videoRef.current && videoRef.current.pause() } catch (e) {} }
      else { try { videoRef.current && videoRef.current.play().catch(() => {}) } catch (e) {} }
    }
    mq && mq.addEventListener && mq.addEventListener('change', handler)
    return () => mq && mq.removeEventListener && mq.removeEventListener('change', handler)
  }, [])

  return (
    <div aria-hidden className="background-film-root">
      {/* Video source: place a file at public/background.mp4 to use a cinematic film background */}
      <video ref={videoRef} className="background-film-video" src={videoSrc} autoPlay muted loop playsInline preload="auto" poster="/background-poster.jpg" />

      {/* Fallback SVG illustration (simple animated scene). Shown if video fails to load or as decorative element. */}
      <div className="background-film-fallback" aria-hidden>
        <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" className="background-film-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="screenGlow" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="blobGrad" x1="0" x2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          <rect width="1200" height="700" fill="url(#blobGrad)" opacity="0.6" />

          {/* desk */}
          <rect x="100" y="420" width="1000" height="16" rx="4" fill="rgba(0,0,0,0.12)" />

          {/* laptop base */}
          <rect x="460" y="300" width="280" height="120" rx="10" fill="#111827" opacity="0.9" />
          {/* screen */}
          <rect x="480" y="200" width="240" height="110" rx="8" fill="#0f172a" />

          {/* animated chart bars on screen */}
          <g className="chart-bars" transform="translate(520,240)">
            <rect x="0" y="30" width="18" height="30" rx="3" fill="#ef4444">
              <animate attributeName="height" values="6;30;6" dur="3s" repeatCount="indefinite" />
              <animate attributeName="y" values="54;30;54" dur="3s" repeatCount="indefinite" />
            </rect>
            <rect x="30" y="10" width="18" height="50" rx="3" fill="#10b981">
              <animate attributeName="height" values="10;50;10" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="y" values="50;10;50" dur="3.2s" repeatCount="indefinite" />
            </rect>
            <rect x="60" y="18" width="18" height="42" rx="3" fill="#06b6d4">
              <animate attributeName="height" values="12;42;12" dur="3.4s" repeatCount="indefinite" />
              <animate attributeName="y" values="48;18;48" dur="3.4s" repeatCount="indefinite" />
            </rect>
            <rect x="90" y="6" width="18" height="54" rx="3" fill="#7c3aed">
              <animate attributeName="height" values="8;54;8" dur="3.6s" repeatCount="indefinite" />
              <animate attributeName="y" values="56;6;56" dur="3.6s" repeatCount="indefinite" />
            </rect>
          </g>

          {/* simple person silhouette */}
          <g transform="translate(360,310) scale(0.9)">
            <circle cx="80" cy="-40" r="28" fill="#111827" opacity="0.95" />
            <rect x="40" y="-10" width="80" height="110" rx="14" fill="#111827" opacity="0.95" />
            <rect x="0" y="80" width="180" height="10" rx="5" fill="#111827" opacity="0.95" />
          </g>

        </svg>
      </div>

      {/* overlay to keep contrast for UI components */}
      <div className="background-film-overlay" style={{ background: overlay }} aria-hidden />
    </div>
  )
}
