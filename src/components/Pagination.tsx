'use client';

import { Meta } from '@/lib/types';

interface Props {
  meta: Meta;
  onPageChange: (page: number) => void;
}

export default function Pagination({ meta, onPageChange }: Props) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
      <button
        className="secondary"
        disabled={meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
      >
        Prev
      </button>

      <span className="muted">
        Page {meta.page} of {meta.totalPages} ({meta.total} total)
      </span>

      <button
        className="secondary"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPageChange(meta.page + 1)}
      >
        Next
      </button>
    </div>
  );
}