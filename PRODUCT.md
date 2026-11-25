# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Staff of private education centers (o'quv markazlari) in Uzbekistan: directors, administrators and front-desk managers. They run the center's day from this panel: enrolling students, building groups, marking attendance, taking payments and printing receipts, working leads, and messaging parents. They use it all day at a desk, and often on a phone. *(Inferred from the codebase; confirmed by the user's request for a professional admin panel for an education site.)*

## Product Purpose
Ilmify Edu is a multi-tenant management system for education centers. Each center's admins get one place for students, teachers, parents, groups, rooms, attendance (including teacher geolocation check-in), payments and receipts, CRM leads, SMS, Telegram bot messaging, reports, teacher salaries, and staff monitoring. Success means the daily operations run without spreadsheets.

## Operating Context
- Next.js 16 app (`admin-page/`) talking to a NestJS backend (`NEXT_PUBLIC_API_URL`, `localhost:4000` in development).
- Roles: `director` sees everything. Other admins see only the modules their `permissions` map allows (keys: dashboard, students, teachers, parents, groups, attendance, rooms, payments, crm, notifications, telegram, reports, admins, monitoring).
- Each center has a name, a logo (`/uploads/centers/<logo>`), a balance, and a tariff or trial with an end date shown to staff.
- There are real-time notifications over a socket and receipt printing via a printer agent.
- The UI language is Uzbek (Latin script).

## Capabilities and Constraints
- Over 60 routes. Business logic and API calls must not change in a visual redesign.
- Pages are built from Tailwind utility classes (gray/white/blue palette) plus shadcn/Radix primitives in `components/ui`.
- The light/dark theme is handled by `next-themes` (class strategy).

## Brand Commitments
- Name: "Ilmify Edu". Each center's own logo and name lead the shell.
- Blue is the incumbent brand accent.
- Visual direction pinned by the user (2026-11-25): "professional, Apple liquid glass effect" for the admin shell and pages.

## Evidence on Hand
- `public/logo.jpg`, `app/icon.svg`, and center logos served by the backend.
- All data is live from the backend. No demo data may be shipped in production views.
