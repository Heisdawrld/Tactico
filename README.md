# TACTICO

The most immersive football manager game ever built. Combining the depth of Football Manager with the physics of FIFA, all in a progressive web app.

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables (see `.env.example`).

3. Run the development server:
   ```bash
   pnpm dev
   ```

## 📁 Project Structure

```
tactico/
├── apps/
│   ├── frontend/       # Next.js + PixiJS + Matter.js
│   ├── backend/        # Next.js API + Socket.io
│   └── shared/         # Shared types, utils, and constants
├── packages/
│   └── database/       # Turso schema and migrations
├── package.json
└── turbo.json
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, PixiJS, Matter.js, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Socket.io, NextAuth.js
- **Database**: Turso (SQLite at the edge)
- **Monorepo**: Turborepo + pnpm

## 📄 License

Private (All rights reserved).