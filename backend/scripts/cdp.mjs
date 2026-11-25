import { spawn } from 'node:child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--remote-debugging-port=9230',
  '--user-data-dir=' + process.env.TEMP + '\\sp-e2e-' + Date.now(),
  'http://localhost:4000/login'
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(1500);

const targets = await fetch('http://127.0.0.1:9230/json').then((r) => r.json());
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let id = 1;
const send = (method, params = {}) => new Promise((resolve) => {
  const cur = id++;
  const h = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id === cur) { ws.removeEventListener('message', h); resolve(msg.result); }
  };
  ws.addEventListener('message', h);
  ws.send(JSON.stringify({ id: cur, method, params }));
});

const exceptions = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === 'Runtime.exceptionThrown') {
    exceptions.push(msg.params.exceptionDetails);
    console.error('RUNTIME_EXCEPTION:', msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  }
});

await send('Runtime.enable');
await send('Page.enable');
await sleep(500);

const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }))?.result?.value;
const results = [];
const assert = (name, cond, info = '') => {
  results.push([name, !!cond]);
  console.log(cond ? 'PASS' : 'FAIL', name, info);
};

// 1. Open /login, then navigate to /register via Link click
let state = await evalJs(`({ path: location.pathname, h1: document.querySelector('h1')?.innerText })`);
assert('1a. Direct open /login', state.path === '/login' && state.h1 === 'С возвращением', JSON.stringify(state));

await evalJs(`document.querySelector('a[href="/register"]').click()`);
await sleep(200);
state = await evalJs(`({ path: location.pathname, h1: document.querySelector('h1')?.innerText })`);
assert('1b. Click link /login -> /register (no reload)', state.path === '/register' && state.h1 === 'Создать аккаунт', JSON.stringify(state));

// Navigate /register -> /login -> /forgot -> /login -> /register
await evalJs(`document.querySelector('a[href="/login"]').click()`);
await sleep(150);
state = await evalJs(`({ path: location.pathname, h1: document.querySelector('h1')?.innerText })`);
assert('1c. Click link /register -> /login', state.path === '/login' && state.h1 === 'С возвращением', JSON.stringify(state));

await evalJs(`document.querySelector('a[href="/forgot"]').click()`);
await sleep(150);
state = await evalJs(`({ path: location.pathname, h1: document.querySelector('h1')?.innerText })`);
assert('1d. Click link /login -> /forgot', state.path === '/forgot' && state.h1 === 'Восстановление пароля', JSON.stringify(state));

await evalJs(`document.querySelector('a[href="/login"]').click()`);
await sleep(150);
await evalJs(`document.querySelector('a[href="/register"]').click()`);
await sleep(150);

// 2. Register a new user via API + login through UI form to test login -> /dashboard navigation
const email = `nav${Date.now()}@test.io`;
await fetch('http://localhost:4000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Навигатор', email, password: 'password123' }),
});

await evalJs(`document.querySelector('a[href="/login"]').click()`);
await sleep(150);
await evalJs(`(() => {
  const setVal = (el, val) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  setVal(document.querySelector('#e'), ${JSON.stringify(email)});
  setVal(document.querySelector('#p'), 'password123');
  document.querySelector('form').requestSubmit();
})()`);
await sleep(600);
state = await evalJs(`({ path: location.pathname, h1: document.querySelector('h1')?.innerText })`);
assert('2. Login navigates to /dashboard without reload', state.path === '/dashboard' && state.h1?.includes('Навигатор'), JSON.stringify(state));

// 3. Navigate from /dashboard to /subjects, /lectures, /notes, /tests, /flashcards, /study-plan, /progress, /mistakes, /settings
const routes = [
  ['/subjects', 'Предметы'],
  ['/lectures', 'Лекции'],
  ['/notes', 'Конспекты'],
  ['/tests', 'Тесты'],
  ['/flashcards', 'Карточки'],
  ['/study-plan', 'План подготовки'],
  ['/progress', 'Прогресс'],
  ['/mistakes', 'Работа над ошибками'],
  ['/settings', 'Настройки'],
  ['/dashboard', 'Навигатор'],
];

