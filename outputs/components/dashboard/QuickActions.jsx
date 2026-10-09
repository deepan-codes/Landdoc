'use client';

import Link from 'next/link';

export default function QuickActions() {
  const actions = [
    {
      id: 1,
      label: 'Add property',
      href: '/properties/add',
      isPrimary: false,
      icon: (
        <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
    },
    {
      id: 2,
      label: 'Add document',
      href: '/documents/add',
      isPrimary: true,
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3h-6m-1.5-6H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      id: 3,
      label: 'Scan document',
      href: '/documents/scan',
      isPrimary: false,
      icon: (
        <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5m8.25 0h4.5c.621 0 1.125.504 1.125 1.125v4.5m0 8.25v4.5c0 .621-.504 1.125-1.125 1.125h-4.5m-8.25 0h-4.5A1.125 1.125 0 013.75 19.5v-4.5M9 12h6" />
        </svg>
      ),
    },
    {
      id: 4,
      label: 'Search vault',
      href: '/search',
      isPrimary: false,
      icon: (
        <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors duration-150 group ${
            action.isPrimary
              ? 'bg-green-dark border border-green-dark text-white hover:bg-[#134e3b]'
              : 'bg-white border border-border text-text-primary hover:border-text-muted hover:bg-stone-50/60'
          }`}
        >
          {/* Action Icon */}
          <div className="flex-shrink-0 flex items-center justify-center">
            {action.icon}
          </div>

          {/* Action Label */}
          <span className={`text-sm font-medium ${action.isPrimary ? 'text-white' : 'text-text-primary'}`}>
            {action.label}
          </span>

          {/* Right Arrow */}
          <svg
            className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
              action.isPrimary ? 'text-white' : 'text-text-muted'
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      ))}
    </div>
  );
}
