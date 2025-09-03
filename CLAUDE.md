# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📖 Holy Editor - 성경 구절 삽입 에디터

성경 구절을 쉽게 삽입하고 편집할 수 있는 웹 기반 에디터입니다.

### Core Technologies
- **Framework**: Next.js 15 with App Router + TypeScript
- **Editor**: Tiptap 3 (ProseMirror-based rich text editor)
- **Styling**: Tailwind CSS 4 + Radix UI components
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod validation
- **API**: tRPC for type-safe APIs
- **Monitoring**: Sentry + PostHog
- **Authentication**: Supabase Auth (to be implemented)

## 🏗️ Project Architecture

```
holy-editor-next/
├── app/                        # Next.js App Router pages
│   ├── editor/[id]/           # Editor page with dynamic routing
│   ├── documents/             # Documents management page
│   └── api/                   # API routes
├── components/
│   ├── editor/                # Editor-specific components
│   │   ├── HolyEditor.tsx    # Main editor component
│   │   ├── Toolbar.tsx       # Editor toolbar
│   │   └── extensions/       # Custom Tiptap extensions
│   │       ├── BibleVerseExtension.ts   # Bible verse extension logic
│   │       ├── BibleVerseNode.ts        # ProseMirror node definition
│   │       └── BibleVerseComponent.tsx  # React component for rendering
│   ├── ui/                    # Reusable UI components (Radix-based)
│   └── layout/                # Layout components
├── lib/
│   ├── bible/                 # Bible-related utilities
│   │   └── books.ts          # Bible book definitions and utilities
│   └── utils.ts              # General utilities
└── prisma/
    └── schema.prisma          # Database schema

```

## 🚀 Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Run development server (with Turbopack)
npm run dev
# Server runs on port 3000 (or 3002 if 3000 is occupied)
# Accessible via http://0.0.0.0:3000 for network access

# Build for production
npm run build

# Start production server
npm start
```

### Database Commands
```bash
# Run database migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database
npm run db:seed

# Generate Prisma Client (after schema changes)
npx prisma generate
```

### Database Migration Workflow (Supabase)
When changing the Prisma schema:
```bash
# 1. Generate and apply migration (uses Supabase direct connection)
npm run db:migrate
# Or manually:
npx prisma migrate dev --name migration-name

# 2. Regenerate Prisma Client (REQUIRED!)
npx prisma generate

# 3. Clear Next.js cache
rm -rf .next

# 4. Restart development server
npm run dev
```

**Quick recovery script for migration issues:**
```bash
npx prisma generate && rm -rf .next && npm run dev
```

## 💡 Key Implementation Details

### Custom Bible Verse Extension
The editor includes a custom Tiptap extension for Bible verse insertion:

1. **BibleVerseExtension.ts**: Core extension logic, handles user input and commands
2. **BibleVerseNode.ts**: ProseMirror node specification, defines the data structure
3. **BibleVerseComponent.tsx**: React component that renders the verse in the editor
4. **Toolbar.tsx**: Contains the UI for inserting Bible verses

The extension allows users to:
- Insert Bible verses via a modal interface
- Select book, chapter, and verse ranges
- Display verses inline with proper formatting
- Edit or delete inserted verses

### Editor State Management
- Uses Tiptap's built-in state management
- Document content stored as JSON in the database
- Auto-save functionality can be implemented using the editor's `onUpdate` event

### Database Schema Requirements
⚠️ **Critical**: The current Prisma schema is misconfigured for a recipe management system (ingredients, recipes tables). 

**Required schema for Holy Editor:**
```prisma
model Document {
  id        String   @id @default(cuid())
  title     String
  content   Json     // Tiptap JSON content
  userId    String?  // For future user authentication
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model BibleReference {
  id         String   @id @default(cuid())
  book       String
  chapter    Int
  verseStart Int
  verseEnd   Int?
  text       String
  documentId String
  createdAt  DateTime @default(now())
}
```

To fix this issue:
1. Backup current database if needed
2. Update `prisma/schema.prisma` with proper models
3. Run `npm run db:migrate` to apply changes
4. Update API routes and tRPC routers accordingly

## 🔧 Environment Variables

Create a `.env.local` file with:
```env
# Supabase Database URLs
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres"

# Supabase Configuration (for auth and storage - when implemented)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN="your_sentry_dsn"
NEXT_PUBLIC_POSTHOG_KEY="your_posthog_key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

⚠️ **Important**: 
- Use the pooler connection (port 6543) for DATABASE_URL
- Use the direct connection (port 5432) for DIRECT_URL (needed for migrations)

## 🎯 Feature Roadmap

Current features:
- Rich text editing with Tiptap
- Bible verse insertion with book/chapter/verse selection
- Document creation and editing

Potential enhancements:
- Document persistence and management
- User authentication
- Collaborative editing
- Export to various formats (PDF, Word, etc.)
- Bible verse search and cross-references
- Sermon templates and outlines
- Note-taking and annotations

## 🐛 Common Issues

1. **Port conflicts**: If port 3000 is in use, the app automatically uses 3002
2. **Prisma Client errors**: Always run `npx prisma generate` after schema changes
3. **Next.js cache issues**: Delete `.next` folder when encountering strange build errors
4. **Database connection**: Ensure both DATABASE_URL and DIRECT_URL are properly set
5. **Turbopack**: This project uses Turbopack for faster builds. If you encounter issues, remove `--turbopack` flag from package.json scripts

## 🚧 Next Steps for Development

1. **Fix Database Schema**: Update Prisma schema from recipe system to document/editor system
2. **Implement Document Storage**: Create API routes for saving/loading documents
3. **Add User Authentication**: Integrate Supabase Auth for user management
4. **Enhance Bible Verse Features**: Add verse search, cross-references, and multiple translations
5. **Export Functionality**: Add PDF, Word document export capabilities

---
*Last updated: 2025-01-28*