'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Pagination from '@/components/Pagination';
import { apiFetch } from '@/lib/api';
import { Meta, Role, User } from '@/lib/types';

interface FormState {
  name: string;
  email: string;
  password: string;
  role: Role;
  interests: string;
}

const emptyForm: FormState = { name: '', email: '', password: '', role: 'user', interests: '' };

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<User[]>(`/users?page=${page}&limit=5`);
      setUsers(res.data);
      setMeta(res.meta ?? null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const interests = form.interests
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      if (editingId) {
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
          interests,
        };
        // পাসওয়ার্ড ফাঁকা থাকলে পাঠাবো না (পুরনোটাই থাকবে)
        if (form.password) body.password = form.password;

        await apiFetch(`/users/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
        resetForm();
        await load();
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify({ ...form, interests }),
        });
        resetForm();
        if (page === 1) await load();
        else setPage(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (u: User) => {
    setEditingId(u._id);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      interests: u.interests.join(', '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete ${u.name}? Their notes and posts will also be deleted.`)) return;
    try {
      await apiFetch(`/users/${u._id}`, { method: 'DELETE' });
      if (users.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <h1>Manage Users</h1>

      <form className="card" onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
        <strong>{editingId ? 'Edit user' : 'Add user'}</strong>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={editingId ? 'New password (leave empty to keep)' : 'Password (min 6)'}
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          minLength={editingId ? undefined : 6}
          required={!editingId}
        />
        <select value={form.role} onChange={(e) => update('role', e.target.value)}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <input
          placeholder="Interests (comma separated)"
          value={form.interests}
          onChange={(e) => update('interests', e.target.value)}
        />
        <div className="row">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      {users.map((u) => (
        <div className="card" key={u._id}>
          <div className="spread">
            <strong>{u.name}</strong>
            <span className="muted">{u.role}</span>
          </div>
          <div className="muted">{u.email}</div>
          <div className="muted">
            Interests: {u.interests.length ? u.interests.join(', ') : 'none'}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>ID: {u._id}</div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="secondary" onClick={() => handleEdit(u)}>
              Edit
            </button>
            <button className="danger" onClick={() => handleDelete(u)}>
              Delete
            </button>
            <Link href={`/posts?user=${u._id}`}>View posts</Link>
          </div>
        </div>
      ))}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <UsersContent />
    </ProtectedRoute>
  );
}