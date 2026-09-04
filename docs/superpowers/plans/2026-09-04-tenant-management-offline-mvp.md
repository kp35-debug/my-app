# Havenly Offline Tenant Management MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current seeded Havenly demo into an offline-first Android landlord workspace with persistent properties, units, tenants, agreements, recurring charges, payments, documents, maintenance, reports, and local reminders.

**Architecture:** Replace the current single-screen in-memory model with feature modules that read and mutate one versioned `AppState` document through an AsyncStorage repository. Keep selected documents in Expo's app-owned document directory and store their metadata in `AppState`. Feature screens consume a single workspace context so each successful mutation persists before the UI renders the updated state.

**Tech Stack:** Expo SDK 57, Expo Router, React 19, React Native, TypeScript strict mode, Gluestack UI provider/primitives, AsyncStorage, Expo DocumentPicker, Expo ImagePicker, Expo FileSystem, Expo Notifications, Jest Expo.

**Spec:** `docs/superpowers/specs/2026-09-04-tenant-management-offline-mvp.md`

## Global Constraints

- Target Android first and retain successful Expo web export.
- Keep the existing Gluestack provider in `app/_layout.tsx` and reuse local Gluestack components where appropriate.
- Use `npx expo install @react-native-async-storage/async-storage expo-file-system expo-notifications` so versions remain compatible with Expo SDK 57.
- Persist records under AsyncStorage key `havenly.app-state.v1`; never persist plain-text production credentials or payment credentials.
- Store selected files only under the app-owned `havenly-documents` directory; document picker calls must set `copyToCacheDirectory: true` before file handling.
- Treat AsyncStorage as unencrypted and require the local-data notice before adding a sensitive document.
- Use local scheduled notifications only; remote push needs a development build, credentials, and a server, so it is explicitly deferred.
- Keep every mutation local and offline; do not introduce a backend, Google backup, payment gateway, multi-owner access, e-signature, or WhatsApp integration.
- Keep `app/index.tsx` as a thin Expo Router entry only. New business logic must not return to that file.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `src/domain/models.ts` | Shared domain types and enums for all persistent records. |
| `src/domain/ids.ts` | Stable local ID and ISO date helpers. |
| `src/domain/billing.ts` | Recurring-charge generation, balance/status calculation, dashboard and report summaries. |
| `src/domain/__tests__/billing.test.ts` | Deterministic recurring-billing and balance tests. |
| `src/data/seedState.ts` | One owner demo workspace used only when no stored state exists. |
| `src/data/workspaceRepository.ts` | Versioned AsyncStorage load, save, reset, and migration boundary. |
| `src/data/documentRepository.ts` | Safe local file copy, metadata creation, and local-file deletion. |
| `src/data/__tests__/workspaceRepository.test.ts` | Serialization and migration tests with mocked storage. |
| `src/providers/WorkspaceProvider.tsx` | Loads state once and exposes typed feature mutations and loading/error state. |
| `src/providers/__tests__/WorkspaceProvider.test.tsx` | Provider persistence and mutation integration tests. |
| `src/components/app/AppShell.tsx` | Shared owner header, navigation, notifications entry, and layout. |
| `src/components/app/ConfirmDialog.tsx` | Reusable archive/delete confirmation UI. |
| `src/components/forms/*` | Reusable validated field, date, currency, and form-action components. |
| `src/features/dashboard/*` | Owner dashboard and report/share views. |
| `src/features/properties/*` | Property/unit lists, forms, details, archive, and occupancy state. |
| `src/features/tenants/*` | Tenant profile, agreement, allotment, and document entry UI. |
| `src/features/billing/*` | Templates, generated charges, payment entry, and receipt UI. |
| `src/features/maintenance/*` | Maintenance list, form, status updates, and history. |
| `src/features/notifications/*` | Permission request and local reminder scheduling. |
| `app/index.tsx` | Sign-in route that renders `OwnerWorkspace` after demo owner login. |
| `app/(owner)/*` | Expo Router owner screens that compose feature components. |
| `app/tenant-preview.tsx` | Static deferred-feature explanation for the tenant demo login. |
| `app.json` | Product identity and the Expo Notifications config plugin. |
| `package.json` | Non-watch test command and required Expo-compatible packages. |

