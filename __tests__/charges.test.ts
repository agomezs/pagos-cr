import {
  getSummary,
  createCharge,
  markOverdue,
  listCharges,
  listChargesByContact,
  listChargesForPeriod,
  listChargesByContactInPeriod,
  generateChargesForPeriod,
} from '../db/charges';

const mockRunSync = jest.fn();
const mockGetAllSync = jest.fn();
const mockWithTransactionSync = jest.fn((fn: () => void) => fn());

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: mockRunSync,
    getAllSync: mockGetAllSync,
    withTransactionSync: mockWithTransactionSync,
  })),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid'),
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
  it('inserts with period and pending status', () => {
    createCharge({ id: 'c-1', contact_id: 'co-1', period: '2026-05', due_date: '2026-05-01' });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, ...args] = mockRunSync.mock.calls[0];
    expect(sql).toContain("'pending'");
    expect(args).toContain('c-1');
    expect(args).toContain('co-1');
    expect(args).toContain('2026-05');
    expect(args).toContain('2026-05-01');
  });
});

describe('listCharges', () => {
  const charge = { id: 'ch-1', contact_id: 'co-1', contact_name: 'Ana', period: '2026-05', due_date: '2026-05-01', status: 'pending', created_at: '', updated_at: '' };
  const line = { id: 'l-1', charge_id: 'ch-1', concept: 'Mensualidad', amount: 35000, type: 'recurring', status: 'pending', description: null, payment_method: null, paid_at: null, created_at: '', updated_at: '' };

  it('returns charges with their lines', () => {
    mockGetAllSync
      .mockReturnValueOnce([charge])
      .mockReturnValueOnce([line]);
    const result = listCharges();
    expect(result).toHaveLength(1);
    expect(result[0].lines).toHaveLength(1);
  });

  it('passes period filter arg to SQL when provided', () => {
    mockGetAllSync.mockReturnValue([]);
    listCharges({ period: '2026-05' });
    const [sql, ...args] = mockGetAllSync.mock.calls[0];
    expect(sql).toContain('c.period = ?');
    expect(args).toContain('2026-05');
  });

  it('passes null period args when period is not provided (no period filter)', () => {
    mockGetAllSync.mockReturnValue([]);
    listCharges();
    const args = mockGetAllSync.mock.calls[0];
    // period placeholder appears twice (? IS NULL OR c.period = ?)
    const nullCount = args.filter((a: unknown) => a === null).length;
    expect(nullCount).toBeGreaterThanOrEqual(2);
  });

  it('passes status filter arg to SQL when provided', () => {
    mockGetAllSync.mockReturnValue([]);
    listCharges({ status: 'overdue' });
    const args = mockGetAllSync.mock.calls[0];
    expect(args).toContain('overdue');
  });

  it('passes contact_id filter arg to SQL when provided', () => {
    mockGetAllSync.mockReturnValue([]);
    listCharges({ contact_id: 'co-1' });
    const args = mockGetAllSync.mock.calls[0];
    expect(args).toContain('co-1');
  });

  it('SQL orders overdue before pending before paid in the ORDER BY clause', () => {
    mockGetAllSync.mockReturnValue([]);
    listCharges();
    const [sql] = mockGetAllSync.mock.calls[0];
    const orderBy = sql.slice(sql.toUpperCase().indexOf('ORDER BY'));
    const overduePos = orderBy.indexOf("'overdue'");
    const pendingPos = orderBy.indexOf("'pending'");
    const paidPos   = orderBy.indexOf("'paid'");
    expect(overduePos).toBeGreaterThan(-1);
    expect(pendingPos).toBeGreaterThan(overduePos);
    expect(paidPos).toBeGreaterThan(pendingPos);
  });
});

describe('listChargesByContact', () => {
  it('returns charges with their lines for a given contact', () => {
    const charge = { id: 'ch-1', contact_id: 'co-1', contact_name: 'Ana', period: '2026-05', due_date: '2026-05-01', status: 'pending', created_at: '', updated_at: '' };
    const line = { id: 'l-1', charge_id: 'ch-1', concept: 'Mensualidad', amount: 35000, type: 'recurring', status: 'pending', description: null, payment_method: null, paid_at: null, created_at: '', updated_at: '' };
    mockGetAllSync
      .mockReturnValueOnce([charge])  // charges query
      .mockReturnValueOnce([line]);   // lines query for ch-1
    const result = listChargesByContact('co-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ch-1');
    const lines = result[0].lines ?? [];
    expect(lines).toHaveLength(1);
    expect(lines[0].concept).toBe('Mensualidad');
  });

  it('returns empty array when contact has no charges', () => {
    mockGetAllSync.mockReturnValueOnce([]);
    expect(listChargesByContact('co-999')).toEqual([]);
  });

  it('queries by contact_id', () => {
    mockGetAllSync.mockReturnValueOnce([]);
    listChargesByContact('co-1');
    const [sql, contactId] = mockGetAllSync.mock.calls[0];
    expect(sql).toContain('contact_id = ?');
    expect(contactId).toBe('co-1');
  });
});

