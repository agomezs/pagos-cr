import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from '../db/chargeTemplates';

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

describe('listTemplates', () => {
  it('returns templates from db', () => {
    const row = { id: 't1', concept: 'Mensualidad', amount: 120000, type: 'recurring', created_at: '', updated_at: '' };
    mockGetAllSync.mockReturnValue([row]);
    expect(listTemplates()).toEqual([row]);
  });

  it('returns empty array when no templates', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(listTemplates()).toEqual([]);
  });
});

describe('createTemplate', () => {
  it('calls runSync with id, concept, amount, and type', () => {
    createTemplate({ id: 'tmpl-1', concept: 'Mensualidad mayo', amount: 120000, type: 'recurring' });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('tmpl-1');
    expect(args).toContain('Mensualidad mayo');
    expect(args).toContain(120000);
    expect(args).toContain('recurring');
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
