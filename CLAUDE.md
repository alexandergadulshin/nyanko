# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a T3 Stack web application built with Next.js, TypeScript, Drizzle ORM, and PostgreSQL. The project follows the T3 Stack architecture pattern and is configured to use pnpm as the package manager.

## Development Commands

**Start development server:**
```bash
pnpm dev
```

**Build and type check:**
```bash
pnpm check        # Runs lint and typecheck
pnpm build        # Production build
pnpm typecheck    # TypeScript checking only
```

**Linting and formatting:**
```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues automatically
pnpm format:check # Check Prettier formatting
pnpm format:write # Apply Prettier formatting
```

**Database operations:**
```bash
pnpm db:generate  # Generate Drizzle schema
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio
./start-database.sh  # Start local PostgreSQL container
```

**Preview production build:**
```bash
pnpm preview     # Build and start production server
```

## Architecture

**Database Layer:**
- Uses Drizzle ORM with PostgreSQL
- Database connection configured in `src/server/db/index.ts`
- Schema defined in `src/server/db/schema.ts`
- Multi-project schema with table prefix `anime-web_`
- Environment variables validated using @t3-oss/env-nextjs in `src/env.js`

**Application Structure:**
- Next.js 15 with App Router in `src/app/`
- Server-side code in `src/server/`
- Styles using Tailwind CSS in `src/styles/`
- Environment configuration with Zod validation

**Key Configuration:**
- Uses TypeScript with strict type checking
- ESLint with Next.js and Drizzle-specific rules
- Prettier with Tailwind CSS plugin
- Database table names prefixed with `anime-web_`

## Environment Setup

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/test/production)
- `BETTER_AUTH_SECRET`: Secret key for authentication (legacy)
- `BETTER_AUTH_URL`: Base URL for authentication (http://localhost:3000 in dev)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key for client-side
- `CLERK_SECRET_KEY`: Clerk secret key for server-side

## Database Setup

### Local Development
This project uses local PostgreSQL (no Docker required):

1. **Ensure PostgreSQL is running:**
   ```bash
   brew services start postgresql@15
   ```

2. **Create the database:**
   ```bash
   createdb anime-web
   ```

3. **Push the schema:**
   ```bash
   pnpm db:push
   ```

The database will be created with the connection string: `postgresql://yoni@localhost:5432/anime-web`

### Production (Supabase)
For production deployment:

1. **Create Supabase Project:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create new project named `anime-web`
   - Copy PostgreSQL connection string

2. **Set Production DATABASE_URL:**
   ```bash
   # Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```

3. **Push schema to Supabase:**
   ```bash
   # Set your Supabase DATABASE_URL in environment variables
   pnpm db:push
   ```

4. **Verify in Supabase Dashboard:**
   - Go to Database → Tables
   - Confirm all tables with `anime-web_` prefix are created

## Authentication

- **Primary**: Uses Clerk for authentication with Next.js integration
  - Sign in/up components at `/auth?mode=sign-in` and `/auth?mode=sign-up`
  - Protected routes via middleware for `/profile/*`, `/anime-list/*`, `/settings/*`
  - Clerk components: `SignIn`, `SignUp`, `UserProfile`
  - User data available via `useUser()` hook

- **Legacy**: BetterAuth still configured but not actively used
  - All auth tables have `anime-web_` prefix
  - Auth endpoints available at `/api/auth/*`
  - Client-side hooks in `src/lib/auth-client.ts`

## Key Features & Implementation Details

### Profile System (`/profile/[userId]`)
- **Profile picture upload**: Click-to-upload functionality with image validation (JPEG, PNG, WebP, 5MB max)
- **Base64 storage**: Images converted to base64 data URLs for database storage
- **Profile editing**: In-place editing of name, username, bio, and profile picture
- **Statistics dashboard**: Visual progress bar showing days watched by anime status with color-coded segments
- **Responsive design**: Mobile-first approach with professional styling

#### Profile Statistics Features:
- **Segmented progress bar**: Shows watch time contribution by status (completed, watching, on-hold, dropped, planning)
- **Color-coded visualization**: Green (completed), blue (watching), yellow (on-hold), red (dropped), gray (planning)
- **Dynamic calculations**: Real-time updates based on anime list data
- **Quick stats**: Total episodes, watch time in hours, and days watched

### Anime List Management (`/anime-list`)
- **Dedicated anime list page**: Full-featured list management separate from profile
- **Smart sorting**: Status priority (watching → completed → paused → dropped → planning) with alphabetical sub-sorting
- **Advanced filtering**: Filter by status with emoji indicators and count display
- **Search integration**: Uses Jikan API for anime search with relevance-based sorting

#### Episode Management:
- **Quick episode controls**: Inline +/- buttons for instant episode updates
- **Optimistic updates**: Immediate UI changes without page refresh
- **Auto-status management**: 
  - Automatically sets status to "completed" when reaching max episodes
  - Reverts from "completed" to "watching" when decreasing below max
  - Sets episodes to max when adding anime with "completed" status
- **Visual feedback**: Loading states and hover effects for all interactions

#### List Features:
- **Compact design**: Optimized for collections of 50+ anime with efficient space usage
- **Status indicators**: Color-coded badges and dots for quick status identification
- **Score tracking**: 1-10 rating system with star display
- **Notes system**: Personal notes for each anime entry
- **Responsive cards**: Clean, modern card design with hover effects

### Edit Modal Improvements:
- **Clearable inputs**: Episode and score fields show empty when value is 0
- **Smart placeholders**: Helpful placeholder text ("0" for episodes, "No score" for ratings)
- **Intuitive editing**: Easy to clear and re-enter values without fighting stuck zeros

### API Endpoints:
- **Profile management**: `/api/profile/[userId]` (GET, PUT)
- **Anime list CRUD**: `/api/anime-list` (POST, DELETE)
- **Image upload**: `/api/upload/profile-image` (POST with validation)

### Database Schema Features:
- **Comprehensive anime tracking**: Episodes watched, total episodes, status, score, dates, notes
- **User profiles**: Name, username, bio, profile image storage
- **Status types**: "planning", "watching", "completed", "dropped", "paused"
- **Proper indexing**: Optimized for user queries and anime lookups

### Design System:
- **Modern aesthetic**: Gradient backgrounds, glassmorphism effects, smooth animations
- **Color scheme**: Purple/pink primary colors with dark theme
- **Interactive elements**: Hover effects, scale animations, color transitions
- **Typography**: Clear hierarchy with appropriate font weights and sizes
- **Spacing**: Consistent spacing system using Tailwind CSS utilities

### Performance Optimizations:
- **Optimistic updates**: Instant UI feedback for episode changes
- **Efficient sorting**: Smart sorting algorithms that maintain list stability
- **Image optimization**: Proper error handling and fallback images
- **Minimal re-renders**: Strategic state updates to prevent unnecessary re-renders

### User Experience Features:
- **No page refreshes**: All episode updates happen inline without navigation
- **Stable list order**: Alphabetical sorting prevents items from jumping around
- **Quick actions**: Easy access to edit, delete, and episode management
- **Visual consistency**: Cohesive design language across all pages
- **Error handling**: Graceful error states with user-friendly messages
- **Loading states**: Clear feedback during async operations

## Claude Code Configuration

**includeCoAuthoredBy**: false
- Disables Claude co-authorship in git commits and pull requests
- All commits will appear as authored solely by the repository owner