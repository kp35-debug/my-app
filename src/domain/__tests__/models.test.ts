import { createEmptyAppState } from '../models';
import { createId, toIsoDate } from '../ids';

describe('domain model foundation', () => {
  it('creates a versioned empty workspace with every collection present', () => {
    expect(createEmptyAppState('owner-1')).toEqual({
      version: 1,
      ownerId: 'owner-1',
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

  it('creates a prefixed identifier', () => {
    expect(createId('tenant')).toMatch(/^tenant-/);
  });

  it('formats dates as calendar ISO dates', () => {
    expect(toIsoDate(new Date(2026, 8, 4))).toBe('2026-09-04');
  });
});
