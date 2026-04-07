# CraftConnect – Frontend

A **React + TypeScript** SPA that powers the CraftConnect heritage platform. Built with Vite, backed by Supabase, and styled with CSS Modules and a custom design token system.

---

## Tech Stack

| | |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 7 (`npm run dev` / `npm run build`) |
| **Routing** | React Router v6 (nested layout routes) |
| **Backend** | Supabase (Auth · Postgres · Realtime · Storage) |
| **Styling** | CSS Modules + CSS custom properties design system |
| **Animations** | Framer Motion |
| **Maps** | Leaflet + React-Leaflet |
| **i18n** | i18next + react-i18next (EN / HI) |
| **Sidebar** | hamburger-react |

---

## Environment Setup

Create `.env` in this directory:

```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm install
npm run dev
```

---

## Project Structure

```
src/
├── App.tsx                    # Root router — public & protected routes
├── i18n.ts                    # i18next configuration
├── main.tsx
│
├── constants/
│   └── industryOptions.ts     # 17 heritage craft categories (single source of truth)
│
├── contexts/                  # React contexts (e.g. notifications)
│
├── hooks/
│   ├── useAuth.ts             # Supabase auth session + profile
│   ├── useChat.ts             # Real-time chat subscriptions
│   └── useWishlist.tsx        # Wishlist state management
│
├── lib/
│   └── supabase.ts            # Supabase client initialisation
│
├── locales/
│   ├── en.json                # English translations
│   └── hi.json                # Hindi translations
│
├── types/
│   └── chat.ts                # Shared TypeScript interfaces
│
├── layouts/
│   └── DashboardLayout.tsx    # Collapsible sidebar + header shell
│
├── pages/
│   ├── Home.tsx               # Public landing page
│   ├── Login.tsx
│   ├── Signup.tsx             # Multi-step signup (auth → verify → profile)
│   ├── ArtisanPortfolio.tsx   # Public artisan profile page
│   ├── ProductPortfolio.tsx   # Public product detail page
│   └── dashboard/
│       ├── Dashboard.tsx      # Role-routing entry (artisan/customer/learner)
│       ├── ArtisanDashboard.tsx
│       ├── CustomerDashboard.tsx
│       ├── LearnerDashboard.tsx
│       ├── Products.tsx       # Marketplace with top filter bar (category + price)
│       ├── MyProducts.tsx     # Artisan product management
│       ├── Courses.tsx        # Masterclass browser
│       ├── MyCourses.tsx      # Learner enrolled courses
│       ├── CoursePortfolio.tsx# Course detail + video player + enrolment
│       ├── Artisans.tsx       # Artisan directory with search & filters
│       ├── Messages.tsx       # Chat shell
│       ├── Notifications.tsx  # Notification centre
│       ├── Certificates.tsx   # Learner certificates
│       └── EditProfile.tsx    # Profile & password settings
│
└── components/
    ├── ProtectedRoute.tsx     # Redirects unauthenticated users to /login
    ├── ScrollToTop.tsx        # Resets scroll on route change
    ├── Spinner.tsx            # Loading indicator
    ├── LanguageSwitcher.tsx   # Animated EN/HI toggle
    ├── LocationPickerModal.tsx# Leaflet map picker for artisan location
    │
    ├── chat/
    │   ├── ChatSidebar.tsx        # Conversation list
    │   ├── ChatWindow.tsx         # Message thread + offer handling
    │   ├── ChatInput.tsx          # Message composer
    │   ├── MessageBubble.tsx      # Single message UI
    │   ├── ClosedChatBanner.tsx   # Read-only banner for closed chats
    │   ├── NewChatDialog.tsx      # Start a new conversation flow
    │   ├── OfferFlowCoordinator.tsx # Offer initiation wizard
    │   ├── OfferCard.tsx          # Rendered offer message
    │   ├── PriceSetDialog.tsx     # Counter-offer price input
    │   └── ArtisanProductPicker.tsx # Select product for offer
    │
    ├── products/
    │   ├── ProductCard.tsx        # Marketplace product tile
    │   └── AddProductModal.tsx    # Add / edit product modal
    │
    ├── courses/                   # Course-related components
    ├── artisans/                  # Artisan card components
    └── ratings/                   # Star rating components
```

---

## Routing

```
/                          → Home (public)
/login                     → Login
/signup                    → Signup (multi-step)
/dashboard                 → Role-based dashboard (protected)
/dashboard/products        → Marketplace
/dashboard/courses         → Masterclasses
/dashboard/artisans        → Artisan directory
/dashboard/messages        → Real-time chat
/dashboard/notifications   → Notification centre
/dashboard/my-products     → Artisan product management
/dashboard/my-courses      → Learner enrolled courses
/dashboard/certificates    → Learner certificates
/dashboard/edit-profile    → Profile settings
/artisan/:id               → Public artisan portfolio
/product/:id               → Public product detail
```

---

## Authentication (Supabase Auth)

- **Signup**: 3-step flow — credentials → email verification → profile completion (name, avatar, role, artisan extras)
- **Login**: `supabase.auth.signInWithPassword()` with Enter-key submit
- **Logout**: `supabase.auth.signOut()` → redirects to `/login`
- **Protected routes**: `<ProtectedRoute>` wraps all `/dashboard/*` routes
- **Auto-profile**: Postgres trigger creates a `profiles` row on new user signup

---

## Craft Industry Categories

Defined in `src/constants/industryOptions.ts` — single source of truth used across signup, product modal, course creation, and the marketplace filter:

```
Bamboo Craft · Bell Metal / Dhokra · Cowrie & Shell Craft
Godna / Tattoo Art · Gourd (Tuma) Craft · Handloom & Weaving
Jewellery & Ornaments · Kosa Silk · Leather Craft
Painting & Folk Art · Pottery & Terracotta · Stone Carving
Textile Printing · Tiles & Mosaic · Wood Carving
Wrought Iron / Loha Shilp · Other
```

---

## Real-Time Chat System

Built on **Supabase Realtime**:

- `OPEN` / `CLOSED` conversation lifecycle — closed chats become read-only archives
- Message types: `TEXT` · `SYSTEM` · `OFFER`
- Offer flow: initiate → counter → accept / reject / withdraw
- System-generated audit messages (e.g. "Conversation closed by Rahul")
- Auto-scroll to latest message on new delivery

---

## Internationalisation

- **Languages**: English (`en`) and Hindi (`hi`)
- Translations in `src/locales/en.json` and `src/locales/hi.json`
- Animated `<LanguageSwitcher>` in the dashboard header
- Industry category names fully translated in the `"industry"` namespace

---

## Database Schema (Supabase Postgres)

Key tables:

| Table | Purpose |
|-------|---------|
| `profiles` | Users — role: `artisan` / `customer` / `learner` |
| `products` | Marketplace listings (multi-image, category, price) |
| `courses` | Artisan-created video courses |
| `course_enrollments` | Learner enrolments |
| `course_video_progress` | Per-video completion tracking |
| `course_completions` | Full course completion records |
| `certificates` | Issued on course completion (unique code) |
| `learning_streaks` | Daily watch streak per user |
| `conversations` | Chat threads (artisan ↔ customer) |
| `messages` | Individual messages within a conversation |
| `purchases` | Order lifecycle (pending → confirmed) |
| `wishlists` | User product wishlists |
| `artisan_ratings` | Star ratings for artisans |
| `product_ratings` | Star ratings for products |
| `notifications` | In-app notification records |
