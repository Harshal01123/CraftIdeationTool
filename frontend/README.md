
# Craft Ideation Tool – Frontend

This repository contains the **frontend** of the *Craft Ideation Tool*, a learning and discovery platform focused on traditional crafts.
The application is built using **React + TypeScript** and follows **industry-standard layout, routing, and component design patterns**.

---

## 🚀 What has been implemented so far

### 1. Dashboard-based layout system

The application uses a **persistent dashboard layout** where:

* The **header** and **sidebar** remain constant
* Only the **main content area** changes when navigating between sections

This is achieved using **nested routing with React Router**.

---

### 2. Nested routing with shared layout

The dashboard is implemented as a **layout route**:

```
/dashboard
/dashboard/products
/dashboard/courses
/dashboard/craftsmen
/dashboard/notifications
```

* `DashboardLayout` contains:

  * Header (user info, actions)
  * Sidebar navigation
  * `<Outlet />` for rendering page-specific content
* Each section (Products, Courses, Craftsmen, Notifications) is a **child route**
* Navigation updates the URL **without reloading the page**

This ensures:

* Better performance
* Clean URL structure
* Predictable UI behavior

---

### 3. Clear separation of concerns

The codebase is organized into three main concepts:

#### Layouts

Responsible for **page structure** (header, sidebar, main area)

```
src/layouts/
  DashboardLayout.tsx
```

#### Pages

Route-level components that represent **screens**

```
src/pages/
  Dashboard.tsx
  Courses.tsx
  Products.tsx
  Craftsmen.tsx
  Notifications.tsx
```

Pages do **not** contain layout code.

#### Components

Reusable UI building blocks

```
src/components/
  Button.tsx
  courses/
    CourseCard.tsx
    CourseCategory.tsx
```

This structure makes the app:

* Easier to scale
* Easier to refactor
* Easier to reason about

---

### 4. Reusable UI components

#### Button component

A **minimal, reusable Button component** was created to avoid repeated `<button>` logic and styling across the app.

* Centralized styling
* Minimal props
* No over-engineering
* Easy to extend later if needed

#### Course components

The Courses page was refactored into reusable components:

* `CourseCard` – displays a single course/video
* `CourseCategory` – groups related courses under a category

This removed duplication and made the Courses page data-driven.

---

### 5. Courses page with categorized content

The Courses section now displays **multiple categories**, each containing a grid of **dummy course videos**:

* Pottery videos
* Bamboo making videos
* Glass decorating videos
* Painting videos

Each category:

* Has its own heading
* Displays courses as cards
* Is rendered using reusable components

---

### 6. CSS modularization and layout stability

* CSS is split logically between **layout styles** and **page-specific styles**
* Flexbox and Grid are used appropriately
* Layout refactoring exposed and fixed hidden height dependencies
* Styling decisions were made to support future responsiveness

---

### 7. SPA navigation behavior

All navigation inside the dashboard:

* Uses React Router (`Link`, `navigate`)
* Avoids full page reloads
* Preserves layout state

Absolute and relative paths are used intentionally:

* **Relative paths** for nested dashboard navigation
* **Absolute paths** for global actions (login, notifications, logout)

---

## 🧠 Key concepts applied

* Single Page Application (SPA) architecture
* Nested routing with layouts
* Component reusability
* Minimal but scalable abstractions
* Clean separation between structure, logic, and styling
* TypeScript for safety and maintainability

---

## 🛠️ Tech stack

* React
* TypeScript
* React Router
* CSS Modules
* Vite

---

## 📌 Current status

The frontend currently focuses on:

* Layout structure
* Navigation flow
* UI consistency
* Component architecture

Backend integration, authentication logic, and real data fetching are planned for later stages.

---

## 🔮 Next possible steps

* Make dashboard routes protected (auth-based)
* Fetch real course data from an API
* Improve responsiveness for smaller screens
* Add active navigation states
* Introduce role-based dashboards (learner / craftsman)

---

## ✨ Summary

This project is being built with a strong emphasis on **correct architecture**, **clean routing**, and **maintainable UI patterns**, ensuring that it can scale smoothly as features are added.

---

