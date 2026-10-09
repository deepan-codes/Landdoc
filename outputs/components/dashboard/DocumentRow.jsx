'use client';

import Link from 'next/link';

export default function DocumentRow({ document }) {
  // Simple clean outline icons with neutral grey container
  const getDocumentIcon = (type) => {
    const normalized = (type || '').toLowerCase();

    if (normalized.includes('revenue') || normalized.includes('patta') || normalized.includes('chitta')) {
      return (
        <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    }

    if (normalized.includes('title') || normalized.includes('deed') || normalized.includes('sale')) {
      return (
        <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zM8.25 12h7.5m-7.5 3h4.5" />
        </svg>
      );
    }

    if (normalized.includes('encumbrance') || normalized.includes('ec')) {
      return (
        <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-2.18-8.497l-4.5 1.8A2.25 2.25 0 007 8.214v4.536a11.25 11.25 0 005.25 9.5 11.25 11.25 0 005.25-9.5V8.214a2.25 2.25 0 00-1.32-2.078l-4.5-1.8a2.25 2.25 0 00-1.68 0z" />
        </svg>
      );
    }

    if (normalized.includes('tax') || normalized.includes('municipal')) {
      return (
        <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m0 0v8.25m0 0a60.07 60.07 0 0015.797 2.101c.727.198 1.453-.342 1.453-1.096V14.25m-17.25 0h17.25m-17.25 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v8.25m-17.25 0h17.25" />
        </svg>
      );
    }

    // Default / FMB measurement
    return (
      <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5L3.75 3.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5v-1.5m3 1.5v-3m3 3v-1.5" />
      </svg>
    );
  };

  return (
    <Link href={`/documents/${document.id}`} className="block group">
      <div className="flex items-center justify-between py-3.5 px-0 transition-colors">
        {/* Left: Icon & Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Simple light-grey icon container */}
          <div className="w-10 h-10 bg-[#F2EFEB] rounded-lg flex items-center justify-center flex-shrink-0">
            {getDocumentIcon(document.type)}
          </div>

          {/* Document Title & Metadata */}
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-text-primary group-hover:text-green-dark transition-colors truncate">
              {document.name}
            </h4>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {document.propertyName} • Added {document.date}
            </p>
          </div>
        </div>

        {/* Right: Simple View link (no underline) */}
        <div className="flex-shrink-0 ml-4">
          <span className="text-sm font-normal text-text-primary group-hover:text-green-dark transition-colors">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}
