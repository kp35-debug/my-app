import * as SecureStore from "expo-secure-store";
import { Platform } from "react";
import type React from "react";

// Types for our data models
export type Property = {
  id: string;
  name: string;
  address: string;
  units: number;
  occupied: number;
  income: number;
};

export type Tenant = {
  id: string;

  name: string;
  initials: string;

  phone: string;
  email?: string;

  propertyId: string;
  unitId: string;

  rent: number;
  rentDueDay: number;

  leaseStartDate: string;
  leaseEndDate: string;

  status: "Active" | "Past" | "Pending";

  color: string;

  createdAt: string;
  updatedAt: string;
};

export type Unit = {
  id: string;
  label: string;
  type: string;
  tenant: string;
  property: string;
  status: "Occupied" | "Vacant" | "Maintenance";
};

export type Payment = {
  id: string;
  tenant: string;
  unit: string;
  type: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending" | "Overdue";
};

export type MaintenanceItem = {
  id: string;
  title: string;
  unit: string;
  date: string;
  status: "Completed" | "In progress" | "Open";
  cost: number;
};

export type RecurringBill = {
  label: string;
  count: string;
  amount: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
};

export type Agreement = {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string;

  type: "Lease" | "Rental Agreement" | "Renewal";

  startDate: string;
  endDate: string;

  rent: number;
  securityDeposit: number;

  rentDueDay: number;
  paymentFrequency: "Monthly" | "Quarterly" | "Yearly";

  status: "Draft" | "Active" | "Expired" | "Terminated";

  documentId?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
};

/**
 * Defines a recurring charge that can be automatically
 * applied to a tenant's account.
 *
 * Examples:
 * - Monthly rent
 * - Parking
 * - Maintenance fee
 * - Water
 * - Society/service charge
 */
export type RecurringChargeTemplate = {
  id: string;

  propertyId?: string;
  unitId?: string;
  tenantId?: string;

  label: string;
  description?: string;

  amount: number;

  frequency: "Weekly" | "Monthly" | "Quarterly" | "Yearly";

  dayOfMonth?: number;

  startDate: string;
  endDate?: string;

  category:
    | "Rent"
    | "Utilities"
    | "Maintenance"
    | "Parking"
    | "Service"
    | "Other";

  active: boolean;

  createdAt: string;
  updatedAt: string;
};

/**
 * An actual charge/invoice generated for a tenant.
 */
export type Charge = {
  id: string;

  propertyId: string;
  unitId: string;
  tenantId: string;

  templateId?: string;
  agreementId?: string;

  label: string;
  description?: string;

  category:
    | "Rent"
    | "Utilities"
    | "Maintenance"
    | "Parking"
    | "Service"
    | "Late Fee"
    | "Other";

  amount: number;

  dueDate: string;
  issuedDate: string;

  status: "Pending" | "Paid" | "Overdue" | "Waived" | "Cancelled";

  paymentId?: string;

  paidAmount?: number;
  paidDate?: string;

  notes?: string;

  createdAt: string;
  updatedAt: string;
};

/**
 * Documents associated with a tenant, property or agreement.
 */
export type TenantDocument = {
  id: string;

  tenantId?: string;
  propertyId?: string;
  unitId?: string;
  agreementId?: string;

  name: string;

  type:
    | "Lease"
    | "Identity"
    | "Address Proof"
    | "Payment Receipt"
    | "Inspection"
    | "Maintenance"
    | "Other";

  mimeType?: string;
  uri: string;

  size?: number;

  issueDate?: string;
  expiryDate?: string;

  status?: "Active" | "Expired" | "Archived";

  notes?: string;

  uploadedAt: string;
  updatedAt: string;
};

/**
 * Detailed maintenance request/work order.
 *
 * MaintenanceItem can remain as the lightweight UI/dashboard model,
 * while MaintenanceRecord stores the complete record.
 */
