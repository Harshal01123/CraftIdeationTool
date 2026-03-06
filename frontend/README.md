# Craft Ideation Tool – Frontend

The **Craft Ideation Tool** is a modern **learning and discovery platform for traditional crafts**, designed with scalability, clean architecture, and maintainable UI patterns in mind.

This repository contains the **frontend** implementation, built using **React + TypeScript**, following **industry-standard layout, routing, and component design principles**.

---

## Overview

The application is structured around a **dashboard-based Single Page Application (SPA)** architecture where:

- Core UI elements (header and sidebar) remain persistent
- Only the main content area updates during navigation
- Routes are clean, predictable, and scalable

The current focus is on **frontend architecture, routing, and UI consistency**, with backend and authentication planned for later stages.

---

## Architecture Highlights

### 1. Dashboard Layout System

The app uses a **persistent dashboard layout**:

- Header and sidebar are always visible
- Page content is rendered dynamically using nested routes
- Layout state is preserved across navigation

This is implemented using **React Router layout routes** and `<Outlet />`.

---

### 2. Nested Routing Structure

Routes follow a clean and extensible hierarchy:

```
/dashboard
/dashboard/products
/dashboard/courses
/dashboard/craftsmen
/dashboard/notifications
```

- `DashboardLayout` acts as the shared layout wrapper
- Each section is rendered as a **child route**
- Navigation updates the URL without triggering page reloads

**Benefits:**

- Better performance
- Clear mental model
- Predictable UI behavior

---

### 3. Clear Separation of Concerns

The codebase is intentionally divided into **Layouts**, **Pages**, and **Components**.

#### Layouts

Responsible only for structure (no business logic):

```
src/layouts/
  DashboardLayout.tsx
```

#### Pages

Route-level components representing full screens:

```
src/pages/
  Dashboard.tsx
  Courses.tsx
  Products.tsx
  Craftsmen.tsx
  Notifications.tsx
```

Pages do **not** include layout markup.

#### Components

Reusable UI building blocks:

```
src/components/
  Button.tsx
  courses/
    CourseCard.tsx
    CourseCategory.tsx
```

This structure keeps the app:

- Scalable
- Easy to refactor
- Easy to reason about

---

### 4. Reusable UI Components

#### Button Component

A centralized, reusable `Button` component was introduced to:

- Avoid repeated `<button>` markup
- Centralize styling
- Keep props minimal and flexible
- Enable easy future extension

#### Course Components

The Courses page is fully **data-driven**, composed of:

- `CourseCard` – represents a single course/video
- `CourseCategory` – groups related courses under a category

This removes duplication and improves maintainability.

---

### 5. Courses Page with Categorized Content

The Courses section currently displays **multiple craft categories**, each rendered using reusable components:

- Pottery videos
- Bamboo making videos
- Glass decorating videos
- Painting videos

Each category:

- Has a clear heading
- Displays courses in a grid layout
- Uses dummy data (API integration planned later)

---

### 6. Styling & Layout Stability

- CSS Modules are used for scoped, maintainable styles
- Layout and page styles are logically separated
- Flexbox and CSS Grid are used where appropriate
- Height and layout dependencies were identified and fixed during refactoring
- The structure supports future responsiveness improvements

---

### 7. SPA Navigation Behavior

All internal navigation:

- Uses React Router (`Link`, `navigate`)
- Avoids full page reloads
- Preserves dashboard layout state

Routing strategy:

- **Relative paths** for dashboard navigation
- **Absolute paths** for global actions (login, logout, notifications)

---

## Concepts Applied

- Single Page Application (SPA) architecture
- Nested routing with shared layouts
- Component reusability
- Clean separation of structure, logic, and styling
- Minimal but scalable abstractions
- TypeScript for safety and maintainability

---

## Tech Stack

- React
- TypeScript
- React Router
- CSS Modules
- Vite

---

## Real-Time Chat System (New Feature)

The platform now includes a robust, real-time messaging system built with Supabase:

- **Real-Time Messaging**: Instant delivery and synchronization of messages without page refreshes using Supabase Realtime subscriptions.
- **Role-Based Interaction**: Supports specialized `artisan` and `customer` roles.
- **Strict Conversation Lifecycle**: Conversations operate in `OPEN` or `CLOSED` states. Once closed, the chat becomes a read-only historical vault to preserve order agreements, with UI gracefully converting to a closed state banner.
- **System Messages**: Automatically generates non-user messages (e.g. "Conversation closed by John") for clear audit trails.
- **Smart Auto-Scroll**: The chat window automatically pins to the latest messages when new ones arrive or are sent by the user over persistent WebSocket channels.

