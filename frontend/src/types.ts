export type Role = 'VENDOR' | 'RECIPIENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  org_name?: string;
  org_type?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  verified?: number;
}

export type FoodCategory = 'BAKERY' | 'COOKED_MEALS' | 'PRODUCE' | 'DAIRY' | 'PACKAGED';
export type ListingStatus = 'AVAILABLE' | 'CLAIMED' | 'COLLECTED' | 'EXPIRED' | 'CANCELLED';
export type SafeTemperature = 'ROOM' | 'REFRIGERATED' | 'HEATED';

export interface Listing {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  portion_estimate: number;
  dietary_flags: string[];
  safe_temperature: SafeTemperature;
  packaging_type: string;
  allergen_info: string;
  address: string;
  latitude: number;
  longitude: number;
  pickup_start: string;
  pickup_deadline: string;
  status: ListingStatus;
  handover_pin?: string;
  notes?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  distance_km?: number;
  vendor_name?: string;
  vendor_org_name?: string;
  vendor_org_type?: string;
  vendor_phone?: string;
  claim?: Claim;
}

export interface Claim {
  id: string;
  listing_id: string;
  recipient_id: string;
  status: 'PENDING_PICKUP' | 'COMPLETED' | 'CANCELLED';
  claim_time: string;
  pickup_time?: string;
  recipient_notes?: string;
  volunteer_name?: string;
  volunteer_phone?: string;
  handover_confirmed_at?: string;
  created_at: string;
  // Join fields
  title?: string;
  description?: string;
  category?: FoodCategory;
  quantity?: number;
  unit?: string;
  portion_estimate?: number;
  address?: string;
  pickup_deadline?: string;
  safe_temperature?: SafeTemperature;
  allergen_info?: string;
  handover_pin?: string;
  listing_status?: ListingStatus;
  vendor_name?: string;
  vendor_org_name?: string;
  vendor_phone?: string;
  recipient_name?: string;
  recipient_org_name?: string;
  recipient_phone?: string;
}

export interface SDGMetrics {
  sdg_target: string;
  total_batches_listed: number;
  total_batches_collected: number;
  active_batches_available: number;
  batches_claimed_pending_pickup: number;
  batches_expired: number;
  total_meals_saved: number;
  total_food_diverted_kg: number;
  co2e_reduction_kg: number;
  registered_vendors: number;
  registered_recipients: number;
}

export interface AuditLog {
  id: string;
  event_type: string;
  actor_id: string;
  actor_name?: string;
  actor_role?: string;
  listing_id?: string;
  details: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: string;
}

