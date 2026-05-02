import { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate } from '../db/chargeTemplates';

const mockRunSync = jest.fn();
const mockGetAllSync = jest.fn();
const mockGetFirstSync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: mockRunSync,
    getAllSync: mockGetAllSync,
    getFirstSync: mockGetFirstSync,
  })),
}));

beforeEach(() => jest.clearAllMocks());

describe('listTemplates', () => {
  it('coerces personal integer to boolean', () => {
    mockGetAllSync.mockReturnValue([
      { id: 't1', concept: 'Ballet', amount: 25000, type: 'extra', personal: 0, created_at: '', updated_at: '' },
    ]);
    const templates = listTemplates();
    expect(templates[0].personal).toBe(false);
  });

  it('excludes personal templates by default', () => {
    listTemplates();
    const [sql] = mockGetAllSync.mock.calls[0];
    expect(sql).toContain('personal = 0');
  });

  it('includes personal templates when flag is true', () => {
    mockGetAllSync.mockReturnValue([]);
    listTemplates(true);
    const [sql] = mockGetAllSync.mock.calls[0];
    expect(sql).not.toContain('personal = 0');
  });

  it('returns empty array when no templates', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(listTemplates()).toEqual([]);
  });
});

describe('getTemplate', () => {
  it('returns template with boolean personal when found', () => {
    mockGetFirstSync.mockReturnValue(
      { id: 't1', concept: 'Mensualidad', amount: 0, type: 'recurring', personal: 1, created_at: '', updated_at: '' },
    );
    const tpl = getTemplate('t1');
    expect(tpl).not.toBeNull();
    expect(tpl!.personal).toBe(true);
    expect(tpl!.concept).toBe('Mensualidad');
  });

  it('returns null when not found', () => {
    mockGetFirstSync.mockReturnValue(null);
    expect(getTemplate('missing')).toBeNull();
  });
});

describe('createTemplate', () => {
  it('persists concept, amount, type, and personal=false by default', () => {
    createTemplate({ id: 'tmpl-1', concept: 'Ballet', amount: 25000, type: 'extra' });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('tmpl-1');
    expect(args).toContain('Ballet');
    expect(args).toContain(25000);
    expect(args).toContain('extra');
    expect(args).toContain(0);
  });

  it('passes personal=1 when personal is true', () => {
    createTemplate({ id: 'tmpl-2', concept: 'Mensualidad', amount: 0, type: 'recurring', personal: true });
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain(1);
    expect(args).not.toContain(true);
  });
});

describe('updateTemplate', () => {
  it('calls runSync with new concept, amount, and type', () => {
    updateTemplate('tmpl-1', { concept: 'Mensualidad junio', amount: 130000, type: 'extra' });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('tmpl-1');
    expect(args).toContain('Mensualidad junio');
    expect(args).toContain(130000);
    expect(args).toContain('extra');
  });
});

describe('deleteTemplate', () => {
  it('calls runSync with the template id', () => {
    deleteTemplate('tmpl-1');
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, id] = mockRunSync.mock.calls[0];
    expect(sql).toContain('DELETE');
    expect(id).toBe('tmpl-1');
  });
});
