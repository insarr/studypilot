import { animate } from 'animejs';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type P = { className?: string; style?: CSSProperties };

/** Wrapper that gives any 3D asset an Anime.js floating + hover-bounce effect */
export function Anime3D({
  src,
  alt = '',
  width,
  className = '',
  style,
  float = true,
  delay = 0,
}: {
  src: string;
  alt?: string;
  width?: number | string;
  float?: boolean;
  delay?: number;
} & P) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !float) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const anim = animate(el, {
      translateY: [-5, 5],
      rotate: [-1.5, 1.5],
      duration: 2400 + (delay % 700),
      delay,
      alternate: true,
      loop: true,
      ease: 'inOutSine',
    });
    return () => {
      anim.pause();
    };
  }, [float, delay]);

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={`asset-3d ${className}`}
      style={{
        width: width ?? undefined,
        height: 'auto',
        objectFit: 'contain',
        userSelect: 'none',
        ...style,
      }}
      onMouseEnter={(e) => {
        animate(e.currentTarget, {
          scale: [1, 1.1, 1.04],
          duration: 420,
          ease: 'outBack(1.8)',
        });
      }}
      onMouseLeave={(e) => {
        animate(e.currentTarget, {
          scale: 1,
          duration: 260,
          ease: 'outQuad',
        });
      }}
    />
  );
}

/* ---------- Official StudyPilot Fox Mascot & Logos ---------- */
export const Logo = ({ size = 38 }: { size?: number }) => (
  <img
    src="/assets3d/fox-mascot.png"
    alt="StudyPilot Fox Mascot"
    width={size}
    height={size}
    style={{
      width: size,
      height: size,
      objectFit: 'contain',
      flexShrink: 0,
      filter: 'drop-shadow(0 3px 6px rgba(3, 3, 2, 0.14))',
    }}
  />
);

export const FoxMascot = ({ className, style }: P) => (
  <Anime3D src="/assets3d/fox-mascot.png" alt="StudyPilot Fox Pilot" className={className} style={style} />
);

export const FoxLogoFull = ({ className, style }: P) => (
  <Anime3D src="/assets3d/fox-logo-full.png" alt="StudyPilot" className={className} style={style} />
);

/* ---------- 3D Study & Stationery Assets ---------- */
export const Notebook = ({ className, style }: P) => (
  <Anime3D src="/assets3d/notebook-aplus.png" alt="Notebook A+" className={className} style={style} delay={120} />
);

export const ExamGradeCard = ({ className, style }: P) => (
  <Anime3D src="/assets3d/notebook-aplus.png" alt="Exam A+" className={className} style={style} delay={240} />
);

export const Pencil = ({ className, style }: P) => (
  <Anime3D src="/assets3d/pencil-3d.png" alt="Pencil" className={className} style={style} delay={180} />
);

export const Marker = ({ className, style }: P) => (
  <Anime3D src="/assets3d/pencil-3d.png" alt="Pencil" className={className} style={style} delay={340} />
);

export const BookStack = ({ className, style }: P) => (
  <Anime3D src="/assets3d/books-3d.png" alt="Books" className={className} style={style} delay={90} />
);

export const OpenBook = ({ className, style }: P) => (
  <Anime3D src="/assets3d/openbook-3d.png" alt="Open Book" className={className} style={style} delay={150} />
);

export const GraduationCapArt = ({ className, style }: P) => (
  <Anime3D src="/assets3d/gradcap-3d.png" alt="Graduation Cap" className={className} style={style} delay={210} />
);

export const Bulb = ({ className, style }: P) => (
  <Anime3D src="/assets3d/bulb-3d.png" alt="Idea Lightbulb" className={className} style={style} delay={60} />
);

export const Chart = ({ className, style }: P) => (
  <Anime3D src="/assets3d/chart-3d.png" alt="Progress Chart" className={className} style={style} delay={300} />
);

export const Laptop3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/laptop-3d.png" alt="Laptop" className={className} style={style} delay={140} />
);

export const Target3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/target-3d.png" alt="Target" className={className} style={style} delay={200} />
);

export const Search3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/search-3d.png" alt="Search" className={className} style={style} delay={110} />
);

export const Clock3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/clock-3d.png" alt="Clock" className={className} style={style} delay={260} />
);

export const Calendar3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/calendar-3d.png" alt="Calendar" className={className} style={style} delay={170} />
);

export const StudentBoy3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/student-boy.png" alt="Student with laptop" className={className} style={style} delay={80} />
);

export const StudentGirl3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/student-girl.png" alt="Student with books" className={className} style={style} delay={280} />
);

export const FolderBlue3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/folder-blue-3d.png" alt="Blue Folder" className={className} style={style} float={false} />
);

export const FolderYellow3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/folder-yellow-3d.png" alt="Yellow Folder" className={className} style={style} float={false} />
);

export const FolderGreen3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/folder-green-3d.png" alt="Green Folder" className={className} style={style} float={false} />
);

export const MicroscopeArt = ({ className, style }: P) => (
  <Anime3D src="/assets3d/microscope-3d.png" alt="Medicine & Science" className={className} style={style} float={false} />
);

