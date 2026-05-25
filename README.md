# AutoFlow — Workflow Manager

Collaborative workflow management for home automation projects. Built with Next.js App Router, Tailwind CSS, Firebase Authentication, and Firestore realtime sync.

## Features

- Dashboard with project stats and overdue count
- Optional project deadline (not required at creation)
- Dynamic hierarchical workflow with accordion UI
- Workflow item types: checklist, text input, multi-select category (Lights)
- Per-item status, notes, optional deadline, and progress tracking
- Dependency rules (e.g. Programming blocked until Switch + Socket and IR + HUB + LCD are done)
- Realtime Firestore sync
- Sidebar navigation, light/dark theme, mobile responsive

## Workflow structure

| Item | Type |
|------|------|
| Advance Received | Checklist |
| Lead Time | Text input (days) |
| Lights | Multi-select category (COB, LED Strips, Panel, etc.) |
| Backbox | Checklist |
| Icon Colour | Text input |
| Switch + Socket | Text input |
| Curtains | Checklist |
| IR + HUB + LCD | Checklist |
| Programming | Checklist (blocked until dependencies complete) |

Add new categories in `src/lib/workflow/definitions.ts` and dependencies in `src/lib/workflow/dependencies.ts`.

## Getting started

1. Enable **Email/Password** auth in Firebase Console
2. Create Firestore database and deploy `firestore.rules`
3. Copy `.env.example` to `.env.local` with your Firebase config

```bash
npm install
npm run dev
```

## Architecture

```
src/
├── types/workflow.ts          # Workflow TypeScript types
├── lib/workflow/
│   ├── definitions.ts         # Catalog of nodes & light types (scalable)
│   ├── factory.ts             # Build default workflow for new projects
│   ├── dependencies.ts        # Block/unblock rules
│   ├── progress.ts            # Progress calculation
│   ├── normalize.ts           # Defaults & Firestore normalization
│   └── mutations.ts           # Immutable workflow updates
├── components/workflow/       # Accordion tree UI
└── lib/firestore/projects.ts  # Firestore CRUD + realtime
```

## Data model

Projects store a `workflow` array on the Firestore document. Legacy `stages` documents are migrated to the default template on read.
