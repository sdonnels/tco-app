# TCO Baseline Micro-Assessment Tool i ''

## Overview

This is a vendor-neutral, current-state Total Cost of Ownership (TCO) baseline tool designed for enterprise End User Computing (EUC) environments. The application produces credible, defensible TCO baselines for desktops and applications without prescribing solutions or calculating ROI. It serves as a micro-assessment tool that establishes a single source of truth for what a customer's environment actually costs today.

**Core Purpose:**
- Establish transparent, explainable cost baselines
- Support vendor-neutral, solution-agnostic assessments
- Enable informed conversations without sales narratives
- Every number must be traceable and defensible

## Excel Workbook Alignment (v2.0)

The tool precisely mirrors the structure and calculations of `TCO_Baseline_Workbook_v2_0_FROZEN.xlsx`:

### Input Structure
- **Project Info**: Client Name, Assessment Date, Customer Champion, XenTegra Engineer
- **Environment**: User Count, Laptop Count, Desktop Count, Thin Client Count, VDI % of Users
- **EUC Pillars & Platforms**: 6 pillars (Access, Virtual Desktops & Applications, Device OS & User Management, Security, App Management, Collaboration AI & Applications) with vendor selection and annual cost tracking
- **EUC Pillars - Platform Cost Rollups (Optional Overrides)**: Override calculated cost categories with known annual spend

### Assumptions (15 values matching Excel)
- Device Refresh Years: Laptop=3, Desktop=3, Thin Client=5
- Device Unit Costs: Laptop=$1200, Desktop=$1100, Thin Client=$600
- Support Ops: Ticket Time=0.5hrs, Deploy Time=1.5hrs, Labor Rate=$50/hr, Tickets/Endpoint=2
- Licensing: $400/user/year, 100% coverage
- Management & Security: $200/endpoint/year
- VDI Platform: $800/VDI user/year
- Overhead: 7% of subtotal

### Calculations
- End-User Devices = Σ(device count × unit cost ÷ refresh years)
- Support & Ops = ticket labor + deployment labor
- Licensing = users × cost/user × coverage %
- Management & Security = endpoints × cost/endpoint
- VDI/DaaS = VDI users × platform cost (gated on VDI presence)
- Overhead = subtotal × overhead %

### Summary Metrics
- Total Annual Baseline, Cost per Endpoint, Cost per User
- VDI Cost per VDI User, Non-VDI Cost per User, VDI User Premium

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight React router)
- **State Management:** TanStack React Query for server state
- **UI Components:** shadcn/ui component library built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS variables for theming
- **Animations:** Framer Motion for page transitions and micro-interactions
- **Build Tool:** Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime:** Node.js with Express 5
- **Language:** TypeScript with ES modules
- **API Pattern:** RESTful API with `/api` prefix convention
- **Development:** Hot module replacement via Vite middleware
- **Production:** Static file serving with SPA fallback

### Data Layer
- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Schema Location:** `shared/schema.ts` (shared between client and server)
- **Validation:** Zod schemas with drizzle-zod integration
- **Storage Abstraction:** Interface-based storage pattern (`IStorage`) allowing memory or database backends
- **Current Implementation:** In-memory storage (`MemStorage`) with database schema ready for PostgreSQL

### Project Structure
```
├── client/src/          # React frontend application
│   ├── components/ui/   # shadcn/ui components
│   ├── pages/           # Route components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Data access layer
│   └── vite.ts          # Development server setup
├── shared/              # Shared types and schemas
└── attached_assets/     # Documentation and reference materials
```

### Build System
- **Development:** Vite dev server with HMR proxied through Express
- **Production:** esbuild bundles server with allowlisted dependencies for cold start optimization
- **Database Migrations:** Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL:** Required via `DATABASE_URL` environment variable
- **Session Store:** connect-pg-simple for session persistence

### UI Framework Dependencies
- **Radix UI:** Full primitive component library (dialog, dropdown, tabs, etc.)
- **Lucide React:** Icon library
- **Embla Carousel:** Carousel/slider functionality
- **Recharts:** Charting library for data visualization

### Development Tools
- **Replit Plugins:** Cartographer, dev banner, runtime error overlay
- **Meta Images Plugin:** Custom Vite plugin for OpenGraph image handling

### Key NPM Packages
- `@tanstack/react-query` - Server state management
- `drizzle-orm` / `drizzle-zod` - Database ORM and validation
- `class-variance-authority` - Component variant management
- `react-hook-form` / `@hookform/resolvers` - Form handling
- `date-fns` - Date utilities
- `xlsx` - Excel file handling (for potential export features)

## Documentation

Complete tool documentation is available at `docs/TCO_BASELINE_TOOL_DOCUMENTATION.md` (v2.3) which includes:
- Full feature description and tool overview
- EUC Pillars & Platforms framework (6 pillars, 17 sub-pillars, 60+ vendors)
- All 15 assumptions with industry-sourced justifications
- Calculation formulas and derived metrics (Override > EUC Pillar costs > Assumptions priority chain)
- Five current-state visualizations (Endpoint Mix, Where Money Goes, Cost by Category, VDI Comparison, Cost Source)
- Export format specifications (JSON, CSV, PDF, Audit Trail, Justifications, Download All zip)
- Tools menu documentation (Intake Form, Import, Help, About)
- Onboarding tour and readiness tracker details
- Dark mode toggle documentation

FAQ file available at `docs/TCO_BASELINE_FAQ.md` (v1.0) with common questions about:
- General usage, data privacy, assessment timing
- Inputs, EUC Pillars, overrides, and readiness tracker
- Assumptions, defaults, and justification sources
- Results, export formats, and troubleshooting

### ReadMe Tab (in-app)
- **Documentation & Resources** card with download buttons for Documentation and FAQ markdown files
- **Quick Start Guide** with 9-step walkthrough covering: Home tab, Project Information, Environment Facts, EUC Pillars, Overrides, Assumptions, Observations, Summary, and Readiness Tracker
- Files imported via Vite `?raw` suffix for client-side download generation

### Tools Menu
- **Generate Intake Form** — Downloads a structured JSON questionnaire for pre-meeting customer data collection
- **Import Intake Data** — Uploads completed intake form JSON to auto-populate tool fields
- **Help** — Generates pre-filled support email with issue description and diagnostic info
- **About** — Version info (0.4.0), technical details, XenTegra copyright and legal notices