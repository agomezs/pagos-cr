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

import { listClients, getClient, createClient, updateClient, deactivateClient } from '../db/clients';

beforeEach(() => jest.clearAllMocks());

describe('listClients', () => {
  it('returns only active clients mapped to boolean active', () => {
    mockGetAllSync.mockReturnValue([
      { id: '1', name: 'Ana', phone: null, notes: null, active: 1, created_at: '', updated_at: '' },
    ]);
    const clients = listClients();
    expect(clients).toHaveLength(1);
    expect(clients[0].active).toBe(true);
  });

  it('returns empty array when no active clients', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(listClients()).toEqual([]);
  });
});

describe('getClient', () => {
  it('returns client with boolean active when found', () => {
    mockGetFirstSync.mockReturnValue(
      { id: '1', name: 'Ana', phone: '+506 8888-1111', notes: null, active: 1, created_at: '', updated_at: '' },
    );
    const client = getClient('1');
    expect(client).not.toBeNull();
    expect(client!.active).toBe(true);
    expect(client!.phone).toBe('+506 8888-1111');
  });

  it('returns null when client not found', () => {
    mockGetFirstSync.mockReturnValue(null);
    expect(getClient('missing')).toBeNull();
  });
});

describe('createClient', () => {
  it('calls runSync with correct fields', () => {
    createClient({ id: 'uuid-1', name: 'Luis', phone: null, notes: 'VIP' });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('uuid-1');
    expect(args).toContain('Luis');
    expect(args).toContain('VIP');
  });

  it('passes null for missing phone', () => {
    createClient({ id: 'uuid-2', name: 'María', phone: null, notes: null });
    const [_sql, _id, _name, phone] = mockRunSync.mock.calls[0];
    expect(phone).toBeNull();
  });
});

describe('updateClient', () => {
  it('calls runSync with updated fields and id', () => {
    updateClient('uuid-1', { name: 'Luis Updated', phone: '+506 7777-0000', notes: null });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('uuid-1');
    expect(args).toContain('Luis Updated');
    expect(args).toContain('+506 7777-0000');
  });
});

describe('deactivateClient', () => {
  it('calls runSync targeting the client id', () => {
    deactivateClient('uuid-1');
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, , id] = mockRunSync.mock.calls[0];
    expect(sql).toContain('active = 0');
    expect(id).toBe('uuid-1');
  });
});
