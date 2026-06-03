export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'paused'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export type InvoiceStatus = 'paid' | 'open' | 'void' | 'draft' | 'uncollectible';

export interface Invoice {
  id: string;
  account_id: number;
  subscription_id: string;
  stripe_invoice_id: string;
  status: InvoiceStatus;
  subtotal_cents: number;
  discount_cents: number;
  credits_applied_cents: number;
  tax_cents: number;
  total_cents: number;
  attempt_count: number;
  paid_at: string | null;
  due_date: string | null;
  created_at: string;
  verifactu_code: string | null;
}

export type SubscriptionItemType = 'base' | 'chargers' | 'guests' | 'sim' | 'call_center';

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  type: SubscriptionItemType;
  quantity: number;
  unit_price_cents: number;
}

export interface SubscriptionDiscount {
  id: string;
  starts_at: string;
  ends_at: string | null;
  coupon_name: string;
  discount_type: 'percent' | 'fixed_amount';
  discount_value: number;
  applies_to: string;
  duration: 'once' | 'repeating' | 'forever';
  duration_months: number | null;
}

export interface Subscription {
  id: string;
  account_id: number;
  plan_id: string;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  items: SubscriptionItem[];
  discounts: SubscriptionDiscount[];
}

// ----------------------------------------------------------------------
// Plans

export type BillingMode = 'flat' | 'per_unit';

export interface PlanPrice {
  id: string;
  stripePriceId: string | null;
  priceCents: number;
  currency: string;
  billingMode: BillingMode;
}

export interface PlanItem {
  name: string | null;
  stripeProductId: string | null;
  monthly: PlanPrice | null;
  annual: PlanPrice | null;
}

export interface Plan {
  id: string;
  name: string;
  maxGuests: number | null;
  trialDays: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  items: {
    base: PlanItem;
    chargers: PlanItem;
    sim: PlanItem;
    call_center: PlanItem;
    guests: PlanItem;
  };
}

export interface CreatePlanBody {
  name: string;
  maxGuests?: number | null;
  isDefault?: boolean;
  trialDays?: number;
  currency?: string;
  items?: {
    base: { monthlyPriceCents: number; yearlyPriceCents?: number };
    chargers: { monthlyPriceCents: number; yearlyPriceCents?: number };
    sim: { monthlyPriceCents: number; yearlyPriceCents?: number };
    call_center: { monthlyPriceCents: number; yearlyPriceCents?: number };
    guests: { monthlyPriceCents: number; yearlyPriceCents?: number };
  };
}

export interface UpdatePlanBody {
  name?: string;
  maxGuests?: number | null;
  isDefault?: boolean;
  isActive?: boolean;
  trialDays?: number;
  items?: {
    base?: { monthlyPriceCents?: number; yearlyPriceCents?: number };
    chargers?: { monthlyPriceCents?: number; yearlyPriceCents?: number };
    sim?: { monthlyPriceCents?: number; yearlyPriceCents?: number };
    call_center?: { monthlyPriceCents?: number; yearlyPriceCents?: number };
    guests?: { monthlyPriceCents?: number; yearlyPriceCents?: number };
  };
}
