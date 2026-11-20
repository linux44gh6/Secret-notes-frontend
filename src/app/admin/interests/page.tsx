'use client';

import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Pagination from '@/components/Pagination';
import { apiFetch } from '@/lib/api';
import { Meta } from '@/lib/types';

interface InterestGroup {
  interest: string;
  count: number;
  users: { _id: string; name: string; email: string }[];
}

function InterestsContent() {
  const [groups, setGroups] = useState<InterestGroup[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter ? `&interest=${encodeURIComponent(filter)}` : '';
      const res = await apiFetch<InterestGroup[]>(
        `/users/group/interests?page=${page}&limit=5${q}`
      );
      setGroups(res.data);
      setMeta(res.meta ?? null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFilter(input.trim());
  };

  const clearFilter = () => {
    setInput('');
    setFilter('');
    setPage(1);
  };

  return (
    <div>
      <h1>Users Grouped by Interests</h1>

      <form className="card row" onSubmit={handleFilter}>
        <input
          style={{ flex: 1, minWidth: 200 }}
          placeholder="Filter by interest (e.g. chess)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Filter</button>
        {filter && (
          <button type="button" className="secondary" onClick={clearFilter}>
            Clear
          </button>
        )}
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && groups.length === 0 && <p className="muted">No data found.</p>}

      {groups.map((g) => (
        <div className="card" key={g.interest}>
          <div className="spread">
            <strong>{g.interest}</strong>
            <span className="muted">
              {g.count} user{g.count > 1 ? 's' : ''}
            </span>
          </div>
          <ul>
            {g.users.map((u) => (
              <li key={u._id}>
                {u.name} <span className="muted">({u.email})</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}

export default function InterestsPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <InterestsContent />
    </ProtectedRoute>
  );
}