'use client';

import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Pagination from '@/components/Pagination';
import { apiFetch } from '@/lib/api';
import { Meta, Note } from '@/lib/types';

function NotesContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Note[]>(`/notes?page=${page}&limit=5`);
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

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await apiFetch(`/notes/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ title, content }),
        });
        resetForm();
        await load();
      } else {
        await apiFetch('/notes', {
          method: 'POST',
          body: JSON.stringify({ title, content }),
        });
        resetForm();
        // নতুন নোট প্রথম পেজে আসে
        if (page === 1) await load();
        else setPage(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingId(note._id);
    setTitle(note.title);
    setContent(note.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      await apiFetch(`/notes/${id}`, { method: 'DELETE' });
      if (notes.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <h1>My Notes</h1>

      <form className="card" onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
        <strong>{editingId ? 'Edit note' : 'New note'}</strong>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Content"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
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
      {!loading && notes.length === 0 && <p className="muted">No notes yet.</p>}

      {notes.map((note) => (
        <div className="card" key={note._id}>
          <div className="spread">
            <strong>{note.title}</strong>
            <span className="muted">{new Date(note.createdAt).toLocaleString()}</span>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
          <div className="row">
            <button className="secondary" onClick={() => handleEdit(note)}>
              Edit
            </button>
            <button className="danger" onClick={() => handleDelete(note._id)}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <NotesContent />
    </ProtectedRoute>
  );
}