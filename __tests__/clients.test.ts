import { listContacts, getContact, createContact, updateContact, deactivateContact } from '../db/contacts';

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

describe('listContacts', () => {
  it('returns only active contacts mapped to boolean active', () => {
    mockGetAllSync.mockReturnValue([
      { id: '1', name: 'Ana', phone: null, notes: null, active: 1, created_at: '', updated_at: '' },
    ]);
    const contacts = listContacts();
    expect(contacts).toHaveLength(1);
    expect(contacts[0].active).toBe(true);
  });

  it('returns empty array when no active contacts', () => {
    mockGetAllSync.mockReturnValue([]);
    expect(listContacts()).toEqual([]);
  });
});

describe('getContact', () => {
  it('returns contact with boolean active when found', () => {
    mockGetFirstSync.mockReturnValue(
      { id: '1', name: 'Ana', phone: '+506 8888-1111', notes: null, active: 1, created_at: '', updated_at: '' },
    );
    const contact = getContact('1');
    expect(contact).not.toBeNull();
    expect(contact!.active).toBe(true);
    expect(contact!.phone).toBe('+506 8888-1111');
  });

  it('returns null when contact not found', () => {
    mockGetFirstSync.mockReturnValue(null);
    expect(getContact('missing')).toBeNull();
  });
});

describe('createContact', () => {
  it('calls runSync with correct fields', () => {
    createContact({ id: 'uuid-1', name: 'Luis', phone: null, notes: 'VIP' });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('uuid-1');
    expect(args).toContain('Luis');
    expect(args).toContain('VIP');
  });

  it('passes null for missing phone', () => {
    createContact({ id: 'uuid-2', name: 'María', phone: null, notes: null });
    const [, , , phone] = mockRunSync.mock.calls[0];
    expect(phone).toBeNull();
  });
});

describe('updateContact', () => {
  it('calls runSync with updated fields and id', () => {
    updateContact('uuid-1', { name: 'Luis Updated', phone: '+506 7777-0000', notes: null });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('uuid-1');
    expect(args).toContain('Luis Updated');
    expect(args).toContain('+506 7777-0000');
  });
});

describe('deactivateContact', () => {
  it('calls runSync targeting the contact id', () => {
    deactivateContact('uuid-1');
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const [sql, , id] = mockRunSync.mock.calls[0];
    expect(sql).toContain('active = 0');
    expect(id).toBe('uuid-1');
  });
});
