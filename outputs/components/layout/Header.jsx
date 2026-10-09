'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { user } from '@/mockData';

export default function Header({ currentPage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() || '/';

  // Determine active tab based on pathname or prop
  const getActiveKey = () => {
    if (currentPage) return currentPage;
    if (pathname.startsWith('/properties')) return 'properties';
    if (pathname.startsWith('/documents')) return 'documents';
    if (pathname.startsWith('/checklist')) return 'checklist';
    if (pathname.startsWith('/search')) return 'search';
    return 'dashboard';
  };

  const activeKey = getActiveKey();

  const navItems = [
    { label: 'Dashboard', href: '/', key: 'dashboard' },
    { label: 'Properties', href: '/properties', key: 'properties' },
    { label: 'Documents', href: '/documents', key: 'documents' },
    { label: 'Checklist', href: '/checklist', key: 'checklist' },
    { label: 'Search', href: '/search', key: 'search' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="container-max">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Logo & Brand */}
          <div className="flex items-center gap-6 lg:gap-8 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-green-dark rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
                L
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-text-primary leading-tight">
                  LandDoc
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted leading-none hidden sm:block">
                  Property Vault
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Centered & Aligned with full height */}
            <nav className="hidden md:flex items-center h-16 gap-1 lg:gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`h-full flex items-center px-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                    activeKey === item.key
                      ? 'text-green-dark border-green-dark font-semibold'
                      : 'text-text-muted border-transparent hover:text-text-primary hover:border-gray-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Status Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-paper border border-border rounded-full text-xs text-text-muted">
              <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>Stored on this device</span>
            </div>

            {/* Add Document Button - Desktop */}
            <Link
              href="/documents/add"
              className="hidden sm:inline-flex items-center gap-2 h-9 px-3.5 bg-green-dark text-white text-sm font-medium rounded-button hover:bg-opacity-90 active:scale-95 transition-all shadow-xs"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add document</span>
            </Link>

            {/* Add Document Button - Mobile */}
            <Link
              href="/documents/add"
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 bg-green-dark text-white rounded-button hover:bg-opacity-90 active:scale-95 transition-all shadow-xs"
              aria-label="Add document"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </Link>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-border">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-text-primary leading-tight">{user.name}</p>
                <p className="text-[11px] text-text-muted leading-tight">Vault Owner</p>
              </div>
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-border object-cover bg-paper flex-shrink-0"
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 text-text-muted hover:text-text-primary hover:bg-paper rounded-button transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <nav className="md:hidden border-t border-border py-3 px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`block px-3 py-2 text-sm font-medium rounded-button transition-colors ${
                  activeKey === item.key
                    ? 'bg-green-dark text-white font-semibold'
                    : 'text-text-primary hover:bg-paper'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
