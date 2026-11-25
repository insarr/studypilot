import { MotionConfig } from 'motion/react';
import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from './store';
import AppShell from './components/AppShell';
import LenisProvider from './components/LenisProvider';
import { Toasts } from './components/UI';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { Subjects, SubjectDetail } from './pages/Subjects';
import { Lectures, LectureDetail } from './pages/Lectures';
import Notes from './pages/Notes';
import { Tests, TestRun } from './pages/Tests';
import Flashcards from './pages/Flashcards';
import StudyPlan from './pages/StudyPlan';
import Progress from './pages/Progress';
import Mistakes from './pages/Mistakes';
import Settings from './pages/Settings';

function Guard({ children }: { children: React.ReactNode }) {
  const { user, ready } = useStore();
  const loc = useLocation();
  if (!ready) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><span className="spin" style={{ width: 34, height: 34 }} /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const boot = useStore((s) => s.boot);
  useEffect(() => {
    boot();
  }, [boot]);
  return (
    <MotionConfig reducedMotion="user">
      <LenisProvider>
        <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/forgot" element={<Auth mode="forgot" />} />
        <Route element={<Guard><AppShell /></Guard>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/subjects/:id" element={<SubjectDetail />} />
          <Route path="/lectures" element={<Lectures />} />
          <Route path="/lectures/:id" element={<LectureDetail />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/tests/:id" element={<TestRun />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/study-plan" element={<StudyPlan />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/mistakes" element={<Mistakes />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
        <Toasts />
      </LenisProvider>
    </MotionConfig>
  );
}
