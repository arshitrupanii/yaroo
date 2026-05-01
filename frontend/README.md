# Yaroo Frontend

Frontend application for Yaroo, built with a modern JavaScript toolchain.

## Prerequisites

- Node.js (LTS recommended)
- npm (or yarn/pnpm)

## Getting Started

```bash
# install dependencies
npm install

# start local dev server
npm run dev
```

App runs at: `http://localhost:5173` (or the port shown in terminal).

## Available Scripts

- `npm run dev` — start development server
- `npm run build` — create production build
- `npm run preview` — preview production build locally
- `npm run lint` — run lint checks
- `npm run test` — run unit/integration tests (if configured)

## Project Structure

```text
src/
    components/   # reusable UI components
    pages/        # route-level pages/views
    hooks/        # custom React hooks
    services/     # API/service layer
    utils/        # helper utilities
    assets/       # static assets
public/         # public static files
```

## Environment Variables

Create a `.env` file in the project root.

Example:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Use variables via `import.meta.env`.

## Build & Deploy

```bash
npm run build
```

Production output is generated in `dist/`.

## Troubleshooting

- Delete `node_modules` and lockfile, then reinstall dependencies.
- Confirm Node.js version matches project requirements.
- Verify `.env` values for local API connectivity.
