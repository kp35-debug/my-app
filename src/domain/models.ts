export type UnitStatus = 'vacant' | 'occupied' | 'maintenance' | 'archived';
export type ChargeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'void';
export type DocumentKind =
  | 'id'
  | 'address-proof'
  | 'photo'
  | 'agreement'
  | 'receipt'
  | 'other';

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

export interface Property {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  address: string;
  notes?: string;
  archivedAt?: string;
}

export interface Unit {
  id: string;
  createdAt: string;
  updatedAt: string;
  propertyId: string;
  name: string;
  type: 'flat' | 'room' | 'shop' | 'office' | 'other';
  defaultRent: number;
  status: UnitStatus;
  archivedAt?: string;
}

export interface Tenant {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  phone: string;
  email?: string;
  emergencyContact?: string;
  unitId?: string;
  archivedAt?: string;
}

export interface Agreement {
  id: string;
  createdAt: string;
  updatedAt: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate?: string;
  depositAmount: number;
  agreedRent: number;
  notes?: string;
}

export interface RecurringChargeTemplate {
  id: string;
  createdAt: string;
  updatedAt: string;
  propertyId: string;
  unitId?: string;
  tenantId?: string;
  agreementId?: string;
  name: string;
  category: 'rent' | 'electricity' | 'maintenance' | 'custom';
  amount: number;
  dueDay: number;
  startsOn: string;
  endsOn?: string;
  active: boolean;
}

export interface Charge {
  id: string;
  createdAt: string;
  updatedAt: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  agreementId: string;
  chargeTemplateId?: string;
  name: string;
  category: 'rent' | 'electricity' | 'maintenance' | 'custom';
  period: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: ChargeStatus;
  voidedAt?: string;
}

export interface Payment {
  id: string;
  createdAt: string;
  updatedAt: string;
  chargeId: string;
  tenantId: string;
  amount: number;
  paidOn: string;
  method: 'cash' | 'bank-transfer' | 'other';
  receiptReference?: string;
  documentId?: string;
  notes?: string;
}

export interface TenantDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  paymentId?: string;
  agreementId?: string;
  kind: DocumentKind;
  name: string;
  localUri: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface MaintenanceRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  propertyId: string;
  unitId: string;
  description: string;
  reportedOn: string;
  cost: number;
  status: 'open' | 'in-progress' | 'closed';
  closedOn?: string;
}

export interface NotificationRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  chargeId: string;
  scheduledFor: string;
  notificationId?: string;
  status: 'scheduled' | 'delivered' | 'cancelled';
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
