// Mock expo-sqlite before any db imports
const mockRunSync = jest.fn();
const mockGetAllSync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: mockRunSync,
    getAllSync: mockGetAllSync,
  })),
}));

// Import after mock is in place
import { getSummary, markPaid, unmarkPaid, createCharge, markOverdue } from '../db/charges';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getSummary', () => {
  it('returns zero summary when no charges exist', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(getSummary()).toEqual({
      totalPending: 0, totalOverdue: 0, totalPaid: 0,
      pendingCount: 0, overdueCount: 0, paidCount: 0,
    });
  });

  it('maps pending rows correctly', () => {
    mockGetAllSync.mockReturnValue([
      { status: 'pending', count: 3, total: 90000 },
    ]);
    const s = getSummary();
    expect(s.totalPending).toBe(90000);
    expect(s.pendingCount).toBe(3);
    expect(s.totalOverdue).toBe(0);
    expect(s.totalPaid).toBe(0);
  });

  it('maps all three statuses', () => {
    mockGetAllSync.mockReturnValue([
      { status: 'pending', count: 2, total: 60000 },
      { status: 'overdue', count: 1, total: 35000 },
      { status: 'paid',    count: 5, total: 150000 },
    ]);
    const s = getSummary();
    expect(s.totalPending).toBe(60000);
    expect(s.pendingCount).toBe(2);
    expect(s.totalOverdue).toBe(35000);
    expect(s.overdueCount).toBe(1);
    expect(s.totalPaid).toBe(150000);
    expect(s.paidCount).toBe(5);
  });

  it('handles null total (no amounts) without crashing', () => {
    mockGetAllSync.mockReturnValue([
      { status: 'pending', count: 1, total: null },
    ]);
    expect(getSummary().totalPending).toBe(0);
  });
});

describe('markPaid', () => {
  it('calls runSync with correct status and fields', () => {
    markPaid('charge-1', 'sinpe', 'ref 12345', '2026-04-20');
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, method, note, paidAt] = mockRunSync.mock.calls[0];
    expect(sql).toContain("status = 'paid'");
    expect(method).toBe('sinpe');
    expect(note).toBe('ref 12345');
    expect(paidAt).toBe('2026-04-20');
  });

  it('passes null note through', () => {
    markPaid('charge-1', 'cash', null, '2026-04-20');
    const [, , note] = mockRunSync.mock.calls[0];
    expect(note).toBeNull();
  });
});

describe('unmarkPaid', () => {
  it('calls runSync targeting the charge id', () => {
    unmarkPaid('charge-42');
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('charge-42');
  });

  it('sets payment fields to NULL in the query', () => {
    unmarkPaid('charge-42');
    const [sql] = mockRunSync.mock.calls[0];
    expect(sql).toContain('payment_method = NULL');
    expect(sql).toContain('paid_at = NULL');
  });
});

describe('createCharge', () => {
  it('inserts with pending status', () => {
    createCharge({ id: 'c-1', client_id: 'cl-1', concept: 'Mensualidad', amount: 120000, due_date: '2026-05-01' });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, ...args] = mockRunSync.mock.calls[0];
    expect(sql).toContain("'pending'");
    expect(args).toContain('c-1');
    expect(args).toContain('cl-1');
    expect(args).toContain(120000);
    expect(args).toContain('2026-05-01');
  });
});

describe('markOverdue', () => {
  it('calls runSync with an UPDATE that targets pending charges past due', () => {
    markOverdue();
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql] = mockRunSync.mock.calls[0];
    expect(sql).toContain("status = 'overdue'");
    expect(sql).toContain("status = 'pending'");
    expect(sql).toContain("due_date < date('now')");
  });
});