## Execution Order

1. Create the data model and persistence boundary.
2. Move the dashboard onto persisted workspace state.
3. Add property/unit CRUD before tenant allotment.
4. Add tenant/agreement CRUD before billing.
5. Add recurring charges and payment allocation before dashboard/report totals.
6. Add local documents and maintenance.
7. Add local reminders and complete Android verification.

### Task 1: Establish the domain model, test commands, and storage dependencies

**Files:**

- Create: `src/domain/models.ts`
- Create: `src/domain/ids.ts`
- Create: `src/domain/__tests__/models.test.ts`
- Modify: `package.json`
- Modify: `app.json`

**Interfaces:**

- Produces `AppState`, `Property`, `Unit`, `Tenant`, `Agreement`, `RecurringChargeTemplate`, `Charge`, `Payment`, `TenantDocument`, `MaintenanceRecord`, and `NotificationRecord`.
- Produces `createId(prefix: string): string` and `toIsoDate(date: Date): string`.
- Consumes no application feature modules.

- [ ] **Step 1: Add Expo-compatible dependencies and a non-watch test command**

Run:

```powershell
npx expo install @react-native-async-storage/async-storage expo-file-system expo-notifications
npm pkg set scripts.test:ci="jest --runInBand"
```

Add the notifications config plugin to `app.json`:

```json
["expo-notifications", { "color": "#1F7A53", "defaultChannel": "payments" }]
```

- [ ] **Step 2: Write the failing model test**

```ts
import { createEmptyAppState } from '../models';

it('creates a versioned empty workspace with every collection present', () => {
  expect(createEmptyAppState('owner-1')).toEqual({
    version: 1,
    ownerId: 'owner-1',
    properties: [], units: [], tenants: [], agreements: [],
    chargeTemplates: [], charges: [], payments: [], documents: [],
    maintenance: [], notifications: [], acceptedSensitiveDataNotice: false,
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test:ci -- src/domain/__tests__/models.test.ts`

Expected: FAIL because `src/domain/models.ts` does not exist.

- [ ] **Step 4: Implement the types and factory**

```ts
export type UnitStatus = 'vacant' | 'occupied' | 'maintenance' | 'archived';
export type ChargeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'void';
export type DocumentKind = 'id' | 'address-proof' | 'photo' | 'agreement' | 'receipt' | 'other';

export interface AppState {
  version: 1; ownerId: string; properties: Property[]; units: Unit[];
  tenants: Tenant[]; agreements: Agreement[]; chargeTemplates: RecurringChargeTemplate[];
  charges: Charge[]; payments: Payment[]; documents: TenantDocument[];
  maintenance: MaintenanceRecord[]; notifications: NotificationRecord[];
  acceptedSensitiveDataNotice: boolean;
}

export const createEmptyAppState = (ownerId: string): AppState => ({
  version: 1, ownerId, properties: [], units: [], tenants: [], agreements: [],
  chargeTemplates: [], charges: [], payments: [], documents: [], maintenance: [],
  notifications: [], acceptedSensitiveDataNotice: false,
});
```

Define each referenced interface in the same file with an `id`, `createdAt`, and `updatedAt`, then use explicit foreign keys such as `propertyId`, `unitId`, `tenantId`, `agreementId`, and `chargeId`.

- [ ] **Step 5: Run model tests and typecheck**

Run:

```powershell
npm run test:ci -- src/domain/__tests__/models.test.ts
npx tsc --noEmit
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit the domain foundation**

```powershell
git add package.json package-lock.json app.json src/domain
git commit -m "feat: add havenly domain model"
```

### Task 2: Persist and hydrate the workspace

**Files:**

- Create: `src/data/seedState.ts`
- Create: `src/data/workspaceRepository.ts`
- Create: `src/data/__tests__/workspaceRepository.test.ts`
- Create: `src/providers/WorkspaceProvider.tsx`
- Create: `src/providers/__tests__/WorkspaceProvider.test.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**

