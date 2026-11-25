// Smoke test: node scripts/smoke.mjs  (backend must be running on :4000)
import JSZip from 'jszip';
const API = process.env.API || 'http://localhost:4000';
const results = [];
const ok = (n, c, extra = '') => { results.push([n, c]); console.log(c ? 'PASS' : 'FAIL', n, extra); };

const LECTURE = `Photosynthesis is the process by which plants convert light energy into chemical energy. Chlorophyll is a green pigment that absorbs light in the chloroplasts. The light reactions produce ATP and NADPH in the thylakoid membranes. The Calvin cycle uses ATP and NADPH to fix carbon dioxide into glucose in the stroma. Cellular respiration is the process that releases energy from glucose in mitochondria. Stomata are small pores on leaves that regulate gas exchange.`;

async function docx(text) {
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`);
  return z.generateAsync({ type: 'nodebuffer' });
}
async function pptx(text) {
  const z = new JSZip();
  z.file('ppt/slides/slide1.xml', `<p:sld xmlns:a="a" xmlns:p="p"><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:sld>`);
  z.file('ppt/slides/slide2.xml', `<p:sld><a:p><a:r><a:t>Second &amp; last slide</a:t></a:r></a:p></p:sld>`);
  return z.generateAsync({ type: 'nodebuffer' });
}
function pdf(text) {
  const objs = [];
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  const stream = `BT /F1 11 Tf 40 750 Td (${text.slice(0, 200)}) Tj ET`;
  objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let out = '%PDF-1.4\n'; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}

const j = async (p, method = 'GET', body, token) => {
  const r = await fetch(API + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { s: r.status, d: await r.json().catch(() => ({})) };
};
const up = async (name, buf, token) => {
  const fd = new FormData(); fd.append('file', new Blob([buf]), name);
  const r = await fetch(API + '/api/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd });
  return { s: r.status, d: await r.json() };
};

const email = `t${Date.now()}@test.io`;
let r = await j('/api/auth/register', 'POST', { name: 'Tester', email, password: 'secret1' });
ok('register', r.s === 200 && r.d.token); const token = r.d.token;
r = await j('/api/auth/register', 'POST', { name: 'T', email, password: 'secret1' }); ok('register duplicate rejected', r.s === 409);
r = await j('/api/auth/login', 'POST', { email, password: 'bad' }); ok('login wrong pw rejected', r.s === 401);
r = await j('/api/auth/login', 'POST', { email, password: 'secret1' }); ok('login', r.s === 200);
r = await j('/api/auth/me', 'GET', null, token); ok('me', r.d.user?.email === email);
r = await j('/api/data', 'GET', null); ok('data requires auth', r.s === 401);
r = await j('/api/data', 'PUT', { data: { subjects: [{ id: 1, name: 'Bio' }] } }, token); ok('save data', r.s === 200);
r = await j('/api/data', 'GET', null, token); ok('data persisted', r.d.data?.subjects?.[0]?.name === 'Bio');
r = await j('/api/auth/forgot', 'POST', { email }); ok('forgot gives code', !!r.d.code); const code = r.d.code;
r = await j('/api/auth/reset', 'POST', { email, code, password: 'newpass1' }); ok('reset', r.s === 200);
r = await j('/api/auth/login', 'POST', { email, password: 'newpass1' }); ok('login new pw', r.s === 200);

for (const [name, buf] of [['l.txt', Buffer.from(LECTURE)], ['l.docx', await docx(LECTURE)], ['l.pptx', await pptx(LECTURE)], ['l.pdf', pdf(LECTURE)]]) {
  const u = await up(name, buf, token);
  ok('upload ' + name, u.s === 200 && u.d.text?.includes('Photosynthesis'), u.s !== 200 ? JSON.stringify(u.d) : `(${u.d.chars} chars)`);
}
let u = await up('bad.exe', Buffer.from('x'), token); ok('upload rejects .exe', u.s === 422);

r = await j('/api/ai/notes', 'POST', { text: LECTURE, title: 'Bio', lang: 'ru' }, token);
console.log('engine:', r.d.engine, r.d.warning || '');
ok('ai notes', r.s === 200 && r.d.data?.summary && Array.isArray(r.d.data?.terms));
r = await j('/api/ai/quiz', 'POST', { text: LECTURE, count: 5, types: ['mcq', 'tf', 'short', 'open'], difficulty: 'medium', lang: 'ru' }, token);
ok('ai quiz', r.s === 200 && r.d.data?.questions?.length > 0, `(${r.d.data?.questions?.length} q)`);
r = await j('/api/ai/flashcards', 'POST', { text: LECTURE, lang: 'ru' }, token);
ok('ai flashcards', r.s === 200 && r.d.data?.cards?.length > 0);
r = await j('/api/ai/ask', 'POST', { text: LECTURE, question: 'What is chlorophyll?', lang: 'en' }, token);
ok('ai ask (in lecture)', r.s === 200 && r.d.data?.found !== false, r.d.data?.answer?.slice(0, 80));
r = await j('/api/ai/ask', 'POST', { text: LECTURE, question: 'Who won the 1998 World Cup?', lang: 'en' }, token);
ok('ai ask (not in lecture)', r.s === 200 && r.d.data?.found === false, r.d.data?.answer?.slice(0, 80));
r = await j('/api/ai/simplify', 'POST', { fragment: 'The Calvin cycle fixes carbon.', lang: 'ru' }, token);
ok('ai simplify', r.s === 200 && r.d.data?.text);
r = await j('/api/auth/account', 'DELETE', null, token); ok('delete account', r.s === 200);

const fails = results.filter((x) => !x[1]).length;
console.log(`\n${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
