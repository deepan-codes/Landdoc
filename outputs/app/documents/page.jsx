'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { documents as initialDocuments, properties } from '@/mockData';

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recently_added'); // 'recently_added', 'oldest', 'name_asc'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'cards'
  const [visibleCount, setVisibleCount] = useState(8);

  // Dynamic Category Counts derived strictly from underlying data
  const categoryCounts = useMemo(() => {
    return {
      all: initialDocuments.length,
      patta: initialDocuments.filter((d) => d.category === 'patta').length,
      sale_deed: initialDocuments.filter((d) => d.category === 'sale_deed').length,
      encumbrance: initialDocuments.filter((d) => d.category === 'encumbrance').length,
      tax_receipt: initialDocuments.filter((d) => d.category === 'tax_receipt').length,
      survey: initialDocuments.filter((d) => d.category === 'survey').length,
      layout: initialDocuments.filter((d) => d.category === 'layout').length,
    };
  }, []);

  const categories = [
    { id: 'all', label: `All (${categoryCounts.all})` },
    { id: 'patta', label: `Patta (${categoryCounts.patta})` },
    { id: 'sale_deed', label: `Sale deed (${categoryCounts.sale_deed})` },
    { id: 'encumbrance', label: `Encumbrance (${categoryCounts.encumbrance})` },
    { id: 'tax_receipt', label: `Tax receipt (${categoryCounts.tax_receipt})` },
    { id: 'survey', label: `Survey (${categoryCounts.survey})` },
    { id: 'layout', label: `Layout (${categoryCounts.layout})` },
  ];

  // Combined Search, Property Filter, Category Filter, and Sorting
  const filteredDocuments = useMemo(() => {
    let result = [...initialDocuments];

    // 1. Property filter
    if (selectedProperty !== 'all') {
      result = result.filter((d) => d.propertyId === selectedProperty);
    }

    // 2. Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((d) => d.category === selectedCategory);
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => {
        const titleMatch = d.name.toLowerCase().includes(q);
        const propMatch = d.propertyName.toLowerCase().includes(q);
        const typeMatch = (d.type || '').toLowerCase().includes(q);
        const tagMatch = (d.typeTag || '').toLowerCase().includes(q);
        const refMatch = (d.reference || '').toLowerCase().includes(q);
        const subMatch = (d.subtitle || '').toLowerCase().includes(q);
        const surveyMatch = (d.surveyNumber || '').toLowerCase().includes(q);
        const subdivMatch = (d.subdivision || '').toLowerCase().includes(q);
        const pattaMatch = (d.pattaNumber || '').toLowerCase().includes(q);
        return (
          titleMatch ||
          propMatch ||
          typeMatch ||
          tagMatch ||
          refMatch ||
          subMatch ||
          surveyMatch ||
          subdivMatch ||
          pattaMatch
        );
      });
    }

    // 4. Sorting
    if (sortBy === 'recently_added') {
      result.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [searchQuery, selectedProperty, selectedCategory, sortBy]);

  const displayedDocs = filteredDocuments.slice(0, visibleCount);
  const remainingCount = filteredDocuments.length - displayedDocs.length;

  // Render Category Tag Badge with exact screenshot palette
  const renderTypeTag = (tag) => {
    const text = tag || 'Revenue record';
    const lower = text.toLowerCase();

    if (lower.includes('revenue') || lower.includes('cadastral')) {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#FDF6ED] text-[#9A6B2F] border border-[#F3E2CF]">
          {text}
        </span>
      );
    }

    if (lower.includes('conveyance') || lower.includes('origin') || lower.includes('title')) {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#EEF7F2] text-[#22674E] border border-[#D5EFE3]">
          {text}
        </span>
      );
    }

    // Encumbrance, Municipal tax, Planning sanction, or generic
    return (
      <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#F2EFEB] text-stone-700 border border-border/80">
        {text}
      </span>
    );
  };

  // Render Ref Icon inside grey box
  const renderRefIcon = (doc) => {
    const code = doc.iconCode || 'REV';
    const lower = (doc.typeTag || doc.name).toLowerCase();

    if (code === 'DEED' || lower.includes('sale deed')) {
      return (
        <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zM8.25 12h7.5m-7.5 3h4.5" />
        </svg>
      );
    }

    if (code === 'ENC' || lower.includes('encumbrance')) {
      return (
        <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-2.18-8.497l-4.5 1.8A2.25 2.25 0 007 8.214v4.536a11.25 11.25 0 005.25 9.5 11.25 11.25 0 005.25-9.5V8.214a2.25 2.25 0 00-1.32-2.078l-4.5-1.8a2.25 2.25 0 00-1.68 0z" />
        </svg>
      );
    }

    if (code === 'TAX' || lower.includes('tax')) {
      return (
        <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m0 0v8.25m0 0a60.07 60.07 0 0015.797 2.101c.727.198 1.453-.342 1.453-1.096V14.25m-17.25 0h17.25m-17.25 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v8.25m-17.25 0h17.25" />
        </svg>
      );
    }

    if (code === 'FMB' || lower.includes('cadastral') || lower.includes('fmb')) {
      return (
        <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5L3.75 3.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5v-1.5m3 1.5v-3m3 3v-1.5" />
        </svg>
      );
    }

    if (code === 'ROOT' || lower.includes('settlement')) {
      return (
        <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }

    if (lower.includes('crop') || lower.includes('adangal')) {
      return (
        <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21V3m0 0c2.5 0 5 1.5 5 4.5S14.5 12 12 12m0-9c-2.5 0-5 1.5-5 4.5S9.5 12 12 12" />
        </svg>
      );
    }

    if (code === 'PLAN' || lower.includes('layout') || lower.includes('sanction')) {
      return (
        <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934a1.12 1.12 0 01-1.006 0L9.503 3.314a1.12 1.12 0 00-1.006 0L3.622 5.751A1.125 1.125 0 003 6.757v12.366c0 .836.88 1.38 1.628 1.006l3.869-1.934a1.12 1.12 0 011.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      );
    }

    // Default document sheet
    return (
      <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* 1. Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif text-text-primary font-normal leading-tight">
            Documents
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            All {initialDocuments.length} property documents stored locally across your {properties.length} properties.
          </p>
        </div>

        {/* Add Document Action */}
        <Link
          href="/documents/add"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-dark text-white text-sm font-semibold rounded-lg hover:bg-[#134e3b] shadow-xs active:scale-[0.99] transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add document</span>
        </Link>
      </div>

      {/* 2. Search & Filter Card Panel */}
      <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top Controls Line: Search, Property Filter, Sort, View Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-lg w-full">
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
              placeholder="Search by document name, survey number, patta..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark transition-colors placeholder:text-text-muted"
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

          {/* Controls Right: Property Dropdown, Sort Dropdown, View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Property Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="appearance-none bg-white border border-border rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm font-medium text-text-primary focus:outline-none focus:border-green-dark cursor-pointer transition-colors"
              >
                <option value="all">All properties ({properties.length})</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <svg
                className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-border rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm font-medium text-text-primary focus:outline-none focus:border-green-dark cursor-pointer transition-colors"
              >
                <option value="recently_added">Sort: Recently added</option>
                <option value="oldest">Sort: Oldest first</option>
                <option value="name_asc">Sort: Name (A–Z)</option>
              </select>
              <svg
                className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* View Mode Toggle: List / Cards */}
            <div className="flex items-center bg-[#EBE7DF] p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-text-primary font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-primary font-medium'
                }`}
                title="Table list view"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-text-primary font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-primary font-medium'
                }`}
                title="Grid cards view"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Filter Pills: All, Patta, Sale deed, Encumbrance, Tax receipt, Survey, Layout */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#133E31] text-white font-medium shadow-xs'
                  : 'bg-[#EFECE6] text-text-primary hover:bg-[#E5E1D8]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Content: List (Table) View OR Cards View */}
      {displayedDocs.length > 0 ? (
        viewMode === 'list' ? (
          /* Table Layout View */
          <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-stone-50/50">
                    <th scope="col" className="py-3 px-4 sm:px-6 w-16">
                      Ref
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Document Name
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Property
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Type Tag
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Date Added
                    </th>
                    <th scope="col" className="py-3 px-4 sm:px-6 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-stone-50/70 transition-colors group cursor-pointer"
                      onClick={() => (window.location.href = `/documents/${doc.id}`)}
                    >
                      {/* Ref Column: Document Icon */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="w-9 h-9 bg-[#F2EFEB] rounded-lg flex items-center justify-center flex-shrink-0">
                          {renderRefIcon(doc)}
                        </div>
                      </td>

                      {/* Document Name & Subtitle */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-serif font-bold text-sm text-text-primary group-hover:text-green-dark transition-colors truncate block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {doc.name}
                          </Link>
                          <p className="text-xs text-text-muted mt-0.5 truncate">
                            {doc.subtitle || doc.reference || doc.description}
                          </p>
                        </div>
                      </td>

                      {/* Associated Property */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs sm:text-sm font-medium text-text-primary whitespace-nowrap">
                          {doc.propertyName}
                        </span>
                      </td>

                      {/* Type Tag Badge */}
                      <td className="py-3.5 px-4">
                        <div className="whitespace-nowrap">
                          {renderTypeTag(doc.typeTag || doc.type)}
                        </div>
                      </td>

                      {/* Date Added */}
                      <td className="py-3.5 px-4 text-xs text-text-muted whitespace-nowrap">
                        {doc.dateAdded || doc.date}
                      </td>

                      {/* View Action Link */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-text-primary group-hover:text-green-dark transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>View</span>
                          <span className="transition-transform group-hover:translate-x-0.5">→</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards Grid View (2 columns on desktop, 1 column on mobile) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {displayedDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-border rounded-xl p-4 sm:p-5 hover:border-stone-400 transition-colors shadow-xs flex flex-col justify-between group"
              >
                {/* Card Top: Icon & Details */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-14 bg-[#F8F6F0] rounded-lg border border-[#E4E0D6] flex flex-col items-center justify-between p-1.5 flex-shrink-0 ${
                      doc.isAmber ? 'border-b-2 border-b-[#8C5E28]' : 'border-b-2 border-b-stone-400'
                    }`}
                  >
                    <div className="flex-1 flex items-center justify-center">
                      {renderRefIcon(doc)}
                    </div>
                    <span className="text-[9px] font-bold tracking-wider font-mono text-stone-700 uppercase">
                      {doc.iconCode || 'DOC'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div>{renderTypeTag(doc.typeTag || doc.type)}</div>
                    <h3 className="font-serif font-bold text-base text-text-primary group-hover:text-green-dark transition-colors truncate">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-text-muted truncate">
                      <strong className="text-text-primary font-medium">{doc.propertyName}</strong> •{' '}
                      {doc.subtitle || doc.reference}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Date & View Link */}
                <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-text-muted">{doc.dateAdded || doc.date}</span>
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
        )
      ) : (
        /* Empty State */
        <div className="bg-white border border-border rounded-xl p-8 sm:p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-text-muted">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-serif font-semibold text-text-primary">
            No documents found
          </h3>
          <p className="text-sm text-text-muted max-w-sm mx-auto">
            No property records matched your active search or filter selection.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedProperty('all');
                setSelectedCategory('all');
              }}
              className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-stone-50 transition-colors"
            >
              Reset filters
            </button>
            <Link
              href="/documents/add"
              className="px-4 py-1.5 bg-green-dark text-white rounded-lg text-xs font-semibold hover:bg-[#134e3b] transition-colors"
            >
              + Add Document
            </Link>
          </div>
        </div>
      )}

      {/* 4. Pagination / Show More Row */}
      {filteredDocuments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-text-muted">
            Showing {displayedDocs.length} of {filteredDocuments.length} documents
          </p>

          {remainingCount > 0 ? (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 8)}
              className="px-4 py-2 bg-white border border-border text-xs sm:text-sm font-medium text-text-primary rounded-lg hover:bg-stone-50 transition-colors shadow-2xs active:scale-[0.99]"
            >
              Show more documents
            </button>
          ) : (
            filteredDocuments.length > 8 && (
              <button
                type="button"
                onClick={() => setVisibleCount(8)}
                className="px-4 py-2 bg-white border border-border text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary rounded-lg hover:bg-stone-50 transition-colors shadow-2xs"
              >
                Show fewer documents
              </button>
            )
          )}
        </div>
      )}

      {/* 5. Client-Side Document Vault Banner */}
      <div className="bg-[#FAF9F5] border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-2.18-8.497l-4.5 1.8A2.25 2.25 0 007 8.214v4.536a11.25 11.25 0 005.25 9.5 11.25 11.25 0 005.25-9.5V8.214a2.25 2.25 0 00-1.32-2.078l-4.5-1.8a2.25 2.25 0 00-1.68 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary leading-snug">
              Client-side document vault
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              All original folios and extracts are encrypted and kept strictly in local storage on this browser profile.
            </p>
          </div>
        </div>

        <div className="text-xs text-text-muted font-mono self-start sm:self-auto sm:text-right pl-12 sm:pl-0">
          <span>Archive hash: </span>
          <span className="font-semibold text-text-primary">TN-2024-LDC9</span>
        </div>
      </div>

      {/* 6. Footer Stamp */}
      <div className="text-center pt-4 border-t border-border/60">
        <p className="text-xs text-text-muted">
          LandDoc • Stored on this device
        </p>
      </div>
    </div>
  );
}
