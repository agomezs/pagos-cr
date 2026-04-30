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
      { id: '1', name: 'Ana', phone: null, email: null, notes: null, monthly_amount: null, active: 1, created_at: '', updated_at: '' },
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
  it('returns contact with boolean active and all fields when found', () => {
    mockGetFirstSync.mockReturnValue(
      { id: '1', name: 'Ana', phone: '+506 8888-1111', email: 'ana@gmail.com', notes: 'Lucas', monthly_amount: 380000, active: 1, created_at: '', updated_at: '' },
    );
    const contact = getContact('1');
    expect(contact).not.toBeNull();
    expect(contact!.active).toBe(true);
    expect(contact!.phone).toBe('+506 8888-1111');
    expect(contact!.email).toBe('ana@gmail.com');
    expect(contact!.monthly_amount).toBe(380000);
    expect(contact!.notes).toBe('Lucas');
  });

  it('returns null when contact not found', () => {
    mockGetFirstSync.mockReturnValue(null);
    expect(getContact('missing')).toBeNull();
  });
});

describe('createContact', () => {
  it('persists all fields including email and monthly_amount', () => {
    createContact({ id: 'uuid-1', name: 'Luis', phone: '+506 8888-0000', email: 'luis@gmail.com', notes: 'VIP', monthly_amount: 210000 });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('uuid-1');
    expect(args).toContain('Luis');
    expect(args).toContain('+506 8888-0000');
    expect(args).toContain('luis@gmail.com');
    expect(args).toContain('VIP');
    expect(args).toContain(210000);
  });

  it('passes null for optional fields when omitted', () => {
    createContact({ id: 'uuid-2', name: 'María', phone: null, email: null, notes: null, monthly_amount: null });
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain(null);
  });
});

describe('updateContact', () => {
  it('updates all fields including email and monthly_amount', () => {
    updateContact('uuid-1', { name: 'Luis Updated', phone: '+506 7777-0000', email: 'new@gmail.com', notes: null, monthly_amount: 250000 });
    expect(mockRunSync).toHaveBeenCalledTimes(1);
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain('uuid-1');
    expect(args).toContain('Luis Updated');
    expect(args).toContain('+506 7777-0000');
    expect(args).toContain('new@gmail.com');
    expect(args).toContain(250000);
  });

  it('passes null for cleared optional fields', () => {
    updateContact('uuid-1', { name: 'Luis', phone: null, email: null, notes: null, monthly_amount: null });
    const args = mockRunSync.mock.calls[0];
    expect(args).toContain(null);
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