- Consumes `AppState` and `createEmptyAppState` from `src/domain/models.ts`.
- Produces `WorkspaceRepository.load(): Promise<AppState>`, `save(state: AppState): Promise<void>`, and `reset(): Promise<AppState>`.
- Produces `useWorkspace(): WorkspaceContextValue` with `state`, `isHydrating`, `saveState`, and `resetWorkspace`.

- [ ] **Step 1: Write repository tests with a mocked AsyncStorage adapter**

```ts
it('returns seeded state only when no stored workspace exists', async () => {
  storage.getItem.mockResolvedValue(null);
  await expect(repository.load()).resolves.toEqual(seedState);
  expect(storage.setItem).toHaveBeenCalledWith('havenly.app-state.v1', JSON.stringify(seedState));
});

it('returns stored state without replacing user changes', async () => {
  storage.getItem.mockResolvedValue(JSON.stringify(storedState));
  await expect(repository.load()).resolves.toEqual(storedState);
});
```

- [ ] **Step 2: Run the repository test to verify it fails**

Run: `npm run test:ci -- src/data/__tests__/workspaceRepository.test.ts`

Expected: FAIL because `workspaceRepository.ts` does not exist.

- [ ] **Step 3: Implement versioned storage and seed hydration**

```ts
const STORAGE_KEY = 'havenly.app-state.v1';

export const createWorkspaceRepository = (storage = AsyncStorage) => ({
  async load(): Promise<AppState> {
    const raw = await storage.getItem(STORAGE_KEY);
    if (raw) return parseAppState(raw);
    const seed = createSeedState();
    await storage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  },
  save: (state: AppState) => storage.setItem(STORAGE_KEY, JSON.stringify(state)),
  async reset() { const seed = createSeedState(); await storage.setItem(STORAGE_KEY, JSON.stringify(seed)); return seed; },
});
```

`parseAppState` must reject malformed JSON, unsupported versions, and missing collections by returning `createSeedState()` rather than crashing the app.

- [ ] **Step 4: Add the provider and gate the router while hydrating**

```tsx
export function WorkspaceProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => { repository.load().then(setState); }, []);
  const saveState = async (next: AppState) => { await repository.save(next); setState(next); };
  if (!state) return <WorkspaceLoadingScreen />;
  return <WorkspaceContext.Provider value={{ state, isHydrating: false, saveState, resetWorkspace }}>{children}</WorkspaceContext.Provider>;
}
```

Wrap the existing `Slot` in `WorkspaceProvider` within `app/_layout.tsx`.

- [ ] **Step 5: Run repository/provider tests and verify restart behavior**

Run:

```powershell
npm run test:ci -- src/data/__tests__/workspaceRepository.test.ts src/providers/__tests__/WorkspaceProvider.test.tsx
npx expo start --android
```

Expected: Tests pass; a changed seed value remains after manually reloading the Android app.

- [ ] **Step 6: Commit workspace persistence**

```powershell
git add app/_layout.tsx src/data src/providers
git commit -m "feat: persist local workspace state"
```

### Task 3: Build property and unit CRUD with occupancy rules

**Files:**

- Create: `src/features/properties/propertyMutations.ts`
- Create: `src/features/properties/PropertyListScreen.tsx`
- Create: `src/features/properties/PropertyFormSheet.tsx`
- Create: `src/features/properties/UnitFormSheet.tsx`
- Create: `src/features/properties/__tests__/propertyMutations.test.ts`
- Create: `app/(owner)/properties.tsx`
- Modify: `app/index.tsx`

**Interfaces:**

