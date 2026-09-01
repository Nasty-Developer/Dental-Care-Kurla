# Dental Care Clinic Website

Premium, responsive Dental Care clinic website for appointment requests and patient information in Kurla East, Mumbai.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/dental-care/src/App.tsx` — clinic landing page, content configuration, responsive interactions, and appointment request UI
- `artifacts/dental-care/src/index.css` — visual tokens, responsive layout, motion, and accessibility styles
- `artifacts/dental-care/public/clinic-atrium.png` — generated clinic interior visual used in the hero
- `artifacts/api-server/src/routes/appointments.ts` — appointment request endpoint and validation
- `lib/api-spec/openapi.yaml` — source of truth for the appointment request contract

## Architecture decisions

- The public site is a single-page experience with anchored navigation so the booking CTA remains close to every key decision point.
- Appointment submissions are modeled as requests, not confirmations; the UI and API both use `request_received` to avoid making an unverified medical scheduling promise.
- Clinic contact details, map URL, doctors, and testimonials are centralized as editable configuration and intentionally default to empty when not provided.

## Product

Visitors can understand Dental Care's approach, explore care options, see the exact clinic location, review FAQs, and submit a preferred appointment request. The experience includes responsive navigation, mobile booking actions, request loading/error/success states, and a clinic request-desk availability indicator.

## User preferences

The clinic brief prioritizes a premium, blue-led healthcare identity, intentional motion, accessibility, and no fabricated contact details, doctors, or testimonials.

## Gotchas

- The generated API client expects the appointment mutation body shape `{ data: AppointmentRequestInput }`.
- Keep the exact address in `artifacts/dental-care/src/App.tsx` and the API response aligned with the supplied reference.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