for (const [href, expectedH1] of routes) {
  await evalJs(`document.querySelector('.sidebar a[href="${href}"]').click()`);
  await sleep(150);
  state = await evalJs(`({ path: location.pathname, h1: document.querySelector('h1')?.innerText })`);
  assert(`3. Sidebar click -> ${href}`, state.path === href && state.h1?.includes(expectedH1), JSON.stringify(state));
}

// 4. Create a subject & lecture, open the lecture (/lectures/:id), then return to /lectures
await evalJs(`(async () => {
  const token = localStorage.getItem('sp_token');
  const data = {
    subjects: [{ id: 'sub1', name: 'Биология', color: '#6366F1', semester: '1', modules: ['Модуль 1'], description: 'Курс биологии', examDate: '2026-12-01' }],
    lectures: [{ id: 'lec1', subjectId: 'sub1', module: 'Модуль 1', title: 'Фотосинтез и клеточное дыхание', text: 'Фотосинтез — это процесс образования органических веществ на свету при участии хлорофилла.', kind: 'txt', createdAt: new Date().toISOString(), favorite: false, chat: [] }],
    quizzes: [], attempts: [], cards: [], tasks: [], mistakes: [], activity: []
  };
  await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ data }) });
})()`);
await send('Page.reload');
await sleep(600);

await evalJs(`document.querySelector('.sidebar a[href="/lectures"]').click()`);
await sleep(200);
state = await evalJs(`({ path: location.pathname, cards: document.querySelectorAll('.card.hover h3').length, title: document.querySelector('.card.hover h3')?.innerText })`);
assert('4a. Lectures list shows lecture', state.path === '/lectures' && state.title === 'Фотосинтез и клеточное дыхание', JSON.stringify(state));

await evalJs(`document.querySelector('.card.hover').click()`);
await sleep(200);
state = await evalJs(`({ path: location.pathname, h1: document.querySelector('h1')?.innerText })`);
assert('4b. Click lecture card -> /lectures/lec1', state.path === '/lectures/lec1' && state.h1 === 'Фотосинтез и клеточное дыхание', JSON.stringify(state));

await evalJs(`document.querySelector('.crumbs a[href="/lectures"]').click()`);
await sleep(200);
state = await evalJs(`({ path: location.pathname, h1: document.querySelector('h1')?.innerText })`);
assert('4c. Breadcrumb click -> back to /lectures', state.path === '/lectures' && state.h1 === 'Лекции', JSON.stringify(state));

// 5. Browser Back and Forward buttons
await evalJs(`history.back()`);
await sleep(200);
state = await evalJs(`({ path: location.pathname, h1: document.querySelector('h1')?.innerText })`);
assert('5a. Browser Back -> /lectures/lec1', state.path === '/lectures/lec1' && state.h1 === 'Фотосинтез и клеточное дыхание', JSON.stringify(state));

await evalJs(`history.forward()`);
await sleep(200);
state = await evalJs(`({ path: location.pathname, h1: document.querySelector('h1')?.innerText })`);
assert('5b. Browser Forward -> /lectures', state.path === '/lectures' && state.h1 === 'Лекции', JSON.stringify(state));

// 6. Refresh the browser on every route
const allRoutes = ['/dashboard', '/subjects', '/subjects/sub1', '/lectures', '/lectures/lec1', '/notes', '/tests', '/flashcards', '/study-plan', '/progress', '/mistakes', '/settings', '/'];
for (const r of allRoutes) {
  await evalJs(`history.pushState({}, '', '${r}'); window.dispatchEvent(new PopStateEvent('popstate'));`);
  await sleep(120);
  await send('Page.reload');
  await sleep(500);
  state = await evalJs(`({ path: location.pathname, len: document.body.innerText.trim().length, h1: document.querySelector('h1')?.innerText })`);
  assert(`6. Refresh on ${r}`, state.path === r && state.len > 20 && !!state.h1, JSON.stringify(state));
}

assert('7. Zero runtime exceptions across entire session', exceptions.length === 0, `exceptions=${exceptions.length}`);

chrome.kill();
const failed = results.filter(([, ok]) => !ok);
console.log(`\nTotal: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