- Consumes `AppState`, `Property`, `Unit`, `UnitStatus`, and `useWorkspace`.
- Produces `createProperty`, `updateProperty`, `archiveProperty`, `createUnit`, `updateUnit`, and `archiveUnit` pure functions returning `AppState`.
- A unit is valid when `propertyId` exists, `name.trim().length > 0`, `monthlyRent >= 0`, and `status !== 'archived'` before assignment.

- [ ] **Step 1: Write failing occupancy and archive tests**

```ts
it('archives an unoccupied unit and excludes it from availability', () => {
  const next = archiveUnit(state, 'unit-1', now);
  expect(next.units.find(unit => unit.id === 'unit-1')?.status).toBe('archived');
});

it('rejects an occupied unit archive until its active agreement ends', () => {
  expect(() => archiveUnit(occupiedState, 'unit-1', now)).toThrow('End the active agreement before archiving this unit.');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:ci -- src/features/properties/__tests__/propertyMutations.test.ts`

Expected: FAIL because property mutation functions do not exist.

- [ ] **Step 3: Implement pure mutations before UI**

```ts
export function createUnit(state: AppState, input: CreateUnitInput, now: string): AppState {
  const property = state.properties.find(item => item.id === input.propertyId && !item.archivedAt);
  if (!property) throw new Error('Choose an active property.');
  if (!input.name.trim()) throw new Error('Enter a unit name.');
  if (input.monthlyRent < 0) throw new Error('Rent cannot be negative.');
  const unit: Unit = { id: createId('unit'), ...input, status: 'vacant', createdAt: now, updatedAt: now };
  return { ...state, units: [...state.units, unit] };
}
```

- [ ] **Step 4: Build the list and validated Gluestack form sheets**

Use `Input`, `Select`, `Button`, and `Actionsheet` from `components/ui` to create/edit properties and units. Every form must render inline validation strings returned from the mutation error. Property cards show unit counts and monthly expected rent; unit cards show `vacant`, `occupied`, `maintenance`, or `archived` status.

- [ ] **Step 5: Wire the owner route and verify the flow**

Run:

```powershell
npm run test:ci -- src/features/properties/__tests__/propertyMutations.test.ts
npx expo start --android
```

Expected manual path: create “Demo Building” → create “A-101” → edit rent → archive the vacant unit → confirm it disappears from available-unit selection.

- [ ] **Step 6: Commit property and unit CRUD**

```powershell
git add app/index.tsx app/(owner)/properties.tsx src/features/properties
git commit -m "feat: manage properties and units"
```

### Task 4: Build tenant profiles, allotment, and agreement lifecycle

**Files:**

- Create: `src/features/tenants/tenantMutations.ts`
- Create: `src/features/tenants/TenantListScreen.tsx`
- Create: `src/features/tenants/TenantFormSheet.tsx`
- Create: `src/features/tenants/AgreementFormSheet.tsx`
- Create: `src/features/tenants/__tests__/tenantMutations.test.ts`
- Create: `app/(owner)/tenants.tsx`

**Interfaces:**

- Consumes property/unit data and `AppState` from Tasks 1–3.
- Produces `createTenant`, `updateTenant`, `startAgreement`, and `endAgreement` pure functions.
- `startAgreement(state, input, now)` requires a `vacant` active unit and changes it to `occupied` atomically.
- `endAgreement(state, agreementId, endDate, now)` changes the agreement to ended and returns the unit to `vacant`.

- [ ] **Step 1: Write failing allotment tests**

```ts
it('allots a vacant unit and creates one active agreement', () => {
  const next = startAgreement(state, input, now);
  expect(next.agreements.filter(item => item.unitId === 'unit-1' && !item.endedAt)).toHaveLength(1);
  expect(next.units.find(item => item.id === 'unit-1')?.status).toBe('occupied');
});

it('does not allot an already occupied unit', () => {
  expect(() => startAgreement(occupiedState, input, now)).toThrow('This unit is not available for allotment.');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:ci -- src/features/tenants/__tests__/tenantMutations.test.ts`

Expected: FAIL because tenant mutation functions do not exist.

