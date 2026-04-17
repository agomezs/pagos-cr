export type Client = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ChargeStatus = 'pending' | 'overdue' | 'paid';
export type PaymentMethod = 'sinpe' | 'transfer' | 'cash';

export type Charge = {
  id: string;
  client_id: string;
  concept: string;
  amount: number;
  due_date: string;
  status: ChargeStatus;
  payment_method: PaymentMethod | null;
  payment_note: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  client_name?: string;
};

export type Summary = {
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
};

export type ChargeFilters = {
  status?: ChargeStatus | null;
  client_id?: string | null;
  date_from?: string | null;
  date_to?: string | null;
};

export type ChargeTemplate = {
  id: string;
  concept: string;
  amount: number;
  created_at: string;
  updated_at: string;
};
