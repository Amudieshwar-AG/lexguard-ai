export default function TechShieldLogo({ className = "w-32 h-32" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="shieldGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="shieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="nodeGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shield background glow */}
      <ellipse cx="60" cy="68" rx="42" ry="50" fill="url(#shieldGlow)" />

      {/* Shield body */}
      <path
        d="M60 8 L100 24 L100 68 C100 92 82 112 60 122 C38 112 20 92 20 68 L20 24 Z"
        fill="url(#shieldFill)"
        stroke="url(#shieldStroke)"
        strokeWidth="1.5"
        opacity="0.95"
      />

      {/* Inner shield highlight */}
      <path
        d="M60 16 L93 29 L93 68 C93 88 77 106 60 115 C43 106 27 88 27 68 L27 29 Z"
        fill="none"
        stroke="rgba(147,197,253,0.15)"
        strokeWidth="1"
      />

      {/* Circuit board lines — horizontal */}
      <line x1="34" y1="55" x2="55" y2="55" stroke="#60a5fa" strokeWidth="1.2" opacity="0.7" filter="url(#glow)" />
      <line x1="65" y1="55" x2="86" y2="55" stroke="#60a5fa" strokeWidth="1.2" opacity="0.7" filter="url(#glow)" />
      <line x1="34" y1="72" x2="52" y2="72" stroke="#93c5fd" strokeWidth="1" opacity="0.6" />
      <line x1="68" y1="72" x2="86" y2="72" stroke="#93c5fd" strokeWidth="1" opacity="0.6" />
      <line x1="38" y1="88" x2="54" y2="88" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
      <line x1="66" y1="88" x2="82" y2="88" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />

      {/* Circuit board lines — vertical */}
      <line x1="42" y1="44" x2="42" y2="88" stroke="#60a5fa" strokeWidth="1.2" opacity="0.6" filter="url(#glow)" />
      <line x1="78" y1="44" x2="78" y2="88" stroke="#60a5fa" strokeWidth="1.2" opacity="0.6" filter="url(#glow)" />
      <line x1="55" y1="38" x2="55" y2="72" stroke="#93c5fd" strokeWidth="1" opacity="0.55" />
      <line x1="65" y1="38" x2="65" y2="72" stroke="#93c5fd" strokeWidth="1" opacity="0.55" />

      {/* Connector ticks */}
      <line x1="42" y1="55" x2="34" y2="55" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
      <line x1="78" y1="55" x2="86" y2="55" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
      <line x1="55" y1="72" x2="52" y2="72" stroke="#93c5fd" strokeWidth="1" opacity="0.5" />
      <line x1="65" y1="72" x2="68" y2="72" stroke="#93c5fd" strokeWidth="1" opacity="0.5" />

      {/* Center core node */}
      <circle cx="60" cy="62" r="8" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.5" filter="url(#nodeGlow)" />
      <circle cx="60" cy="62" r="4.5" fill="#60a5fa" opacity="0.9" filter="url(#nodeGlow)" />
      <circle cx="60" cy="62" r="2" fill="white" opacity="0.95" />

      {/* Corner circuit nodes */}
      <circle cx="42" cy="44" r="3" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1" filter="url(#nodeGlow)" />
      <circle cx="78" cy="44" r="3" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1" filter="url(#nodeGlow)" />
      <circle cx="42" cy="88" r="2.5" fill="#2563eb" stroke="#93c5fd" strokeWidth="1" filter="url(#nodeGlow)" />
      <circle cx="78" cy="88" r="2.5" fill="#2563eb" stroke="#93c5fd" strokeWidth="1" filter="url(#nodeGlow)" />

      {/* Mid-line nodes */}
      <circle cx="42" cy="55" r="2" fill="#60a5fa" opacity="0.9" filter="url(#nodeGlow)" />
      <circle cx="78" cy="55" r="2" fill="#60a5fa" opacity="0.9" filter="url(#nodeGlow)" />
      <circle cx="42" cy="72" r="2" fill="#93c5fd" opacity="0.8" />
      <circle cx="78" cy="72" r="2" fill="#93c5fd" opacity="0.8" />
      <circle cx="55" cy="38" r="2" fill="#60a5fa" opacity="0.85" />
      <circle cx="65" cy="38" r="2" fill="#60a5fa" opacity="0.85" />
      <circle cx="55" cy="55" r="1.8" fill="#bfdbfe" opacity="0.9" />
      <circle cx="65" cy="55" r="1.8" fill="#bfdbfe" opacity="0.9" />

      {/* Outer edge dots */}
      <circle cx="34" cy="55" r="1.5" fill="#60a5fa" opacity="0.7" />
      <circle cx="86" cy="55" r="1.5" fill="#60a5fa" opacity="0.7" />
      <circle cx="38" cy="88" r="1.5" fill="#60a5fa" opacity="0.6" />
      <circle cx="82" cy="88" r="1.5" fill="#60a5fa" opacity="0.6" />

      {/* Top shield crest highlight */}
      <path
        d="M60 12 L88 24"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
