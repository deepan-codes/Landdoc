'use client';

import Link from 'next/link';

export default function Breadcrumb({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-md">
      <ol className="flex items-center gap-xs text-secondary text-text-muted">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-xs">
            {item.href ? (
              <Link
                href={item.href}
                className="text-green-dark hover:text-green-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-text-primary font-medium">{item.label}</span>
            )}

            {index < items.length - 1 && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.293 6.293a1 1 0 011.414 0L10 7.586l.293-.293a1 1 0 111.414 1.414l-1.414 1.414 1.414 1.414a1 1 0 01-1.414 1.414L10 12.414l-.293.293a1 1 0 01-1.414-1.414l1.414-1.414-1.414-1.414a1 1 0 010-1.414z" />
              </svg>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
