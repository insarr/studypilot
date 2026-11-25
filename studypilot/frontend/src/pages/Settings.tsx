import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useStore, useT } from '../store';
import { PageHead, ThemeLang, confirmBox } from '../components/UI';
import { emptyData } from '../types';

export default function Settings() {
  const t = useT();
  const nav = useNavigate();
  const { user, data, logout, toast, mutate } = useStore();
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  const change = async () => {
    setBusy(true);
    try { await api.changePassword(cur, pw); toast(t('Пароль изменён', 'Password changed'), 'ok'); setCur(''); setPw(''); } catch (e: any) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const exportJson = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'studypilot-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const clear = () => {
    if (!confirmBox(t('Удалить ВСЕ предметы, лекции, тесты и карточки?', 'Delete ALL subjects, lectures, quizzes and cards?'))) return;
    mutate((d) => Object.assign(d, emptyData()));
    toast(t('Данные очищены', 'Data cleared'), 'ok');
  };
  const del = async () => {
    if (!confirmBox(t('Удалить аккаунт навсегда? Это действие необратимо.', 'Delete your account permanently? This cannot be undone.'))) return;
    try { await api.deleteAccount(); logout(); nav('/'); } catch (e: any) { toast(e.message, 'err'); }
  };

  return (
    <>
      <PageHead title={t('Настройки', 'Settings')} />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card stack">
          <h3 style={{ margin: 0 }}>{t('Профиль', 'Profile')}</h3>
          <div className="row"><div className="avatar">{user?.name.slice(0, 1).toUpperCase()}</div><div><b>{user?.name}</b><div className="muted sm">{user?.email}</div></div></div>
        </div>
        <div className="card stack">
          <h3 style={{ margin: 0 }}>{t('Внешний вид и язык', 'Appearance & language')}</h3>
          <div className="row"><ThemeLang app /></div>
          <p className="muted sm">{t('Настройки применяются сразу и сохраняются в браузере.', 'Settings apply instantly and are saved in the browser.')}</p>
        </div>
        <div className="card stack">
          <h3 style={{ margin: 0 }}>{t('Смена пароля', 'Change password')}</h3>
          <div className="field"><label>{t('Текущий пароль', 'Current password')}</label><input className="input" type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
          <div className="field"><label>{t('Новый пароль (мин. 6)', 'New password (min 6)')}</label><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <button className="btn btn-primary" disabled={busy || !cur || pw.length < 6} onClick={change}>{t('Изменить пароль', 'Change password')}</button>
        </div>
        <div className="card stack">
          <h3 style={{ margin: 0 }}>{t('Данные', 'Data')}</h3>
          <p className="muted sm">{t(`Предметов: ${data.subjects.length}, лекций: ${data.lectures.length}, тестов: ${data.quizzes.length}, карточек: ${data.cards.length}.`, `Subjects: ${data.subjects.length}, lectures: ${data.lectures.length}, quizzes: ${data.quizzes.length}, cards: ${data.cards.length}.`)}</p>
          <div className="row"><button className="btn btn-ghost" onClick={exportJson}>{t('Экспорт JSON', 'Export JSON')}</button><button className="btn btn-danger" onClick={clear}>{t('Очистить данные', 'Clear data')}</button></div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--line)' }} />
          <div className="row"><button className="btn btn-ghost" onClick={() => { logout(); nav('/'); }}>{t('Выйти', 'Log out')}</button><button className="btn btn-danger" onClick={del}>{t('Удалить аккаунт', 'Delete account')}</button></div>
        </div>
      </div>
    </>
  );
}
