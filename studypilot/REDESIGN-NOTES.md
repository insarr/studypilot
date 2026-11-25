# StudyPilot — Quiet Premium redesign

## Design direction
- Neutral dark palette: obsidian, charcoal, graphite, warm ivory and muted bronze.
- No neon gradients, emoji decorations or glowing AI accents.
- Compact sidebar, restrained borders, editorial typography and calm motion.
- The Dashboard now has a typographic hero, knowledge-orbit visual, compact metrics, subject image tiles, recent lectures and a daily focus panel.
- Existing routes and page components are retained; the redesign is applied through the shared design tokens and global styles.

## Preview
Open `frontend/preview.html` in a browser for a standalone visual preview of the new Dashboard concept. It uses remote Unsplash images and Google Fonts, so those visual assets require an internet connection.

## Run the application
1. Install backend dependencies in `backend`: `npm install`.
2. Copy `backend/.env.example` to `backend/.env` and add your own provider API key(s).
3. Install frontend dependencies in `frontend`: `npm install`.
4. Start the backend and frontend using the scripts in their respective `package.json` files.

## Security cleanup
The supplied archive contained environment credentials, a JWT secret and local user/data JSON files. These have been excluded from this redesigned archive. Add your own `.env` and the backend will create its local data directory as needed. Rotate any real API keys that were previously present in the original archive.
