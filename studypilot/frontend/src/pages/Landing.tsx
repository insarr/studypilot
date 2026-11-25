import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, useT } from '../store';
import { Icon } from '../components/Icon';
import { BookStack, Bookmark, Bulb, Chart, Formula, Hl, Logo, Marker, Notebook, OpenBook, Paperclip, Pencil, Sticky } from '../components/Deco';
import { ThemeLang } from '../components/UI';

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

export default function Landing() {
  const t = useT();
  const nav = useNavigate();
  const user = useStore((s) => s.user);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scrollTo = (id: string) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const title = t('Загрузи лекцию — получи конспект, тест и план до экзамена', 'Upload a lecture — get notes, a quiz, and an exam plan').split(' ');
  const gradStart = Math.floor(title.length / 2) + 1;

  const features = [
    ['upload', t('Загрузка PDF, DOCX, PPTX, TXT', 'PDF, DOCX, PPTX, TXT upload'), t('Текст извлекается автоматически и хранится по предметам и модулям.', 'Text is extracted automatically and stored by subject and module.'), '#6366F1'],
    ['note', t('Умный конспект', 'Smart notes'), t('Краткий и подробный конспект, термины, mind map и темы для экзамена.', 'Short & detailed notes, terms, mind map and exam topics.'), '#A78BFA'],
    ['send', t('Чат по лекции', 'Lecture chat'), t('AI отвечает только по вашему материалу и честно говорит, если ответа в нём нет.', 'AI answers only from your material and honestly says when it is not there.'), '#22D3EE'],
    ['test', t('Тесты', 'Quizzes'), t('5, 10 или 20 вопросов: варианты, верно/неверно, короткий и открытый ответ.', '5, 10 or 20 questions: choice, true/false, short and open answer.'), '#10B981'],
    ['cards', t('Карточки', 'Flashcards'), t('Интервальное повторение: приложение само напомнит, что пора повторить.', 'Spaced repetition: the app reminds you what to review.'), '#F59E0B'],
    ['plan', t('План до экзамена', 'Exam plan'), t('Укажите дату экзамена — получите расписание по дням с отметками выполнения.', 'Set an exam date — get a day-by-day schedule with checkmarks.'), '#F43F5E'],
  ];

  return (
    <>
      <nav className={`l-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="wrap in">
          <Link to="/" className="brand" style={{ padding: 0 }}>
            <Logo /> <span>Study<b>Pilot</b></span>
          </Link>
          <div className={`l-links ${menu ? 'open' : ''}`}>
            <a href="#features" onClick={(e) => (e.preventDefault(), scrollTo('features'))}>{t('Возможности', 'Features')}</a>
            <a href="#how" onClick={(e) => (e.preventDefault(), scrollTo('how'))}>{t('Как это работает', 'How it works')}</a>
            <a href="#faq" onClick={(e) => (e.preventDefault(), scrollTo('faq'))}>FAQ</a>
            <span className="hide-d row" style={{ gap: 8 }}><ThemeLang app /></span>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
            <span className="hide-m row" style={{ gap: 8, flexWrap: 'nowrap' }}><ThemeLang /></span>
            {user ? (
              <button className="btn btn-primary btn-sm" onClick={() => nav('/dashboard')}>{t('Мой аккаунт', 'My account')}</button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm hide-m" style={{ background: 'transparent', color: 'inherit', borderColor: 'currentColor' }}>{t('Войти', 'Log in')}</Link>
                <Link to="/register" className="btn btn-primary btn-sm">{t('Начать', 'Start')}</Link>
              </>
            )}
            <button className="btn btn-icon l-burger" style={{ border: '1px solid currentColor' }} onClick={() => setMenu(!menu)} aria-label="Menu"><Icon name={menu ? 'x' : 'menu'} /></button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="orb" style={{ width: 340, height: 340, background: '#6366F1', top: -60, left: -80 }} />
        <div className="orb" style={{ width: 300, height: 300, background: '#22D3EE', top: '18%', right: -90, animationDelay: '-4s' }} />
        <div className="orb" style={{ width: 280, height: 280, background: '#A78BFA', bottom: -70, left: '38%', animationDelay: '-7s' }} />
        <div className="wrap hero-grid">
          <div className="stack" style={{ gap: 22, alignItems: 'flex-start', minWidth: 0 }}>
            <span className="eyebrow"><span style={{ width: 8, height: 8, borderRadius: 8, background: '#22D3EE', boxShadow: '0 0 10px #22D3EE' }} /> {t('AI-помощник для учёбы', 'AI study assistant')}</span>
            <h1>
              {title.map((w, i) => (
                <span key={i} className={`w ${i >= gradStart ? 'g' : ''}`} style={{ animationDelay: `${i * 70}ms` }}>{w}</span>
              ))}
            </h1>
            <p className="sub">{t('Загрузите PDF, DOCX, PPTX или TXT — StudyPilot составит конспект, соберёт тест и карточки и разложит подготовку по дням.', 'Upload a PDF, DOCX, PPTX or TXT — StudyPilot builds notes, a quiz and flashcards, and schedules your prep day by day.')}</p>
            <div className="row" style={{ gap: 12 }}>
              <button className="btn btn-primary btn-lg" onClick={() => nav(user ? '/lectures' : '/register')}><Icon name="upload" /> {t('Загрузить лекцию', 'Upload a lecture')}</button>
              <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,.09)', color: '#fff', border: '1px solid rgba(255,255,255,.22)' }} onClick={() => nav(user ? '/dashboard' : '/login')}>{t('Мой аккаунт', 'My account')}</button>
            </div>
            <div className="row" style={{ gap: 18, color: '#94a3b8', fontSize: '.86rem' }}>
              <span>✓ {t('Без карты и тарифов', 'No card, no plans')}</span><span>✓ {t('Данные сохраняются', 'Your data is saved')}</span><span>✓ {t('RU / EN', 'RU / EN')}</span>
            </div>
          </div>
          <div className="hero-stage" aria-hidden>
            <Notebook className="nb bob" style={{ ['--r' as string]: '-6deg' }} />
            <Pencil className="pc bob" />
            <Marker className="mk bob" />
            <BookStack className="bk bob" style={{ animationDelay: '-2s' }} />
            <Sticky color="yellow" className="st2 bob">{t('Сдать физику!', 'Ace physics!')}</Sticky>
            <Sticky color="mint" className="st1 bob" style={{ animationDelay: '-3s' }}>{t('Тест: 9/10 ✓', 'Quiz: 9/10 ✓')}</Sticky>
            <Formula className="fm bob">E = mc²</Formula>
            <Bulb className="bu bob" />
            <Chart className="ch bob" />
            <Paperclip style={{ position: 'absolute', width: 18, left: '38%', top: '8%' }} />
          </div>
        </div>
      </header>

      <section className="sec" id="features">
        <div className="wrap">
          <Reveal>
            <h2>{t('Всё для подготовки — в одном месте', 'Everything for exam prep — in one place')}</h2>
            <p className="lead">{t('Как умный студенческий рабочий стол: конспекты, тесты, карточки и план.', 'Like a smart student desk: notes, quizzes, flashcards and a plan.')}</p>
          </Reveal>
          <div className="grid g3">
            {features.map(([ic, h, p, c], i) => (
              <Reveal key={h} d={i * 70}>
                <div className="card feat hover" style={{ height: '100%' }}>
                  <div className="ic" style={{ background: c }}><Icon name={ic} size={22} /></div>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="how" style={{ background: 'var(--bg-2)' }}>
        <div className="wrap">
          <Reveal><h2>{t('Три шага до готовности', 'Three steps to ready')}</h2></Reveal>
          <div className="grid g3" style={{ marginTop: 32 }}>
            {[
              [t('Загрузите', 'Upload'), t('Перетащите файл или вставьте текст лекции.', 'Drop a file or paste the lecture text.')],
              [t('Получите', 'Get'), t('Конспект, термины, тест и карточки за несколько секунд.', 'Notes, terms, a quiz and flashcards in seconds.')],
              [t('Повторяйте', 'Review'), t('План по дням, разбор ошибок и прогресс по предметам.', 'A day plan, mistake review and subject progress.')],
            ].map(([h, p], i) => (
              <Reveal key={h} d={i * 90}>
                <div className="card" style={{ height: '100%' }}>
                  <div className="step-n">0{i + 1}</div>
                  <h3>{h}</h3>
                  <p className="muted">{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="row" style={{ marginTop: 40, gap: 28, alignItems: 'flex-end' }}>
              <OpenBook style={{ width: 'min(260px, 60%)' }} />
              <div className="stack" style={{ gap: 6, flex: 1, minWidth: 220 }}>
                <p style={{ fontSize: '1.15rem' }}>{t('AI отвечает ', 'AI answers ')}<Hl>{t('только по вашей лекции', 'only from your lecture')}</Hl>{t(' — без выдумок.', ' — no inventions.')}</p>
                <Bookmark style={{ width: 22 }} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec" id="faq">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <Reveal><h2 style={{ marginBottom: 24 }}>FAQ</h2></Reveal>
          <div className="faq">
            {[
              [t('Какие файлы поддерживаются?', 'Which files are supported?'), t('PDF, DOCX, PPTX и TXT до 25 МБ. Также можно вставить текст вручную. Сканы без текстового слоя не распознаются.', 'PDF, DOCX, PPTX and TXT up to 25 MB, or paste text. Scans without a text layer are not recognized.')],
              [t('Сохраняются ли мои данные?', 'Is my data saved?'), t('Да, всё хранится на сервере в вашем аккаунте и доступно после обновления страницы.', 'Yes, everything is stored on the server in your account and survives a refresh.')],
              [t('Где хранится ключ AI?', 'Where is the AI key stored?'), t('Только на сервере. В браузер он никогда не попадает.', 'Only on the server. It never reaches the browser.')],
            ].map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta">
            <div className="stack" style={{ gap: 16, maxWidth: 560, position: 'relative', zIndex: 1 }}>
              <h2 style={{ color: '#fff' }}>{t('Готов превратить лекции в оценки?', 'Ready to turn lectures into grades?')}</h2>
              <div><button className="btn btn-lg" style={{ background: '#fff', color: '#312e81' }} onClick={() => nav(user ? '/dashboard' : '/register')}>{user ? t('Открыть аккаунт', 'Open account') : t('Создать аккаунт', 'Create account')}</button></div>
            </div>
            <Notebook className="bob hide-m" style={{ position: 'absolute', right: '6%', bottom: -30, width: 170, ['--r' as string]: '8deg' }} />
          </div>
        </div>
      </section>
      <footer className="footer"><div className="wrap row spread"><span>© StudyPilot</span><span>{t('Загрузи лекцию — получи конспект, тест и план до экзамена', 'Upload a lecture — get notes, a quiz, and an exam plan')}</span></div></footer>
    </>
  );
}