export type MaintenanceRecord = {
  id: string;

  propertyId: string;
  unitId: string;
  tenantId?: string;

  title: string;
  description?: string;

  category:
    | "Plumbing"
    | "Electrical"
    | "Appliance"
    | "HVAC"
    | "Structural"
    | "Cleaning"
    | "Pest Control"
    | "Other";

  priority: "Low" | "Medium" | "High" | "Urgent";

  status:
    | "Open"
    | "Assigned"
    | "In progress"
    | "Waiting for tenant"
    | "Waiting for parts"
    | "Completed"
    | "Cancelled";

  reportedDate: string;
  scheduledDate?: string;
  completedDate?: string;

  assignedTo?: string;
  vendor?: string;

  estimatedCost?: number;
  cost?: number;

  tenantNotes?: string;
  landlordNotes?: string;
  resolution?: string;

  documentIds?: string[];

  createdAt: string;
  updatedAt: string;
};

/**
 * In-app notification for landlord or tenant.
 */
export type NotificationRecord = {
  id: string;

  recipientId: string;
  recipientRole: "Landlord" | "Tenant";

  type:
    | "PaymentDue"
    | "PaymentReceived"
    | "PaymentOverdue"
    | "ChargeCreated"
    | "LeaseExpiring"
    | "LeaseRenewed"
    | "MaintenanceCreated"
    | "MaintenanceUpdated"
    | "DocumentExpiring"
    | "General";

  title: string;
  message: string;

  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  paymentId?: string;
  chargeId?: string;
  maintenanceId?: string;
  documentId?: string;
  agreementId?: string;

  read: boolean;

  createdAt: string;
  readAt?: string;

  action?: {
    type: "payment" | "charge" | "maintenance" | "document" | "agreement";
    id: string;
  };
};

// Storage keys
const STORAGE_KEYS = {
  PROPERTIES: "properties",
  TENANTS: "tenants",
  UNITS: "units",
  PAYMENTS: "payments",
  MAINTENANCE: "maintenance",
  USER_ROLE: "user_role",
  USER_NAME: "user_name",
} as const;

