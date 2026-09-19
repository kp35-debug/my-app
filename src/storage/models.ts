import {
  Agreement,
  Charge,
  MaintenanceRecord,
  NotificationRecord,
  Payment,
  Property,
  RecurringChargeTemplate,
  Tenant,
  TenantDocument,
  Unit,
} from "./storageService";

export type UnitStatus = "vacant" | "occupied" | "maintenance" | "archived";
export type ChargeStatus = "pending" | "partial" | "paid" | "overdue" | "void";
export type DocumentKind =
  | "id"
  | "address-proof"
  | "photo"
  | "agreement"
  | "receipt"
  | "other";

export interface AppState {
  version: 1;
  ownerId: string;
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  agreements: Agreement[];
  chargeTemplates: RecurringChargeTemplate[];
  charges: Charge[];
  payments: Payment[];
  documents: TenantDocument[];
  maintenance: MaintenanceRecord[];
  notifications: NotificationRecord[];
  acceptedSensitiveDataNotice: boolean;
}

export const createEmptyAppState = (ownerId: string): AppState => ({
  version: 1,
  ownerId,
  properties: [],
  units: [],
  tenants: [],
  agreements: [],
  chargeTemplates: [],
  charges: [],
  payments: [],
  documents: [],
  maintenance: [],
  notifications: [],
  acceptedSensitiveDataNotice: false,
});
