# MENUZAI — Antigravity Development Handover Package

---

## 1️⃣ Objective

Transform the Stitch-designed UI for MENUZAI into a fully functional, production-ready SaaS platform with responsive web pages, dynamic menu handling, QR integration, WhatsApp ordering, templates archive, analytics, and admin functionalities.

---

## 2️⃣ Provided Assets

- HTML files of the designed UI (desktop + mobile)
- Screenshots of each screen and flow (for reference)
- Optional: Figma design notes or Stitch AI metadata

---

## 3️⃣ Platform Scope

**Web App Type:** Progressive Web App (PWA), mobile-first design

**Key Features:**

1. **Menu Management**
   - Upload PDF / Image / Text menus → Parse automatically
   - Edit categories, items, prices, highlights (Most Popular / Chef’s Choice)
   - Drag & drop layout in Menu Editor
   - Save & Publish menu
   - Export menu as PDF or QR-code-enabled link

2. **Customer Flow**
   - QR scan → Mobile menu page
   - Add items to cart → Sticky floating cart
   - View order summary → Optional inputs: Name, Table
   - Order via WhatsApp → Prefilled message

3. **Templates Archive & Selection**
   - Browse Free / Premium templates
   - Filter, search, preview templates
   - Select template → Pre-populate Menu Editor

4. **Analytics Dashboard**
   - Most ordered dishes, revenue insights, category performance
   - Graphs & tables (interactive, real-time data display)

5. **Admin / Settings**
   - Manage templates, menu items, QR codes
   - Update restaurant info and hours

---

## 4️⃣ Technical Requirements

- **Frontend:** React.js / Next.js (mobile-first, responsive)
- **State Management:** Redux or Context API for cart & menu state
- **Styling:** TailwindCSS or styled-components matching UI screenshots
- **Routing:** React Router / Next.js routing for pages
- **Backend (optional):** Node.js + Express or Firebase for data storage
- **Database:** Firestore / Supabase / PostgreSQL for menus, templates, analytics
- **QR Codes:** Auto-generate per menu, downloadable PNG
- **WhatsApp Integration:** Prefilled message links using `https://wa.me/{phone}?text={encoded_message}`
- **Export Options:** PDF generation for menus
- **Analytics:** Chart.js / Recharts for visual reports

---

## 5️⃣ Interactions & Behavior

- Menu items dynamically added to cart
- Floating sticky cart updates live
- Template selection pre-populates editor
- Inline edit updates reflected in live preview
- Smooth transitions & animations matching Stitch UI
- Mobile-first UX, PWA-ready
- WhatsApp CTA opens app/web with prefilled order message

---

## 6️⃣ Deliverables

1. Fully functional MENUZAI web app
2. Responsive layouts (desktop + mobile)
3. QR-code menu links generation
4. WhatsApp order integration
5. Admin dashboard for menu management and analytics
6. Exportable menus (PDF & QR)
7. Template archive and selection flow

---

## 7️⃣ Instructions for Google Antigravity

- Use the attached HTML and screenshots as the authoritative design reference
- Map all interactive behaviors exactly as defined in Stitch UI
- Produce production-ready code with clean folder structure
- Provide reusable React components, styled according to design
- Document deployment instructions and configuration
- Ensure the app is mobile-first, PWA-ready, and scalable for SaaS

---

