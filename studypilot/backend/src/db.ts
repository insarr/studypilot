import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(process.cwd(), 'data');
fs.mkdirSync(DIR, { recursive: true });
const USERS = path.join(DIR, 'users.json');

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  resetToken?: string;
  resetExpires?: number;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

export const loadUsers = () => readJson<User[]>(USERS, []);
export const saveUsers = (u: User[]) => writeJson(USERS, u);

const dataFile = (id: string) => path.join(DIR, `data-${id.replace(/[^a-zA-Z0-9_-]/g, '')}.json`);
export const loadData = (id: string) => readJson<unknown>(dataFile(id), null);
export const saveData = (id: string, d: unknown) => writeJson(dataFile(id), d);
