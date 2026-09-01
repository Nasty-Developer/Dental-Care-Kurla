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

- `artifacts/dental-care/src/App.tsx` — treatment catalogue, pricing states, responsive interactions, and five-step appointment flow
- `artifacts/dental-care/src/index.css` — blue visual system, compact responsive layout, booking states, motion, and accessibility styles
- `artifacts/dental-care/public/clinic-atrium.png` — generated clinic interior visual used in the hero
- `artifacts/api-server/src/routes/appointments.ts` — appointment request endpoint and validation
- `lib/api-spec/openapi.yaml` — source of truth for the appointment request contract

## Architecture decisions

- The public site is a single-page experience with anchored navigation so the booking CTA remains close to every key decision point.
- Appointment submissions are modeled as pending requests, not confirmations; the UI and API both make the follow-up step explicit.
- Treatment prices and availability are configuration-driven; the current catalogue contains all 46 supplied Dental Care rate-sheet entries and prices in one source.
- Clinic contact details, map URL, doctors, and testimonials are centralized as editable configuration and intentionally default to empty when not provided.

## Product

Visitors can browse and search treatments, filter by category, inspect details, understand duration and pricing states, choose a preferred date/time, review an appointment summary, submit a pending appointment request, see the exact clinic location, and review FAQs. The experience includes responsive navigation, mobile action bar, booking loading/error/success states, and a clinic request-desk availability indicator.

## User preferences

The clinic brief prioritizes a premium, blue-led healthcare identity, intentional motion, accessibility, and no fabricated contact details, doctors, or testimonials.

## Gotchas

- The generated API client expects the appointment mutation body shape `{ data: AppointmentRequestInput }`.
- Treatment catalogue values live in `treatmentConfig`; rate-sheet prices are shown exactly as supplied, while durations remain `As advised` because no durations were included in the rate sheet.
- Keep the exact address in `artifacts/dental-care/src/App.tsx` and the API response aligned with the supplied reference.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
