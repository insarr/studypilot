import {
  BookOpen,
  CheckSquare,
  Code2,
  Compass,
  FileText,
  GraduationCap,
  Landmark,
  Layers,
  MessageSquare,
  Microscope,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, useT } from '../store';
import { Icon } from '../components/Icon';
import { InlineMd } from '../components/Md';
import {
  Anime3D,
  Atom3D,
  Bookmark,
  CampusLibraryScene,
  Certificate3D,
  Chart,
  CoffeeStudyArt,
  CozyStudyDeskScene,
  ExamGradeCard,
  FoxMascot,
  GraduationCapArt,
  Hl,
  Laptop3D,
  Logo,
  Microscope3D,
  Notebook,
  OpenBook,
  Pencil,
  Rocket3D,
  Sticky,
  StudentBoy3D,
  StudentGirl3D,
  Target3D,
  TornPaper,
  Trophy3D,
} from '../components/Deco';
import GsapTiltCard from '../components/GsapTiltCard';
import LottieSparkle from '../components/LottieSparkle';
import ThreeHeroCanvas from '../components/ThreeHeroCanvas';
import { ThemeLang } from '../components/UI';
import SmoothTab from '../components/kokonutui/smooth-tab';
import StackPanel, { type StackPage } from '../components/kokonutui/stack-panel';
import StatusIsland from '../components/kokonutui/status-island';

