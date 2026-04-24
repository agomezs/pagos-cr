import { createLine, markLinePaid, unmarkLinePaid, markLinesOverdue } from '../db/chargeLines';

const mockRunSync = jest.fn();
const mockGetAllSync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: mockRunSync,
    getAllSync: mockGetAllSync,
  })),
}));

beforeEach(() => jest.clearAllMocks());

describe('createLine', () => {
  it('inserts with pending status and all fields', () => {
    createLine({ id: 'l-1', charge_id: 'ch-1', concept: 'Mensualidad', amount: 210000, description: 'Lucas', type: 'recurring' });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, ...args] = mockRunSync.mock.calls[0];
    expect(sql).toContain("'pending'");
    expect(args).toContain('l-1');
    expect(args).toContain('ch-1');
    expect(args).toContain('Mensualidad');
    expect(args).toContain(210000);
    expect(args).toContain('Lucas');
    expect(args).toContain('recurring');
  });

  it('passes null description through', () => {
    createLine({ id: 'l-2', charge_id: 'ch-1', concept: 'Ballet', amount: 25000, description: null, type: 'extra' });
    const [, , , , , description] = mockRunSync.mock.calls[0];
    expect(description).toBeNull();
  });
});

describe('markLinePaid', () => {
  it('sets status to paid with method and date', () => {
    markLinePaid('l-1', 'sinpe', '2026-05-03');
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, method, paidAt] = mockRunSync.mock.calls[0];
    expect(sql).toContain("status = 'paid'");
    expect(sql).toContain("status IN ('pending', 'overdue')");
    expect(method).toBe('sinpe');
    expect(paidAt).toBe('2026-05-03');
  });

  it('includes the line id in the args', () => {
    markLinePaid('l-42', 'cash', '2026-05-03');
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('l-42');
  });

  it('accepts all three payment methods', () => {
    for (const method of ['sinpe', 'transfer', 'cash'] as const) {
      jest.clearAllMocks();
      markLinePaid('l-1', method, '2026-05-03');
      const [, m] = mockRunSync.mock.calls[0];
      expect(m).toBe(method);
    }
  });
});

describe('unmarkLinePaid', () => {
  it('clears payment fields in the query', () => {
    unmarkLinePaid('l-1');
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql] = mockRunSync.mock.calls[0];
    expect(sql).toContain('payment_method = NULL');
    expect(sql).toContain('paid_at = NULL');
  });

  it('only targets lines with paid status', () => {
    unmarkLinePaid('l-1');
    const [sql] = mockRunSync.mock.calls[0];
    expect(sql).toContain("status = 'paid'");
  });

  it('restores overdue for past-due recurring lines', () => {
    unmarkLinePaid('l-1');
    const [sql] = mockRunSync.mock.calls[0];
    expect(sql).toContain("'overdue'");
    expect(sql).toContain("type = 'recurring'");
    expect(sql).toContain("date('now')");
  });

  it('includes the line id in args', () => {
    unmarkLinePaid('l-99');
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('l-99');
  });
});

describe('markLinesOverdue', () => {
  it('targets only pending recurring lines for the given charge', () => {
    markLinesOverdue('ch-1');
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, , charge_id] = mockRunSync.mock.calls[0];
    expect(sql).toContain("status = 'overdue'");
    expect(sql).toContain("status = 'pending'");
    expect(sql).toContain("type = 'recurring'");
    expect(charge_id).toBe('ch-1');
  });
});
