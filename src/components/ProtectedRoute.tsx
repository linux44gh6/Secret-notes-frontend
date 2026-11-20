'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/lib/types';

interface Props {
  children: React.ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed = !!user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (!allowed) {
      router.replace('/notes');
    }
  }, [user, loading, allowed, router]);

  if (loading || !allowed) {
    return <p className="muted">Loading...</p>;
  }

  return <>{children}</>;
}