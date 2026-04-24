const mockRunSync = jest.fn();
const mockGetAllSync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: mockRunSync,
    getAllSync: mockGetAllSync,
  })),
}));

import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from '../db/chargeTemplates';

beforeEach(() => jest.clearAllMocks());

describe('listTemplates', () => {
  it('returns templates from db', () => {
    const row = { id: 't1', concept: 'Mensualidad', amount: 120000, created_at: '', updated_at: '' };
    mockGetAllSync.mockReturnValue([row]);
    expect(listTemplates()).toEqual([row]);
  });

  it('returns empty array when no templates', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(listTemplates()).toEqual([]);
  });
});

describe('createTemplate', () => {
  it('calls runSync with id, concept, and amount', () => {
    createTemplate({ id: 'tmpl-1', concept: 'Mensualidad mayo', amount: 120000 });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('tmpl-1');
    expect(args).toContain('Mensualidad mayo');
    expect(args).toContain(120000);
  });
});

describe('updateTemplate', () => {
  it('calls runSync with new concept and amount', () => {
    updateTemplate('tmpl-1', { concept: 'Mensualidad junio', amount: 130000 });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('tmpl-1');
    expect(args).toContain('Mensualidad junio');
    expect(args).toContain(130000);
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
