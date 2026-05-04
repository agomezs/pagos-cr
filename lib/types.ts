export type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  monthly_amount: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ChargeStatus = 'pending' | 'overdue' | 'paid';
export type PaymentMethod = 'sinpe' | 'transfer' | 'cash';
export type LineType = 'recurring' | 'extra';

export type ChargeLine = {
  id: string;
  charge_id: string;
  concept: string;
  amount: number;
  description: string | null;
  type: LineType;
  status: ChargeStatus;
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Charge = {
  id: string;
  contact_id: string;
  period: string;
  due_date: string;
  status: ChargeStatus;
  created_at: string;
  updated_at: string;
  // joined
  contact_name?: string;
  lines?: ChargeLine[];
};

export type ChargeTemplate = {
  id: string;
  concept: string;
  amount: number;
  type: LineType;
  personal: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactTemplate = {
  id: string;
  contact_id: string;
  template_id: string;
  amount: number | null;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  // joined from charge_templates
  concept?: string;
  template_amount?: number;
  type?: LineType;
  personal?: boolean;
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
  contact_id?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  period?: string | null;
};
