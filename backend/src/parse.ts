import mammoth from 'mammoth';
import JSZip from 'jszip';

// Polyfill DOMMatrix for Node.js / pdfjs-dist environments
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  class DOMMatrixPolyfill {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(init?: any) {
      if (Array.isArray(init)) {
        if (init.length === 6) {
          this.a = this.m11 = init[0] ?? 1;
          this.b = this.m12 = init[1] ?? 0;
          this.c = this.m21 = init[2] ?? 0;
          this.d = this.m22 = init[3] ?? 1;
          this.e = this.m41 = init[4] ?? 0;
          this.f = this.m42 = init[5] ?? 0;
        } else if (init.length === 16) {
          this.m11 = init[0]; this.m12 = init[1]; this.m13 = init[2]; this.m14 = init[3];
          this.m21 = init[4]; this.m22 = init[5]; this.m23 = init[6]; this.m24 = init[7];
          this.m31 = init[8]; this.m32 = init[9]; this.m33 = init[10]; this.m34 = init[11];
          this.m41 = init[12]; this.m42 = init[13]; this.m43 = init[14]; this.m44 = init[15];
          this.a = this.m11; this.b = this.m12; this.c = this.m21; this.d = this.m22;
          this.e = this.m41; this.f = this.m42;
          this.is2D = false;
        }
      }
    }
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    transformPoint(point: any) { return point; }
    toFloat32Array() {
      return new Float32Array([
        this.m11, this.m12, this.m13, this.m14,
        this.m21, this.m22, this.m23, this.m24,
        this.m31, this.m32, this.m33, this.m34,
        this.m41, this.m42, this.m43, this.m44,
      ]);
    }
    toFloat64Array() {
      return new Float64Array([
        this.m11, this.m12, this.m13, this.m14,
        this.m21, this.m22, this.m23, this.m24,
        this.m31, this.m32, this.m33, this.m34,
        this.m41, this.m42, this.m43, this.m44,
      ]);
    }
  }
  (globalThis as any).DOMMatrix = DOMMatrixPolyfill;
  (globalThis as any).DOMMatrixReadOnly = DOMMatrixPolyfill;
}

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
  const mod: any = await import('pdf-parse');
  if (typeof mod.PDFParse === 'function') {
    const parser = new mod.PDFParse({ data: new Uint8Array(buf) });
    const res = await parser.getText();
    await parser.destroy?.();
    return (res?.text || '') as string;
  }
  const fn = mod.default ?? mod;
  const res = await fn(buf);
  return (res?.text || '') as string;
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
