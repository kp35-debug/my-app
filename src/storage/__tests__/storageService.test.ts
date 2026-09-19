/**
 * Tests for src/storage/storageService.ts
 *
 * Covers:
 *  - initialize() seeding defaults when storage is empty (and not overwriting existing data)
 *  - CRUD for tenants, payments and maintenance items (read-modify-write via mocked backend)
 *  - Platform branching: web (localStorage) vs native (SecureStore)
 *  - clearAllData removing every key on both platforms
 *  - getUserName / getUserRole fallbacks
 */

import { Platform } from "react";
import * as SecureStore from "expo-secure-store";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, Platform: { OS: "web", select: (obj: Record<string, unknown>) => obj.web ?? obj.default } };
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => (key in store ? store[key] : null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    __reset: () => {
      store = {};
      jest.clearAllMocks();
    },
  };
})();

// jsdom is not configured: inject our localStorage stub onto globalThis
(globalThis as any).localStorage = localStorageMock;

import { storageService, type Payment, type Tenant } from "../storageService";

const mockedSecureStore = jest.mocked(SecureStore);

const sampleTenant: Tenant = {
  id: "t99",
  name: "Test Tenant",
  initials: "TT",
  unit: "Z-001",
  property: "Test Property",
  rent: 1000,
  due: "01 Oct",
  tenure: "Oct 2026 – Sep 2027",
  phone: "+91 90000 00000",
  color: "#FFFFFF",
};

const samplePayment: Payment = {
  id: "pay99",
  tenant: "Test Tenant",
  unit: "Z-001",
  type: "Monthly rent",
  amount: 1000,
  date: "01 Oct 2026",
  status: "Paid",
};

const storageKeys = [
  "properties",
  "tenants",
  "units",
  "payments",
  "maintenance",
  "user_role",
  "user_name",
];

let platformOS: string;
Object.defineProperty(Platform, "OS", { get: () => platformOS, configurable: true });

beforeEach(() => {
  localStorageMock.__reset();
  mockedSecureStore.setItemAsync.mockReset().mockResolvedValue(undefined);
  mockedSecureStore.getItemAsync.mockReset().mockResolvedValue(null);
  mockedSecureStore.deleteItemAsync.mockReset().mockResolvedValue(undefined);
  platformOS = "web";
});

describe("initialize", () => {
  test("seeds defaults when storage is empty", async () => {
    await storageService.initialize();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "properties",
      expect.stringContaining("Cedar Heights"),
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "tenants",
      expect.stringContaining("Aarav Mehta"),
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "payments",
      expect.stringContaining("Monthly rent"),
    );
  });

  test("does not overwrite existing data", async () => {
    localStorageMock.setItem("tenants", JSON.stringify([sampleTenant]));
    await storageService.initialize();
    const stored = JSON.parse(localStorageMock.getItem("tenants") as string);
    expect(stored).toEqual([sampleTenant]);
  });
});

describe("payments CRUD", () => {
  test("addPayment persists the payment", async () => {
    await storageService.addPayment(samplePayment);
    const payments = await storageService.getPayments();
    expect(payments).toEqual(expect.arrayContaining([samplePayment]));
  });

  test("updatePayment merges updates by id", async () => {
    await storageService.addPayment(samplePayment);
    await storageService.updatePayment(samplePayment.id, { status: "Overdue" });
    const payments = await storageService.getPayments();
    expect(payments.find((p) => p.id === samplePayment.id)?.status).toBe(
      "Overdue",
    );
  });

  test("deletePayment removes the payment", async () => {
    await storageService.addPayment(samplePayment);
    await storageService.deletePayment(samplePayment.id);
    const payments = await storageService.getPayments();
    expect(payments.find((p) => p.id === samplePayment.id)).toBeUndefined();
  });
});

describe("tenants CRUD", () => {
  test("addTenant, updateTenant and deleteTenant work end to end", async () => {
    await storageService.addTenant(sampleTenant);
    expect(
      (await storageService.getTenants()).find((t) => t.id === "t99"),
    ).toBeTruthy();

    await storageService.updateTenant("t99", { rent: 2000 });
    expect(
      (await storageService.getTenants()).find((t) => t.id === "t99")?.rent,
    ).toBe(2000);

    await storageService.deleteTenant("t99");
    expect(
      (await storageService.getTenants()).find((t) => t.id === "t99"),
    ).toBeUndefined();
  });
});

describe("maintenance CRUD", () => {
  test("addMaintenance and updateMaintenance persist items", async () => {
    const item = {
      id: "m99",
      title: "Fix tap",
      unit: "Z-001",
      date: "01 Oct 2026",
      status: "Open" as const,
      cost: 100,
    };
    await storageService.addMaintenance(item);
    await storageService.updateMaintenance("m99", { status: "Completed" });
    const items = await storageService.getMaintenance();
    expect(items.find((m) => m.id === "m99")?.status).toBe("Completed");
  });
});

describe("concurrent mutations are serialized", () => {
  test("two concurrent addPayment calls both persist", async () => {
    const a = { ...samplePayment, id: "pay-a" };
    const b = { ...samplePayment, id: "pay-b" };
    await Promise.all([
      storageService.addPayment(a),
      storageService.addPayment(b),
    ]);
    const payments = await storageService.getPayments();
    expect(payments.find((p) => p.id === "pay-a")).toBeTruthy();
    expect(payments.find((p) => p.id === "pay-b")).toBeTruthy();
  });
});

describe("platform branching", () => {
  test("uses localStorage on web", async () => {
    platformOS = "web";
    await storageService.saveUserName("Web User");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "user_name",
      JSON.stringify("Web User"),
    );
    expect(mockedSecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  test("uses SecureStore on native", async () => {
    platformOS = "ios";
    await storageService.saveUserName("Native User");
    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
      "user_name",
      JSON.stringify("Native User"),
    );
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });
});

describe("clearAllData", () => {
  test("removes every key on web", async () => {
    await storageService.saveUserName("x");
    await storageService.clearAllData();
    for (const key of storageKeys) {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
    }
    expect(await storageService.getUserName()).toBe("Anika Kapoor");
  });

  test("removes every key on native", async () => {
    platformOS = "android";
    await storageService.clearAllData();
    for (const key of storageKeys) {
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(key);
    }
  });
});

describe("user data fallbacks", () => {
  test("getUserName falls back to default when unset", async () => {
    expect(await storageService.getUserName()).toBe("Anika Kapoor");
  });

  test("getUserRole falls back to owner when unset", async () => {
    expect(await storageService.getUserRole()).toBe("owner");
  });
});
