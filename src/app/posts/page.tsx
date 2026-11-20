'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Pagination from '@/components/Pagination';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Meta, Post } from '@/lib/types';

interface UserPosts {
  _id: string;
  name: string;
  email: string;
  posts: Post[];
}

function PostsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // ?user=<id> থাকলে সেই ইউজারের পোস্ট, নইলে নিজের
  const [userId, setUserId] = useState(searchParams.get('user') || user?._id || '');
  const [inputId, setInputId] = useState(userId);

  const [data, setData] = useState<UserPosts | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiFetch<UserPosts>(`/posts/user/${userId}?page=${page}&limit=5`);
      setData(res.data);
      setMeta(res.meta ?? null);
      setError('');
    } catch (err) {
      setData(null);
      setMeta(null);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setUserId(inputId.trim());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
      setTitle('');
      setContent('');
      setMessage('Post created');

      // নিজের পোস্ট দেখলে লিস্ট রিফ্রেশ
      if (userId === user?._id) {
        if (page === 1) await load();
        else setPage(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Posts</h1>

      <form className="card" onSubmit={handleCreate} style={{ display: 'grid', gap: 10 }}>
        <strong>New post (visible to everyone)</strong>
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
            {saving ? 'Posting...' : 'Create post'}
          </button>
        </div>
        {message && <div className="success">{message}</div>}
      </form>

      <form className="card row" onSubmit={handleSearch}>
        <input
          style={{ flex: 1, minWidth: 220 }}
          placeholder="User ID"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
        />
        <button type="submit">View posts</button>
        {user && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setInputId(user._id);
              setUserId(user._id);
              setPage(1);
            }}
          >
            My posts
          </button>
        )}
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      {data && (
        <>
          <h2>
            Posts by {data.name} <span className="muted">({data.email})</span>
          </h2>

          {data.posts.length === 0 && <p className="muted">No posts yet.</p>}

          {data.posts.map((post) => (
            <div className="card" key={post._id}>
              <div className="spread">
                <strong>{post.title}</strong>
                <span className="muted">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
            </div>
          ))}

          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}

export default function PostsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<p className="muted">Loading...</p>}>
        <PostsContent />
      </Suspense>
    </ProtectedRoute>
  );
}