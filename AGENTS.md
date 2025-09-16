# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Next.js App Router pages, layouts, and API handlers; subfolders like `(auth)/` and `editor/` isolate flows.
- `components/` contains shared UI and feature modules; `components/ui/` includes shadcn/ui building blocks.
- `contexts/`, `hooks/`, `lib/`, and `utils/` provide shared state, React hooks, domain helpers, and utilities.
- `server/` encapsulates backend-only logic (tRPC routers, Prisma access). `prisma/` stores the schema and migrations.
- `apps/mobile/` and `packages/` support Expo/mobile and shared libraries.
- Static assets live in `public/`; scripts and docs are under `scripts/` and `docs/`.

## Build, Test, and Development Commands
- `npm run dev` – start the Next.js dev server (Turbopack) at http://localhost:3000.
- `npm run build` – generate the production bundle after running `prisma generate`.
- `npm run start` – launch the production build locally.
- `npm run lint` / `npm run lint:fix` – check or auto-fix lint issues.
- `npm run mobile` – launch the Expo mobile workspace.
- Database: `npm run db:migrate`, `npm run db:seed`, `npm run db:studio` for migrations, seeding, and Prisma Studio.

## Coding Style & Naming Conventions
- TypeScript everywhere; follow 2-space indentation (`.editorconfig`).
- React components use PascalCase filenames (`SermonInfoSection.tsx`); hooks use `useXxx` pattern.
- shadcn/ui components live under `components/ui/`; extend them rather than duplicating styles.
- Run ESLint (`npm run lint`) before commits; format with Prettier defaults embedded in ESLint.

## Testing Guidelines
- Automated tests are not yet configured; when adding tests prefer Vitest + React Testing Library.
- Place unit tests alongside sources (`*.test.ts(x)` or `__tests__/`).
- Ensure new scripts or server utilities include at least smoke tests once the harness is introduced.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as seen in history.
- Commits should be scoped and descriptive: e.g., `feat(editor): add revision history panel`.
- Pull requests must describe the change, include testing notes, and link related issues; add UI screenshots when relevant.
- Document migration or configuration impacts in the PR body and provide rollback notes.

## Security & Configuration Tips
- Keep secrets out of Git; copy `.env.example` to `.env.local` and fill required values (`DATABASE_URL`, Supabase keys, Sentry DSN).
- Client bundles must not import `server/` modules; use tRPC endpoints instead.
- When editing Prisma schema, run `npm run db:migrate` and commit the generated migration.