export const CompassRulerArt = ({ className, style }: P) => (
  <Anime3D src="/assets3d/atom-3d.png" alt="Mathematics & Physics" className={className} style={style} float={false} />
);

export const CoffeeStudyArt = ({ className, style }: P) => (
  <Anime3D src="/assets3d/bulb-3d.png" alt="Study Idea" className={className} style={style} delay={160} />
);

export const Paperclip = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 28 70" fill="none" aria-hidden>
    <path d="M20 22v30a8 8 0 0 1-16 0V14a6 6 0 0 1 12 0v34a3 3 0 0 1-6 0V24" stroke="#41413F" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

export const Bookmark = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 30 70" aria-hidden>
    <path d="M0 0h30v70l-15-14L0 70z" fill="#FF4500" />
  </svg>
);

export const TornPaper = ({
  color = '#9bd8a9',
  className,
  style,
}: { color?: string } & P) => (
  <svg className={`torn-shape ${className || ''}`} style={style} viewBox="0 0 260 180" fill="none" aria-hidden>
    <path
      d="M12 18 L34 12 L58 19 L84 11 L112 17 L140 10 L168 18 L196 11 L224 19 L248 14 L252 44 L246 76 L253 108 L245 140 L250 164 L222 170 L194 162 L164 171 L136 163 L106 171 L78 162 L48 170 L20 163 L8 168 L14 134 L7 98 L15 62 Z"
      fill={color}
      stroke="#030302"
      strokeWidth="1.5"
      strokeOpacity="0.16"
    />
    <pattern id={`dots-${color.replace('#', '')}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.2" fill="#030302" fillOpacity="0.15" />
    </pattern>
    <path
      d="M16 22 L244 18 L244 160 L16 160 Z"
      fill={`url(#dots-${color.replace('#', '')})`}
    />
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

export const CampusLibraryScene = ({
  caption,
  className = '',
  style,
}: { caption?: string } & P) => (
  <div className={`scrapbook-photo-frame ${className}`} style={style}>
    <span className="photo-tape tl" aria-hidden="true" />
    <span className="photo-tape tr" aria-hidden="true" />
    <img
      src="/illustrations/campus-library.jpg"
      alt={caption || 'University library study space'}
      className="scrapbook-photo-img"
      loading="lazy"
    />
    {caption && <div className="scrapbook-photo-cap">{caption}</div>}
  </div>
);

export const CozyStudyDeskScene = ({ className, style }: P) => (
  <div className={`row ${className || ''}`} style={{ justifyContent: 'center', gap: 18, padding: '12px 0', ...style }}>
    <StudentBoy3D style={{ width: 118 }} />
    <OpenBook style={{ width: 170 }} />
    <StudentGirl3D style={{ width: 114 }} />
  </div>
);


/* ---------- Additional 3D Assets from New Sprite Sheet ---------- */
export const Atom3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/atom-3d.png" alt="Atom" className={className} style={style} delay={90} />
);

export const Flask3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/flask-3d.png" alt="Chemistry Flask" className={className} style={style} delay={190} />
);

export const Microscope3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/microscope-3d.png" alt="Lab Microscope" className={className} style={style} delay={130} />
);

export const Trophy3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/trophy-3d.png" alt="Trophy" className={className} style={style} delay={220} />
);

export const Certificate3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/certificate-3d.png" alt="Certificate" className={className} style={style} delay={150} />
);

export const Rocket3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/rocket-3d.png" alt="Rocket" className={className} style={style} delay={70} />
);

export const Megaphone3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/megaphone-3d.png" alt="Megaphone" className={className} style={style} delay={240} />
);

export const Globe3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/globe-3d.png" alt="Globe" className={className} style={style} delay={110} />
);

export const OpenBook3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/openbook-3d.png" alt="Open Textbook" className={className} style={style} delay={170} />
);

export const Alarm3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/alarm-3d.png" alt="Alarm Clock" className={className} style={style} delay={210} />
);

export const Plant3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/plant-3d.png" alt="Plant" className={className} style={style} delay={300} />
);

export const Planet3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/planet-3d.png" alt="Planet" className={className} style={style} delay={160} />
);

export const Plane3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/plane-3d.png" alt="Paper Plane" className={className} style={style} delay={80} />
);

export const RobotAssistant3D = ({ className, style }: P) => (
  <Anime3D src="/assets3d/robot-assistant-3d.png" alt="StudyPilot AI Assistant" className={className} style={style} float={false} />
);

export const FileIcon3D = ({
  kind = 'txt',
  width = 38,
  className = '',
  style,
}: { kind?: string; width?: number } & P) => {
  const k = kind.toLowerCase();
  const src =
    k === 'pdf'
      ? '/assets3d/file-pdf-3d.png'
      : k === 'docx' || k === 'doc'
        ? '/assets3d/file-doc-3d.png'
        : k === 'pptx' || k === 'ppt'
          ? '/assets3d/file-img-3d.png'
          : k === 'zip'
            ? '/assets3d/file-zip-3d.png'
            : k === 'code' || k === 'md'
              ? '/assets3d/file-code-3d.png'
              : '/assets3d/file-txt-3d.png';
  return <Anime3D src={src} alt={kind.toUpperCase()} width={width} float={false} className={className} style={style} />;
};
