# Yaroo - Real-time Chat Application

A modern, full-stack chat application built with Node.js, React, and WebSockets.

## Quick Start

### Prerequisites

- Node.js (v16+)
- npm

### Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Setup Environment Variables

**Backend** - Create `backend/.env`:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend** - Create `frontend/.env.local`:

```
VITE_API_URL=http://localhost:5000/api
```

### Run Development

```bash
# Backend (from backend/)
npm run dev

# Frontend (from frontend/)
npm run dev
```

## Tech Stack

**Backend:** Node.js, Express, MongoDB, JWT, Socket.io, Cloudinary  
**Frontend:** React, Vite, Tailwind CSS, Zustand, Axios

## Project Structure

```
yaroo/
├── backend/
│   ├── controllers/      # Route handlers
│   ├── models/           # Database schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth & other middleware
│   ├── lib/              # Utilities (DB, Socket, Cloudinary)
│   └── server.js         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── Pages/        # Page components
│   │   ├── store/        # Zustand stores
│   │   ├── lib/          # Utilities & API client
│   │   └── main.jsx      # Entry point
│   └── vite.config.js
└── package.json
```

## Build

```bash
# Frontend production build (from frontend/)
npm run build
```

## Running (development)

Start backend and frontend in separate terminals:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm start
```

Visit the frontend (typically http://localhost:3000) which calls the backend API (http://localhost:4000/api).

## Building for production

Build frontend and serve static files from backend or a CDN.

```bash
cd frontend
npm run build

# copy build output to backend public/ or configure hosting
```

## Testing

Run unit and integration tests (commands depend on project):

```bash
cd backend
npm test

cd ../frontend
npm test
```

## API (overview)

Common endpoints (example):

- POST /api/auth/register - register new user
- POST /api/auth/login - authenticate and return JWT
- GET /api/items - list items
- POST /api/items - create item (auth required)

Document the real API endpoints, request/response shapes, and auth behavior in this section.

## Contributing

- Fork the repository
- Create a branch: git checkout -b feature/your-feature
- Commit changes and open a pull request

---

If you provide specific backend and frontend frameworks or package.json scripts, this README can be updated to include exact commands and configuration snippets.
