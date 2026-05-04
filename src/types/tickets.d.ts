export type TicketStatus = 'OPEN' | 'CLOSED' | 'PENDING';
export type TicketType = 'APP' | 'CALL';

export type TicketTracking = {
  id: number;
  ticketId: number;
  message: string;
  author: string;
  createdAt: string;
};

export type Ticket = {
  id: number;
  chargingStationId: number | null;
  appUserId: number | null;
  reason: string;
  description: string;
  status: TicketStatus;
  type: TicketType;
  createdAt: string;
  updatedAt: string;
  chargingStation: { id: number; name: string } | null;
  appUser: { id: number; name: string; email: string; telephone: string | null; } | null;
  tracking: TicketTracking[];
};