- [ ] **Step 3: Implement tenant and agreement mutations**

`Tenant` must include `fullName`, `phone`, optional `email`, optional `emergencyContact`, and archive timestamps. `Agreement` must include `tenantId`, `unitId`, `startDate`, `endDate`, `monthlyRent`, `depositAmount`, and optional `endedAt`.

- [ ] **Step 4: Implement tenant list, detail, and agreement forms**

The list supports name/unit search. The detail screen shows profile fields, active/ended agreement, balance summary, documents, payments, and a visible “End agreement” action. The agreement form selects only units with `status === 'vacant'`.

- [ ] **Step 5: Verify tenant lifecycle end-to-end**

Run:

```powershell
npm run test:ci -- src/features/tenants/__tests__/tenantMutations.test.ts
npx expo start --android
```

Expected manual path: create tenant → assign a vacant unit → verify occupied state → end agreement → verify the unit becomes vacant.

- [ ] **Step 6: Commit tenant and agreement lifecycle**

```powershell
git add app/(owner)/tenants.tsx src/features/tenants
git commit -m "feat: manage tenants and agreements"
```

### Task 5: Add recurring charges, payment allocation, and receipt records

**Files:**

- Create: `src/domain/billing.ts`
- Create: `src/domain/__tests__/billing.test.ts`
- Create: `src/features/billing/BillingScreen.tsx`
- Create: `src/features/billing/ChargeTemplateSheet.tsx`
- Create: `src/features/billing/PaymentSheet.tsx`
- Create: `src/features/billing/__tests__/billingMutations.test.ts`
- Create: `app/(owner)/payments.tsx`

**Interfaces:**

- Produces `generateMonthlyCharges(state, month: string, now: string): AppState`.
- Produces `recordPayment(state, input: RecordPaymentInput, now: string): AppState`.
- Produces `getChargeBalance(charge: Charge, payments: Payment[]): number` and `getChargeStatus(charge, payments, today): ChargeStatus`.
- `month` uses `YYYY-MM`; a charge uniqueness key is `(templateId, month)`.

- [ ] **Step 1: Write failing billing tests**

```ts
it('creates one charge per template for a month and remains idempotent', () => {
  const once = generateMonthlyCharges(state, '2026-09', now);
  const twice = generateMonthlyCharges(once, '2026-09', now);
  expect(twice.charges).toHaveLength(once.charges.length);
});

it('marks a charge partial after a payment smaller than its amount', () => {
  const next = recordPayment(state, { chargeId: 'charge-1', amount: 500, paidOn: '2026-09-02', receiptReference: 'CASH-001' }, now);
  expect(getChargeStatus(next.charges[0], next.payments, '2026-09-03')).toBe('partial');
});
```

- [ ] **Step 2: Run the billing test to verify it fails**

Run: `npm run test:ci -- src/domain/__tests__/billing.test.ts src/features/billing/__tests__/billingMutations.test.ts`

Expected: FAIL because billing functions do not exist.

- [ ] **Step 3: Implement deterministic billing functions**

`RecurringChargeTemplate` includes `tenantId`, `agreementId`, `kind`, `amount`, `dueDay`, `active`, and `createdAt`. `generateMonthlyCharges` creates a charge only for active templates that still have an active agreement in the requested month. `recordPayment` rejects zero, negative, or over-balance payments.

- [ ] **Step 4: Build billing UI and payment entry**

The Payments route shows a month selector, status filters, generated charges, outstanding balances, and a “Generate month” action. Payment entry chooses a charge, displays remaining balance, accepts amount/date/reference, and persists a payment. A paid charge cannot accept another payment.

- [ ] **Step 5: Verify bills and payments**

Run:

```powershell
npm run test:ci -- src/domain/__tests__/billing.test.ts src/features/billing/__tests__/billingMutations.test.ts
npx expo start --android
```

Expected manual path: create rent template → generate September → generate September again → see one charge → record partial payment → reload app → see partial balance.

