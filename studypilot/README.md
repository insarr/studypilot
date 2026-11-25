# StudyPilot — AI-помощник для студентов

Полнофункциональное образовательное веб-приложение (React 19 + TypeScript + Vite + KaTeX на фронтенде, Express + TypeScript на бэкенде).

---

## Быстрый запуск на новом компьютере (Windows)

1. Распакуйте архив `StudyPilot-Full-Project.zip` в любую папку.
2. Убедитесь, что на компьютере установлен [Node.js](https://nodejs.org/) (версии 18+ или 20+).
3. Дважды нажмите на файл **`START_STUDYPILOT.bat`**:
   - При первом запуске скрипт сам установит `node_modules` в `backend` и `frontend`.
   - Запустит сервер и автоматически откроет браузер по адресу **`http://localhost:4000`**.

---

## Ручной запуск через терминал (Windows / macOS / Linux)

### 1. Установка зависимостей (один раз)
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Сборка фронтенда (если меняли код в `frontend/src`)
```bash
cd frontend
npm run build
```

### 3. Запуск приложения (единый порт 4000)
```bash
cd backend
npm start
```
После этого приложение доступно по адресу: **`http://localhost:4000`**

### 4. Режим разработки фронтенда с Hot Reload (опционально)
В первом терминале запустите бэкенд (`cd backend && npm run dev`), а во втором:
```bash
cd frontend
npm run dev
```

---

## Настройки ИИ и API-ключей (`backend/.env`)

Все ключи уже сохранены внутри файла `backend/.env`:
- **Unified API (FreeLLMAPI)**: `http://127.0.0.1:31415/v1` (если запущен локально).
- **Облачные резервные провайдеры (работают на любом ПК с интернетом без дополнительных программ)**:
  - **Groq API** (`GROQ_API_KEY`) — модели `openai/gpt-oss-120b` и `qwen/qwen3.8-27b`
  - **Google Gemini API** (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`) — модели `gemini-3.5-flash` и `gemini-3.8-flash`
  - **Zhipu GLM** (`ZHIPU_API_KEY`)

---

## Где хранятся ваши аккаунты и загруженные лекции

Все пользователи и сгенерированные конспекты/тесты/карточки сохранены в папке:
- `backend/data/users.json`
- `backend/data/data-<id>.json`

Эти файлы также включены в архив, поэтому на новом компьютере все ваши лекции и расширенные конспекты сразу будут на месте.
