export const LINE_TYPE = {
  recurring: 'recurring',
  extra: 'extra',
} as const;

export const CHARGE_STATUS = {
  pending: 'pending',
  overdue: 'overdue',
  paid: 'paid',
} as const;

export const PAYMENT_METHOD = {
  sinpe: 'sinpe',
  transfer: 'transfer',
  cash: 'cash',
} as const;
