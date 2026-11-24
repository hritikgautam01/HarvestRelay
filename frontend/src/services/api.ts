import { Listing, Claim, SDGMetrics, User, AuditLog } from '../types';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('harvest_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async demoLogin(roleOrId: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/demo-login?userId=${encodeURIComponent(roleOrId)}&role=${encodeURIComponent(roleOrId)}`);
    if (!res.ok) throw new Error('Demo login failed');
    const data = await res.json();
    localStorage.setItem('harvest_token', data.token);
    return data;
  },

  async login(email: string, password?: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('harvest_token', data.token);
    return data;
  },

  async register(body: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem('harvest_token', data.token);
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  // Listings
  async getListings(params: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    category?: string;
    status?: string;
    dietary?: string;
    search?: string;
    vendorId?: string;
  } = {}): Promise<Listing[]> {
    const query = new URLSearchParams();
    if (params.lat !== undefined) query.set('lat', params.lat.toString());
    if (params.lng !== undefined) query.set('lng', params.lng.toString());
    if (params.radiusKm !== undefined) query.set('radiusKm', params.radiusKm.toString());
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.dietary && params.dietary !== 'ALL') query.set('dietary', params.dietary);
    if (params.search) query.set('search', params.search);
    if (params.vendorId) query.set('vendorId', params.vendorId);

    const res = await fetch(`${API_BASE}/listings?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch listings');
    return res.json();
  },

  async getListing(id: string): Promise<Listing> {
    const res = await fetch(`${API_BASE}/listings/${id}`);
    if (!res.ok) throw new Error('Failed to fetch listing');
    return res.json();
  },

  async createListing(body: any): Promise<Listing> {
    const res = await fetch(`${API_BASE}/listings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create listing');
    }
    return res.json();
  },

  async closeListing(id: string): Promise<Listing> {
    const res = await fetch(`${API_BASE}/listings/${id}/close`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to close listing');
    return res.json();
  },

  async resetTimers(): Promise<any> {
    const res = await fetch(`${API_BASE}/listings/reset-timers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to reset timers');
    return res.json();
  },

  // Claims
  async claimListing(listingId: string, body: {
    recipient_notes?: string;
    volunteer_name?: string;
    volunteer_phone?: string;
    declaration_accepted: boolean;
  }): Promise<{ success: boolean; claim: Claim; listing: Listing; message: string }> {
    const res = await fetch(`${API_BASE}/claims/${listingId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Claim failed');
    }
    return res.json();
  },

  async confirmHandover(claimId: string, handoverPin: string): Promise<any> {
    const res = await fetch(`${API_BASE}/claims/${claimId}/handover`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ handover_pin: handoverPin }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Handover confirmation failed');
    }
    return res.json();
  },

  async cancelClaim(claimId: string, reason?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/claims/${claimId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to cancel claim');
    return res.json();
  },

  async getMyClaims(): Promise<Claim[]> {
    const res = await fetch(`${API_BASE}/claims/my-claims`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch claims');
    return res.json();
  },

  async getVendorClaims(): Promise<Claim[]> {
    const res = await fetch(`${API_BASE}/claims/vendor-claims`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch vendor claims');
    return res.json();
  },

  // Admin
  async getAdminMetrics(): Promise<SDGMetrics> {
    const res = await fetch(`${API_BASE}/admin/metrics`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch admin users');
    return res.json();
  },

  async toggleUserVerification(userId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle verification');
    return res.json();
  },

  async getAdminLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/admin/logs`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },
};

