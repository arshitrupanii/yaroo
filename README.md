# Yaroo

Yaroo is a full-stack real-time chat app built with Express, MongoDB, Socket.IO, React, Vite, Tailwind CSS, DaisyUI, and Zustand.

## Quick Start

Install dependencies from the project root:

```bash
npm install
npm install --prefix frontend
```

Create a local `.env` from `.env.example`, then fill the required values:

```bash
cp .env.example .env
```

Run the app in two terminals:

```bash
npm run dev
```

```bash
npm run dev --prefix frontend
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/health`
- Backend API: `http://localhost:5000/api`

## Required Local Config

Minimum backend variables:

```env
MONGODB_URI=mongodb://localhost:27017/yaroo
MONGO_AUTO_INDEX=false
PORT=5000
JWT_SECRET=replace-with-a-random-32-plus-character-secret
FRONTEND_URL=http://localhost:5173
PASSWORD_RESET_URL=http://localhost:5173
```

Frontend variables for local development:

```env
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
```

## Email Setup

Resend is the recommended production email provider:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="Yaroo <noreply@yourdomain.com>"
```

Do not commit API keys. If a key is shared publicly or pasted into chat, revoke it and create a new one.

## Production

Read [PRODUCTION.md](./PRODUCTION.md) before deploying.

Production build:

```bash
npm run build
```

Production start:

```bash
npm start
```

## Useful Scripts

- `npm run dev` - start backend with nodemon
- `npm start` - start backend with Node
- `npm run seed` - seed sample data
- `npm run db:indexes` - sync MongoDB indexes
- `npm run build` - install frontend dependencies and build frontend
- `npm run lint --prefix frontend` - lint frontend
- `npm run build --prefix frontend` - build frontend only

## Project Structure

```text
backend/
  controllers/
  lib/
  middleware/
  model/
  routes/
  scripts/
frontend/
  src/
    components/
    Pages/
    lib/
    store/
```
