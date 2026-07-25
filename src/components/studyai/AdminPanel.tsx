'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Crown, Search, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { WabiSabiCard } from './WabiSabiCard';
import { ZenButton } from './ZenButton';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  plan: 'FREE' | 'SAMURAI' | 'SENSEI';
  createdAt: string;
}

const planLabels: Record<string, string> = { FREE: 'Shojin', SAMURAI: 'Samurai', SENSEI: 'Sensei' };
const planColors: Record<string, string> = { FREE: 'var(--ws-text-tertiary)', SAMURAI: 'var(--ws-accent)', SENSEI: 'var(--ws-gold)' };

export function AdminPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) setUsers(data.users);
      else setMsg({ type: 'error', text: data.error });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao buscar usuários' });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchUsers]);

  const changePlan = async (userId: string, plan: string) => {
    setSavingId(userId);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan: data.user.plan } : u)));
        setMsg({ type: 'success', text: `Plano de ${data.user.name} alterado para ${planLabels[plan]}` });
      } else {
        setMsg({ type: 'error', text: data.error });
      }
    } catch {
      setMsg({ type: 'error', text: 'Erro ao atualizar plano' });
    }
    setSavingId(null);
  };

  const changeRole = async (userId: string, role: string) => {
    setSavingId(userId);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u)));
        setMsg({ type: 'success', text: `Role de ${data.user.name} alterado para ${role}` });
      } else {
        setMsg({ type: 'error', text: data.error });
      }
    } catch {
      setMsg({ type: 'error', text: 'Erro ao atualizar role' });
    }
    setSavingId(null);
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${name}?`)) return;
    setSavingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setMsg({ type: 'success', text: `Usuário ${name} removido` });
      } else {
        const data = await res.json();
        setMsg({ type: 'error', text: data.error });
      }
    } catch {
      setMsg({ type: 'error', text: 'Erro ao deletar' });
    }
    setSavingId(null);
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    samurai: users.filter((u) => u.plan === 'SAMURAI').length,
    sensei: users.filter((u) => u.plan === 'SENSEI').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">
            <Shield size={22} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
            Painel Administrativo
          </h1>
          <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Gerencie usuários, planos e permissões</p>
        </div>
        <ZenButton variant="secondary" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
        </ZenButton>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <WabiSabiCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-ink) 8%, transparent)' }}>
              <Users size={18} className="text-[var(--ws-text-secondary)]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">{stats.total}</p>
              <p className="text-xs text-[var(--ws-text-tertiary)]">Total de Usuários</p>
            </div>
          </div>
        </WabiSabiCard>
        <WabiSabiCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 8%, transparent)' }}>
              <Shield size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">{stats.admins}</p>
              <p className="text-xs text-[var(--ws-text-tertiary)]">Administradores</p>
            </div>
          </div>
        </WabiSabiCard>
        <WabiSabiCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 8%, transparent)' }}>
              <Crown size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">{stats.samurai}</p>
              <p className="text-xs text-[var(--ws-text-tertiary)]">Samurai</p>
            </div>
          </div>
        </WabiSabiCard>
        <WabiSabiCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-gold) 12%, transparent)' }}>
              <Crown size={18} style={{ color: 'var(--ws-gold)' }} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">{stats.sensei}</p>
              <p className="text-xs text-[var(--ws-text-tertiary)]">Sensei</p>
            </div>
          </div>
        </WabiSabiCard>
      </div>

      {/* Message */}
      {msg && (
        <div className={`mb-4 rounded-ws-button px-4 py-2.5 text-sm ${
          msg.type === 'success' ? 'bg-[color-mix(in_srgb,var(--ws-verdigris)_12%,transparent)] text-[var(--ws-verdigris)]' : 'bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] text-[var(--ws-accent)]'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ws-text-tertiary)]" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] py-2.5 pl-10 pr-4 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
        />
      </div>

      {/* Users Table */}
      <WabiSabiCard hover={false} className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--ws-text-tertiary)]">
            {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--ws-glass-border)]">
                  <th className="px-6 py-3 font-medium text-[var(--ws-text-tertiary)]">Usuário</th>
                  <th className="px-4 py-3 font-medium text-[var(--ws-text-tertiary)]">Plano</th>
                  <th className="px-4 py-3 font-medium text-[var(--ws-text-tertiary)]">Role</th>
                  <th className="px-4 py-3 font-medium text-[var(--ws-text-tertiary)]">Desde</th>
                  <th className="px-4 py-3 font-medium text-[var(--ws-text-tertiary)]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--ws-glass-border)] last:border-0 transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_2%,transparent)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--ws-glass-border)] text-xs font-bold text-[var(--ws-accent)]">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--ws-text-primary)]">{u.name}</p>
                          <p className="text-xs text-[var(--ws-text-tertiary)]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={u.plan}
                        onChange={(e) => changePlan(u.id, e.target.value)}
                        disabled={savingId === u.id}
                        className="rounded-ws-button border border-[var(--ws-glass-border)] bg-transparent px-2 py-1 text-sm font-medium outline-none focus:border-[var(--ws-accent)]/30"
                        style={{ color: planColors[u.plan] }}
                      >
                        <option value="FREE">Shojin (Free)</option>
                        <option value="SAMURAI">Samurai (R$29)</option>
                        <option value="SENSEI">Sensei (R$59)</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        disabled={savingId === u.id}
                        className="rounded-ws-button border border-[var(--ws-glass-border)] bg-transparent px-2 py-1 text-sm font-medium outline-none focus:border-[var(--ws-accent)]/30"
                      >
                        <option value="USER">Usuário</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--ws-text-tertiary)]">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => deleteUser(u.id, u.name)}
                        disabled={savingId === u.id}
                        className="rounded-ws-button p-1.5 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] hover:text-[var(--ws-accent)] disabled:opacity-50"
                        title="Deletar usuário"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WabiSabiCard>
    </motion.div>
  );
}
