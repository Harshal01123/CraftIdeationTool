# CraftConnect

**CraftConnect** is a full-stack digital heritage platform designed to revitalise India's local handicraft sector, aligned with the "Vocal for Local" initiative. It bridges the gap between master artisans and modern customers/learners through a rich **Marketplace**, **Educational Ecosystem**, and **Real-Time Communication** layer.

## Overview

The platform serves three distinct user roles:

| Role | Description |
|------|-------------|
| **Artisan** | Lists products, creates masterclass courses, manages orders, and chats with customers. |
| **Customer** | Discovers and purchases authentic handcrafted goods, rates artisans and products. |
| **Learner** | Enrols in artisan-led masterclasses, tracks progress, earns certificates. |

## System Architecture

The application is built as a **React + TypeScript SPA** backed entirely by **Supabase** (Auth, Postgres database, Realtime, Storage).

```
CraftConnect/          ← Vite + React + TypeScript frontend
supabase/              ← Database migrations & edge functions (if any)
```

## Core Features

### 🛒 Marketplace
- Browse authentic handcrafted products with multi-image galleries
- Filter by **craft category** (dropdown) and **price range** (slider)
- Wishlist, product detail pages, and artisan portfolio views
- Offer/bargaining flow via integrated chat

### 🎓 Educational Platform
- Artisan-created video masterclasses (YouTube or native MP4)
- Enrolment, per-video progress tracking, and streaks
- Completion certificates with unique codes

### 💬 Real-Time Chat
- Artisan ↔ Customer conversations with `OPEN` / `CLOSED` lifecycle
- Offer messages (make, accept, reject, counter)
- Supabase Realtime subscriptions for instant delivery
- System-generated audit messages

### 🔔 Notifications
- Global bell icon with unread badge
- Notifies on new messages, new conversations, and conversation closure

### 🌐 Bilingual UI
- Full **English / हिंदी** support via `react-i18next`
- Animated language switcher in the dashboard header

### 🗂️ Craft Industry Categories
17 heritage craft categories including Bamboo Craft, Bell Metal / Dhokra, Kosa Silk, Pottery & Terracotta, Wood Carving, Wrought Iron / Loha Shilp, and more.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Routing | React Router v6 |
| Backend / DB | Supabase (Postgres + Auth + Realtime + Storage) |
| Styling | CSS Modules + CSS custom properties |
| Animations | Framer Motion |
| Maps | React Leaflet (location picker) |
| i18n | i18next + react-i18next |
| Sidebar Toggle | hamburger-react |

## Getting Started

```bash
cd CraftConnect
npm install
```

Create a `.env` file:

```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
```

## Database

The full schema is documented in [`CraftConnect/README.md`](CraftConnect/README.md). Key tables:

- `profiles` — users (artisan / customer / learner)
- `products` — marketplace listings with multi-image support
- `courses` + `course_enrollments` + `course_video_progress` — education layer
- `conversations` + `messages` — chat system
- `purchases` — order lifecycle
- `wishlists`, `artisan_ratings`, `product_ratings`, `certificates`

## Project Status

✅ All core features implemented and live.