describe('listChargesForPeriod', () => {
  it('passes period twice to the query (current period + unpaid past periods)', () => {
    mockGetAllSync.mockReturnValue([]);
    listChargesForPeriod('2026-05');
    const [sql, p1, p2] = mockGetAllSync.mock.calls[0];
    expect(sql).toContain('period = ?');
    expect(sql).toContain('period < ?');
    expect(p1).toBe('2026-05');
    expect(p2).toBe('2026-05');
  });

  it('returns charges with their lines', () => {
    const charge = { id: 'ch-1', contact_id: 'co-1', contact_name: 'Ana', period: '2026-05', due_date: '2026-05-01', status: 'pending', created_at: '', updated_at: '' };
    const line = { id: 'l-1', charge_id: 'ch-1', concept: 'Mensualidad', amount: 35000, type: 'recurring', status: 'pending', description: null, payment_method: null, paid_at: null, created_at: '', updated_at: '' };
    mockGetAllSync
      .mockReturnValueOnce([charge])
      .mockReturnValueOnce([line]);
    const result = listChargesForPeriod('2026-05');
    expect(result).toHaveLength(1);
    expect(result[0].period).toBe('2026-05');
    expect(result[0].lines).toHaveLength(1);
  });

  it('SQL orders overdue before pending before paid in the ORDER BY clause', () => {
    mockGetAllSync.mockReturnValue([]);
    listChargesForPeriod('2026-05');
    const [sql] = mockGetAllSync.mock.calls[0];
    const orderBy = sql.slice(sql.toUpperCase().indexOf('ORDER BY'));
    const overduePos = orderBy.indexOf("'overdue'");
    const pendingPos = orderBy.indexOf("'pending'");
    const paidPos   = orderBy.indexOf("'paid'");
    expect(overduePos).toBeGreaterThan(-1);
    expect(pendingPos).toBeGreaterThan(overduePos);
    expect(paidPos).toBeGreaterThan(pendingPos);
  });

  it('excludes paid charges from past periods', () => {
    mockGetAllSync.mockReturnValue([]);
    listChargesForPeriod('2026-05');
    const [sql] = mockGetAllSync.mock.calls[0];
    // Past-period condition must exclude paid
    expect(sql).toContain("status != 'paid'");
  });
});

describe('listChargesByContactInPeriod', () => {
  it('filters by contact_id and period', () => {
    mockGetAllSync.mockReturnValue([]);
    listChargesByContactInPeriod('co-1', '2026-05');
    const [sql, contactId, p1, p2] = mockGetAllSync.mock.calls[0];
    expect(sql).toContain('contact_id = ?');
    expect(sql).toContain('period = ?');
    expect(sql).toContain('period < ?');
    expect(contactId).toBe('co-1');
    expect(p1).toBe('2026-05');
    expect(p2).toBe('2026-05');
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

  it('only targets recurring lines, not extra lines', () => {
    mockGetAllSync.mockReturnValue([]);
    markOverdue();
    const [sql] = mockRunSync.mock.calls[0];
    expect(sql).toContain("type = 'recurring'");
  });

  it('syncs charge status for each stale charge returned by the second query', () => {
    // First getAllSync returns stale charges; each triggers a runSync for syncChargeStatus
    mockGetAllSync.mockReturnValueOnce([{ id: 'ch-1' }, { id: 'ch-2' }]);
    markOverdue();
    // 1 UPDATE for lines + 2 UPDATE for syncChargeStatus
    expect(mockRunSync).toHaveBeenCalledTimes(3);
    const statusUpdateSqls = mockRunSync.mock.calls.slice(1).map(([sql]: [string]) => sql);
    for (const sql of statusUpdateSqls) {
      expect(sql).toContain('UPDATE charges SET status');
    }
  });

  it('does not call syncChargeStatus when no stale charges exist', () => {
    mockGetAllSync.mockReturnValueOnce([]);
    markOverdue();
    expect(mockRunSync).toHaveBeenCalledTimes(1);
  });
});

describe('generateChargesForPeriod', () => {
  it('inserts one charge and lines per contact', () => {
    const templates = [
      { contact_id: 'co-1', template_id: 't-1', concept: 'Mensualidad', amount: null, template_amount: 210000, description: null, type: 'recurring' },
      { contact_id: 'co-2', template_id: 't-1', concept: 'Mensualidad', amount: 150000, template_amount: 210000, description: null, type: 'recurring' },
    ];
    mockGetAllSync.mockReturnValueOnce(templates);
    mockRunSync.mockReturnValue({ changes: 1 });

    generateChargesForPeriod('2026-05', '2026-05-02');

    expect(mockWithTransactionSync).toHaveBeenCalledTimes(1);
    // 2 charge inserts + 2 line inserts = 4 runSync calls
    expect(mockRunSync).toHaveBeenCalledTimes(4);
  });

  it('skips contacts whose charge already exists for the period (idempotency)', () => {
    const templates = [
      { contact_id: 'co-1', template_id: 't-1', concept: 'Mensualidad', amount: null, template_amount: 210000, description: null, type: 'recurring' },
    ];
    mockGetAllSync.mockReturnValueOnce(templates);
    // changes === 0 means unique index rejected the insert
    mockRunSync.mockReturnValue({ changes: 0 });

    generateChargesForPeriod('2026-05', '2026-05-02');

    // charge INSERT OR IGNORE called, but no line inserts since changes === 0
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql] = mockRunSync.mock.calls[0];
    expect(sql).toContain('INSERT OR IGNORE');
  });

  it('uses contact_templates.amount override over template default', () => {
    const templates = [
      { contact_id: 'co-1', template_id: 't-1', concept: 'Mensualidad', amount: 150000, template_amount: 210000, description: null, type: 'recurring' },
    ];
    mockGetAllSync.mockReturnValueOnce(templates);
    mockRunSync.mockReturnValue({ changes: 1 });

    generateChargesForPeriod('2026-05', '2026-05-02');

    // Line insert is the second runSync call; amount arg should be 150000 (the override)
    const lineCall = mockRunSync.mock.calls[1];
    expect(lineCall).toContain(150000);
    expect(lineCall).not.toContain(210000);
  });
});