- [ ] **Step 6: Commit recurring billing and payments**

```powershell
git add app/(owner)/payments.tsx src/domain/billing.ts src/domain/__tests__/billing.test.ts src/features/billing
git commit -m "feat: track recurring charges and payments"
```

### Task 6: Add local document collection and receipt attachments

**Files:**

- Create: `src/data/documentRepository.ts`
- Create: `src/data/__tests__/documentRepository.test.ts`
- Create: `src/features/documents/DocumentList.tsx`
- Create: `src/features/documents/DocumentPickerButton.tsx`
- Create: `src/features/documents/SensitiveDataNotice.tsx`
- Modify: `src/features/tenants/TenantListScreen.tsx`
- Modify: `src/features/billing/PaymentSheet.tsx`

**Interfaces:**

- Produces `savePickedDocument(input: SaveDocumentInput): Promise<TenantDocument>` and `removeDocument(document: TenantDocument): Promise<void>`.
- `TenantDocument` stores `ownerType: 'tenant' | 'payment'`, `ownerId`, `kind`, `originalName`, `mimeType`, `size`, `localUri`, and `createdAt`.
- Consumes the accepted-sensitive-data boolean from `WorkspaceProvider`.

- [ ] **Step 1: Write failing document-copy tests**

```ts
it('creates a stable document record inside the app document directory', async () => {
  const document = await repository.savePickedDocument(pickedAsset, { ownerType: 'tenant', ownerId: 'tenant-1', kind: 'id' });
  expect(document.localUri).toContain('havenly-documents/tenant-1/');
  expect(file.copy).toHaveBeenCalled();
});

it('does not allow attachment before the sensitive-data notice is accepted', async () => {
  await expect(repository.savePickedDocument(pickedAsset, contextWithoutConsent)).rejects.toThrow('Accept the local-data notice before attaching documents.');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:ci -- src/data/__tests__/documentRepository.test.ts`

Expected: FAIL because `documentRepository.ts` does not exist.

- [ ] **Step 3: Implement document storage**

Use `DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false })` and optionally `ImagePicker.launchImageLibraryAsync`. Copy the chosen asset into `new Directory(Paths.document, 'havenly-documents', ownerId)` with a generated filename. Do not save a cache URI as the permanent URI.

- [ ] **Step 4: Add notice, picker, list, open, and remove actions**

Show the one-time notice: “Documents stay only on this device until backup is introduced. Do not use this demo for sensitive production documents.” Persist acceptance in `AppState.acceptedSensitiveDataNotice`. The document list shows type, filename, date, and open/remove actions. Removing a document deletes the file before removing its metadata from state.

- [ ] **Step 5: Verify local document retention**

Run:

```powershell
npm run test:ci -- src/data/__tests__/documentRepository.test.ts
npx expo start --android
```

Expected manual path: accept notice → attach a PDF or image to a tenant → close/reopen app → open the attachment → remove it → confirm the list entry disappears.

- [ ] **Step 6: Commit document support**

```powershell
git add src/data/documentRepository.ts src/data/__tests__/documentRepository.test.ts src/features/documents src/features/tenants src/features/billing
git commit -m "feat: store local tenant documents and receipts"
```

### Task 7: Build maintenance CRUD and dashboard/report summaries

**Files:**

- Create: `src/features/maintenance/maintenanceMutations.ts`
- Create: `src/features/maintenance/MaintenanceScreen.tsx`
- Create: `src/features/maintenance/MaintenanceFormSheet.tsx`
- Create: `src/features/maintenance/__tests__/maintenanceMutations.test.ts`
- Create: `src/features/dashboard/dashboardSelectors.ts`
- Create: `src/features/dashboard/__tests__/dashboardSelectors.test.ts`
- Create: `src/features/dashboard/DashboardScreen.tsx`
- Create: `src/features/dashboard/ReportShareSheet.tsx`
- Create: `app/(owner)/maintenance.tsx`
- Modify: `app/index.tsx`