## 🔐 Authentication (Supabase Auth)

Full authentication flow using Supabase Auth with auto-profile creation.

### Signup

- Collects **Full Name**, **Email**, **Password**, and **User Type** (Craftsman, Learner, Customer).
- Calls `supabase.auth.signUp()` — user is created in Supabase Auth and automatically logged in (no email confirmation required).
- A `profiles` row is auto-created via a PostgreSQL trigger reading `raw_user_meta_data`.
- Craftsman role maps to `artisan` in the database.
- On success → redirects to `/dashboard/messages`.

### Login

- Calls `supabase.auth.signInWithPassword()`.
- Supports **Enter key** to submit on both fields.
- Already logged-in users are auto-redirected to `/dashboard/messages` (no login page shown).
- Displays inline error messages on failure.

### Logout

- Calls `supabase.auth.signOut()` from the Dashboard header.
- Clears session and immediately redirects to `/login`.

### Protected Routes

- All `/dashboard/*` routes are wrapped in a `ProtectedRoute` component.
- Unauthenticated users who try to access dashboard URLs are automatically redirected to `/login`.
- No flash of protected content while session is being checked.

### Live User Info in Header

- Dashboard header shows the **real logged-in user's name and role** fetched from the `profiles` table (replaces hardcoded "John Doe / Learner").

---

### Chat File Structure

The chat functionality introduces new hooks and components seamlessly integrated into the existing architecture:

```text
src/
├── components/
│   ├── ProtectedRoutes.tsx     # Restricts access to authenticated usersuseAuth
│   │
│   └── chat/
│       ├── ChatSidebar.tsx     # Displays list of conversations or contacts
│       ├── ChatWindow.tsx      # Main chat container that orchestrates messages and input
│       ├── MessageBubble.tsx   # UI component for rendering a single chat message
│       ├── ChatInput.tsx       # Message input box and send button
│       └── ClosedChatBanner.tsx# Banner shown when a chat is closed or read-only
│
├── hooks/
│   ├── useAuth.ts              # Handles Supabase authentication and session state
│   └── useChat.ts              # Custom hook for real-time chat using WebSocket/Supabase realtime
│
├── lib/
│   └── supabase.ts             # Initializes and exports Supabase client instance
│
└── types/
    └── chat.ts                 # TypeScript interfaces/types for chat database schema
```

### Environment Setup

Create a `.env` file at the root of the `frontend` directory and add your Supabase credentials found under your project's **Settings → API**:

```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-auto-generated-anon-key
```

### Chat Database Implementation (Supabase SQL)

To replicate the real-time chat backend, add the following table manually or run the following SQL block in your Supabase SQL Editor:

```sql
-- 1. PROFILES TABLE (synced with Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'artisan', 'learner')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CONVERSATIONS TABLE
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artisan_id UUID NOT NULL REFERENCES public.profiles(id),
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  closed_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MESSAGES TABLE
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id),
  sender_id UUID REFERENCES public.profiles(id),
  sender_role TEXT CHECK (sender_role IN ('customer', 'artisan', 'system')),
  type TEXT NOT NULL DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'SYSTEM')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR PROFILES
CREATE POLICY "Profiles viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. RLS POLICIES FOR CONVERSATIONS
CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = artisan_id OR auth.uid() = customer_id);
CREATE POLICY "Participants can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = artisan_id OR auth.uid() = customer_id);
CREATE POLICY "Participants can update conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = artisan_id OR auth.uid() = customer_id);

-- 7. RLS POLICIES FOR MESSAGES
CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND (c.artisan_id = auth.uid() OR c.customer_id = auth.uid())
    )
  );
CREATE POLICY "Participants can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.artisan_id = auth.uid() OR c.customer_id = auth.uid()) AND c.status = 'OPEN'
    )
  );

-- 8. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    COALESCE(new.raw_user_meta_data->>'role', 'learner')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
```

---

## Current Status

The frontend currently focuses on:

- Application layout structure
- Navigation flow
- UI consistency
- Scalable component architecture
- Real time chatbox (Prototype)

Backend integration, authentication and real data fetching are **intentionally deferred** to later stages.

---

## Planned Improvements

- API-driven course and product data
- Responsive design for smaller screens
- Active navigation states
- Role-based dashboards (learner / craftsman)

---

## Summary

This frontend is being built with a strong emphasis on **correct architecture, clean routing, and maintainable UI patterns**.
The foundation is intentionally solid, allowing new features to be added without architectural rewrites.

---
