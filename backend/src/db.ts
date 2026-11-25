import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// On Vercel Serverless, process.cwd() is read-only; fall back automatically to os.tmpdir()
function resolveDataDir(): string {
  const localDir = path.resolve(process.cwd(), 'data');
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = path.join(os.tmpdir(), 'studypilot-data');
    fs.mkdirSync(tmpDir, { recursive: true });
    // Seed initial users.json from repo if present and tmp is empty
    const tmpUsers = path.join(tmpDir, 'users.json');
    const localUsers = path.join(localDir, 'users.json');
    if (!fs.existsSync(tmpUsers) && fs.existsSync(localUsers)) {
      try {
        fs.copyFileSync(localUsers, tmpUsers);
      } catch {
        // ignore
      }
    }
    return tmpDir;
  }
  try {
    fs.mkdirSync(localDir, { recursive: true });
    return localDir;
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'studypilot-data');
    fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
  }
}

export const DATA_DIR = resolveDataDir();
const USERS = path.join(DATA_DIR, 'users.json');

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  avatar?: string; // Data URL or preset 3D avatar URL
  emailVerified?: boolean;
  verifyCodeHash?: string; // SHA-256 hash of 6-digit OTP code
  verifyExpires?: number;
  resetToken?: string; // SHA-256 hash of reset code
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

const dataFile = (id: string) => path.join(DATA_DIR, `data-${id.replace(/[^a-zA-Z0-9_-]/g, '')}.json`);
export const loadData = (id: string) => readJson<unknown>(dataFile(id), null);
export const saveData = (id: string, d: unknown) => writeJson(dataFile(id), d);
