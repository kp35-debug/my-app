import { expect, it } from "@jest/globals";
import { createEmptyAppState } from "../models";

it("creates a versioned empty workspace with every collection present", () => {
  expect(createEmptyAppState("owner-1")).toEqual({
    version: 1,
    ownerId: "owner-1",
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
});
