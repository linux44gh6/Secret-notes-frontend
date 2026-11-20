'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';


export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="navbar">
      <Link href="/" className="brand">Secure Notes</Link>

      <div className="nav-links">
        {user ? (
          <>
            <Link href="/notes">My Notes</Link>
            <Link href="/posts">Posts</Link>
            {user.role === 'admin' && (
              <>
                <Link href="/admin/users">Users</Link>
                <Link href="/admin/notes">All Notes</Link>
                <Link href="/admin/interests">Interests</Link>
              </>
            )}
            <span className="user-info">
              {user.name} ({user.role})
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}