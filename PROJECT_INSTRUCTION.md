Use this. Clean, direct, structured for AI analysis before project generation.

---

## README — System Instruction (Pre-Build Analysis)

### 1. Objective

Build a modern, responsive web app with **non-static UI** using motion and 3D interaction.
The system must prioritize **clean architecture**, **performance**, **mobile usability**, and **maintainable component design** before implementation.

---

### 2. Tech Constraints (Strict)

* Framework: **Next.js (App Router) + TypeScript**
* UI Library: **MUI only** (no Tailwind, no mixed styling systems)
* Animation Stack (allowed only):

  * **Framer Motion** → UI transitions + micro-interactions
  * **Three.js / WebGL** → immersive hero/background animation
* Architecture Rules:

  * Max **200 lines per file**
  * Split into small components if exceeded
  * High cohesion, low coupling
  * Reusable and scalable structure

---

### 3. Design Direction

#### Theme Requirements

* Avoid AI-style purple/neon gradients
* Use calm, premium palette:

Example direction:

* Primary: Deep navy (#0F172A)
* Secondary: Slate (#1E293B)
* Accent: Gold (#F59E0B) or Cyan (#06B6D4)
* Background: Soft neutral (#F8FAFC)

Typography:

* Headings: modern geometric (Inter / Manrope)
* Body: clean readable sans-serif

Visual Style:

* Minimal
* Soft shadows
* Spacious layout
* Rounded corners (8–16px)

---

### 4. Motion Strategy

#### Framer Motion Usage

Use for:

* Page transitions
* Hover states
* Cards + button interactions
* Scroll reveals
* Micro feedback animations

Avoid:

* Heavy chained animations
* Layout shift issues

#### Three.js / WebGL Usage

Use ONLY for:

* Hero background
* Floating symbolic elements
* Particle systems
* Subtle ambient movement

Avoid:

* Full heavy scenes
* Blocking render performance

---

### 5. Responsive Design Rules

Priority: **mobile-first**

Guidelines:

* Strict spacing system using MUI theme spacing
* No random margins
* Use container max-widths properly
* Typography scaling via breakpoints

Mobile:

* Larger tap targets
* Simplified layouts
* Reduced motion intensity

---

### 6. Layout System

Use consistent structure:

* Hero
* Feature sections
* Interactive blocks
* CTA
* Footer

Spacing rhythm:

* Section gap: 64–96px desktop
* 40–56px tablet
* 32px mobile

---

### 7. Component Architecture

Follow layered separation:

Rules:

* Shared = reusable
* Modules = domain logic
* Layout = structural

No business logic inside UI components.

---

### 8. Performance Rules

Must optimize:

* Lazy load Three.js scene
* Reduce motion on low-end devices
* Avoid unnecessary re-renders
* Memoize heavy components

---

### 9. Accessibility Rules

Must ensure:

* Contrast compliance
* Keyboard navigation
* Focus visibility
* Reduced motion preference support

---

### 10. Deliverable Expectation (for AI)

Before coding, AI must:

1. Analyze animation scope
2. Propose structure
3. Define theme
4. Outline components
5. Plan responsiveness
---