function Reveal({ children, d = 0, className = '' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${on ? 'in' : ''} ${className}`} style={{ '--d': `${d}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}

/* B11 Mandatory Word-by-Word Scroll Tagline Reveal Component */
function TaglineReveal({ text, highlights }: { text: string; highlights: Record<number, 'mint' | 'marigold'> }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const words = text.split(' ');
  const [litCount, setLitCount] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let rafId = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const start = vh * 0.85;
      const end = vh * 0.25;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
      setLitCount(Math.round(progress * words.length));
    };
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [words.length]);

  return (
    <section className="tagline-reveal-sec">
      <div className="wrap">
        <div ref={boxRef} className="tagline-reveal-box">
          <TornPaper color="#fde99b" style={{ width: 190, left: -20, top: -10, transform: 'rotate(-6deg)', opacity: 0.7 }} />
          <TornPaper color="#9bd8a9" style={{ width: 180, right: -15, bottom: -10, transform: 'rotate(5deg)', opacity: 0.7 }} />
          <p className="tagline-reveal-text" style={{ position: 'relative', zIndex: 2 }}>
            {words.map((w, idx) => {
              const isLit = idx < litCount;
              const hl = highlights[idx];
              const pillClass = hl === 'mint' ? 'pastel-pill' : hl === 'marigold' ? 'marigold-pill' : '';
              return (
                <span key={idx} className={`tagline-word ${isLit ? 'lit' : ''} ${isLit ? pillClass : ''}`}>
                  {w}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const t = useT();
  const nav = useNavigate();
  const user = useStore((s) => s.user);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [demoTab, setDemoTab] = useState<'notes' | 'cards' | 'quiz' | 'chat'>('notes');
  const [demoAns, setDemoAns] = useState<number | null>(1);
  const [demoCardFlip, setDemoCardFlip] = useState(false);

  useEffect(() => {
    let raf = 0;
    const h = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 20));
    };
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', h);
    };
  }, []);

  const scrollTo = (id: string) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const disciplines = [
    {
      title: t('Математика и физика', 'Math & Physics'),
      sub: t('Формулы LaTeX, теоремы, вывод уравнений и задачи', 'LaTeX formulas, theorems, derivations and problems'),
      tilt: '-1.5deg',
      art: <Anime3D src="/assets3d/atom-3d.png" alt="Math & Physics" width={82} delay={50} />,
    },
    {
      title: t('IT и алгоритмы', 'CS & Algorithms'),
      sub: t('Сложность O(n), структуры данных, архитектура и код', 'Big-O complexity, data structures, architecture & code'),
      tilt: '1.2deg',
      art: <Anime3D src="/assets3d/laptop-3d.png" alt="CS & Algorithms" width={92} delay={130} />,
    },
    {
      title: t('Медицина и биология', 'Medicine & Biology'),
      sub: t('Латинские термины, классификации, циклы и карточки', 'Terms, classifications, pathways and flashcards'),
      tilt: '-1deg',
      art: <Anime3D src="/assets3d/microscope-3d.png" alt="Medicine & Biology" width={78} delay={210} />,
    },
    {
      title: t('Экономика и право', 'Economics & Law'),
      sub: t('Модели, кейсы, статьи, определения и тезисы лекций', 'Models, case studies, definitions and lecture theses'),
      tilt: '1.5deg',
      art: <Anime3D src="/assets3d/globe-3d.png" alt="Economics & Law" width={78} delay={290} />,
    },
    {
      title: t('Экзамены и зачёты', 'Exams & Finals'),
      sub: t('Расписание по дням, тренировочные билеты и разбор ошибок', 'Daily schedule, practice tickets and mistake review'),
      tilt: '-1.2deg',
      art: <Anime3D src="/assets3d/gradcap-3d.png" alt="Exams & Finals" width={90} delay={370} />,
    },
  ];

  const stackPages: Record<string, StackPage> = {
    root: {
      title: t('Учебные модули и конспекты', 'Study Modules & Notes'),
      sections: [
        {
          title: t('Математический анализ и статистика', 'Calculus & Statistics'),
          rows: [
            { id: 'prob', label: t('Модуль 1: Теория вероятностей', 'Module 1: Probability Theory'), detail: '10 лекций', to: 'prob' },
            { id: 'stat', label: t('Модуль 2: Проверка гипотез и регрессия', 'Module 2: Hypothesis Testing & Regression'), detail: '8 лекций', to: 'stat' },
          ],
        },
        {
          title: t('Автоматизация подготовки (ИИ)', 'AI Study Automation'),
          rows: [
            { id: 'katex', label: t('Рендер формул KaTeX в конспектах', 'KaTeX Formula Rendering in Notes'), checked: true },
            { id: 'sm2', label: t('Интервальное повторение карточек SM-2', 'SM-2 Spaced Repetition Schedule'), checked: true },
            { id: 'cite', label: t('Строгая проверка цитат по файлу лекции', 'Strict Source File Quote Citations'), checked: true },
          ],
          footer: t('Нажмите на модуль, чтобы открыть список лекций и теорем.', 'Click a module to inspect lectures and theorems.'),
        },
      ],
    },
    prob: {
      title: t('Теория вероятностей', 'Probability Theory'),
      sections: [
        {
          title: t('Конспекты в модуле', 'Module Notes'),
          rows: [
            { id: 'l1', label: t('Лекция 1: Пространство исходов Ω и аксиомы', 'Lecture 1: Sample Space & Axioms'), detail: 'KaTeX · 14 терминов', selected: true },
            { id: 'l2', label: t('Лекция 2: Условная вероятность и формула Байеса', 'Lecture 2: Conditional Probability & Bayes'), detail: 'KaTeX · 12 терминов', selected: true },
            { id: 'l3', label: t('Лекция 3: Случайные величины и распределения', 'Lecture 3: Random Variables & Distributions'), detail: 'Тест 10/10', selected: true },
          ],
        },
      ],
    },
    stat: {
      title: t('Статистика и регрессия', 'Statistics & Regression'),
      sections: [
        {
          title: t('Конспекты в модуле', 'Module Notes'),
          rows: [
            { id: 's1', label: t('Лекция 9: Нулевая гипотеза H₀ и p-value', 'Lecture 9: Null Hypothesis H₀ & p-value'), detail: '7 945 симв.', selected: true },
            { id: 's2', label: t('Лекция 10: Метод наименьших квадратов и R²', 'Lecture 10: Ordinary Least Squares & R²'), detail: '5 141 симв.', selected: true },
          ],
        },
      ],
    },
  };

  const testimonials = [
    {
      quote: t(
        'Раньше перед сессией я тонула в двадцати PDF-презентациях по теории вероятностей. В StudyPilot загрузила весь курс и получила идеальные структурные конспекты с формулами и примерами.',
        'Before finals I used to drown in twenty PDF slide decks on probability theory. I uploaded the whole course to StudyPilot and got structured notes with rendered formulas and examples.',
      ),
      name: t('Алина Соколова', 'Alina Sokolova'),
      role: t('Факультет компьютерных наук, 3 курс', 'Computer Science, 3rd year'),
      tag: t('Матстат · 94/100', 'Statistics · 94/100'),
      color: 'var(--color-mint)',
    },
    {
      quote: t(
        'Самое крутое — ИИ не придумывает отсебятину, а отвечает строго по тексту нашего лектора и ставит плашку со ссылкой на файл. Кнопка «Проще» спасла на матанализе.',
        'The best part is that AI never hallucinates — it answers strictly from our professor’s lecture and cites the source file. The “Simpler” button saved me in calculus.',
      ),
      name: t('Даниил Морозов', 'Daniil Morozov'),
      role: t('Прикладная математика и физика, 2 курс', 'Applied Math & Physics, 2nd year'),
      tag: t('Матанализ · Отлично', 'Calculus · Grade A'),
      color: 'var(--color-marigold)',
    },
    {
      quote: t(
        'Интервальные карточки и автоматический разбор ошибок после тестов сократили мою подготовку к коллоквиуму по биохимии с недели до двух спокойных вечеров.',
        'Spaced repetition flashcards and automatic mistake review cut my biochemistry exam prep from a stressful week down to two calm evenings.',
      ),
      name: t('София Лебедева', 'Sofia Lebedeva'),
      role: t('Лечебное дело, медицинский университет', 'Medical School, 4th year'),
      tag: t('Биохимия · 180 карточек', 'Biochemistry · 180 cards'),
      color: 'var(--color-periwinkle)',
    },
  ];

  return (
    <>
      {/* Floating Compact Pill Navigation (Craft Docs + B7 Navigation) */}
      <nav className={`l-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="in">
          <Link to="/" className="brand" style={{ padding: 0 }}>
            <Logo size={32} /> <span>Study<b>Pilot</b></span>
          </Link>
          <div className={`l-links ${menu ? 'open' : ''}`}>
            <a href="#showcase" onClick={(e) => (e.preventDefault(), scrollTo('showcase'))}>{t('Живое демо', 'Live demo')}</a>
            <a href="#library" onClick={(e) => (e.preventDefault(), scrollTo('library'))}>{t('Атмосфера', 'Workspace')}</a>
            <a href="#disciplines" onClick={(e) => (e.preventDefault(), scrollTo('disciplines'))}>{t('Предметы', 'Subjects')}</a>
            <a href="#features" onClick={(e) => (e.preventDefault(), scrollTo('features'))}>{t('Возможности', 'Features')}</a>
            <a href="#faq" onClick={(e) => (e.preventDefault(), scrollTo('faq'))}>FAQ</a>
            <span className="hide-d row" style={{ gap: 8, marginTop: 8 }}><ThemeLang app /></span>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
            <span className="hide-m row" style={{ gap: 8, flexWrap: 'nowrap' }}><ThemeLang app /></span>
            {user ? (
              <button className="btn btn-primary btn-sm" onClick={() => nav('/dashboard')}>{t('Мой аккаунт', 'My account')}</button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm hide-m" style={{ borderRadius: 9999, minWidth: 78, justifyContent: 'center' }}>{t('Войти', 'Log in')}</Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{ minWidth: 196, justifyContent: 'center' }}>{t('Попробовать бесплатно', 'Try StudyPilot Free')}</Link>
              </>
            )}
            <button className="btn btn-icon l-burger" style={{ border: '1px solid var(--line)', borderRadius: 9999 }} onClick={() => setMenu(!menu)} aria-label="Menu">
              <Icon name={menu ? 'x' : 'menu'} />
            </button>
          </div>
        </div>
      </nav>

      {/* Craft Docs Sky-to-Canvas Digital Scrapbook Hero */}
      <header className="craft-hero">
        <div className="craft-hero-grid-bg" />
        <ThreeHeroCanvas />

        {/* Decorative Collage Background Shapes */}
        <TornPaper color="#9bd8a9" className="bob" style={{ width: 250, top: 88, left: '-3%', ['--r' as string]: '-8deg' }} />
        <TornPaper color="#fde99b" className="bob" style={{ width: 240, top: 110, right: '-2%', ['--r' as string]: '7deg', animationDelay: '-2.5s' }} />
        <TornPaper color="#b8caf5" className="bob" style={{ width: 220, bottom: 90, left: '4%', ['--r' as string]: '5deg', animationDelay: '-4s' }} />

        <div className="wrap">
          <div className="craft-hero-center">
            <div className="row" style={{ justifyContent: 'center', gap: 18, marginBottom: -8 }}>
              <Rocket3D className="hide-m" style={{ width: 64 }} />
              <FoxMascot style={{ width: 132 }} />
              <Atom3D className="hide-m" style={{ width: 68 }} />
            </div>
            <div className="craft-tag-pill">
              <LottieSparkle size={20} />
              <motion.span
                key={t('ru-tag', 'en-tag')}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {t('Расширенные конспекты с формулами KaTeX · Карточки SM-2', 'Extended lecture notes with KaTeX math · SM-2 Flashcards')}
              </motion.span>
            </div>

            <motion.h1
              key={t('ru-h1', 'en-h1')}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="craft-display-title"
            >
              <span>{t('Твоё пространство для', 'Your crafted space for')}</span>
              <span className="highlight-marigold">{t('конспектов,', 'lecture notes,')}</span>
              <span>{t('формул и', 'formulas and')}</span>
              <span className="highlight-mint">{t('экзаменов', 'exams')}</span>
            </motion.h1>

            <p className="craft-hero-sub" style={{ minHeight: 58 }}>
              {t(
                'Загрузите лекцию в PDF, DOCX, PPTX или TXT. StudyPilot превратит её в глубокий академический конспект с формулами LaTeX, соберёт карточки, проверит знания тестом и разложит подготовку по дням.',
                'Upload any lecture in PDF, DOCX, PPTX or TXT. StudyPilot turns it into deep academic notes with LaTeX formulas, flashcards, practice quizzes, and a daily exam plan.',
              )}
            </p>

            <div className="row" style={{ justifyContent: 'center', gap: 14, marginTop: 6 }}>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary btn-lg"
                style={{ minWidth: 276, justifyContent: 'center' }}
                onClick={() => nav(user ? '/lectures?new=1' : '/register')}
              >
                <Icon name="upload" size={18} />
                {t('Загрузить лекцию бесплатно', 'Upload a lecture for free')}
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-craft-ghost"
                style={{ minWidth: 224, justifyContent: 'center' }}
                onClick={() => nav(user ? '/dashboard' : '/login')}
              >
                {user ? t('Открыть рабочий стол', 'Open dashboard') : t('Войти в аккаунт', 'Sign in to workspace')}
              </motion.button>
            </div>

            <div className="row" style={{ justifyContent: 'center', gap: 20, fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
              <span>✓ {t('Формулы KaTeX и источники из файла', 'KaTeX math & file citations')}</span>
              <span>✓ {t('PDF · DOCX · PPTX · TXT до 25 МБ', 'PDF · DOCX · PPTX · TXT up to 25 MB')}</span>
              <span>✓ {t('Работает строго по вашей лекции', 'Strictly grounded in your lecture')}</span>
            </div>
          </div>

          {/* Interactive Scrapbook Study Showcase */}
          <div className="scrapbook-stage" id="showcase">
            {/* Top Companion Bar — Placed cleanly above the window so zero text is ever covered */}
            <div className="scrapbook-companion-bar">
              <div className="companion-badge-card">
                <StudentBoy3D style={{ width: 64 }} />
                <div>
                  <div className="caption">{t('Конспект готов за 15 сек', 'Notes ready in 15 sec')}</div>
                  <div className="sub">{t('PDF, DOCX, PPTX → LaTeX конспект', 'PDF, DOCX, PPTX → LaTeX notes')}</div>
                </div>
                <Target3D style={{ width: 44 }} />
              </div>

              <div className="companion-badge-card">
                <Pencil style={{ width: 38 }} />
                <div>
                  <div className="caption">{t('Сессия закрыта на 5+', 'Finals aced with A+')}</div>
                  <div className="sub">{t('Карточки SM-2 и тесты по лекции', 'SM-2 flashcards & lecture quizzes')}</div>
                </div>
                <StudentGirl3D style={{ width: 62 }} />
              </div>
            </div>

            {/* Main Floating Scrapbook Window */}
            <div className="showcase-window">
              <div className="showcase-topbar">
                <div className="row" style={{ gap: 12 }}>
                  <div className="window-dots">
                    <span style={{ background: '#ff5f56' }} />
                    <span style={{ background: '#ffbd2e' }} />
                    <span style={{ background: '#27c93f' }} />
                  </div>
                  <BookOpen size={16} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    Mathematics_III_1.pdf — {t('Теория вероятностей и матстатистика', 'Probability Theory & Statistics')}
                  </span>
                  <StatusIsland
                    tasks={[
                      { id: '1', label: t('KaTeX + ИИ активны', 'KaTeX + AI active'), detail: '14 терминов', status: 'done' },
                    ]}
                    streakCount={7}
                  />
                </div>

                {/* Kokonut UI SmoothTab inside the Hero Mockup */}
                <SmoothTab
                  value={demoTab}
                  onChange={(id) => setDemoTab(id as typeof demoTab)}
                  items={[
                    { id: 'notes', title: t('Расширенный конспект', 'Extended Notes'), icon: FileText },
                    { id: 'cards', title: t('Карточки', 'Flashcards'), icon: Layers, badge: 14 },
                    { id: 'quiz', title: t('Мини-тест', 'Mini Quiz'), icon: CheckSquare },
                    { id: 'chat', title: t('Чат с лекцией', 'Lecture Chat'), icon: MessageSquare },
                  ]}
                />
              </div>

              <div className="showcase-body">
                {/* Left Notebook Sidebar */}
                <div className="showcase-side-l">
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
                    {t('Тетради по предметам', 'Subject Notebooks')}
                  </div>
                  <div className="dd-item" style={{ background: 'var(--color-marigold)', color: '#030302', fontWeight: 600 }}>
                    <Compass size={16} />
                    <span className="grow trunc">{t('Теория вероятностей', 'Probability Theory')}</span>
                    <span className="badge" style={{ background: '#fff' }}>10</span>
                  </div>
                  <div className="dd-item">
                    <Microscope size={16} />
                    <span className="grow trunc">{t('Молекулярная биология', 'Molecular Biology')}</span>
                    <span className="muted sm">6</span>
                  </div>
                  <div className="dd-item">
                    <Code2 size={16} />
                    <span className="grow trunc">{t('Алгоритмы и структуры', 'Algorithms & DS')}</span>
                    <span className="muted sm">8</span>
                  </div>
                  <div className="dd-item">
                    <Landmark size={16} />
                    <span className="grow trunc">{t('Макроэкономика', 'Macroeconomics')}</span>
                    <span className="muted sm">5</span>
                  </div>

                  <div style={{ marginTop: 'auto', padding: 12, borderRadius: 16, background: 'color-mix(in srgb, var(--color-mint) 35%, var(--card))', border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{t('Готовность к экзамену', 'Exam Readiness')}</div>
                    <div style={{ fontFamily: 'var(--font-untitledseriffont)', fontSize: '1.7rem', margin: '2px 0' }}>87%</div>
                    <div className="bar"><i style={{ width: '87%', background: '#178a4c' }} /></div>
                  </div>
                </div>

                {/* Center Interactive Workspace */}
                <div className="showcase-main">
                  {demoTab === 'notes' && (
                    <div className="md-doc">
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 4 }}>
                        {t('РАСШИРЕННЫЕ КОНСПЕКТЫ ЛЕКЦИЙ (1–10)', 'EXTENDED LECTURE NOTES (1–10)')}
                      </div>
                      <h2 className="md-h2" style={{ marginTop: 0 }}>
                        {t('Лекция 1: Пространство исходов, события и аксиомы вероятности', 'Lecture 1: Sample Space, Events, and Probability Axioms')}
                      </h2>

                      <div className="md-li md-li-l0">
                        <div className="md-line-row">
                          <span className="md-bullet-ring" />
                          <div className="md-line-body">
                            <InlineMd
                              text={t(
                                '**Что такое вероятность:** Числовое значение от $0$ (невозможно) до $1$ (достоверно), квантифицирующее неопределённость. В основе всех моделей (от спам-фильтров до нейросетей) лежат эти понятия.',
                                '**What is probability:** A numerical value from $0$ (impossible) to $1$ (certain) quantifying uncertainty. Every model from spam filters to neural networks builds on these foundations.',
                              )}
                            />
                            <span className="md-src-pill">Mathematics_III_1.pdf</span>
                          </div>
                        </div>
                      </div>

                      <div className="md-li md-li-l0">
                        <div className="md-line-row">
                          <span className="md-bullet-ring" />
                          <div className="md-line-body">
                            <InlineMd
                              text={t(
                                '**Пространство элементарных исходов ($\\Omega$):** Множество всех возможных взаимоисключающих результатов случайного эксперимента.',
                                '**Sample space ($\\Omega$):** The set of all possible mutually exclusive outcomes of a random experiment.',
                              )}
                            />
                            <span className="md-src-pill">Mathematics_III_1.pdf</span>
                          </div>
                        </div>
                      </div>

                      <div className="md-li md-li-l1">
                        <div className="md-line-row">
                          <span className="md-bullet-ring" />
                          <div className="md-line-body">
                            <InlineMd
                              text={t(
                                '**Пример (бросок кубика):** $\\Omega = \\{1, 2, 3, 4, 5, 6\\}$, а событие «выпало чётное число» — подмножество $A = \\{2, 4, 6\\}$.',
                                '**Example (rolling a die):** $\\Omega = \\{1, 2, 3, 4, 5, 6\\}$, and the event “an even number rolled” is the subset $A = \\{2, 4, 6\\}$.',
                              )}
                            />
                            <span className="md-src-pill">Mathematics_III_1.pdf</span>
                          </div>
                        </div>
                      </div>

                      <div className="papaya-callout" style={{ margin: '18px 0' }}>
                        <span className="papaya-tag">{t('Классическое определение Лапласа', 'Laplace Classical Formula')}</span>
                        <div style={{ marginTop: 4 }}>
                          <InlineMd
                            text={t(
                              'Если все исходы в $\\Omega$ равновероятны, вероятность события $A$ вычисляется как отношение мощностей множеств:',
                              'If all outcomes in $\\Omega$ are equally likely, the probability of event $A$ is the ratio of cardinalities:',
                            )}
                          />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <InlineMd
                            text={
                              '$$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{\\text{количество благоприятных исходов}}{\\text{общее число исходов}}$$'
                            }
                          />
                        </div>
                      </div>

                      <div className="md-li md-li-l0">
                        <div className="md-line-row">
                          <span className="md-bullet-ring" />
                          <div className="md-line-body">
                            <InlineMd
                              text={t(
                                '**Операции над событиями:** Объединение ($A \\cup B$ — произошло $A$ или $B$), пересечение ($A \\cap B$ — произошли оба) и дополнение ($A^c = \\Omega \\setminus A$).',
                                '**Set operations on events:** Union ($A \\cup B$ — $A$ or $B$ occurred), intersection ($A \\cap B$ — both occurred), and complement ($A^c = \\Omega \\setminus A$).',
                              )}
                            />
                            <span className="md-src-pill">Mathematics_III_1.pdf</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {demoTab === 'cards' && (
                    <div className="stack" style={{ alignItems: 'center', padding: '16px 0' }}>
                      <div className="row spread" style={{ width: '100%' }}>
                        <span className="badge ok">{t('Алгоритм SM-2 · Карточка 1 из 14', 'SM-2 Algorithm · Card 1 of 14')}</span>
                        <span className="muted sm">{t('Нажмите на карточку, чтобы перевернуть', 'Click the card to flip')}</span>
                      </div>
                      <div
                        className={`flip ${demoCardFlip ? 'on' : ''}`}
                        style={{ height: 220, maxWidth: 460 }}
                        onClick={() => setDemoCardFlip(!demoCardFlip)}
                      >
                        <div className="flip-in">
                          <div className="face front" style={{ padding: 22 }}>
                            <div>
                              <div className="badge" style={{ marginBottom: 10 }}>{t('Термин и формула', 'Term & Formula')}</div>
                              <div><InlineMd text={t('Формула условной вероятности $P(A \\mid B)$', 'Conditional Probability Formula $P(A \\mid B)$')} /></div>
                            </div>
                          </div>
                          <div className="face back" style={{ padding: 22 }}>
                            <div>
                              <InlineMd text={'$$P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}, \\quad P(B) > 0$$'} />
                              <div className="sm" style={{ marginTop: 8 }}>
                                {t('Вероятность наступления события A при условии, что событие B уже произошло.', 'The probability of event A occurring given that event B has already occurred.')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDemoCardFlip(!demoCardFlip)}>
                          {demoCardFlip ? t('Показать вопрос', 'Show question') : t('Показать ответ', 'Show answer')}
                        </button>
                        <button className="btn btn-soft btn-sm" onClick={() => setDemoCardFlip(false)}>{t('Хорошо · через 4 дн.', 'Good · in 4 days')}</button>
                        <button className="btn btn-primary btn-sm" onClick={() => setDemoCardFlip(false)}>{t('Легко · через 12 дн.', 'Easy · in 12 days')}</button>
                      </div>
                    </div>
                  )}

                  {demoTab === 'quiz' && (
                    <div className="stack">
                      <div className="row spread">
                        <span className="badge">{t('Вопрос 1 из 10 · Режим тренировки', 'Question 1 of 10 · Practice Mode')}</span>
                        <span className="badge ok">{t('Проверяется по лекции', 'Verified from lecture')}</span>
                      </div>
                      <h3 style={{ fontSize: 18 }}>
                        <InlineMd
                          text={t(
                            'Чему равна вероятность события $A = \\{2, 4, 6\\}$ при одном броске честного шестигранного кубика?',
                            'What is the probability of event $A = \\{2, 4, 6\\}$ when rolling a fair six-sided die once?',
                          )}
                        />
                      </h3>
                      {[
                        ['$P(A) = \\frac{1}{6}$', false],
                        ['$P(A) = \\frac{|A|}{|\\Omega|} = \\frac{3}{6} = 0.5$', true],
                        ['$P(A) = \\frac{2}{6} = \\frac{1}{3}$', false],
                      ].map(([label, isRight], i) => {
                        const chosen = demoAns === i;
                        const cls = chosen ? (isRight ? 'right' : 'wrong') : '';
                        return (
                          <button key={i} className={`opt ${cls}`} onClick={() => setDemoAns(i)}>
                            <span className="ltr">{String.fromCharCode(65 + i)}</span>
                            <span><InlineMd text={String(label)} /></span>
                          </button>
                        );
                      })}
                      {demoAns !== null && (
                        <div className="card" style={{ padding: 14, boxShadow: 'none', background: demoAns === 1 ? 'color-mix(in srgb, var(--color-mint) 35%, var(--card))' : 'color-mix(in srgb, var(--color-marigold) 35%, var(--card))' }}>
                          <b>{demoAns === 1 ? t('✓ Верно!', '✓ Correct!') : t('Попробуйте вариант B:', 'Try option B:')}</b>{' '}
                          <InlineMd
                            text={t(
                              'В пространстве $\\Omega = \\{1,2,3,4,5,6\\}$ ровно $6$ равновероятных исходов, из которых $3$ благоприятствуют событию $A = \\{2,4,6\\}$.',
                              'In sample space $\\Omega = \\{1,2,3,4,5,6\\}$ there are $6$ equally likely outcomes, and $3$ favor $A = \\{2,4,6\\}$.',
                            )}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {demoTab === 'chat' && (
                    <div className="stack">
                      <div className="msg user">
                        {t('Объясни на пальцах, чем отличаются несовместные события от независимых?', 'Explain in simple terms the difference between mutually exclusive and independent events?')}
                      </div>
                      <div className="msg ai">
                        <InlineMd
                          text={t(
                            '**Несовместные события** вообще не могут произойти одновременно: $A \\cap B = \\varnothing$, поэтому если случилось одно, второе уже невозможно (например, на одном кубике выпало сразу $2$ и $5$). А **независимые события** не влияют на вероятность друг друга: $P(A \\cap B) = P(A)\\cdot P(B)$ (например, результаты двух разных бросков кубика).',
                            '**Mutually exclusive events** cannot happen at the same time: $A \\cap B = \\varnothing$. **Independent events** can happen together and do not affect each other’s probability: $P(A \\cap B) = P(A)\\cdot P(B)$.',
                          )}
                        />
                        <blockquote>
                          “<InlineMd text={t('События A и B называются несовместными, если их пересечение пусто: $A \\cap B = \\varnothing$.', 'Events A and B are mutually exclusive if their intersection is empty: $A \\cap B = \\varnothing$.')} />” — Mathematics_III_1.pdf
                        </blockquote>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Collage Study Companion Column */}
                <div className="showcase-side-r">
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
                    {t('Шпаргалка и термины', 'Quick Terms & Sticky')}
                  </div>
                  <div className="card" style={{ padding: 14, boxShadow: 'var(--shadow-sm)', borderRadius: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}><Hl color="yellow">{t('Аксиома нормировки', 'Normalization Axiom')}</Hl></div>
                    <p className="sm" style={{ marginTop: 4 }}>
                      <InlineMd text={t('Вероятность всего пространства исходов всегда равна $P(\\Omega) = 1$.', 'The probability of the entire sample space is always $P(\\Omega) = 1$.')} />
                    </p>
                  </div>
                  <div className="card" style={{ padding: 14, boxShadow: 'var(--shadow-sm)', borderRadius: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}><Hl color="mint">{t('Аддитивность', 'Additivity')}</Hl></div>
                    <p className="sm" style={{ marginTop: 4 }}>
                      <InlineMd text={t('Для несовместных событий $P(A \\cup B) = P(A) + P(B)$.', 'For disjoint events $P(A \\cup B) = P(A) + P(B)$.')} />
                    </p>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'var(--card-2)', border: '1px solid var(--line)' }}>
                    <CoffeeStudyArt style={{ width: 42, flexShrink: 0 }} />
                    <div className="hand" style={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
                      {t('Никакого хаоса в конспектах перед сессией!', 'No more messy notes before finals!')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Companion Strip — Cleanly below the window without covering any text */}
            <div className="scrapbook-footer-bar hide-m">
              <Sticky color="yellow" style={{ transform: 'rotate(-1.5deg)', padding: '10px 18px' }}>
                {t('Экзамен через 5 дней — план готов!', 'Exam in 5 days — study plan ready!')}
              </Sticky>
              <div className="row" style={{ gap: 12 }}>
                <Laptop3D style={{ width: 78 }} />
                <span className="muted sm" style={{ fontWeight: 600 }}>
                  {t('Автосохранение конспектов, карточек и истории чата', 'Auto-saves notes, flashcards, and chat history')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* B11 Mandatory Word-by-Word Scroll Tagline Reveal Section */}
      <TaglineReveal
        text={t(
          'Превратите длинные университетские лекции и сложные учебники в живые конспекты с формулами, умные карточки и чёткий план подготовки к каждому экзамену.',
          'Turn long university lectures and dense textbooks into living notes with formulas, smart flashcards, and a clear daily plan for every exam.',
        )}
        highlights={{ 5: 'marigold', 8: 'mint', 11: 'marigold' }}
      />

      {/* University Library & Interactive StackPanel Section */}
      <section className="sec" id="library" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="grid g2" style={{ alignItems: 'center', gap: 32 }}>
            <Reveal>
              <CampusLibraryScene
                caption={t(
                  'Атмосфера университетской библиотеки и совместной подготовки — в вашей цифровой тетради StudyPilot',
                  'The warmth of a university library and collaborative study session — inside your StudyPilot notebook',
                )}
              />
            </Reveal>
            <Reveal d={90}>
              <div className="stack" style={{ gap: 18 }}>
                <span className="craft-tag-pill" style={{ alignSelf: 'flex-start' }}>
                  <GraduationCap size={15} />
                  <span>{t('Интерактивная структура курса', 'Interactive Course Navigator')}</span>
                </span>
                <h2>{t('Порядок в каждом предмете и модуле', 'Every subject and module, thoughtfully organized')}</h2>
                <p className="muted" style={{ fontSize: 16 }}>
                  {t(
                    'Нажмите на любой модуль ниже, чтобы посмотреть, как StudyPilot раскладывает лекции, формулы KaTeX и карточки по полочкам.',
                    'Click any module below to explore how StudyPilot organizes lectures, KaTeX formulas, and flashcards.',
                  )}
                </p>
                {/* Kokonut UI StackPanel */}
                <StackPanel pages={stackPages} root="root" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5-Column Craft Discipline Grid ("Craft is for your things") */}
      <section className="sec" id="disciplines" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <h2>{t('StudyPilot создан для каждого предмета', 'StudyPilot is crafted for every discipline')}</h2>
              <p className="lead">
                {t(
                  'От матанализа и машинного обучения до медицины, права и гуманитарных курсов — оформление адаптируется под структуру вашей дисциплины.',
                  'From calculus and machine learning to medicine, law, and humanities — notes adapt to your subject’s structure.',
                )}
              </p>
            </div>
          </Reveal>

          <div className="craft-5col">
            {disciplines.map((d, i) => (
              <Reveal key={d.title} d={i * 70}>
                <GsapTiltCard className="discipline-card" style={{ ['--tilt' as string]: d.tilt, height: '100%' }}>
                  <div className="discipline-art">
                    {d.art}
                  </div>
                  <h3 style={{ fontSize: 18, margin: 0 }}>{d.title}</h3>
                  <p className="sm muted">{d.sub}</p>
                </GsapTiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Scrapbook Bento Collage Features Section */}
      <section className="sec" id="features">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <h2>{t('Как умный студенческий скрапбук', 'Like a thoughtful academic scrapbook')}</h2>
              <p className="lead">
                {t(
                  'Все учебные материалы собираются в аккуратные тетради с формулами, закладками, карточками и статистикой прогресса.',
                  'All your study materials come together in tactile notebooks with formulas, bookmarks, flashcards, and progress analytics.',
                )}
              </p>
            </div>
          </Reveal>

          <div className="bento-grid">
            {/* Bento 1: Extended Academic Notes with KaTeX */}
            <Reveal className="bento-7" d={0}>
              <div className="bento-card" style={{ height: '100%' }}>
                <div>
                  <span className="badge ok" style={{ marginBottom: 12 }}>{t('Конспекты нового поколения', 'Next-Gen Lecture Notes')}</span>
                  <h3 className="serif-head" style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.1rem)', marginBottom: 10 }}>
                    {t('Расширенные конспекты с формулами KaTeX и плашками источников', 'Extended notes with KaTeX formulas and source file badges')}
                  </h3>
                  <p className="muted">
                    {t(
                      'Никаких сухих огрызков текста и «сырых» символов разметки. ИИ разбивает лекцию на разделы, выделяет определения, оформляет примеры во вложенные списки и рендерит настоящие математические уравнения.',
                      'No superficial summaries or raw markdown symbols. AI structures lectures into sections, highlights definitions, indents examples, and renders real mathematical equations.',
                    )}
                  </p>
                </div>
                <div className="papaya-callout">
                  <span className="papaya-tag">{t('Формула Байеса · Выдержка из конспекта', 'Bayes Theorem · Note Excerpt')}</span>
                  <div style={{ marginTop: 8 }}>
                    <InlineMd text={'$$P(H_i \\mid A) = \\frac{P(A \\mid H_i)\\,P(H_i)}{\\sum_{j=1}^{n} P(A \\mid H_j)\\,P(H_j)}$$'} />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Bento 2: Multi-format Upload & Cozy Study Desk Illustration */}
            <Reveal className="bento-5" d={80}>
              <div className="bento-card pastel-marigold" style={{ height: '100%' }}>
                <div>
                  <span className="badge" style={{ background: '#fff', marginBottom: 12 }}>PDF · DOCX · PPTX · TXT</span>
                  <h3 className="serif-head" style={{ fontSize: 'clamp(1.5rem, 2.3vw, 1.95rem)', marginBottom: 10 }}>
                    {t('Мгновенное чтение слайдов, методичек и учебников', 'Instant extraction from slides, handouts, and textbooks')}
                  </h3>
                  <p style={{ color: 'var(--text-2)' }}>
                    {t(
                      'Перетащите презентацию преподавателя или PDF-лекцию. Текст извлекается за секунду и раскладывается по предметам и модулям.',
                      'Drop your professor’s slide deck or PDF lecture. Text is extracted in a second and organized by subject and module.',
                    )}
                  </p>
                </div>
                <CozyStudyDeskScene style={{ width: '100%', borderRadius: 16, border: '1px solid rgba(3,3,2,0.12)' }} />
              </div>
            </Reveal>

            {/* Bento 3: Spaced Repetition Flashcards */}
            <Reveal className="bento-4" d={120}>
              <div className="bento-card pastel-mint" style={{ height: '100%' }}>
                <div>
                  <span className="badge" style={{ background: '#fff', marginBottom: 12 }}>{t('Алгоритм SM-2', 'SM-2 Algorithm')}</span>
                  <h3 className="serif-head" style={{ fontSize: '1.65rem', marginBottom: 10 }}>
                    {t('Умные карточки для запоминания', 'Spaced repetition flashcards')}
                  </h3>
                  <p style={{ color: 'var(--text-2)' }}>
                    {t(
                      'Карточки создаются автоматически по терминам и теоремам лекции. Сложные карточки показываются чаще, лёгкие — реже.',
                      'Cards are generated automatically from lecture terms and theorems. Hard cards appear more often, easy ones less.',
                    )}
                  </p>
                </div>
                <div className="card" style={{ padding: 16, borderRadius: 18, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-untitledseriffont)', fontSize: '1.25rem' }}>
                    <InlineMd text={t('Коэффициент детерминации $R^2$', 'Coefficient of determination $R^2$')} />
                  </div>
                  <div className="muted sm" style={{ marginTop: 6 }}>
                    <InlineMd text={'$$R^2 = 1 - \\frac{SS_{\\text{res}}}{SS_{\\text{tot}}}$$'} />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Bento 4: Practice & Exam Quizzes + Mistake Notebook */}
            <Reveal className="bento-8" d={160}>
              <div className="bento-card pastel-periwinkle" style={{ height: '100%' }}>
                <div className="grid g2" style={{ alignItems: 'center' }}>
                  <div>
                    <span className="badge" style={{ background: '#fff', marginBottom: 12 }}>{t('Тренировка и Экзамен', 'Practice & Exam Modes')}</span>
                    <h3 className="serif-head" style={{ fontSize: 'clamp(1.55rem, 2.4vw, 2rem)', marginBottom: 10 }}>
                      {t('Тесты на 5, 10 или 20 вопросов и тетрадь разбора ошибок', 'Custom quizzes and an automatic mistake notebook')}
                    </h3>
                    <p style={{ color: 'var(--text-2)' }}>
                      {t(
                        'Выбирайте варианты ответа, верно/неверно, короткий или открытый ответ. Каждая ошибка автоматически попадает в «Тетрадь ошибок» с подробным объяснением.',
                        'Choose multiple choice, true/false, short or open answers. Every mistake is saved to your Mistake Notebook with a clear explanation.',
                      )}
                    </p>
                  </div>
                  <div className="row" style={{ justifyContent: 'center', gap: 16 }}>
                    <ExamGradeCard style={{ width: 110 }} />
                    <Trophy3D style={{ width: 92 }} />
                    <Certificate3D style={{ width: 96 }} />
                    <Microscope3D style={{ width: 78 }} />
                    <Chart style={{ width: 105 }} />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="sec" id="how" style={{ background: 'var(--bg-2)' }}>
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <h2>{t('Три шага от файла до пятёрки в зачётке', 'Three steps from raw file to an A+')}</h2>
              <p className="lead">{t('Никаких сложных настроек — всё работает сразу после загрузки лекции.', 'Zero complex setup — everything works the moment you drop your lecture.')}</p>
            </div>
          </Reveal>
          <div className="grid g3">
            {[
              [
                t('Загрузите лекцию', 'Upload your lecture'),
                t('Перетащите PDF, DOCX, PPTX, TXT или вставьте текст вручную. Выберите предмет и модуль.', 'Drop a PDF, DOCX, PPTX, TXT file or paste text. Pick a subject and module.'),
                <Notebook style={{ width: 84 }} />,
              ],
              [
                t('Получите расширенный конспект', 'Get extended academic notes'),
                t('Через несколько секунд готовы подробный конспект с формулами KaTeX, выжимка на 1 страницу, словарь терминов и Mind Map.', 'In seconds you get detailed notes with KaTeX math, a 1-page summary, glossary terms, and a Mind Map.'),
                <OpenBook style={{ width: 110 }} />,
              ],
              [
                t('Закрепите тестом и карточками', 'Master with quizzes & cards'),
                t('Пройдите тест в режиме тренировки или экзамена, повторите карточки SM-2 и следуйте дневному плану до дня сдачи.', 'Take a practice or timed exam quiz, review SM-2 flashcards, and follow your daily schedule.'),
                <GraduationCapArt style={{ width: 96 }} />,
              ],
            ].map(([h, p, art], i) => (
              <Reveal key={String(h)} d={i * 90}>
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 18 }}>
                  <div>
                    <div className="row spread" style={{ marginBottom: 12 }}>
                      <div className="step-n">0{i + 1}</div>
                      {art}
                    </div>
                    <h3 style={{ fontSize: 21 }}>{h}</h3>
                    <p className="muted" style={{ marginTop: 8 }}>{p}</p>
                  </div>
                  <div className="row" style={{ gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                    <span>•</span>
                    <span>{i === 0 ? t('До 25 МБ на файл', 'Up to 25 MB per file') : i === 1 ? t('Рендер формул LaTeX', 'LaTeX formula rendering') : t('Авто-разбор ошибок', 'Auto mistake review')}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="card" style={{ marginTop: 32, background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div className="row" style={{ gap: 20 }}>
                <OpenBook style={{ width: 120 }} />
                <div className="stack" style={{ gap: 4 }}>
                  <h3 className="serif-head" style={{ fontSize: '1.5rem', margin: 0 }}>
                    {t('ИИ отвечает ', 'AI answers ')}
                    <Hl color="yellow">{t('строго по вашей лекции', 'strictly from your lecture')}</Hl>
                    {t(' — без галлюцинаций', ' — zero hallucinations')}
                  </h3>
                  <p className="muted">
                    {t('Каждый ответ в чате сопровождается точной цитатой из загруженного материала. Если информации в лекции нет — StudyPilot честно об этом скажет.', 'Every chat answer includes an exact quote from your uploaded material. If a topic is not in the lecture, StudyPilot tells you honestly.')}
                  </p>
                </div>
              </div>
              <Bookmark style={{ width: 24 }} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Craft Literary Serif Testimonials Section */}
      <section className="sec">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <h2>{t('Создано для тех, кто учится с умом', 'Crafted for students who study smart')}</h2>
              <p className="lead">{t('Студенты технических, медицинских и гуманитарных факультетов готовятся к сессии в StudyPilot.', 'Engineering, medical, and humanities students prepare for finals in StudyPilot.')}</p>
            </div>
          </Reveal>
          <div className="grid g3">
            {testimonials.map((item, i) => (
              <Reveal key={item.name} d={i * 80}>
                <div className="quote-card" style={{ height: '100%' }}>
                  <div>
                    <span className="badge" style={{ background: item.color, color: '#030302', marginBottom: 16 }}>{item.tag}</span>
                    <p className="quote-serif">“{item.quote}”</p>
                  </div>
                  <div className="row" style={{ gap: 12, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                    <div className="avatar" style={{ background: item.color }}>{item.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                      <div className="muted sm">{item.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="sec" id="faq" style={{ paddingTop: 20 }}>
        <div className="wrap" style={{ maxWidth: 860 }}>
          <Reveal>
            <div className="sec-head">
              <h2>{t('Частые вопросы', 'Frequently asked questions')}</h2>
            </div>
          </Reveal>
          <div className="faq">
            {[
              [
                t('Какие форматы файлов поддерживаются?', 'Which file formats are supported?'),
                t('Вы можете загружать файлы PDF, DOCX, PPTX и TXT размером до 25 МБ или просто вставить текст лекции вручную. Текст из слайдов презентаций и документов извлекается автоматически.', 'You can upload PDF, DOCX, PPTX, and TXT files up to 25 MB, or paste lecture text directly. Text from slides and documents is extracted automatically.'),
              ],
              [
                t('Как оформляются математические формулы и символы в конспектах?', 'How are mathematical formulas and symbols rendered in notes?'),
                t('StudyPilot использует встроенный математический движок KaTeX. Все дроби, интегралы, матрицы, греческие символы (Ω, μ, σ) и формулы отображаются в виде чистой академической вёрстки, как в университетских учебниках.', 'StudyPilot uses the built-in KaTeX math engine. Fractions, integrals, Greek letters (Ω, μ, σ), and equations render in crisp textbook typography.'),
              ],
              [
                t('Придумывает ли нейросеть факты, которых не было в лекции?', 'Does the AI invent facts that were not in my lecture?'),
                t('Нет. Ассистент работает строго по тексту вашей лекции, прикрепляет плашки с названием исходного файла и приводит прямые цитаты в чате.', 'No. The assistant works strictly from your lecture text, attaches source file badges, and provides direct quotes in chat.'),
              ],
              [
                t('Что делает кнопка «Проще» возле пунктов конспекта и терминов?', 'What does the “Simpler” button next to notes and terms do?'),
                t('Нажатие на иконку лампочки возле любого сложного определения или абзаца просит ИИ объяснить этот фрагмент простыми словами с наглядной жизненной аналогией.', 'Clicking the lightbulb icon next to any complex definition or bullet asks AI to explain that specific passage in plain language with a relatable analogy.'),
              ],
              [
                t('Сохраняются ли мои предметы, конспекты и результаты тестов?', 'Are my subjects, notes, and quiz results saved?'),
                t('Да, все ваши лекции, сгенерированные конспекты, карточки, история чата и статистика тестов автоматически сохраняются на сервере в вашем аккаунте и доступны после перезагрузки браузера.', 'Yes, all your lectures, generated notes, flashcards, chat history, and quiz stats are saved on the server in your account and persist across reloads.'),
              ],
              [
                t('Безопасно ли хранятся API-ключи нейросетей?', 'Are the AI API keys stored securely?'),
                t('Да. Все ключи хранятся исключительно на стороне бэкенд-сервера в .env и никогда не передаются в клиентский код браузера.', 'Yes. All API keys live strictly on the backend server in .env and are never exposed to the browser.'),
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final Scrapbook Collage CTA */}
      <section className="sec" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="cta">
            <TornPaper color="#9bd8a9" style={{ width: 240, right: -30, top: -30, transform: 'rotate(10deg)', opacity: 0.85 }} />
            <TornPaper color="#fde99b" style={{ width: 220, right: 160, bottom: -40, transform: 'rotate(-6deg)', opacity: 0.85 }} />
            <div className="stack" style={{ gap: 18, maxWidth: 600, position: 'relative', zIndex: 2 }}>
              <span className="craft-tag-pill" style={{ alignSelf: 'flex-start' }}>
                <GraduationCap size={15} />
                <span>{t('Готовы к следующей сессии?', 'Ready for your next exam session?')}</span>
              </span>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.1rem)' }}>
                {t('Соберите идеальную тетрадь по каждому предмету уже сегодня', 'Build the ultimate notebook for every subject today')}
              </h2>
              <p className="muted" style={{ fontSize: 17 }}>
                {t('Загрузите первую лекцию и получите расширенный конспект с формулами, карточки и тренировочный тест за 15 секунд.', 'Upload your first lecture and get extended notes with formulas, flashcards, and a practice quiz in 15 seconds.')}
              </p>
              <div className="row" style={{ gap: 12 }}>
                <button className="btn btn-primary btn-lg" onClick={() => nav(user ? '/dashboard' : '/register')}>
                  {user ? t('Открыть мой рабочий стол', 'Open my workspace') : t('Начать учиться бесплатно', 'Start studying for free')}
                </button>
                <button className="btn btn-ghost btn-lg" style={{ borderRadius: 9999 }} onClick={() => nav(user ? '/lectures?new=1' : '/login')}>
                  {user ? t('Загрузить лекцию', 'Upload lecture') : t('Войти в аккаунт', 'Log in')}
                </button>
              </div>
            </div>
            <Notebook className="bob hide-m" style={{ position: 'absolute', right: '6%', bottom: -20, width: 175, zIndex: 2, ['--r' as string]: '7deg' }} />
            <GraduationCapArt className="bob hide-m" style={{ position: 'absolute', right: '22%', top: 28, width: 105, zIndex: 2, ['--r' as string]: '-8deg', animationDelay: '-2s' }} />
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap row spread">
          <div className="row" style={{ gap: 10 }}>
            <Logo size={26} />
            <b style={{ color: 'var(--text)' }}>StudyPilot</b>
            <span>· {t('Цифровой скрапбук и AI-помощник для учёбы', 'Digital Scrapbook & AI Study Workspace')}</span>
          </div>
          <div className="row" style={{ gap: 16 }}>
            <Link to="/login">{t('Вход', 'Log in')}</Link>
            <Link to="/register">{t('Регистрация', 'Sign up')}</Link>
            <Link to="/dashboard">{t('Рабочий стол', 'Dashboard')}</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