// Default data (fallback if storage is empty)
const DEFAULT_DATA = {
  properties: [
    {
      id: "p1",
      name: "Cedar Heights",
      address: "12 Lakeview Road",
      units: 12,
      occupied: 10,
      income: 186000,
    },
    {
      id: "p2",
      name: "Maple Residency",
      address: "44 Park Street",
      units: 8,
      occupied: 6,
      income: 104000,
    },
    {
      id: "p3",
      name: "The Corner Shops",
      address: "8 Market Lane",
      units: 4,
      occupied: 3,
      income: 72000,
    },
  ],
  tenantsOld: [
    {
      id: "t1",
      name: "Aarav Mehta",
      initials: "AM",
      unit: "A-204",
      property: "Cedar Heights",
      rent: 24000,
      due: "05 Sep",
      tenure: "Aug 2025 – Jul 2026",
      phone: "+91 98765 43210",
      color: "#E6F2EA",
    },
    {
      id: "t2",
      name: "Neha Kapoor",
      initials: "NK",
      unit: "B-102",
      property: "Cedar Heights",
      rent: 22000,
      due: "05 Sep",
      tenure: "Jan 2026 – Dec 2026",
      phone: "+91 98220 11890",
      color: "#FFF0E2",
    },
    {
      id: "t3",
      name: "Rohan Shah",
      initials: "RS",
      unit: "1st Floor",
      property: "Maple Residency",
      rent: 18000,
      due: "01 Sep",
      tenure: "Apr 2025 – Mar 2026",
      phone: "+91 99112 20304",
      color: "#E8EFF8",
    },
    {
      id: "t4",
      name: "Priya Nair",
      initials: "PN",
      unit: "Shop 02",
      property: "The Corner Shops",
      rent: 26000,
      due: "10 Sep",
      tenure: "Jun 2024 – May 2027",
      phone: "+91 99870 44555",
      color: "#F3E8F3",
    },
  ],
  tenants: [
    {
      id: "t1",
      name: "Aarav Mehta",
      initials: "AM",
      phone: "+91 98765 43210",
      email: "aarav.mehta@example.com",

      propertyId: "p1",
      unitId: "u1",

      rent: 24000,
      rentDueDay: 5,

      leaseStartDate: "2025-08-01",
      leaseEndDate: "2026-07-31",

      status: "Active",

      color: "#E6F2EA",

      createdAt: "2025-07-20T10:00:00.000Z",
      updatedAt: "2025-08-01T10:00:00.000Z",
    },
    {
      id: "t2",
      name: "Neha Kapoor",
      initials: "NK",
      phone: "+91 98220 11890",
      email: "neha.kapoor@example.com",

      propertyId: "p1",
      unitId: "u2",

      rent: 22000,
      rentDueDay: 5,

      leaseStartDate: "2026-01-01",
      leaseEndDate: "2026-12-31",

      status: "Active",

      color: "#FFF0E2",

      createdAt: "2025-12-15T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    },
    {
      id: "t3",
      name: "Rohan Shah",
      initials: "RS",
      phone: "+91 99112 20304",
      email: "rohan.shah@example.com",

      propertyId: "p2",
      unitId: "u3",

      rent: 18000,
      rentDueDay: 1,

      leaseStartDate: "2025-04-01",
      leaseEndDate: "2026-03-31",

      status: "Active",

      color: "#E8EFF8",

      createdAt: "2025-03-20T10:00:00.000Z",
      updatedAt: "2025-04-01T10:00:00.000Z",
    },
    {
      id: "t4",
      name: "Priya Nair",
      initials: "PN",
      phone: "+91 99870 44555",
      email: "priya.nair@example.com",

      propertyId: "p3",
      unitId: "u4",

      rent: 26000,
      rentDueDay: 10,

      leaseStartDate: "2024-06-01",
      leaseEndDate: "2027-05-31",

      status: "Active",

      color: "#F3E8F3",

      createdAt: "2024-05-20T10:00:00.000Z",
      updatedAt: "2024-06-01T10:00:00.000Z",
    },
  ],
  units: [
    {
      id: "u1",
      label: "A-204",
      type: "2 BHK",
      tenant: "Aarav Mehta",
      property: "Cedar Heights",
      status: "Occupied" as const,
    },
    {
      id: "u2",
      label: "B-102",
      type: "1 BHK",
      tenant: "Neha Kapoor",
      property: "Cedar Heights",
      status: "Occupied" as const,
    },
    {
      id: "u3",
      label: "C-301",
      type: "2 BHK",
      tenant: "",
      property: "Cedar Heights",
      status: "Vacant" as const,
    },
    {
      id: "u4",
      label: "1st Floor",
      type: "Office",
      tenant: "Rohan Shah",
      property: "Maple Residency",
      status: "Occupied" as const,
    },
    {
      id: "u5",
      label: "Shop 02",
      type: "Retail",
      tenant: "Priya Nair",
      property: "The Corner Shops",
      status: "Occupied" as const,
    },
  ],
  payments: [
    {
      id: "pay1",
      tenant: "Aarav Mehta",
      unit: "A-204",
      type: "Monthly rent",
      amount: 24000,
      date: "02 Sep 2026",
      status: "Paid" as const,
    },
    {
      id: "pay2",
      tenant: "Neha Kapoor",
      unit: "B-102",
      type: "Monthly rent",
      amount: 22000,
      date: "01 Sep 2026",
      status: "Paid" as const,
    },
    {
      id: "pay3",
      tenant: "Rohan Shah",
      unit: "1st Floor",
      type: "Monthly rent",
      amount: 18000,
      date: "Due 01 Sep",
      status: "Overdue" as const,
    },
    {
      id: "pay4",
      tenant: "Priya Nair",
      unit: "Shop 02",
      type: "Monthly rent",
      amount: 26000,
      date: "Due 10 Sep",
      status: "Pending" as const,
    },
    {
      id: "pay5",
      tenant: "Aarav Mehta",
      unit: "A-204",
      type: "Electricity",
      amount: 1860,
      date: "28 Aug 2026",
      status: "Paid" as const,
    },
  ],
  maintenance: [
    {
      id: "m1",
      title: "Kitchen tap replacement",
      unit: "A-204 · Cedar Heights",
      date: "02 Sep 2026",
      status: "Completed" as const,
      cost: 850,
    },
    {
      id: "m2",
      title: "Paint touch-up",
      unit: "C-301 · Cedar Heights",
      date: "31 Aug 2026",
      status: "In progress" as const,
      cost: 3200,
    },
    {
      id: "m3",
      title: "AC service",
      unit: "Shop 02 · The Corner Shops",
      date: "28 Aug 2026",
      status: "Completed" as const,
      cost: 1200,
    },
  ],
  recurringBills: [
    {
      label: "Monthly rent",
      count: "4 tenants",
      amount: 90000,
      icon: require("@expo/vector-icons/FontAwesome").default,
      color: "#1F7A53",
    },
    {
      label: "Electricity",
      count: "3 meters",
      amount: 8400,
      icon: require("@expo/vector-icons/FontAwesome").default,
      color: "#C1771A",
    },
    {
      label: "Maintenance",
      count: "2 units",
      amount: 5000,
      icon: require("@expo/vector-icons/FontAwesome").default,
      color: "#233B4D",
    },
  ],
};

// Helper function to securely store data (throws on failure so callers can surface errors)
async function storeData(key: string, value: unknown): Promise<void> {
  const jsonValue = JSON.stringify(value);
  if (Platform.OS === "web") {
    localStorage.setItem(key, jsonValue);
  } else {
    await SecureStore.setItemAsync(key, jsonValue);
  }
}

// Helper function to securely retrieve data
async function getData<T>(key: string): Promise<T | null> {
  try {
    let jsonValue: string | null = null;
    if (Platform.OS === "web") {
      jsonValue = localStorage.getItem(key);
    } else {
      jsonValue = await SecureStore.getItemAsync(key);
    }

    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    return null;
  }
}

// Per-key mutation queues: serialize read-modify-write operations so concurrent
// calls cannot interleave and overwrite each other's changes.
const mutationQueues = new Map<string, Promise<unknown>>();

function enqueueMutation<T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = mutationQueues.get(key) ?? Promise.resolve();
  const next = previous.then(operation, operation);
  mutationQueues.set(
    key,
    next.catch(() => {}),
  );
  return next;
}

