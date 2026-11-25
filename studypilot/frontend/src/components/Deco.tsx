import type { CSSProperties, ReactNode } from 'react';

type P = { className?: string; style?: CSSProperties };

export const Notebook = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 220 280" fill="none" aria-hidden>
    <rect x="14" y="14" width="196" height="256" rx="14" fill="#000" opacity=".12" />
    <rect x="8" y="8" width="196" height="256" rx="14" fill="#4F46E5" />
    <rect x="22" y="8" width="182" height="256" rx="10" fill="#FDFBF4" />
    {Array.from({ length: 11 }).map((_, i) => (
      <line key={i} x1="40" x2="190" y1={52 + i * 18} y2={52 + i * 18} stroke="#C7D2FE" strokeWidth="1.2" />
    ))}
    <line x1="56" x2="56" y1="20" y2="256" stroke="#FCA5A5" strokeWidth="1.5" />
    {Array.from({ length: 9 }).map((_, i) => (
      <circle key={i} cx="22" cy={34 + i * 26} r="6" fill="#A5B4FC" stroke="#4338CA" strokeWidth="2" />
    ))}
    <path d="M68 40c10-8 18 6 28-2s16 4 26-2" stroke="#4F46E5" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M68 58c12-6 22 4 34 0s24 2 34-2" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" opacity=".7" />
    <path d="M68 94l8 8 16-18" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M102 94h60" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <path d="M68 130l8 8 16-18" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M102 130h44" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <rect x="66" y="156" width="96" height="14" rx="3" fill="#FDE68A" opacity=".85" />
    <path d="M70 163h86" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Pencil = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 40 220" fill="none" aria-hidden>
    <polygon points="20,214 8,182 32,182" fill="#F5D0A9" />
    <polygon points="20,214 16,202 24,202" fill="#1F2937" />
    <rect x="8" y="30" width="24" height="152" fill="#FBBF24" />
    <rect x="8" y="30" width="8" height="152" fill="#F59E0B" />
    <rect x="8" y="22" width="24" height="10" fill="#D1D5DB" />
    <rect x="8" y="8" width="24" height="16" rx="6" fill="#FB7185" />
  </svg>
);

export const Marker = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 36 190" fill="none" aria-hidden>
    <rect x="6" y="52" width="24" height="120" rx="6" fill="#22D3EE" />
    <rect x="6" y="52" width="24" height="22" rx="4" fill="#0891B2" />
    <polygon points="10,52 26,52 22,28 14,28" fill="#E0F2FE" />
    <rect x="15" y="12" width="6" height="18" rx="2" fill="#0E7490" />
  </svg>
);

export const BookStack = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 220 150" fill="none" aria-hidden>
    <ellipse cx="110" cy="140" rx="96" ry="8" fill="#000" opacity=".14" />
    <rect x="14" y="98" width="190" height="34" rx="6" fill="#6366F1" />
    <rect x="22" y="104" width="170" height="22" rx="3" fill="#EEF2FF" />
    <rect x="14" y="98" width="14" height="34" rx="5" fill="#4338CA" />
    <rect x="34" y="62" width="160" height="32" rx="6" fill="#22D3EE" />
    <rect x="44" y="68" width="140" height="20" rx="3" fill="#ECFEFF" />
    <rect x="34" y="62" width="14" height="32" rx="5" fill="#0891B2" />
    <rect x="22" y="28" width="150" height="30" rx="6" fill="#A78BFA" />
    <rect x="32" y="34" width="130" height="18" rx="3" fill="#F5F3FF" />
    <rect x="22" y="28" width="14" height="30" rx="5" fill="#7C3AED" />
    <path d="M150 28V12l10 8 10-8v16" fill="#F43F5E" />
  </svg>
);

export const OpenBook = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 240 150" fill="none" aria-hidden>
    <ellipse cx="120" cy="140" rx="104" ry="7" fill="#000" opacity=".14" />
    <path d="M120 24C92 8 46 10 14 22v104c32-12 78-14 106 2z" fill="#FDFBF4" stroke="#C7D2FE" strokeWidth="2" />
    <path d="M120 24c28-16 74-14 106-2v104c-32-12-78-14-106 2z" fill="#F8F5EA" stroke="#C7D2FE" strokeWidth="2" />
    {[44, 58, 72, 86, 100].map((y) => (
      <g key={y}>
        <path d={`M30 ${y}c26-6 60-6 80 2`} stroke="#CBD5E1" strokeWidth="1.6" />
        <path d={`M130 ${y + 2}c20-8 54-8 80-2`} stroke="#CBD5E1" strokeWidth="1.6" />
      </g>
    ))}
    <rect x="34" y="62" width="60" height="9" rx="2" fill="#FDE68A" opacity=".8" />
    <path d="M150 112l8 8 16-18" stroke="#10B981" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M120 24v108" stroke="#A5B4FC" strokeWidth="2" />
  </svg>
);

export const Paperclip = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 28 70" fill="none" aria-hidden>
    <path d="M20 22v30a8 8 0 0 1-16 0V14a6 6 0 0 1 12 0v34a3 3 0 0 1-6 0V24" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const Bookmark = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 30 70" aria-hidden>
    <path d="M0 0h30v70l-15-14L0 70z" fill="#F43F5E" />
  </svg>
);

export const Bulb = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 64 80" fill="none" aria-hidden>
    <path d="M32 6a22 22 0 0 0-13 40c3 3 4 6 4 10h18c0-4 1-7 4-10A22 22 0 0 0 32 6z" fill="#FDE68A" stroke="#F59E0B" strokeWidth="3" />
    <rect x="23" y="58" width="18" height="6" rx="3" fill="#94A3B8" />
    <rect x="26" y="66" width="12" height="6" rx="3" fill="#64748B" />
    <path d="M26 30l6 8 6-8" stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Chart = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 120 80" fill="none" aria-hidden>
    <rect x="12" y="46" width="16" height="26" rx="4" fill="#A78BFA" />
    <rect x="38" y="30" width="16" height="42" rx="4" fill="#6366F1" />
    <rect x="64" y="38" width="16" height="34" rx="4" fill="#22D3EE" />
    <rect x="90" y="14" width="16" height="58" rx="4" fill="#10B981" />
    <path d="M10 38l28-16 26 8 44-24" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Formula = ({ children, className, style }: { children: ReactNode } & P) => (
  <span className={`formula ${className || ''}`} style={style}>
    {children}
  </span>
);

export const Sticky = ({ children, color = 'yellow', className, style }: { children: ReactNode; color?: 'yellow' | 'pink' | 'mint' | 'blue' } & P) => (
  <div className={`sticky sticky-${color} ${className || ''}`} style={style}>
    <span className="tape" />
    {children}
  </div>
);

export const Hl = ({ children, color = 'yellow' }: { children: ReactNode; color?: 'yellow' | 'mint' | 'pink' }) => <mark className={`hl hl-${color}`}>{children}</mark>;

export const Logo = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6366F1" />
        <stop offset="1" stopColor="#22D3EE" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="9" fill="url(#lg)" />
    <path d="M8 22V10l8 3 8-3v12l-8-3z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
