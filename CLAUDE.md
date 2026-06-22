# Galaxy Home Automation — Claude Code Guide

## Project Overview
Internal CRM/workflow management app for Galaxy Home Automation.  
Manages leads, projects, site operations, quotations, and client portals.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Auth & DB:** Firebase (Firestore + Firebase Auth + Realtime Database)
- **AI:** Google Gemini (`@google/generative-ai`)
- **Drag & Drop:** `@dnd-kit`
- **Styling:** Tailwind CSS

## Project Structure
```
src/
  app/
    (app)/          # Authenticated routes
      dashboard/    # B2B & B2C dashboards, inventory, alerts, activity logs
      leads/        # Lead management, follow-ups, analytics
      projects/     # Project tracking
      quotations/   # Quotation builder
      site-operations/ # Site ops management
      my-sites/     # Site listings
      user-management/ # User admin
      chat/         # AI chat (Gemini)
    client/         # Client portal (unauthenticated)
    login/          # Auth page
  components/       # Reusable UI and feature components
  services/         # Firebase & API service layer
  hooks/            # Custom React hooks
  types/            # TypeScript type definitions
  lib/              # Utility functions
  data/             # Static/seed data
```

## Key Services
- `src/services/storageService.ts` — Firebase Realtime DB (quotes & products)
- Other services in `src/services/` handle Firestore collections

## Auth & Roles
- `src/components/auth/AuthGuard.tsx` — redirects unauthenticated users
- `src/components/auth/RoleGuard.tsx` — role-based access control

## Dev Commands
```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # Lint
```

## Deployment
- Hosted on Vercel (auto-deploys on push to `main`)
- Firebase project: `galaxy-quotation` (Realtime DB) + Firestore

## Notes
- All new service files must be TypeScript (`.ts`), not `.js`
- Keep components small and feature-scoped
- Role-based guards must wrap any sensitive pages
