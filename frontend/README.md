# 🎨 Craft Ideation Tool – Frontend

The **Craft Ideation Tool** is a modern **learning and discovery platform for traditional crafts**, designed with scalability, clean architecture, and maintainable UI patterns in mind.

This repository contains the **frontend** implementation, built using **React + TypeScript**, following **industry-standard layout, routing, and component design principles**.

---

## 🚀 Overview

The application is structured around a **dashboard-based Single Page Application (SPA)** architecture where:

* Core UI elements (header and sidebar) remain persistent
* Only the main content area updates during navigation
* Routes are clean, predictable, and scalable

The current focus is on **frontend architecture, routing, and UI consistency**, with backend and authentication planned for later stages.

---

## 🧱 Architecture Highlights

### 1. Dashboard Layout System

The app uses a **persistent dashboard layout**:

* Header and sidebar are always visible
* Page content is rendered dynamically using nested routes
* Layout state is preserved across navigation

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

* `DashboardLayout` acts as the shared layout wrapper
* Each section is rendered as a **child route**
* Navigation updates the URL without triggering page reloads

**Benefits:**

* Better performance
* Clear mental model
* Predictable UI behavior

---

### 3. Clear Separation of Concerns

The codebase is intentionally divided into **Layouts**, **Pages**, and **Components**.

#### 📐 Layouts

Responsible only for structure (no business logic):

```
src/layouts/
  DashboardLayout.tsx
```

#### 📄 Pages

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

#### 🧩 Components

Reusable UI building blocks:

```
src/components/
  Button.tsx
  courses/
    CourseCard.tsx
    CourseCategory.tsx
```

This structure keeps the app:

* Scalable
* Easy to refactor
* Easy to reason about

---

### 4. Reusable UI Components

#### Button Component

A centralized, reusable `Button` component was introduced to:

* Avoid repeated `<button>` markup
* Centralize styling
* Keep props minimal and flexible
* Enable easy future extension

#### Course Components

The Courses page is fully **data-driven**, composed of:

* `CourseCard` – represents a single course/video
* `CourseCategory` – groups related courses under a category

This removes duplication and improves maintainability.

---

### 5. Courses Page with Categorized Content

The Courses section currently displays **multiple craft categories**, each rendered using reusable components:

* Pottery videos
* Bamboo making videos
* Glass decorating videos
* Painting videos

Each category:

* Has a clear heading
* Displays courses in a grid layout
* Uses dummy data (API integration planned later)

---

### 6. Styling & Layout Stability

* CSS Modules are used for scoped, maintainable styles
* Layout and page styles are logically separated
* Flexbox and CSS Grid are used where appropriate
* Height and layout dependencies were identified and fixed during refactoring
* The structure supports future responsiveness improvements

---

### 7. SPA Navigation Behavior

All internal navigation:

* Uses React Router (`Link`, `navigate`)
* Avoids full page reloads
* Preserves dashboard layout state

Routing strategy:

* **Relative paths** for dashboard navigation
* **Absolute paths** for global actions (login, logout, notifications)

---

## 🧠 Concepts Applied

* Single Page Application (SPA) architecture
* Nested routing with shared layouts
* Component reusability
* Clean separation of structure, logic, and styling
* Minimal but scalable abstractions
* TypeScript for safety and maintainability

---

## 🛠️ Tech Stack

* React
* TypeScript
* React Router
* CSS Modules
* Vite

---

## 📌 Current Status

The frontend currently focuses on:

* Application layout structure
* Navigation flow
* UI consistency
* Scalable component architecture

Backend integration, authentication, and real data fetching are **intentionally deferred** to later stages.

---

## 🔮 Planned Improvements

* Protected dashboard routes (authentication)
* API-driven course and product data
* Responsive design for smaller screens
* Active navigation states
* Role-based dashboards (learner / craftsman)

---

## ✨ Summary

This frontend is being built with a strong emphasis on **correct architecture, clean routing, and maintainable UI patterns**.
The foundation is intentionally solid, allowing new features to be added without architectural rewrites.

---


