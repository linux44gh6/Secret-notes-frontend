'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';


export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (user.role === 'admin') {
      router.replace('/admin/users');
    } else {
      router.replace('/notes');
    }
  }, [user, loading, router]);

  return <p className="muted">Loading...</p>;
}