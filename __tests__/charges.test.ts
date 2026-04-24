import { getSummary, createCharge, markOverdue } from '../db/charges';

const mockRunSync = jest.fn();
const mockGetAllSync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: mockRunSync,
    getAllSync: mockGetAllSync,
  })),
}));

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

describe('createCharge', () => {
  it('inserts with pending status', () => {
    createCharge({ id: 'c-1', contact_id: 'co-1', due_date: '2026-05-01' });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, ...args] = mockRunSync.mock.calls[0];
    expect(sql).toContain("'pending'");
    expect(args).toContain('c-1');
    expect(args).toContain('co-1');
    expect(args).toContain('2026-05-01');
  });
});

describe('markOverdue', () => {
  it('calls runSync with an UPDATE that targets pending recurring lines past due', () => {
    mockGetAllSync.mockReturnValue([]);
    markOverdue();
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql] = mockRunSync.mock.calls[0];
    expect(sql).toContain("status = 'overdue'");
    expect(sql).toContain("status = 'pending'");
    expect(sql).toContain("due_date < date('now')");
  });
});
