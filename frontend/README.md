# Yaroo Frontend

Frontend application for Yaroo, built with Vite, React, Tailwind CSS, DaisyUI, Zustand, Axios, and Socket.IO Client.

## Prerequisites

- Node.js LTS
- npm

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173` or the port shown in the terminal.

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run preview` - preview production build locally
- `npm run lint` - run lint checks

## Project Structure

```text
src/
  components/   reusable UI components
  Pages/        route-level pages
  store/        Zustand stores
  lib/          API and helper utilities
  constants/    static UI constants
public/         public static files
```

## Environment Variables

Create a `.env` file in the project root when running the frontend separately.

```env
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
```

When these are not set, production builds use same-origin `/api` and local development uses the localhost backend defaults.

## Build & Deploy

```bash
npm run build
```

Production output is generated in `dist/`.
