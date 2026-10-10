'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { properties, documents } from '@/mockData';

export default function PropertyDetailPage({ params }) {
  const property = properties.find((p) => p.id === params.id) || properties[0];

  if (!property) {
    notFound();
  }

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'key', 'recent'
  const [visibleCount, setVisibleCount] = useState(8);

  // All documents belonging to this property
  const propertyDocs = useMemo(() => {
    return documents.filter((d) => d.propertyId === property.id);
  }, [property.id]);

  // Search and filter logic
  const filteredDocs = useMemo(() => {
    let result = propertyDocs;

    // Filter type
    if (activeFilter === 'key') {
      result = result.filter((d) => d.isKey);
    } else if (activeFilter === 'recent') {
      result = result.filter((d) => d.isRecent);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => {
        const titleMatch = d.name.toLowerCase().includes(q);
        const typeMatch = (d.type || '').toLowerCase().includes(q);
        const refMatch = (d.reference || '').toLowerCase().includes(q);
        const surveyMatch = (d.surveyNumber || '').toLowerCase().includes(q);
        const subMatch = (d.subdivision || '').toLowerCase().includes(q);
        const pattaMatch = (d.pattaNumber || '').toLowerCase().includes(q);
        const descMatch = (d.description || '').toLowerCase().includes(q);
        return titleMatch || typeMatch || refMatch || surveyMatch || subMatch || pattaMatch || descMatch;
      });
    }

    return result;
  }, [propertyDocs, activeFilter, searchQuery]);

  const displayedDocs = filteredDocs.slice(0, visibleCount);
  const remainingCount = filteredDocs.length - displayedDocs.length;

  // Percentage for requisite records
  const reqAdded = property.addedDocuments || 7;
  const reqTotal = property.requiredDocuments || 9;
  const progressPct = Math.round((reqAdded / reqTotal) * 100);

  // Render thumbnail icon based on code
  const renderThumbnailIcon = (code) => {
    switch (code) {
      case 'DEED':
        return (
          <svg className="w-5 h-5 text-[#8C5E28]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zM8.25 12h7.5m-7.5 3h4.5" />
          </svg>
        );
      case 'ENC':
        return (
          <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-2.18-8.497l-4.5 1.8A2.25 2.25 0 007 8.214v4.536a11.25 11.25 0 005.25 9.5 11.25 11.25 0 005.25-9.5V8.214a2.25 2.25 0 00-1.32-2.078l-4.5-1.8a2.25 2.25 0 00-1.68 0z" />
          </svg>
        );
      case 'TAX':
        return (
          <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m0 0v8.25m0 0a60.07 60.07 0 0015.797 2.101c.727.198 1.453-.342 1.453-1.096V14.25m-17.25 0h17.25m-17.25 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v8.25m-17.25 0h17.25" />
          </svg>
        );
      case 'FMB':
        return (
          <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5L3.75 3.75z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5v-1.5m3 1.5v-3m3 3v-1.5" />
          </svg>
        );
      case 'ROOT':
        return (
          <svg className="w-5 h-5 text-[#8C5E28]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v4.5a2.25 2.25 0 002.25 2.25h.75m9-9h.75a2.25 2.25 0 012.25 2.25v4.5a2.25 2.25 0 01-2.25 2.25h-.75m-9-4.5h9" />
          </svg>
        );
      case 'GIFT':
        return (
          <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M3 11.25h18M12 3v18m-4.5-15a2.25 2.25 0 014.5 0v3H7.5V6zm9 0a2.25 2.25 0 00-4.5 0v3h4.5V6z" />
          </svg>
        );
      case 'PLAN':
        return (
          <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        );
      case 'REV':
      default:
        return (
          <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-text-muted" aria-label="Breadcrumb">
        <Link href="/properties" className="hover:text-text-primary transition-colors">
          Properties
        </Link>
        <span>/</span>
        <span className="text-text-primary font-medium">{property.name}</span>
      </nav>

      {/* 2. Property Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div className="space-y-2">
          {/* Category Pill and Ref Code */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#F9EED9] text-[#7A531A] rounded-md tracking-wider uppercase font-sans">
              {property.category || 'HERITAGE HOLDING'}
            </span>
            <span className="text-xs text-text-muted">
              • {property.refCode || 'Ref: TN-AMB-1998-025'}
            </span>
          </div>

          {/* Property Name */}
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary tracking-tight">
            {property.name}
          </h1>

          {/* Location and Identifiers Line */}
          <p className="text-xs sm:text-sm text-text-muted flex flex-wrap items-center gap-1.5">
            <span>{property.location}</span>
            <span>•</span>
            <span>Survey No. {property.surveyNumber}</span>
            {property.subdivisions && property.subdivisions.length > 0 && (
              <>
                <span>(Sub: {property.subdivisions.join(', ')})</span>
              </>
            )}
            {property.pattaNumber && (
              <>
                <span>•</span>
                <span>Patta No. {property.pattaNumber}</span>
              </>
            )}
            {property.taluk && (
              <>
                <span>•</span>
                <span>{property.taluk}</span>
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Edit Property Details Button */}
          <Link
            href={`/properties/add?edit=${property.id}`}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-white border border-border text-xs sm:text-sm font-medium text-text-primary rounded-lg hover:bg-stone-50 transition-colors shadow-xs"
          >
            <svg
              className="w-4 h-4 text-text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            <span>Edit property details</span>
          </Link>

          {/* Add Document to This Property Button */}
          <Link
            href={`/documents/add?propertyId=${property.id}`}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-green-dark text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#134e3b] transition-colors shadow-xs active:scale-[0.99]"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add document to this property</span>
          </Link>
        </div>
      </div>

      {/* 3. Summary Section (4-column card) */}
      <div className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 lg:divide-x divide-border">
          {/* Column 1: TOTAL DEPOSIT */}
          <div className="space-y-1.5 pt-4 sm:pt-0 first:pt-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
              TOTAL DEPOSIT
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-serif text-3xl font-bold text-text-primary">
                {propertyDocs.length}
              </span>
              <span className="text-xs text-text-muted">documents vaulted</span>
            </div>
            <p className="text-xs text-text-muted mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted/60 flex-shrink-0" />
              <span>{property.archivalNote || 'Archival bond preservation'}</span>
            </p>
          </div>

          {/* Column 2: REQUISITE RECORDS */}
          <div className="space-y-1.5 pt-4 sm:pt-0 lg:pl-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                REQUISITE RECORDS
              </span>
              <span className="text-xs font-bold text-text-primary">
                {reqAdded} of {reqTotal}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#E5E2DA] h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-green-dark h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              {property.checklistNotAddedNote ||
                `${reqTotal - reqAdded} not added: Encumbrance 2024 update, Chitta extract`}
            </p>
          </div>

          {/* Column 3: REGISTRY ACTIVITY */}
          <div className="space-y-1.5 pt-4 sm:pt-0 lg:pl-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
              REGISTRY ACTIVITY
            </span>
            <p className="font-serif text-lg font-bold text-text-primary mt-1">
              Updated {property.lastUpdated || '2 days ago'}
            </p>
            <p className="text-xs text-text-muted mt-1.5">
              {property.registryActivity?.note || 'Patta digital extract synced'}
            </p>
          </div>

          {/* Column 4: PHYSICAL CUSTODY */}
          <div className="space-y-1.5 pt-4 sm:pt-0 lg:pl-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
              PHYSICAL CUSTODY
            </span>
            <div className="flex items-start gap-1.5 mt-1 text-xs sm:text-sm font-medium text-text-primary">
              <svg
                className="w-4 h-4 text-[#8C5E28] flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <span>{property.physicalCustody?.locker || '1 deed in Canara Bank Safe Locker #418'}</span>
            </div>
            <p className="text-xs text-text-muted mt-1.5">
              {property.physicalCustody?.storage || '4 physical folios in domestic archive safe'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md w-full">
          <svg
            className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search within ${property.name} records, numbers...`}
            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark transition-colors placeholder:text-text-muted shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#ECE9E1] p-1 rounded-xl self-start sm:self-auto border border-border/50">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-text-primary font-semibold shadow-xs'
                : 'text-text-muted hover:text-text-primary font-medium'
            }`}
          >
            All ({propertyDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('key')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              activeFilter === 'key'
                ? 'bg-white text-text-primary font-semibold shadow-xs'
                : 'text-text-muted hover:text-text-primary font-medium'
            }`}
          >
            Key documents
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('recent')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              activeFilter === 'recent'
                ? 'bg-white text-text-primary font-semibold shadow-xs'
                : 'text-text-muted hover:text-text-primary font-medium'
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      {/* 5. Document Cards Grid (2-column on desktop, 1-column on mobile) */}
      {displayedDocs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {displayedDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-border rounded-xl p-4 sm:p-5 hover:border-stone-400 transition-colors shadow-xs flex flex-col justify-between group"
            >
              {/* Card Top: Thumbnail & Details */}
              <div className="flex items-start gap-4">
                {/* Styled Document Thumbnail Container */}
                <div
                  className={`w-12 h-14 bg-[#F8F6F0] rounded-lg border border-[#E4E0D6] flex flex-col items-center justify-between p-1.5 flex-shrink-0 ${
                    doc.isAmber ? 'border-b-2 border-b-[#8C5E28]' : 'border-b-2 border-b-stone-400'
                  }`}
                >
                  <div className="flex-1 flex items-center justify-center">
                    {renderThumbnailIcon(doc.iconCode)}
                  </div>
                  <span className="text-[9px] font-bold tracking-wider font-mono text-stone-700 uppercase">
                    {doc.iconCode || 'DOC'}
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1">
                  {/* Category Pill */}
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded ${
                        doc.isAmber
                          ? 'bg-[#FDF6ED] text-[#8C5E28] border border-[#F3E2CF]'
                          : 'bg-[#F2EFEB] text-text-primary border border-border/70'
                      }`}
                    >
                      {doc.type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif font-bold text-base text-text-primary group-hover:text-green-dark transition-colors truncate">
                    {doc.name}
                  </h3>

                  {/* Reference & Identifiers */}
                  <p className="text-xs text-text-muted truncate">
                    {doc.reference || doc.description}
                  </p>
                </div>
              </div>

              {/* Card Bottom: Date Added & View Link */}
              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-muted">
                  {doc.dateAdded || `Added ${doc.date}`}
                </span>
                <Link
                  href={`/documents/${doc.id}`}
                  className="font-medium text-text-primary group-hover:text-green-dark transition-colors flex items-center gap-1"
                >
                  <span>View</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl p-10 text-center space-y-3">
          <p className="font-serif text-lg text-text-primary">No documents found matching your filter</p>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Try adjusting your search query or switching to &ldquo;All&rdquo; documents.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            className="text-xs font-semibold text-green-dark hover:text-green-900 pt-1"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* 6. Show More Documents Button */}
      {remainingCount > 0 && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 8)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-border text-xs sm:text-sm font-medium text-text-primary rounded-full hover:bg-stone-50 transition-colors shadow-xs active:scale-[0.99]"
          >
            <span>Show more documents ({remainingCount} remaining)</span>
            <span className="text-xs">⌵</span>
          </button>
        </div>
      )}

      {/* 7. Footer Stamp */}
      <div className="text-center pt-8 border-t border-border/60">
        <p className="text-xs text-text-muted">
          LandDoc • Stored on this device
        </p>
      </div>
    </div>
  );
}
