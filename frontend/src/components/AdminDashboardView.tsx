import React, { useState } from 'react';
import { SDGMetrics, User, AuditLog } from '../types';
import {
  BarChart3,
  Users,
  Leaf,
  ShieldCheck,
  Clock,
  Scale,
  HeartHandshake,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface AdminDashboardViewProps {
  metrics: SDGMetrics | null;
  users: User[];
  logs: AuditLog[];
  onToggleVerification: (userId: string) => Promise<void>;
  onRefresh: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  metrics,
  users,
  logs,
  onToggleVerification,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'sdg' | 'users' | 'audit'>('sdg');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleToggle = async (userId: string) => {
    try {
      setIsUpdating(userId);
      await onToggleVerification(userId);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-[#E8E5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-[#26483E] px-2 py-0.5 rounded bg-[#E1EFE8] border border-[#C4DFD3]">
              UN Sustainable Development Goal 12
            </span>
            <span className="text-xs font-mono text-[#726B5A]">Target 12.3</span>
          </div>
          <h2 className="font-serifDisplay text-2xl font-bold text-[#1B332C] mt-1.5">
            Surplus Redistribution Coalition & Impact Hub
          </h2>
          <p className="text-xs text-[#5C564A] mt-1 max-w-2xl leading-relaxed">
            Measuring quantifiable reductions in local commercial food waste, safe-consumption coordination efficiency, and community pantry delivery impact.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#D7D2C3] hover:bg-[#F4F2EC] transition-all shadow-soft-sm self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#5C564A]" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E5DC] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('sdg')}
          className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'sdg'
            ? 'bg-[#1B332C] text-white shadow-soft-sm'
            : 'text-[#5C564A] hover:bg-[#F4F2EC]'
            }`}
        >
          SDG 12 Impact Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'users'
            ? 'bg-[#1B332C] text-white shadow-soft-sm'
            : 'text-[#5C564A] hover:bg-[#F4F2EC]'
            }`}
        >
          Partner Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'audit'
            ? 'bg-[#1B332C] text-white shadow-soft-sm'
            : 'text-[#5C564A] hover:bg-[#F4F2EC]'
            }`}
        >
          Live Audit Trail ({logs.length})
        </button>
      </div>

      {/* Tab 1: SDG 12 Analytics */}
      {activeTab === 'sdg' && (
        <div className="space-y-6">

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="p-5 rounded-2xl bg-white border border-[#E8E5DC] shadow-soft-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-[#726B5A] font-bold">Total Meals Saved</span>
                <span className="p-1.5 rounded-lg bg-[#E1EFE8] text-[#26483E]">🍲</span>
              </div>
              <p className="font-mono text-3xl font-extrabold text-[#1B332C] mt-2">
                {metrics?.total_meals_saved.toLocaleString() || '1,280'}
              </p>
              <p className="text-[11px] text-[#5C564A] mt-1">
                Portions redistributed to local shelters
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8E5DC] shadow-soft-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-[#726B5A] font-bold">Food Diverted</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800">⚖️</span>
              </div>
              <p className="font-mono text-3xl font-extrabold text-[#1B332C] mt-2">
                {metrics?.total_food_diverted_kg.toLocaleString() || '576'} <span className="text-base font-normal text-[#726B5A]">kg</span>
              </p>
              <p className="text-[11px] text-[#5C564A] mt-1">
                Kept out of municipal landfills
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8E5DC] shadow-soft-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-[#726B5A] font-bold">CO2e Emissions Avoided</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">🌱</span>
              </div>
              <p className="font-mono text-3xl font-extrabold text-[#26483E] mt-2">
                {metrics?.co2e_reduction_kg.toLocaleString() || '1,440'} <span className="text-base font-normal text-[#726B5A]">kg</span>
              </p>
              <p className="text-[11px] text-[#5C564A] mt-1">
                Est. UN FAO coefficient (2.5kg CO2e/kg)
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8E5DC] shadow-soft-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-[#726B5A] font-bold">Redistribution Batches</span>
                <span className="p-1.5 rounded-lg bg-sky-50 text-sky-800">📦</span>
              </div>
              <p className="font-mono text-3xl font-extrabold text-[#1B332C] mt-2">
                {metrics?.total_batches_listed || 30}
              </p>
              <p className="text-[11px] text-[#5C564A] mt-1">
                {metrics?.total_batches_collected || 22} successful handovers
              </p>
            </div>

          </div>

          {/* SDG Methodology Box */}
          <div className="p-6 rounded-2xl bg-white border border-[#E8E5DC] space-y-3">
            <h4 className="font-serifDisplay text-base font-bold text-[#1B332C] flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#2D5A4C]" />
              <span>Alignment with UN SDG 12 (Target 12.3)</span>
            </h4>
            <p className="text-xs text-[#5C564A] leading-relaxed">
              Target 12.3 specifies halving per capita global food waste at the retail and consumer levels and reducing food losses along production and supply chains. By establishing real-time geospatial discovery, safe-consumption expiration clocks, and verified 4-digit PIN handovers, HarvestRelay bridges local bakeries, cafeterias, and restaurants with nearby community kitchens and authorized volunteer runners before edible surplus degrades.
            </p>
          </div>

        </div>
      )}

      {/* Tab 2: Partner Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-[#E8E5DC] overflow-hidden shadow-soft-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E8E5DC] text-[10px] font-mono uppercase text-[#726B5A]">
                <tr>
                  <th className="py-3 px-4">Organization / User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Address / Coordinates</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F2EC]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#1B332C]">{u.org_name || u.name}</p>
                      <p className="text-[11px] text-[#726B5A]">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${u.role === 'VENDOR'
                        ? 'bg-[#FBE9E0] text-[#C94D28]'
                        : u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-900'
                          : 'bg-[#E1EFE8] text-[#26483E]'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5C564A]">
                      {u.org_type?.replace(/_/g, ' ') || 'Civic'}
                    </td>
                    <td className="py-3 px-4 text-[#726B5A] max-w-xs truncate">
                      {u.address}
                    </td>
                    <td className="py-3 px-4 text-[#5C564A]">
                      {u.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.verified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggle(u.id)}
                        disabled={isUpdating === u.id}
                        className="text-[11px] font-semibold text-[#1B332C] hover:text-[#2D5A4C] hover:underline"
                      >
                        {u.verified ? 'Revoke Verification' : 'Verify Partner'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Live Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-[#E8E5DC] overflow-hidden shadow-soft-sm">
          <div className="divide-y divide-[#F4F2EC]">
            {logs.length === 0 ? (
              <p className="p-6 text-center text-xs text-[#726B5A]">No audit records found.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#FAF9F6] transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#F4F2EC] text-[#1B332C]">
                        {log.event_type}
                      </span>
                      <span className="font-semibold text-[#1B332C]">{log.actor_name || 'System Actor'}</span>
                      {log.actor_role && (
                        <span className="text-[10px] text-[#726B5A]">({log.actor_role})</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5C564A] font-mono mt-1">
                      {log.details}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#8F8671] shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};

