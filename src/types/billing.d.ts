export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';

export type SubscriptionItemType = 'base' | 'chargers' | 'guests' | 'sim';

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  type: SubscriptionItemType;
  quantity: number;
  unit_price_cents: number;
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
    guests?: { monthlyPriceCents?: number; yearlyPriceCents?: number };
  };
}
