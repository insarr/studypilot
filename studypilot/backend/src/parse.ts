import mammoth from 'mammoth';
import JSZip from 'jszip';

export type Kind = 'pdf' | 'docx' | 'pptx' | 'txt';

export function detectKind(name: string): Kind | null {
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'pdf' || ext === 'docx' || ext === 'pptx' || ext === 'txt' || ext === 'md') return ext === 'md' ? 'txt' : (ext as Kind);
  return null;
}

const decodeXml = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

async function parsePdf(buf: Buffer): Promise<string> {
  // pdf-parse v1 API (default export function) or v2 (PDFParse class)
  const mod: any = await import('pdf-parse');
  if (typeof mod.PDFParse === 'function') {
    const parser = new mod.PDFParse({ data: new Uint8Array(buf) });
    const res = await parser.getText();
    await parser.destroy?.();
    return res.text as string;
  }
  const fn = mod.default ?? mod;
  const res = await fn(buf);
  return res.text as string;
}

async function parseDocx(buf: Buffer): Promise<string> {
  const r = await mammoth.extractRawText({ buffer: buf });
  return r.value;
}

async function parsePptx(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const slides = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => parseInt(a.match(/(\d+)\.xml/)![1]) - parseInt(b.match(/(\d+)\.xml/)![1]));
  const out: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    const xml = await zip.files[slides[i]].async('string');
    const paras = xml.split(/<\/a:p>/).map((p) => {
      const runs = [...p.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)].map((m) => decodeXml(m[1]));
      return runs.join('');
    });
    const text = paras.map((p) => p.trim()).filter(Boolean).join('\n');
    if (text) out.push(`Слайд ${i + 1}\n${text}`);
  }
  return out.join('\n\n');
}

export async function extractText(name: string, buf: Buffer): Promise<{ text: string; kind: Kind }> {
  const kind = detectKind(name);
  if (!kind) throw new Error('Неподдерживаемый формат. Допустимы PDF, DOCX, PPTX, TXT.');
  let text = '';
  if (kind === 'pdf') text = await parsePdf(buf);
  else if (kind === 'docx') text = await parseDocx(buf);
  else if (kind === 'pptx') text = await parsePptx(buf);
  else text = buf.toString('utf8');
  text = text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!text) throw new Error('Не удалось извлечь текст: файл пуст или содержит только изображения (сканы).');
  return { text, kind };
}
