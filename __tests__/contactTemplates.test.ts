import { listContactTemplates, assignTemplate, removeContactTemplate } from '../db/contactTemplates';

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

describe('listContactTemplates', () => {
  it('coerces active integer to boolean', () => {
    mockGetAllSync.mockReturnValue([
      { id: 'ct1', contact_id: 'c1', template_id: 't1', amount: null, description: null, active: 1, created_at: '', updated_at: '', concept: 'Ballet', template_amount: 25000, type: 'extra', personal: 0 },
    ]);
    const rows = listContactTemplates('c1');
    expect(rows[0].active).toBe(true);
  });

  it('coerces personal integer to boolean', () => {
    mockGetAllSync.mockReturnValue([
      { id: 'ct1', contact_id: 'c1', template_id: 't1', amount: 380000, description: 'Lucas + Clarita', active: 1, created_at: '', updated_at: '', concept: 'Mensualidad', template_amount: 0, type: 'recurring', personal: 1 },
    ]);
    const rows = listContactTemplates('c1');
    expect(rows[0].personal).toBe(true);
    expect(rows[0].amount).toBe(380000);
    expect(rows[0].description).toBe('Lucas + Clarita');
  });

  it('exposes template_amount separately from override amount', () => {
    mockGetAllSync.mockReturnValue([
      { id: 'ct1', contact_id: 'c1', template_id: 't1', amount: 380000, description: null, active: 1, created_at: '', updated_at: '', concept: 'Mensualidad', template_amount: 0, type: 'recurring', personal: 1 },
    ]);
    const rows = listContactTemplates('c1');
    expect(rows[0].amount).toBe(380000);
    expect(rows[0].template_amount).toBe(0);
  });

  it('returns empty array when no assignments', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(listContactTemplates('c1')).toEqual([]);
  });
});

describe('assignTemplate', () => {
  it('inserts with contact_id, template_id, and active=1 in sql', () => {
    assignTemplate('ct-1', 'c1', 't1');
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, ...args] = mockRunSync.mock.calls[0];
    expect(sql).toContain('active');
    expect(sql).toContain('1');
    expect(args).toContain('ct-1');
    expect(args).toContain('c1');
    expect(args).toContain('t1');
  });

  it('passes amount and description overrides when provided', () => {
    assignTemplate('ct-1', 'c1', 't1', 380000, 'Lucas + Clarita');
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain(380000);
    expect(args).toContain('Lucas + Clarita');
  });

  it('passes null for amount and description when not provided', () => {
    assignTemplate('ct-1', 'c1', 't1');
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain(null);
  });
});

describe('removeContactTemplate', () => {
  it('sets active=0 and updates updated_at', () => {
    removeContactTemplate('ct-1');
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, , id] = mockRunSync.mock.calls[0];
    expect(sql).toContain('active = 0');
    expect(sql).toContain('updated_at');
    expect(sql).not.toContain('created_at');
    expect(id).toBe('ct-1');
  });
});