// Storage service
export const storageService = {
  // Initialize storage with default data if empty
  async initialize(): Promise<void> {
    try {
      const properties = await getData<Property[]>(STORAGE_KEYS.PROPERTIES);
      const tenants = await getData<Tenant[]>(STORAGE_KEYS.TENANTS);
      const units = await getData<Unit[]>(STORAGE_KEYS.UNITS);
      const payments = await getData<Payment[]>(STORAGE_KEYS.PAYMENTS);
      const maintenance = await getData<MaintenanceItem[]>(
        STORAGE_KEYS.MAINTENANCE,
      );

      // Only set defaults if data doesn't exist
      if (!properties) {
        await storeData(STORAGE_KEYS.PROPERTIES, DEFAULT_DATA.properties);
      }
      if (!tenants) {
        await storeData(STORAGE_KEYS.TENANTS, DEFAULT_DATA.tenants);
      }
      if (!units) {
        await storeData(STORAGE_KEYS.UNITS, DEFAULT_DATA.units);
      }
      if (!payments) {
        await storeData(STORAGE_KEYS.PAYMENTS, DEFAULT_DATA.payments);
      }
      if (!maintenance) {
        await storeData(STORAGE_KEYS.MAINTENANCE, DEFAULT_DATA.maintenance);
      }
    } catch (error) {
      console.error("Error initializing storage:", error);
    }
  },

  // Properties
  async getProperties(): Promise<Property[]> {
    const data = await getData<Property[]>(STORAGE_KEYS.PROPERTIES);
    return data || DEFAULT_DATA.properties;
  },

  async saveProperties(properties: Property[]): Promise<void> {
    await storeData(STORAGE_KEYS.PROPERTIES, properties);
  },

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    const data = await getData<Tenant[]>(STORAGE_KEYS.TENANTS);
    return data || DEFAULT_DATA.tenants;
  },

  async saveTenants(tenants: Tenant[]): Promise<void> {
    await storeData(STORAGE_KEYS.TENANTS, tenants);
  },

  async addTenant(tenant: Tenant): Promise<void> {
    return enqueueMutation(STORAGE_KEYS.TENANTS, async () => {
      const tenants = await this.getTenants();
      await this.saveTenants([...tenants, tenant]);
    });
  },

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<void> {
    return enqueueMutation(STORAGE_KEYS.TENANTS, async () => {
      const tenants = await this.getTenants();
      const updatedTenants = tenants.map((tenant) =>
        tenant.id === id ? { ...tenant, ...updates } : tenant,
      );
      await this.saveTenants(updatedTenants);
    });
  },

  async deleteTenant(id: string): Promise<void> {
    return enqueueMutation(STORAGE_KEYS.TENANTS, async () => {
      const tenants = await this.getTenants();
      const filteredTenants = tenants.filter((tenant) => tenant.id !== id);
      await this.saveTenants(filteredTenants);
    });
  },

  // Units
  async getUnits(): Promise<Unit[]> {
    const data = await getData<Unit[]>(STORAGE_KEYS.UNITS);
    return data || DEFAULT_DATA.units;
  },

  async saveUnits(units: Unit[]): Promise<void> {
    await storeData(STORAGE_KEYS.UNITS, units);
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    const data = await getData<Payment[]>(STORAGE_KEYS.PAYMENTS);
    return data || DEFAULT_DATA.payments;
  },

  async savePayments(payments: Payment[]): Promise<void> {
    await storeData(STORAGE_KEYS.PAYMENTS, payments);
  },

  async addPayment(payment: Payment): Promise<void> {
    return enqueueMutation(STORAGE_KEYS.PAYMENTS, async () => {
      const payments = await this.getPayments();
      await this.savePayments([...payments, payment]);
    });
  },

  async updatePayment(id: string, updates: Partial<Payment>): Promise<void> {
    return enqueueMutation(STORAGE_KEYS.PAYMENTS, async () => {
      const payments = await this.getPayments();
      const updatedPayments = payments.map((payment) =>
        payment.id === id ? { ...payment, ...updates } : payment,
      );
      await this.savePayments(updatedPayments);
    });
  },

  async deletePayment(id: string): Promise<void> {
    return enqueueMutation(STORAGE_KEYS.PAYMENTS, async () => {
      const payments = await this.getPayments();
      const filteredPayments = payments.filter((payment) => payment.id !== id);
      await this.savePayments(filteredPayments);
    });
  },

  // Maintenance
  async getMaintenance(): Promise<MaintenanceItem[]> {
    const data = await getData<MaintenanceItem[]>(STORAGE_KEYS.MAINTENANCE);
    return data || DEFAULT_DATA.maintenance;
  },

  async saveMaintenance(maintenance: MaintenanceItem[]): Promise<void> {
    await storeData(STORAGE_KEYS.MAINTENANCE, maintenance);
  },

  async addMaintenance(item: MaintenanceItem): Promise<void> {
    return enqueueMutation(STORAGE_KEYS.MAINTENANCE, async () => {
      const maintenance = await this.getMaintenance();
      await this.saveMaintenance([...maintenance, item]);
    });
  },

  async updateMaintenance(
    id: string,
    updates: Partial<MaintenanceItem>,
  ): Promise<void> {
    return enqueueMutation(STORAGE_KEYS.MAINTENANCE, async () => {
      const maintenance = await this.getMaintenance();
      const updatedMaintenance = maintenance.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      );
      await this.saveMaintenance(updatedMaintenance);
    });
  },

  async deleteMaintenance(id: string): Promise<void> {
    return enqueueMutation(STORAGE_KEYS.MAINTENANCE, async () => {
      const maintenance = await this.getMaintenance();
      const filteredMaintenance = maintenance.filter((item) => item.id !== id);
      await this.saveMaintenance(filteredMaintenance);
    });
  },

  // User data
  async getUserRole(): Promise<"owner" | "tenant"> {
    const role = await getData<string>(STORAGE_KEYS.USER_ROLE);
    return (role as "owner" | "tenant") || "owner";
  },

  async saveUserRole(role: "owner" | "tenant"): Promise<void> {
    await storeData(STORAGE_KEYS.USER_ROLE, role);
  },

  async getUserName(): Promise<string> {
    const name = await getData<string>(STORAGE_KEYS.USER_NAME);
    return name || "Anika Kapoor";
  },

  async saveUserName(name: string): Promise<void> {
    await storeData(STORAGE_KEYS.USER_NAME, name);
  },

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      for (const key of keys) {
        if (Platform.OS === "web") {
          localStorage.removeItem(key);
        } else {
          await SecureStore.deleteItemAsync(key);
        }
      }
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  },

  // Get recurring bills (static for now, could be made dynamic)
  getRecurringBills(): RecurringBill[] {
    return DEFAULT_DATA.recurringBills;
  },
};