**Interfaces:**

- Produces `createMaintenance`, `updateMaintenanceStatus`, and `archiveMaintenance`.
- Produces `selectDashboardSummary(state, month, today)` and `buildMonthlyPaymentReport(state, month, today): string`.
- Dashboard summary returns `{ propertyCount, occupiedUnitCount, vacantUnitCount, expectedAmount, collectedAmount, outstandingAmount, openMaintenanceCount }`.

- [ ] **Step 1: Write failing summary and maintenance tests**

```ts
it('removes a closed maintenance item from the open count', () => {
  const next = updateMaintenanceStatus(state, 'maintenance-1', 'completed', now);
  expect(selectDashboardSummary(next, '2026-09', '2026-09-04').openMaintenanceCount).toBe(0);
});

it('builds a shareable report with collected and outstanding totals', () => {
  expect(buildMonthlyPaymentReport(state, '2026-09', '2026-09-04')).toContain('Outstanding: ₹18,000');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:ci -- src/features/maintenance/__tests__/maintenanceMutations.test.ts src/features/dashboard/__tests__/dashboardSelectors.test.ts`

Expected: FAIL because mutation and selector modules do not exist.

- [ ] **Step 3: Implement maintenance mutations and report selectors**

Maintenance records use `status: 'open' | 'in-progress' | 'completed'`, `unitId`, `title`, `description`, `reportedOn`, `completedOn`, and `cost`. Dashboard totals must derive only from persisted charges/payments, never from hard-coded demo totals.

- [ ] **Step 4: Build maintenance and reporting UI**

Maintenance records filter by status and unit. The dashboard links to property, tenant, payment, and maintenance routes. `ReportShareSheet` creates plain text for the selected month and calls `Share.share({ message: report })`; it does not create a PDF.

- [ ] **Step 5: Verify dashboard consistency**

Run:

```powershell
npm run test:ci -- src/features/maintenance/__tests__/maintenanceMutations.test.ts src/features/dashboard/__tests__/dashboardSelectors.test.ts
npx expo start --android
```

Expected manual path: close an open maintenance item → return to dashboard → open count decreases; record a payment → collected/outstanding totals change; share a report as text.

- [ ] **Step 6: Commit maintenance and reports**

```powershell
git add app/index.tsx app/(owner)/maintenance.tsx src/features/maintenance src/features/dashboard
git commit -m "feat: add maintenance and owner reports"
```

### Task 8: Schedule local due-date reminders and finish the demo sign-in boundary

**Files:**

- Create: `src/features/notifications/notificationService.ts`
- Create: `src/features/notifications/__tests__/notificationService.test.ts`
- Create: `app/tenant-preview.tsx`
- Modify: `app/index.tsx`
- Modify: `app.json`

**Interfaces:**

- Produces `ensureNotificationPermission(): Promise<boolean>` and `scheduleChargeReminder(charge: Charge): Promise<string | null>`.
- Produces `syncChargeReminders(charges: Charge[]): Promise<Record<string, string>>` where keys are charge IDs and values are Expo schedule IDs.
- Owner login enters the owner workspace. Tenant demo login navigates to `/tenant-preview` and clearly states that the tenant portal is deferred.

- [ ] **Step 1: Write failing scheduling tests**

