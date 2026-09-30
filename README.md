# UniLib — University Library Management System

A full-stack library operations platform: a **React 18 + Vite 6** single-page app on top of an **Express 5 + MongoDB (Mongoose 9)** REST API, with JWT authentication and two role-based experiences; **Librarian** and **LibraryMember**.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.1.12-06B6D4?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2.1-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-Mongoose_9.7.4-47A248?logo=mongodb&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![Deploy](https://img.shields.io/badge/Deploy-Vercel_%C3%97_2-000000?logo=vercel&logoColor=white)

> 

---

## At a glance

| | |
|---|---|
| **Frontend** | `client/` — Vite 6 + React 18 + TypeScript + Tailwind CSS 4 (CSS-first theme), TanStack Query 5, axios, Recharts, lucide-react |
| **Backend** | `server/` — Node 20, Express 5, Mongoose 9, bcryptjs, jsonwebtoken |
| **Database** | MongoDB Atlas (`library_management_system`) — 5 collections |
| **Auth** | Stateless JWT (HS256, 7-day default) + bcrypt (cost 12) + server-side role verification |
| **API surface** | 44 endpoints across 6 route modules + a public health probe |
| **Verified build** | `vite v6.3.5` · 2342 modules · ~50 s · main bundle 826.8 kB (226.6 kB gzip) |
| **Verified runtime** | Node `v20.19.6` · npm `10.8.2` |
| **Deploy target** | Vercel × 2 (static SPA + serverless Express function) + MongoDB Atlas |

---

## Table of contents

- [Why this project exists](#why-this-project-exists)
- [Feature tour by role](#feature-tour-by-role)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
  - [System diagram](#system-diagram)
  - [Backend layering](#backend-layering)
  - [Frontend layering](#frontend-layering)
  - [End-to-end request trace](#end-to-end-request-trace-borrowing-a-book)
- [Repository layout](#repository-layout)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Authentication & authorization](#authentication--authorization)
- [Domain state machines](#domain-state-machines)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Architectural Decisions](#architectural-decisions)
- [Accessibility, responsiveness & UX foundations](#accessibility-responsiveness--ux-foundations)
- [Performance notes](#performance-notes)
- [Verification & QA checklist](#verification--qa-checklist)

## Why this project exists

University libraries run on workflows that generic CRUD demos never touch: a **book has copies**, those copies **move between members**, members **queue for popular titles**, loans go **overdue**, and returns can come back **damaged or lost**. UniLib models those workflows end to end:

- **Catalog management** — librarians curate books with ISBN-level uniqueness, shelf locations, copy counts and auto-derived availability status.
- **Circulation** — librarians issue books to members; students and staff can also **self-serve borrow** from the catalog.
- **Returns desk** — returns are recorded with a **condition** (good / fair / damaged / lost) and the copy ledger is adjusted accordingly.
- **Reservations queue** — when every copy is out, members join a **positioned queue** with an expiry; librarians approve, reject, notify-next and complete holds.
- **Dashboards** — 12-month borrowing trends, category distribution, active borrowers and overdue counts computed with MongoDB aggregation pipelines.
- **Member self-service** — personal dashboard, borrowing history with server-side sorting/filtering, own reservations, and profile management incl. avatar upload.

---

## Feature tour by role

### LibraryMember

| Area | What you get |
|---|---|
| Member dashboard | Currently borrowed books (sorted by due date), **"due soon" count** (≤ 3 days), active reservations, all-time borrowed total, recently borrowed list |
| Catalog (`MemberCatalogPage`) | Search, category / status / author / publisher filters, 7 sort options, availability counters, **Borrow** button when copies exist, **Reserve** button when they don't |
| Borrowing history | Paginated, searchable, status-filterable, sortable by borrow date / due date / return date / title — **scoped server-side to the caller's `memberId`** |
| My reservations | Own reservation queue with live status and **self-cancel** |
| Profile | Edit name, email, phone, department, member type; change password; **drag-and-drop avatar upload** with preview, type + 2 MB client-side validation |

### Librarian

| Area | What you get |
|---|---|
| Operations dashboard | Total books, active borrowers, books currently borrowed, overdue returns; 12-month borrowed-vs-returned line chart; category bar chart |
| Catalog CRUD | Create / edit / delete books, cover-colour picker, shelf location, copy counts, duplicate-ISBN guard |
| Borrowing management | Filterable issue history, **Issue Book** wizard (member + book pickers, loan length, live due-date preview), renew loans, edit records |
| Return management | Return-stats cards (active / overdue / returned-today), **process return** with condition + notes, flag loans as overdue, and a dedicated **Return History** view |
| Reservations | Stats cards incl. **expiring-soon** counter, queue list with position, approve / reject (with reason) / cancel / **mark completed** / **notify next in queue** |
| Profile | Same self-service profile tools as members |

---

## Tech stack

### Client (`client/`)

| Concern | Choice | Notes |
|---|---|---|
| Build tool | **Vite 6.3.5** | `@vitejs/plugin-react`, esbuild transpile, `@` → `src` alias |
| UI runtime | **React 18.3.1** | Function components + hooks only |
| Language | **TypeScript / TSX** sources | **No `tsconfig.json`** — Vite transpiles via esbuild with no type-check gate (see limitations) |
| Styling | **Tailwind CSS 4.1.12** (`@tailwindcss/vite`) | CSS-first config: design tokens declared with `@theme inline` in `src/styles/theme.css` |
| Component kit | **Radix UI primitives + shadcn/ui** (`src/app/components/ui/*`) | Full local copy — no runtime component library dependency |
| Server state | **TanStack Query 5** | One app-wide `QueryClient`; per-query `staleTime`/`retry`; invalidation on mutation |
| HTTP | **axios** | Single instance, request/response interceptors (see decisions #7–#8) |
| Charts | **Recharts 2.15.2** | Line + bar charts on the librarian dashboard |
| Icons | **lucide-react** | Throughout the UI |
| Notifications | **sonner** | Toast host for action feedback |
| Font | **Inter** | Loaded via `src/styles/fonts.css`, used in the app shell |

### Server (`server/`)

| Concern | Choice | Notes |
|---|---|---|
| Runtime | **Node.js ≥ 20** (verified on 20.19.6) | Express 5 requires Node ≥ 18; Vercel requires 20+ |
| Web framework | **Express 5.2.1** | Router-per-domain, async controllers |
| ODM | **Mongoose 9.7.4** | Schemas, hooks, indexes, aggregations, `.lean()` |
| Auth | **jsonwebtoken 9** + **bcryptjs 3** | HS256 JWT (7-day default), bcrypt cost factor 12 |
| Config | **dotenv 17** | `.env` locally; platform env vars in production |
| CORS | **cors 2.8** | Wide-open today; `CLIENT_URL` documented for allow-listing |

---

## Architecture

### System diagram

```
                          ┌───────────────────────────────────────────┐
                          │            Browser (React SPA)            │
                          │  Vite build → static dist/ (Vercel CDN)   │
                          │                                           │
                          │  AuthGuard ──► AuthenticatedApp (views)   │
                          │  TanStack Query cache ◄── hooks/*         │
                          │  axios instance (JWT + no-cache headers)  │
                          └────────────────────┬──────────────────────┘
                                               │  HTTPS  ·  Bearer <JWT>
                                               ▼
                          ┌───────────────────────────────────────────┐
                          │        Express 5 API (Vercel Function)     │
                          │                                           │
                          │  request logger → health → connectDB()    │
                          │      → /api/auth      /api/books          │
                          │        /api/borrowing /api/dashboard      │
                          │        /api/reservations /api/profile     │
                          │                                           │
                          │  routes → middleware(auth/authorize)      │
                          │        → controllers → services           │
                          │        → Mongoose models                  │
                          └────────────────────┬──────────────────────┘
                                               │  Cached connection promise
                                               ▼
                          ┌───────────────────────────────────────────┐
                          │   MongoDB Atlas · library_management_system│
                          │   users · books · members · borrowrecords  │
                          │   reservations                             │
                          └───────────────────────────────────────────┘
```

### Backend layering

```
server.js                 App wiring only: middleware, health check, mount routers,
                          global error handler, dual-mode boot (listener vs module export)
│
├── routes/*.js           URL design + access policy (authenticate / authorize roles)
├── middleware/auth.js    JWT verification → req.user; role gate → 403
├── controllers/*.js      Thin adapters: read req, call service, choose status code,
│                         serialise errors, hand unexpected errors to next(err)
├── services/*.js         Business rules, validation, copy accounting, aggregations
│                         (throws Error with .statusCode and optional .errors map)
└── models/*.js           Schema, enums, indexes, hooks (password hashing, status derivation)
```

**Rule of thumb enforced by this layout:** controllers never contain business rules, and services never touch `req`/`res`. That is what makes the same `createBorrowRecord` service usable both from the librarian endpoint (`POST /api/borrowing`) and the member self-service endpoint (`POST /api/borrowing/self`), and from the reservation → loan conversion (`PATCH /api/reservations/:id/complete`).

### Frontend layering

```
main.tsx
└── App.tsx ──────────────────────────── composition root
    └── <QueryClientProvider client={queryClient}>
        └── <AuthGuard> ──────────────── blocks render until /auth/me verifies the token;
            │                           renders Welcome / Login / Register when unauthenticated
            └── <AuthenticatedApp> ───── single `view` state machine (no route library)
                │
                ├── pages/*.tsx ──────── one component per screen, role-gated here
                ├── hooks/*.js ───────── TanStack Query wrappers (one per API domain)
                │                         · queries  → useBooks, useBorrowing, useReservations …
                │                         · mutations → invalidate the right query keys onSuccess
                ├── components/BookUI.tsx  shared visual primitives (BookCover, badges,
                │                          Avatar, form styles) used by every page
                └── components/ui/* ──── shadcn/Radix primitives
```

Two deliberate traits stand out:

1. **Navigation is a typed state machine, not a router.** `View` is a string-literal union
   (`"dashboard" | "books" | "add" | "edit" | "details" | "borrowing" | "issue" | "returns" | "returnHistory" | "reservations" | "profile" | "catalog" | "myReservations" | "myBorrowingHistory"`),
   so an unknown view is a compile-time error and no page can be reached out of role order —
   the render block itself is guarded by `user.role` checks.
2. **All server state flows through hooks**, never through scattered `useEffect` fetches.
   `staleTime` is tuned per domain (books 10 s, filters 60 s, librarian dashboard 30 s,
   member dashboard 15 s, reservation stats 15 s, profile 30 s) and mutations invalidate
   exactly the keys they affect — e.g. marking a reservation complete also invalidates
   `["books"]` because a copy was consumed.

### End-to-end request trace: borrowing a book

```
MemberCatalogPage "Borrow" click
   │
   ├─ useBorrowForSelf() → POST /api/borrowing/self { bookId, borrowDurationDays: 14 }
   │
   ├─ axios request interceptor          → attaches Bearer <unilib_token> + no-cache headers
   │
   ├─ Express: logger → connectDB() (cached) → routes/borrowing.js
   │      router.use(authenticate)             → verifies JWT, loads req.user (never trusts body)
   │      handler: borrowForSelf               → memberId/name/type taken from req.user
   │
   ├─ borrowingController.borrowForSelf
   │      validates memberId + duration, loads the Book, computes dueDate
   │      delegates to borrowingService.createBorrowRecord(...)
   │
   ├─ borrowingService.createBorrowRecord        ← ALL invariants enforced here
   │      1. required-field validation           → 400 { error, errors{…} }
   │      2. memberType ∈ {student, staff}       → 400
   │      3. book exists                         → 404
   │      4. availableCopies >= 1                → 400 "No available copies…"
   │      5. no duplicate active loan             → 400 "already has an active borrow…"
   │      6. create BorrowRecord (denormalised snapshot of title/isbn/cover colour)
   │      7. book.availableCopies -= 1, save()   → pre-save hook re-derives book.status
   │
   ├─ 201 { message, record }
   │
   └─ onSuccess: invalidate ["books"], ["borrowRecords"], ["memberDashboard"], ["dashboardStats"]
         → the catalog card, member dashboard and librarian KPIs all refresh consistently
```

---

## Repository layout

```
library-management-system/
├── client/                          # React SPA (Vercel project #1 · Root Directory = client)
│   ├── index.html                   # Vite entry (mounts #root)
│   ├── vite.config.ts               # react + tailwind plugins, "@" alias, figma:asset resolver
│   ├── package.json                 # vite build / vite dev scripts
│   ├── ATTRIBUTIONS.md              # shadcn/ui (MIT) + Unsplash credits
│   └── src/
│       ├── main.tsx                 # createRoot → <App />
│       ├── styles/
│       │   ├── index.css            # @import fonts → tailwind → theme
│       │   ├── theme.css            # design tokens (@theme inline), dark palette, a11y helpers
│       │   └── tailwind.css         # tailwind entry
│       └── app/
│           ├── App.tsx              # QueryClientProvider + AuthGuard + view state machine + Shell
│           ├── LoginPage.tsx  RegisterPage.tsx          # lazy-loaded auth screens
│           ├── components/
│           │   ├── AuthGuard.tsx    # zero-trust session gate + logout orchestration
│           │   ├── BookUI.tsx       # shared book/status/avatar primitives + constants
│           │   ├── ImageUpload.tsx  # drag-and-drop avatar uploader (base64, 2 MB cap)
│           │   ├── figma/           # ImageWithFallback helper
│           │   └── ui/              # ~40 shadcn/Radix primitives
│           ├── hooks/               # TanStack Query wrappers (books, borrowing, reservations,
│           │   │                    #   dashboard, my-borrowing-history)
│           │   └── useDialogA11y.ts # scroll-lock + Escape for overlays
│           ├── pages/               # 11 screens (dashboards, catalog, borrowing, returns,
│           │                        #   reservations, profile, welcome) + 2 auth screens above
│           └── services/
│               ├── api.js           # axios instance + interceptors + the full API surface
│               └── queryClient.ts   # shared QueryClient (isolated to avoid circular imports)
│
├── server/                          # Express API (Vercel project #2 · Root Directory = server)
│   ├── server.js                    # app wiring, logger, health, dual-mode boot, module export
│   ├── seed.js                      # demo data loader (clears + inserts)
│   ├── config/db.js                 # cached-connection Mongo connector (serverless-safe)
│   ├── middleware/auth.js           # authenticate() + authorize(...roles)
│   ├── models/                      # User · Book · BorrowRecord · Reservation · Member
│   ├── routes/                      # auth · books · borrowing · dashboard · reservations · profile
│   ├── controllers/                 # thin HTTP adapters (validation → service → status code)
│   ├── services/                    # business logic + aggregations (the real domain layer)
│   ├── uploads/                     # legacy folder — unused (avatars are base64 in Mongo)
│   └── package.json                 # npm start · npm run seed
│
├── DEPLOYMENT.md                    # Vercel × 2 + Atlas deployment runbook
├── PROFILE_PICTURE_IMPLEMENTATION_PLAN.md   # reference spec that informed the avatar feature
└── README.md                        # ← you are here
```

---

## Data model

### Entity map

```
                ┌───────────────┐
                │     User      │  auth principal (Admin | Librarian | LibraryMember)
                │  fullName     │  · bcrypt password hash
                │  email (uniq) │  · memberId links members to the Member registry
                │  role         │  · profilePicture = base64 data URI
                └───────┬───────┘
                        │ memberId (1:1, for LibraryMember accounts)
                        ▼
                ┌───────────────┐
                │    Member     │  lightweight registry used by circulation views
                │  id  (uniq)   │  STU-YYYY-NNNN / STF-YYYY-NNNN
                │  activeLoans  │
                └───────────────┘

  ┌───────────────────┐        copies consumed        ┌─────────────────────┐
  │       Book        │◄──────────────────────────────│    BorrowRecord     │
  │  isbn (uniq)      │   availableCopies/totalCopies │  bookId → Book      │
  │  totalCopies      │                               │  bookTitle (snapshot)│
  │  availableCopies  │                               │  memberId (string)  │
  │  status (derived) │        holds the queue        │  borrow/due/return  │
  └─────────┬─────────┘◄──────────────────────────────│  condition, status  │
            │                 ┌─────────────────────┐ │                     │
            └────────────────►│    Reservation      │ └─────────────────────┘
                              │  bookId → Book      │
                              │  position (queue)   │
                              │  expiresAt (+7 d)   │
                              │  status, notifiedAt │
                              └─────────────────────┘
```

### Collections

| Model | Key fields | Indexes / constraints |
|---|---|---|
| **User** (`models/User.js`) | `fullName`, `email`, `password` (hashed), `role` ∈ {Librarian, LibraryMember}, `memberId`, `memberType` ∈ {student, staff}, `department`, `phoneNumber`, `profilePicture` (base64) | `email` unique; `memberId` unique **+ sparse** (Librarian are seeded `LIB-0001`so the unique index doesn't collide on multiple `null`s); `toJSON()` strips the hash |
| **Book** (`models/Book.js`) | `isbn`, `title`, `author`, `category`, `publisher`, `year`, `edition`, `pages`, `language`, `description`, `shelfLocation`, `totalCopies`, `availableCopies`, `borrowCount`, `coverColor`, `status` ∈ {available, low-stock, checked-out, reserved} | `isbn` unique; `status` is **derived in a pre-save hook** (0 copies → `checked-out`, ≤ 2 → `low-stock`, else `available`) |
| **BorrowRecord** (`models/BorrowRecord.js`) | `bookId` ref + `bookTitle`/`bookCoverColor`/`isbn` snapshots, `memberId`, `memberName`, `memberType`, `borrowDate`, `dueDate`, `returnDate`, `status` ∈ {borrowed, returned, overdue, reserved}, `condition` ∈ {good, fair, damaged, lost}, `notes` | Denormalised book + member snapshots mean listing 10 loans needs **one query and zero joins** |
| **Reservation** (`models/Reservation.js`) | `bookId` ref + book snapshots, `memberId`/`memberName`/`memberEmail`/`memberType`, `reservedAt`, `expiresAt` (default **+7 days**), `approvedAt`, `completedAt`, `notifiedAt`, `position`, `status` ∈ {pending, approved, rejected, cancelled, completed, notified}, `rejectionReason` | **Compound index** `{ bookId, status, position }` powers queue lookups; `{ memberId, status }` powers "my reservations" |
| **Member** (`models/Member.js`) | `id` (STU-/STF- code), `name`, `type`, `department`, `email`, `activeLoans` | `id` unique; auto-created on registration to keep librarian-side member views working |

### Where the numbers live

| Number | Source of truth | Adjusted when |
|---|---|---|
| `totalCopies` | Book document | Book edited; **−1 when a return is marked `lost`** |
| `availableCopies` | Book document | **−1** on issue and on reservation-complete; **+1** on return with any non-`lost` condition (capped at `totalCopies`) |
| `borrowCount` | Book document | `+1` per issue — used as a popularity metric |
| Book `status` | Derived | Recomputed by the pre-save hook on every save; never set by hand |
| Reservation `position` | Derived | `max(position) + 1` among `pending`/`notified` for that book, computed at creation |

---

## API reference

**Base URL:** `http://localhost:5000/api` locally · `https://<api-project>.vercel.app/api` in production (`VITE_API_URL`).

### Conventions

| Concern | Convention |
|---|---|
| Auth | `Authorization: Bearer <jwt>` on every protected route |
| Success shapes | Single resource → the document; mutation → `{ message, <entity> }`; list → `{ books \| records, total, page, totalPages }` |
| Error shape | `{ error: string }` and, for validation failures, `{ error, errors: { field: message } }` |
| Status codes | `200/201` success · `400` validation/business rule · `401` missing/expired/invalid token · `403` wrong role or foreign resource · `404` not found · `409` duplicate (email/ISBN) · `500` unhandled |
| Pagination | `?page` (clamped into `[1, totalPages]`) and `?limit`; `totalPages` is always ≥ 1 |
| Search | `?search` → case-insensitive regex across domain-relevant fields |
| Sorting | Whitelisted `sortBy` + `sortOrder=asc\|desc` — unknown fields silently fall back to `createdAt desc` |
| Caching | Auth routes send `Cache-Control: no-store`; the client also stamps no-cache headers on every request |

### Health

| Method | Path | Access |
|---|---|---|
| `GET` | `/api/v1/health` | public — returns `{ success, statusCode, message, data: { environment, timestamp } }` |

### Auth — `/api/auth` (5 endpoints)

| Method | Path | Access | Notes |
|---|---|---|---|
| `POST` | `/register` | public | Creates a `LibraryMember` + `Member` record; generates `STU-YYYY-NNNN`; `409` on duplicate email |
| `POST` | `/login` | public | Returns `{ message, user, token }`; identical message for unknown email and wrong password |
| `GET` | `/me` | authenticated | The client's session-verification call on boot; returns `{ user }` |
| `POST` | `/logout` | authenticated | Acknowledgement endpoint — the client performs the real teardown (see decision #9) |
| `POST` | `/change-password` | authenticated | Requires `currentPassword`; `400` if wrong; new password ≥ 6 chars |

### Books — `/api/books` (6 endpoints)

| Method | Path | Access | Notes |
|---|---|---|---|
| `GET` | `/filters` | authenticated | Distinct authors / publishers / categories for dropdowns |
| `GET` | `/` | authenticated | `search` (title, author, ISBN), `category`, `status`, `author`, `publisher`, `sortBy`, `sortOrder` |
| `GET` | `/:id` | authenticated | Single book or `404` |
| `POST` | `/` | Librarian, Admin | Required-field validation + duplicate-ISBN `409` |
| `PUT` | `/:id` | Librarian, Admin | Field-whitelisted patch-by-PUT; re-checks ISBN uniqueness |
| `DELETE` | `/:id` | Librarian, Admin | `404` when already gone |

### Borrowing — `/api/borrowing` (11 endpoints)

Route ordering is deliberate: the concrete paths (`/return-stats`, `/return-history`, `/self`, `/self/history`) are declared **before** `/:id`, and the role gate is applied per-section so member self-service can't reach librarian tools.

| Method | Path | Access | Notes |
|---|---|---|---|
| `GET` | `/return-stats` | Librarian | `{ active, overdue, returnedToday }` (day-boundary query) |
| `GET` | `/return-history` | Librarian, Admin | Only `status: "returned"`, sorted by `returnDate desc` |
| `POST` | `/:id/return` | Librarian | Sets `returned` + `returnDate`, stores condition/notes, restores copies (or decrements `totalCopies` when `lost`) |
| `POST` | `/self` | authenticated | Member self-service issue — **identity from the JWT, not the body**; `borrowDurationDays` required |
| `GET` | `/self/history` | authenticated | Caller's own history with search/status/sorting; scoped by `req.user.memberId` |
| `GET` | `/` | Librarian, Admin | `search` → member name / book title / member ID / ISBN; `status=active` expands to borrowed+overdue |
| `GET` | `/:id` | Librarian, Admin | Single record |
| `POST` | `/` | Librarian, Admin | Issue for a member picked in the wizard; validates availability + no duplicate active loan |
| `PUT` | `/:id` | Librarian, Admin | Editable fields incl. date coercion and member-type enum guard |
| `POST` | `/:id/renew` | Librarian, Admin | Requires a new `dueDate`; rejects renewing returned/reserved records; resets status to `borrowed` |
| `DELETE` | `/:id` | Librarian, Admin | Deletes the record and **returns the copy if it was still out** |

### Dashboard — `/api/dashboard` (4 endpoints)

| Method | Path | Access | Notes |
|---|---|---|---|
| `GET` | `/stats` | **public today** | `{ totalBooks, activeBorrowers (distinct memberIds), booksBorrowed, overdueReturns }` |
| `GET` | `/activity` | **public today** | 12-month aggregation, gap-filled to always return 12 buckets of `{ m, b, r }` |
| `GET` | `/categories` | **public today** | `$lookup` into `books` → `[{ n: category, v: count }]` sorted desc |
| `GET` | `/member` | LibraryMember | Personal bundle: currently borrowed (due-date sorted), `dueSoonCount` + `dueSoon` (≤ 3 days), active reservations, `totalBorrowed`, 5 most recent loans |



### Reservations — `/api/reservations` (13 endpoints)

| Method | Path | Access | Notes |
|---|---|---|---|
| `GET` | `/stats` | Librarian, Admin | Counts per status + **`expiringSoon`** (pending/approved expiring within 24 h) |
| `POST` | `/notify-next/:bookId` | Librarian, Admin | Promotes the lowest-position `pending` reservation to `notified` and stamps `notifiedAt` |
| `GET` | `/self` | authenticated | Caller's own reservations (`req.user.memberId`) |
| `POST` | `/self` | authenticated | Reserves a book for the caller — **rejected when copies are available** ("borrow it instead") |
| `PATCH` | `/self/:id/cancel` | authenticated | **Ownership-checked** — cancelling someone else's reservation is a `403` |
| `GET` | `/` | Librarian, Admin | Search across member name/ID/email, title, ISBN; filter status/memberType |
| `GET` | `/:id` | Librarian, Admin | Single reservation |
| `POST` | `/` | Librarian, Admin | Creates for a chosen member; rejects duplicate active reservations for the same book |
| `PATCH` | `/:id/approve` | Librarian, Admin | Only from `pending`/`notified` → `approved` + `approvedAt` |
| `PATCH` | `/:id/reject` | Librarian, Admin | Only from `pending`/`notified`; stores optional `rejectionReason` |
| `PATCH` | `/:id/cancel` | Librarian, Admin | Blocked for already-final states |
| `PATCH` | `/:id/complete` | Librarian, Admin | Only from `approved`; stamps `completedAt` **and decrements `availableCopies`** (the hold became a loan) |
| `DELETE` | `/:id` | **Admin** | Hard delete |

### Profile — `/api/profile` (4 endpoints)

| Method | Path | Access | Notes |
|---|---|---|---|
| `GET` | `/` | authenticated | Current user (hash never leaves the model layer) |
| `PUT` | `/` | authenticated | Whitelisted fields: `fullName`, `email` (uniqueness-checked), `phoneNumber`, `department`, `memberType`, `profilePicture` |
| `PUT` | `/avatar` | authenticated | Accepts a data-URI base64 image (JPEG/PNG/GIF/WebP), pattern-validated + ≤ 5 MB payload |
| `PUT` | `/change-password` | authenticated | Same semantics as the auth route |

**Endpoint tally:** 5 auth + 6 books + 11 borrowing + 4 dashboard + 13 reservations + 4 profile + 1 health = **44**.

---

## Authentication & authorization

### Login and session flow

```
POST /api/auth/login { email, password }
        │
        ├─ User.findOne({ email })                     ← 401 "Invalid email or password." for unknown email
        ├─ user.comparePassword(password)              ← bcrypt.compare against the cost-12 hash; same 401 on failure
        └─ jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || "7d" })
                 │
                 ▼
client: localStorage["unilib_token"] = token   →  AuthenticatedApp renders
                 │
any later request: Authorization: Bearer <token>
                 │
        middleware/authenticate → jwt.verify → User.findById(decoded.id) → req.user
                 │
        middleware/authorize("Librarian", "Admin") → 403 { requiredRoles, yourRole } when role mismatches
```



### Zero-trust client checks 

1. **No client-side trust on boot.** `AuthGuard` starts in `loading`, calls `GET /api/auth/me`, and renders **nothing** until the server confirms the session. The role used for navigation comes from that verified response — never from `localStorage`, never from a decoded JWT payload.
2. **Global 401 ejection.** The axios response interceptor listens for `401` on any non-auth route and dispatches a `unilib:unauthorized` window event; `AuthGuard` treats it as session death, wipes the token and returns the user to Welcome/Login. A dead token can therefore never leave the app stranded inside an authenticated shell with empty panels.
3. **Logout is local-first.** `logout()` clears the token, calls `queryClient.clear()` (so the next user can't read the previous user's cached API responses), flips the UI to unauthenticated and *only then* fires the best-effort `POST /auth/logout` with the token it captured before clearing the API call uses the `skipAuth` escape hatch precisely because storage is already empty
4. **No stale role data.** Auth routes send `Cache-Control: no-store, no-cache, must-revalidate`, and the axios request interceptor adds no-cache headers to **every** call.
5. **Password hashes never leak.** `User.toJSON()` deletes `password`, so even documents returned by mistake are safe.

---

## Domain state machines

### BorrowRecord

```
                 POST /borrowing  ·  POST /borrowing/self
                               │
                               ▼
                        ┌────────────┐   librarian flags overdue (PUT /:id)   ┌───────────┐
                        │  borrowed  │ ─────────────────────────────────────►│  overdue  │
                        └─────┬──────┘ ◄─────────────────────────────────────└─────┬─────┘
                              │        POST /:id/renew (resets to borrowed)        │
                              │                                                   │
                              │  POST /:id/return { condition, notes }            │
                              ▼                                                   ▼
                        ┌────────────┐                                   (same return path)
                        │  returned  │◄──────────────────────────────────────────┘
                        └────────────┘
     condition = lost → book.totalCopies −1     ·     otherwise → book.availableCopies +1 (≤ totalCopies)
```

| Trigger | Status | Copy ledger | Notes |
|---|---|---|---|
| Librarian issues (`POST /borrowing`) | `borrowed` | `availableCopies −1` | Rejects when out of stock or the member already has this book |
| Member self-serves (`POST /borrowing/self`) | `borrowed` | `availableCopies −1` | `dueDate = today + borrowDurationDays` |
| Renew (`POST /:id/renew`) | back to `borrowed` | unchanged | Rejected for `returned` / `reserved` |
| Mark overdue (`PUT /:id` from Return Management) | `overdue` | unchanged | Flagged by staff; there is **no scheduler** that flips this automatically |
| Return (`POST /:id/return`) | `returned` + `returnDate` | `+1` unless `lost` | Stores condition + notes |
| Delete (`DELETE /:id`) | record removed | `+1` if it was still out | Consistency rescue for staff |

### Reservation

```
   POST /reservations/self  ·  POST /reservations
                │
                ▼
        ┌──────────────┐  approve   ┌────────────┐  complete   ┌─────────────┐
        │   pending    │───────────►│  approved  │────────────►│  completed  │
        │ position: n  │            │ approvedAt │  completedAt│  (−1 copy)  │
        └──┬────────┬──┘            └─────┬──────┘             └─────────────┘
           │        │   reject            │  cancel
           │        └──────────►┌──────────┴───────►┌───────────┐
           │                    │    rejected      │ cancelled │
   notify  │                    │ rejectionReason  └───────────┘
   next    ▼                    └───────────────────
     ┌────────────┐  approve / reject / cancel  (same branches as above)
     │  notified  │  notifiedAt stamped by POST /notify-next/:bookId
     └────────────┘
```

Guards worth calling out:

- **`pending` / `notified` are the only approvable or rejectable states.**
- **`completed` / `rejected` / `cancelled` are terminal** — cancellation is refused afterwards.
- **`complete` consumes a copy** (`availableCopies −1`), because an approved hold physically leaves the shelf.
- **Members cannot reserve what is on the shelf** — `reserveForSelf` returns `400 "This book is currently available — please borrow it instead."`
- **Queue position** = `max(position) + 1` per book over `pending`/`notified`, and each reservation carries `expiresAt` (default +7 days), which drives the `expiringSoon` stat.

---

## Getting started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | **≥ 20** (verified 20.19.6) | Express 5 needs ≥ 18; Vercel needs ≥ 20 |
| npm | 10.x (verified 10.8.2) | `package-lock.json` is committed in both apps |
| MongoDB | Atlas cluster **or** local `mongod` | The code only needs a `MONGODB_URI` |
| Git | any recent | — |

### 1 · Clone

```bash
git clone https://github.com/Yamuhammad01/Library-Management-System.git
cd library-management-system
```

### 2 · Start the API

```bash
cd server
npm install
```

Create `server/.env`:

```dotenv
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/library_management_system
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Then:

```bash
npm run seed     # optional: wipes Book/Member/BorrowRecord/User and loads demo data
npm start        # → "MongoDB connected: …" then "Server running on port 5000"
```

Smoke-test the API:

```bash
curl http://localhost:5000/api/v1/health
```

### 3 · Start the web app

In a second terminal:

```bash
cd client
npm install
npm run dev      # → http://localhost:5173
```

No env file is needed in development — `api.js` falls back to `http://localhost:5000/api`. To point at another API, create `client/.env.local`:

```dotenv
VITE_API_URL=https://your-api.vercel.app/api
```

### 4 · Sign in

`npm run seed` creates **10 books, 12 members, 15 circulation records and 4 user accounts**:

| Role | Email | Password |
|---|---|---|
| Librarian | `librarian@unilib.edu` | `Library123` |
| LibraryMember | `as@unilib.edu` | `Library123` |
| LibraryMember | `kevin@unilib.edu` | `password123` |

The Welcome screen also has **one-click demo login** buttons for the Librarian and Member accounts, so a reviewer never has to type credentials.

### Useful commands

| Where | Command | What it does |
|---|---|---|
| `server/` | `npm start` | Boots the API (`node server.js`) |
| `server/` | `npm run seed` | Re-seeds demo data |
| `client/` | `npm run dev` | Vite dev server with HMR |
| `client/` | `npm run build` | Production bundle → `client/dist/` |
| — | `git push origin main` | Triggers both Vercel projects |

---

## Environment variables

### Server

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | dev only | `5000` | Listener port (`process.env.PORT || 5000`); injected by Vercel in production |
| `MONGODB_URI` | yes | — | Atlas/local connection string incl. database name |
| `JWT_SECRET` | yes | — | HS256 signing key. **Changing it invalidates every issued token** |
| `JWT_EXPIRES_IN` | recommended | `7d` | Token lifetime passed to `jwt.sign` |
| `NODE_ENV` | recommended | `development` | Surfaced by the health endpoint; set `production` on Vercel |
| `CLIENT_URL` | optional | — | Origin to allow-list once CORS is tightened |

### Client

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_URL` | production only | `http://localhost:5000/api` | API base URL; trailing slashes are stripped automatically. **Inlined at build time, changing it requires a rebuild** |

---

## Deployment

The repo ships **two apps in one GitHub repository**, deployed as **two Vercel projects**:

```
GitHub (main)
 ├── Root Directory = client  →  static Vite build (CDN)          env: VITE_API_URL=https://<api>/api
 └── Root Directory = server  →  Express as a Vercel Function     env: MONGODB_URI, JWT_SECRET,
                                                                        JWT_EXPIRES_IN, NODE_ENV=production
                                           │
                                           └──►  MongoDB Atlas (allow 0.0.0.0/0 — Vercel uses dynamic egress IPs)
```

| Fact | Why it matters |
|---|---|
| `server/server.js` exports the app and guards `app.listen` behind `require.main === module` | Vercel auto-detects the Express entry — **no `vercel.json` needed**, while `npm start` still works locally |
| The JSON body limit is `4mb` | Base64 avatars exceed Express's 100 kB default; 4 MB stays under Vercel's 4.5 MB request cap |
| Avatars are base64 strings in MongoDB | Nothing writes to disk, so the read-only serverless filesystem is a non-issue (`server/uploads/` is vestigial) |
| `config/db.js` caches the connection *promise* and resets it on failure | Warm invocations reuse the socket; a failed cold start retries on the next request instead of killing the instance |
| Navigation is in-app state (no `pushState`) | No SPA rewrite rule is required; one HTML entry serves the whole app |


---

## Architectural Decisions

Each decision below is stated as **problem → decision → consequence**, because that is the level of reasoning the code actually encodes.

### 1. A real service layer, not logic in controllers

**Problem.** CRUD demos put rules in route handlers, so the same rule (book availability, copy accounting) gets re-implemented and eventually drifts everywhere it is needed.

**Decision.** `routes → middleware → controllers → services → models`. Controllers validate the *shape* of the request and translate results into status codes; **all** domain rules live in `services/*.js`, which throw `Error` objects carrying `statusCode` and an optional field-error map.

**Consequence.** The identical service function backs `POST /api/borrowing` (librarian) and `POST /api/borrowing/self` (member), and the reservation-completion path reuses the same copy-accounting primitives. A rule can only be wrong in one place, and services are unit-testable without HTTP.

### 2. A uniform, self-describing error contract

**Problem.** Ad-hoc error handling produces a different failure shape per endpoint, which forces fragile client parsing.

**Decision.** Services throw errors with `.statusCode`; controllers serialise them as `{ error }` or `{ error, errors: { field: message } }`; anything unexpected is forwarded to `next(err)` and lands in the global handler as a logged `500`.

**Consequence.** The client can render per-field validation messages (the auth, register and issue-book forms do exactly this) and never sees an HTML error page. Every failure the API can produce is enumerable: `400 / 401 / 403 / 404 / 409 / 500`.

### 3. Serverless-first boot without losing local DX

**Problem.** The classic Express `app.listen()` entry cannot be imported as a serverless handler, and naïvely reconnecting to MongoDB per invocation exhausts the connection pool.

**Decision.** `server.js` exports the app and only calls `connectDB().then(app.listen)` when `require.main === module`; `config/db.js` memoises the connection promise, short-circuits when `readyState === 1`, and clears the cache on failure so the next request retries; a middleware `await connectDB()` runs before data routes.

**Consequence.** One codebase runs unmodified as (a) a long-lived local process and (b) a Vercel Function, with no `vercel.json` and no cold-start crash loop. The tempting alternative `process.exit(1)` when Atlas is briefly unreachable is deliberately avoided so a transient outage doesn't take down a warm instance.

### 4. Denormalised read snapshots in the two hottest collections

**Problem.** Circulation lists need book title, ISBN and cover colour plus member name for every row. A normalised design makes those list endpoints either multi-round-trip or `$lookup`-heavy.

**Decision.** `BorrowRecord` and `Reservation` store **snapshots** (`bookTitle`, `bookCoverColor`, `isbn`, `memberName`, `memberEmail`, `memberType`) alongside the `bookId` reference, written at creation time; `Reservation` additionally carries two compound indexes matching its real query patterns (`{bookId, status, position}` and `{memberId, status}`).

**Consequence.** Every list view, librarian borrowing table, return history, member's own history, reservation queue is a **single indexed query with zero joins**. The trade-off (snapshots can go stale if a book is later renamed) is acceptable for circulation records, which are historical documents that *should* preserve the title as issued.

### 5. Invariants enforced where the data changes

**Problem.** "A member cannot borrow the same book twice", "you cannot reserve a book that is on the shelf", "a lost book reduces `totalCopies`, a good return restores `availableCopies`"  rules like this are trivially bypassed if they live in the UI.

**Decision.** Every one of these is enforced inside the service that performs the write, immediately before it, using a fresh read of the book document: availability check → duplicate active-loan check → record creation → copy decrement. Reservation transitions validate the **current status against the allowed source states** before mutating.

**Consequence.** The API is safe to call from any client (including `curl`), and the frontend can treat `400`s as authoritative business-rule feedback. This is also why the UI only shows "Reserve" for unavailable books *and* the endpoint still rejects an available-book reservation when someone calls it directly.

### 6. Derived state is computed, never trusted

**Problem.** `status: "available" | "low-stock" | "checked-out"` duplicates `availableCopies`/`totalCopies`, so any write path that forgets to update it corrupts the catalog.

**Decision.** A Mongoose **pre-save hook** recomputes `Book.status` from the copy counts on every save (`0 → checked-out`, `≤2 → low-stock`, else `available`), and services mutate only the numeric fields.

**Consequence.** Status can never disagree with the numbers regardless of which endpoint changed them  including the reservation-complete path, which was added later and inherited correct status behaviour for free.

### 7. Registrations mint their own domain identity

**Problem.** A new member needs a human-readable library ID (`STU-2027-0042`) that must be unique, monotonic and legible to library staff, UUIDs are none of those.

**Decision.** `authService.generateMemberId()` derives the prefix from member type, queries the Member collection with a **year-scoped regex**, sorts descending, parses the last sequence number and zero-pads the next one then the `Member` registry row and the `User` account are created together in the registration flow.

**Consequence.** IDs read like real library cards, stay unique per prefix/year, and the auto-created `Member` row keeps every librarian-side member view working without special-casing self-registered accounts. (Sequence gaps on concurrent registrations are possible and acceptable; a counter collection is the upgrade path if strictness is ever needed.)

### 8. One HTTP choke point  with a deliberate escape hatch

**Problem.** Auth headers, cache headers and 401 handling duplicated per call site is the fastest route to inconsistency.

**Decision.** All requests go through a single axios instance in `services/api.js` with two interceptors: the request interceptor attaches `Bearer <unilib_token>` plus no-cache headers **unless** the call sets `config.skipAuth`; the response interceptor converts any `401` outside `/auth/*` into a global `unilib:unauthorized` event while still rejecting the promise so component-level error handling keeps working.

**Consequence.** Adding an endpoint is one exported function, auth and caching are structural, not remembered. The `skipAuth` flag exists for exactly one legitimate case: **logout**, where the token must be sent explicitly because local storage has already been cleared to guarantee an immediate, offline-safe sign-out.

### 9. Zero-trust session handling on the client

**Problem.** Client-side auth typically trusts `localStorage` and the last-known role, so a stale or forged client state can render an authenticated shell around data the server will refuse to return.

**Decision.** `AuthGuard` renders a loading state until `GET /auth/me` confirms the session *and* supplies the role; a global `unilib:unauthorized` listener performs hard ejection on any 401; logout is **local-first** (clear token → `queryClient.clear()` → flip UI → best-effort server call) so sign-out can never be blocked by a slow or unreachable API; the three auth screens are `React.lazy()` imports to avoid a circular dependency between the guard and the pages.

**Consequence.** The client never displays a role the server hasn't confirmed, the next user on a shared machine cannot read the previous user's cached API responses, and an expired token degrades to the login screen instead of a broken dashboard.

### 10. Dependency-direction discipline in the frontend

**Problem.** Auth-triggered cache purging needs the `QueryClient`, but the natural home for that client is next to `<App />`  importing it from the auth layer creates a circular dependency (`AuthGuard ⇄ App`).

**Decision.** The `QueryClient` lives in its own leaf module (`services/queryClient.ts`) that imports nothing from the app, and `AuthGuard` calls `queryClient.clear()` directly. The same instinct produced the `React.lazy()` auth screens and the `skipAuth`-free service layer.

**Consequence.** The dependency graph stays acyclic and the file layout makes the intended direction obvious to the next contributor: services → hooks → pages → App, never backwards.

### 11. Server-derived vocabulary, not hard-coded option lists

**Problem.** Filter dropdowns (authors, publishers, categories) drift the moment someone adds a book through the API with a new value.

**Decision.** `GET /api/books/filters` computes the option lists with `Book.distinct(...)` over the live catalog, and the client caches them for 60 s.

**Consequence.** Dropdowns always reflect reality, including values added through direct API calls and the seed script; a single indexed-distinct call replaces maintenance of parallel constant arrays.

### 12. Analytics as aggregation pipelines, with the shape the chart needs

**Problem.** "Borrowing activity for the last 12 months" naïvely means 12 count queries, and months with zero activity silently vanish from the result  producing charts that lie about gaps.

**Decision.** `getBorrowingActivity` runs one `$match` + `$group` pipeline that buckets by `$year`/`$month` and uses `$cond` sums to compute borrowed and returned counts in the same pass; the service then **gap-fills** all 12 buckets server-side into `{ m, b, r }`. `getCategoryData` similarly uses `$lookup` into `books`, `$group` and `$project` to emit `{ n, v }` sorted descending. Field names are intentionally terse because they are consumed by chart components, not humans.

**Consequence.** One round trip per chart, deterministic 12-point series regardless of database contents, and the client simply renders what it receives,  no client-side date maths to get wrong.

### 13. Compound indexes chosen from the access patterns

**Problem.** Queue reads (`lowest pending position for a book`) and member reads (`my reservations by status`) are the two hottest reservation queries; without indexes, both are collection scans that grow with history.

**Decision.** Declare `{ bookId: 1, status: 1, position: 1 }` and `{ memberId: 1, status: 1 }` on the schema, matching the exact predicate order of those queries (including the sort on `position`).

**Consequence.** The "notify next in queue" operation, the most latency-visible action a librarian performs  stays an index hit even as the reservations collection grows.

### 14. Operability built in from day one

**Problem.** Deployed APIs become black boxes without request tracing, health probes, and a way to tell which build is running.

**Decision.** A hand-rolled middleware logs `METHOD URL STATUS durationMs` per request with ANSI-coloured status codes; `GET /api/v1/health` reports environment + timestamp (and therefore drives Vercel uptime checks or a status page); Mongo connection success/failure is logged with the host name; the schema-level `timestamps: true` on every model gives free `createdAt`/`updatedAt` for auditing.

**Consequence.** Every incident conversation starts with real evidence from the platform's log stream, the duration column alone exposes N+1 regressions, and the versioned health path leaves room to add `/api/v2` without breaking monitors.

### 15. Bounded, self-correcting pagination and sorting

**Problem.** Pagination bugs cluster in two places: a page number past the end returns empty screens ("where did my books go?"), and user-supplied `sortBy` opens the door to arbitrary field sorts.

**Decision.** Every list service computes `total`, derives `totalPages`, and **clamps** the requested page into `[1, totalPages]` before running the query (`safePage`), returning the clamped value so the UI can trust it. Sort fields pass through a whitelist (`title`, `author`, `year`, `createdAt`, `availableCopies`, `category`) with a silent fallback to `createdAt desc`.

**Consequence.** Deleting rows on the last page never yields a blank screen the client is told the effective page and there is no way to sort the library by an unindexed or unexpected field.

---

## Accessibility, responsiveness & UX foundations

The responsive behaviour is a set of **reusable foundations**, not per-page patches:

| Problem | Foundation |
|---|---|
| Mobile browser chrome (address bars) clips full-height layouts | `.app-shell` / `.app-screen` use `100dvh` with a `100vh` fallback, so the shell tracks the *visible* viewport |
| Wide data tables force the whole page to scroll sideways | `.table-scroll` gives tables their own contained horizontal scroller with `overscroll-behavior-x: contain` — a swipe at the end of the table can't trigger browser back-navigation |
| Long tab strips overflow on phones | `.tab-scroll` — swipeable, scrollbar hidden, same overscroll containment |
| iOS Safari auto-zooms when a sub-16px input is focused (leaving the user stranded zoomed-in) | A `max-width: 640px` media query forces form controls to `16px` — desktop typography is untouched |
| Modal/drawer overlays let the page behind scroll (especially on touch) and trap keyboard users | `useDialogA11y(active, onClose)` locks body scroll, compensates for the scrollbar gap so the layout doesn't jump, and closes on `Escape` |
| Screen readers on icon-only controls | `aria-label` on nav toggle, close buttons, notification bell (`"Notifications, 4 unread"`), search, and the `<aside aria-label="Main navigation">` landmark |
| Overlays must be announced as dialogs | Details drawers and confirm dialogs carry `role="dialog" aria-modal="true"` with labels |

Component-level details worth noting: status is never conveyed by colour alone (every badge pairs an icon with text — `BookMarked`, `BadgeCheck`, `AlertTriangle`, `Clock`), avatar fallbacks derive initials from the user's name, and the sidebar drawer is `invisible` (not just translated) when closed so unreachable controls stay out of the tab order.

## Performance notes

Measured from the last verified `npm run build`:

```
dist/index.html                          0.81 kB │ gzip:   0.45 kB
dist/assets/index-*.css                105.39 kB │ gzip:  17.41 kB
dist/assets/LoginPage-*.js               5.34 kB │ gzip:   1.98 kB
dist/assets/WelcomePage-*.js             5.73 kB │ gzip:   1.98 kB
dist/assets/RegisterPage-*.js            7.68 kB │ gzip:   2.35 kB
dist/assets/index-*.js                 826.80 kB │ gzip: 226.58 kB
(!) some chunks are larger than 500 kB after minification
```

What's already working in the project's favour:

- **Auth screens are code-split** (`React.lazy`), so anonymous visitors download only the shell plus one ~5 kB page.
- **Server state is cached, not refetched** — `staleTime` per domain (10–60 s) plus targeted invalidation means tab switches inside an SPA session are effectively free.
- **Charts are the heaviest dependency (Recharts)** and only mount on dashboards; combined with cached aggregate endpoints (one pipeline per chart), rendering is cheap after first load.
- **List endpoints page at the database level** (`skip`/`limit` + `countDocuments`) instead of shipping everything to the browser.
- **`.lean()`** is used on read-only queries (profile, member dashboard) to skip hydration overhead.
- **Deployment-side**: the SPA is served from Vercel's CDN, and the API is a serverless function with a warm connection cache, so steady-state latency is dominated by Atlas round trips.

**The obvious next win** is splitting the main chunk with `manualChunks` (or lazy-loading the dashboard/Recharts path) — the 826 kB warning is the build telling you exactly that. This is listed in the roadmap rather than hidden.

---

## Verification & QA checklist

### Automated / scriptable

| Check | Command | Expected |
|---|---|---|
| Client production build | `cd client && npm run build` | `vite v6.3.5 building for production…`, `✓ built in ~50s`, output in `client/dist/` |
| API health | `curl http://localhost:5000/api/v1/health` | `{ "success": true, "data": { "environment": "development", "timestamp": … } }` |
| Auth round-trip | `curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"librarian@unilib.edu\",\"password\":\"Library123\"}"` | `200` with `{ message, user, token }` |
| Auth is enforced | `curl http://localhost:5000/api/books` | `401 { "error": "Authentication required. No token provided." }` |
| Role gate works | Call `POST /api/books` with a Member token | `403` listing `requiredRoles` and `yourRole` |
| Seed loads | `cd server && npm run seed` | `Inserted 10 books … 12 members … 15 borrow records … 4 users` + credential printout |

### Manual walkthrough (the flows that exercise the interesting logic)

1. **Session boot** — log in, reload the page: the spinner appears, `/auth/me` resolves, and you land back on the dashboard without re-entering credentials. Then corrupt `localStorage.unilib_token` and reload: you are ejected to Welcome (not a blank dashboard).
2. **Copy accounting** — as Librarian, note a book's `availableCopies`; as Member, borrow it from the catalog; confirm the counter decrements, `status` flips to `low-stock`/`checked-out` at the thresholds, and the member dashboard shows the loan.
3. **Rule enforcement from outside the UI** — `POST /api/borrowing/self` for a book the member already holds → `400 "This member already has an active borrow for this book."`; `POST /api/reservations/self` for a book with copies → `400 "This book is currently available — please borrow it instead."`
4. **Returns ledger** — return a loan with condition `good` (copy count rises) and another with `lost` (total copies drop by 1); verify Return Management stats and Return History both reflect it.
5. **Reservation queue** — with all copies out, create two reservations from different members, confirm `position` 1 then 2; approve → complete (copy decrements) and check that `expiringSoon` reflects a reservation whose `expiresAt` is inside 24 h.
6. **Ownership checks** — as a member, `PATCH /api/reservations/self/<someone-else's id>/cancel` → `403 "You can only cancel your own reservations."`
7. **Logout hygiene** — log in as Librarian, log out, log in as Member in the same tab: no librarian data flashes before the member view (cache was cleared).
8. **Mobile pass** — at ≤ 390 px width: drawer navigation opens/closes with `Escape` and backdrop tap, tables scroll internally without moving the page, form fields don't trigger iOS zoom.
9. **Avatar upload** — upload a JPEG > 2 MB (client rejects), then a valid image (preview → save → persists after reload); confirm the API accepts only `data:image/(jpeg|png|gif|webp);base64,` payloads.

---
## License

This project is licensed under the MIT License.

---
## Author 
**Muhammad Idris**

• GitHub: https://github.com/Yamuhammad01 <br>
• LinkedIn: https://www.linkedin.com/in/muhammad-idrisb2/ <br>
• Email: idrismuhd814@gmail.com <br>
• Live Demo: https://library-management-system-3tru.vercel.app/ <br>

---

