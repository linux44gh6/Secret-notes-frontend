'use client';

import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Pagination from '@/components/Pagination';
import { apiFetch } from '@/lib/api';
import { Meta, Note } from '@/lib/types';

function AllNotesContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Note[]>(`/notes/all?page=${page}&limit=5`);
      setNotes(res.data);
      setMeta(res.meta ?? null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1>All Notes</h1>
      <p className="muted">Admin view: notes from every user (read only).</p>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && notes.length === 0 && <p className="muted">No notes found.</p>}

      {notes.map((note) => {
        const owner = typeof note.owner === 'string' ? null : note.owner;
        return (
          <div className="card" key={note._id}>
            <div className="spread">
              <strong>{note.title}</strong>
              <span className="muted">{new Date(note.createdAt).toLocaleString()}</span>
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
            <div className="muted">
              Owner: {owner ? `${owner.name} (${owner.email})` : String(note.owner)}
            </div>
          </div>
        );
      })}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}

export default function AdminNotesPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <AllNotesContent />
    </ProtectedRoute>
  );
}