# TCO Baseline Micro-Assessment Tool

## Overview

This is a vendor-neutral, current-state Total Cost of Ownership (TCO) baseline tool designed for enterprise End User Computing (EUC) environments. The application produces credible, defensible TCO baselines for desktops and applications without prescribing solutions or calculating ROI. It serves as a micro-assessment tool that establishes a single source of truth for what a customer's environment actually costs today.

**Core Purpose:**
- Establish transparent, explainable cost baselines
- Support vendor-neutral, solution-agnostic assessments
- Enable informed conversations without sales narratives
- Every number must be traceable and defensible

## Excel Workbook Alignment (v2.1)

The tool precisely mirrors the structure and calculations of `TCO_Baseline_Workbook_v2_0_FROZEN.xlsx`:

### Input Structure
- **Project Info**: Client Name, Assessment Date, Customer Champion, XenTegra Engineer
- **Environment**: User Count, Laptop Count, Desktop Count, Thin Client Count
- **VDI/DaaS**: VDI % of Users, Platform Presence (Citrix, AVD, Windows 365, Horizon, Parallels) with conditional spend fields and custom platform support
- **Tool Presence**: Intune, SCCM, Workspace ONE, Jamf, ControlUp, Nerdio with conditional spend fields and custom tool support
- **Category Roll-ups**: Optional overrides for total spend per category
- **Managed Services**: Total annual MSP spend with outsourced function checkboxes
- **Observations**: Free-form notes field

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
- Management & Security = actual tool spend (if provided) OR endpoints × cost/endpoint
- VDI/DaaS = actual platform spend (if provided) OR VDI users × platform cost (gated on VDI presence)
- Overhead = subtotal × overhead %

### Spend Override Logic
- When actual spend values are entered for VDI platforms or management tools, those totals replace the assumption-based calculations
- Spend fields only counted when the corresponding presence flag is "yes" to prevent stale data
- Category rollup overrides replace the entire category calculation when provided
- Custom platforms and tools are always included in spend totals

### Summary Metrics
- Total Annual Baseline, Cost per Endpoint, Cost per User
- VDI Cost per VDI User, Non-VDI Cost per User, VDI User Premium

### Visualizations (5 current-state charts)
- Endpoint Mix (pie) - device type distribution
- Where Money Goes (pie) - spend allocation by category
- Cost by Category (horizontal bar) - absolute dollar comparison
- VDI vs Non-VDI Comparison (bar) - per-user cost comparison
- Cost Source (bar) - input-derived vs assumption-based costs

### Export Formats (5 types)
- JSON - machine-readable data interchange
- CSV - spreadsheet-compatible tabular data
- PDF - professional print-ready report with HTML/CSS chart rendering
- Audit Trail - comprehensive human-readable traceability report
- Assumption Justifications - industry-sourced rationales for each assumption

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight React router)
- **State Management:** TanStack React Query for server state; local React state (useState) for assessment data
- **UI Components:** shadcn/ui component library built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS variables for theming
- **Animations:** Framer Motion for page transitions and micro-interactions
- **Charts:** Recharts for interactive data visualizations
- **Dark Mode:** System-aware theme toggle with localStorage persistence
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
- **Client-Side Data:** Assessment data is entirely client-side (no server storage); exports download directly to the user's device

### Project Structure
```
├── client/src/              # React frontend application
│   ├── components/          # Application components
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── TcoCharts.tsx    # 5 Recharts visualizations + ChartCard wrapper
│   │   └── OnboardingTour.tsx # Guided tour overlay
│   ├── pages/               # Route components
│   │   └── tco-baseline.tsx # Main TCO tool (inputs, assumptions, summary, exports)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and query client
│   └── assets/              # Static assets (logos, images)
├── server/                  # Express backend
│   ├── routes.ts            # API route definitions
│   ├── storage.ts           # Data access layer
│   └── vite.ts              # Development server setup
├── shared/                  # Shared types and schemas
├── docs/                    # Documentation
│   └── TCO_BASELINE_TOOL_DOCUMENTATION.md  # Complete tool docs (v2.1)
├── scripts/                 # Utility scripts
│   └── tco-validation-test.js  # 20-test calculation validation suite
└── attached_assets/         # Reference materials and Excel workbook
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

Complete tool documentation is available at `docs/TCO_BASELINE_TOOL_DOCUMENTATION.md` (v2.1) which includes:
- Full feature description and tool overview
- All 15 assumptions with industry-sourced justifications
- Calculation formulas and derived metrics (including spend override logic)
- Five current-state visualizations (Endpoint Mix, Where Money Goes, Cost by Category, VDI Comparison, Cost Source)
- Conditional spend fields and custom platform/tool support
- Export format specifications (JSON, CSV, PDF, Audit Trail, Justifications)
- Onboarding tour and readiness tracker details
- Dark mode toggle documentation