```ts
it('does not schedule a reminder when notification permission is denied', async () => {
  notifications.getPermissionsAsync.mockResolvedValue({ granted: false });
  notifications.requestPermissionsAsync.mockResolvedValue({ granted: false });
  await expect(scheduleChargeReminder(charge)).resolves.toBeNull();
});

it('schedules one local reminder for a pending future-due charge', async () => {
  await scheduleChargeReminder(chargeDueTomorrow);
  expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the notification test to verify it fails**

Run: `npm run test:ci -- src/features/notifications/__tests__/notificationService.test.ts`

Expected: FAIL because notification service does not exist.

- [ ] **Step 3: Implement only local reminders**

Create Android channel `payments` with high importance. Schedule one notification at 09:00 local time on the due date for each pending charge whose due date is today or later. For overdue charges, render an in-app alert card; do not schedule a past notification. Cancel and recreate reminders when a charge is paid, voided, or edited.

- [ ] **Step 4: Build the tenant-preview route and route demo credentials correctly**

The tenant preview must state: “Tenant self-service is planned after owner workflows are validated.” It must never render owner records. The sign-in function must not treat the demo password as real authentication.

- [ ] **Step 5: Verify on a physical Android device**

Run:

```powershell
npm run test:ci -- src/features/notifications/__tests__/notificationService.test.ts
npx expo start --android
```

Expected manual path: grant notification permission → create a due-tomorrow charge → see one scheduled local reminder; sign in with tenant credentials → see the tenant preview screen only.

- [ ] **Step 6: Commit reminders and role boundary**

```powershell
git add app/index.tsx app/tenant-preview.tsx app.json src/features/notifications
git commit -m "feat: add local payment reminders"
```

### Task 9: Run regression checks and produce an Android handoff build

**Files:**

- Modify: `README.md`
- Modify: `app.json`

**Interfaces:**

- Consumes the completed offline workspace and all feature routes.
- Produces repeatable local run, test, web-export, and Android-install instructions.

- [ ] **Step 1: Add a manual acceptance checklist to the README**

Add the following commands and test flow:

```powershell
npm install
npx expo start --android
npm run test:ci
npx expo export --platform web --output-dir dist
npx expo-doctor
```

Manual acceptance path: sign in as owner → add property → add unit → add tenant → allot unit → configure rent → generate current month → record payment → attach document → log/close maintenance → share report → restart app and repeat key checks.

- [ ] **Step 2: Run the complete automated suite**

Run:

```powershell
npm run test:ci
npx tsc --noEmit
npx expo-doctor
npx expo export --platform web --output-dir dist
```

Expected: Every command exits with code 0.

- [ ] **Step 3: Verify Android packaging readiness**

Run:

```powershell
npx expo prebuild --platform android --no-install
npx expo run:android
```

Expected: Android project generation and local Android launch succeed. Do not run a cloud EAS build until the owner supplies an Expo account/project configuration.

- [ ] **Step 4: Commit release documentation**

```powershell
git add README.md app.json
git commit -m "docs: add offline mvp verification guide"
```

## Self-Review

### Spec coverage

| Requirement | Plan task |
| --- | --- |
| Persistent offline workspace | Tasks 1–2 |
| Properties, units, vacancy, and allotment | Tasks 3–4 |
| Tenant profiles and agreements | Task 4 |
| Recurring rent, electricity, maintenance, custom charges | Task 5 |
| Payments and receipt records | Tasks 5–6 |
| Documents and local-data notice | Task 6 |
| Maintenance history | Task 7 |
| Dashboard, reports, share | Task 7 |
| Local reminders | Task 8 |
| Demo logins and tenant boundary | Task 8 |
| Android and web verification | Task 9 |
| Deferred cloud/payment/remote-push features | Global Constraints and specification |

### Placeholder scan

The plan has no unspecified implementation steps. Every task names concrete files, public interfaces, validation rules, tests, commands, and commit boundaries.

### Type consistency

All feature modules use `AppState` from `src/domain/models.ts`. Entity relationships use the same `propertyId`, `unitId`, `tenantId`, `agreementId`, and `chargeId` fields throughout the plan. Charge-generation uniqueness is consistently `(templateId, month)`.

## Sources consulted

- [Expo AsyncStorage documentation](https://docs.expo.dev/versions/latest/sdk/async-storage/) — persistent local key-value storage and Expo-compatible install command.
- [Expo DocumentPicker documentation](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/) — `copyToCacheDirectory: true` requirement before filesystem access.
- [Expo FileSystem documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/) — app-owned document directory storage.
- [Expo Notifications documentation](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) — local notifications in Expo Go and remote-push development-build constraint.

