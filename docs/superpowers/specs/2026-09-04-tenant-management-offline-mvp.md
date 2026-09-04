# Havenly Offline MVP Specification

## Product intent

Havenly Property Desk is an Android-first app for a single owner or landlord to manage properties, units, tenants, agreements, charges, payments, maintenance, documents, and simple reports from one device.

## Current starting point

The project is an Expo Router and TypeScript application. `app/index.tsx` is a polished demonstration screen with seeded in-memory data. It demonstrates the intended owner experience but does not persist edits, create entities, store documents, generate bills, or send notifications.

## First-release goal

Deliver a usable offline-first owner workspace. A landlord can create and edit a property, create units, allot a unit to a tenant, track a tenant agreement, generate and settle recurring charges, retain local document records, log maintenance, and review balances after closing and reopening the app.

## Users and access

| User | First-release access |
| --- | --- |
| Owner | Full local workspace access |
| Tenant | Demo-only sign-in message; no tenant portal in the first release |

The owner demo account is `owner@demo.com` with password `owner123`. The tenant demo account is `tenant@demo.com` with password `tenant123`.

## Required first-release capabilities

### Property and unit management

- Create, edit, archive, and list properties.
- Create, edit, archive, and list flats, rooms, shops, and offices within a property.
- Record unit type, default rent, and status: `vacant`, `occupied`, or `maintenance`.
- Prevent allotting an occupied or archived unit to a second active tenant.

### Tenant and agreement management

- Create, edit, archive, and list tenant profiles.
- Store phone number, emergency contact, unit assignment, tenancy start/end dates, deposit amount, and agreed rent.
- Create one active agreement per occupied unit and retain expired agreement metadata.
- End an agreement by assigning an end date and return its unit to `vacant`.

### Charges, recurring billing, payments, and receipts

- Configure monthly recurring templates for rent, electricity, maintenance, and custom charges.
- Generate at most one charge per template for a calendar month.
- Display paid, pending, overdue, and partially paid charge states.
- Record one or more payments against a charge and calculate the outstanding amount.
- Store a receipt reference and optional document attachment for a payment.

### Documents and maintenance

- Attach local ID, address proof, photograph, agreement, receipt, and custom document records to a tenant or payment.
- Copy selected files into the app document directory; retain only file metadata and the local URI in persistent app state.
- Create, update, close, and list maintenance records with unit, description, date, cost, and status.

### Dashboard, reports, and reminders

- Show property count, occupied/vacant unit count, total expected charges, collected amount, outstanding amount, and open maintenance count.
- Provide an on-device monthly payment report and occupancy report that can be shared as text.
- Schedule local reminders for due and overdue charges. Remote push delivery is not part of this release.

## Data and security constraints

- Store operational records in AsyncStorage as one versioned JSON document under `havenly.app-state.v1`.
- Store attached document files under the app-owned document directory in an `havenly-documents` folder.
- Validate all form inputs before mutation: required names, non-negative currency amounts, valid dates, and active-unit constraints.
- Do not store real production IDs, passwords, payment credentials, or cloud tokens in the application source or local seed data.
- AsyncStorage is unencrypted. The first release must display a one-time local-data notice before the owner can attach sensitive documents.
- No server, cloud backup, payment gateway, multi-owner access, e-signature, WhatsApp integration, or remote push token is included in this release.

## UI constraints

- Preserve the existing Havenly visual language: light background, deep green primary color, compact mobile cards, and bottom navigation.
- Retain the Gluestack provider in `app/_layout.tsx`; use existing Gluestack primitives where they improve consistency and keep feature-specific components focused.
- Support Android first while keeping Expo web export working for development verification.

## Acceptance criteria

1. Data created or updated by the owner remains after an app restart.
2. An owner can create a property, add a unit, add a tenant, allot the vacant unit, and view the occupied status without editing source code.
3. Monthly rent generated for the same tenant/template/month never appears twice.
4. Recording payments updates the charge balance and dashboard totals immediately and after reload.
5. A selected document can be opened from the tenant or payment that owns it after reload.
6. A closed maintenance item no longer appears in the open-maintenance dashboard total.
7. Local due-date reminders can be scheduled on a physical Android device after notification permission is granted.
8. The app passes `npx expo-doctor`, `npm run test:ci`, and `npx expo export --platform web --output-dir dist`.

## Deferred integrations

- Google-account backup and synchronization
- Remote Expo/FCM push notifications
- Online payment links and payment gateway reconciliation
- Multiple owners, staff permissions, and tenant portal
- Advanced analytics, PDF reports, e-signatures, and WhatsApp sharing
