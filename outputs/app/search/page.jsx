'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { properties, documents, searchResults } from '@/mockData';

export default function SearchVaultPage() {
  const [query, setQuery] = useState('25');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Results' },
    { id: 'properties', label: 'Properties' },
    { id: 'deeds', label: 'Title Deeds' },
    { id: 'revenue', label: 'Patta & Revenue' },
    { id: 'ec', label: 'Encumbrance (EC)' },
  ];

  // Dynamic search across properties and documents
  const filteredData = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) {
      return {
        matchedProperties: properties,
        matchedDocuments: documents,
      };
    }

    const matchedProps = properties.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchLoc = p.location.toLowerCase().includes(q);
      const matchSurvey = p.surveyNumber.toLowerCase().includes(q);
      const matchSub = (p.subdivisions || []).some((s) => s.toLowerCase().includes(q));
      const matchPatta = (p.pattaNumber || '').toLowerCase().includes(q);
      return matchName || matchLoc || matchSurvey || matchSub || matchPatta;
    });

    const matchedDocs = documents.filter((d) => {
      const matchName = d.name.toLowerCase().includes(q);
      const matchProp = d.propertyName.toLowerCase().includes(q);
      const matchType = d.type.toLowerCase().includes(q);
      const matchDesc = (d.description || '').toLowerCase().includes(q);
      return matchName || matchProp || matchType || matchDesc;
    });

    return {
      matchedProperties: matchedProps,
      matchedDocuments: matchedDocs,
    };
  }, [query]);

  const displayProperties = filterCategory === 'all' || filterCategory === 'properties'
    ? filteredData.matchedProperties
    : [];

  const displayDocuments = filterCategory === 'properties'
    ? []
    : filteredData.matchedDocuments.filter((d) => {
        if (filterCategory === 'all') return true;
        if (filterCategory === 'deeds') return d.type.toLowerCase().includes('title') || d.name.toLowerCase().includes('deed');
        if (filterCategory === 'revenue') return d.type.toLowerCase().includes('revenue') || d.name.toLowerCase().includes('patta') || d.name.toLowerCase().includes('fmb');
        if (filterCategory === 'ec') return d.type.toLowerCase().includes('encumbrance') || d.name.toLowerCase().includes('ec');
        return true;
      });

  const totalCount = displayProperties.length + displayDocuments.length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary">
          Vault Search
        </h1>
        <p className="text-sm text-text-muted mt-1.5">
          Fast offline index across all survey numbers, subdivisions, patta certificates, and deeds.
        </p>
      </div>

      {/* Main Search Input Box */}
      <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="relative">
          <svg
            className="w-5 h-5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by survey number (e.g. 25, 48/2), Patta #1845, Poonamallee SRO, deed number..."
            className="w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-stone-50 border border-border rounded-lg focus:outline-none focus:border-green-dark focus:bg-white transition-all text-text-primary placeholder:text-text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 text-sm"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & Quick Queries */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilterCategory(c.id)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  filterCategory === c.id
                    ? 'bg-green-dark text-white border-green-dark font-medium'
                    : 'bg-white text-text-muted border-border hover:text-text-primary hover:border-stone-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Quick search tags */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="hidden sm:inline">Try:</span>
            {['25', 'Patta 1845', 'Tambaram', 'Sale Deed'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-text-primary rounded text-[11px] transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          Found <strong>{totalCount}</strong> results for &ldquo;{query || 'All'}&rdquo;
        </span>
        <span>Instant Local Search</span>
      </div>

      {/* No Results Empty State */}
      {totalCount === 0 && (
        <div className="bg-white border border-border rounded-xl p-10 text-center space-y-3">
          <p className="font-serif text-lg text-text-primary">No records found matching &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Try searching by parcel survey number (e.g., 25 or 112/3), SRO jurisdiction, or document type.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-xs font-semibold text-green-dark hover:text-green-900 pt-2"
          >
            Clear search filters
          </button>
        </div>
      )}

      {/* Section 1: Matching Properties */}
      {displayProperties.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif font-bold text-lg text-text-primary flex items-center gap-2">
            <span>Matching Properties</span>
            <span className="text-xs font-sans font-normal text-text-muted">
              ({displayProperties.length})
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayProperties.map((prop) => (
              <Link
                key={prop.id}
                href={`/properties/${prop.id}`}
                className="bg-white border border-border rounded-xl p-4 sm:p-5 hover:border-stone-400 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif font-bold text-base text-text-primary group-hover:text-green-dark transition-colors">
                      {prop.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-stone-100 rounded text-text-muted">
                      {prop.documents} docs
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">{prop.location}</p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium border border-emerald-200">
                      Survey #{prop.surveyNumber}
                    </span>
                    {prop.pattaNumber && (
                      <span className="px-2 py-0.5 bg-stone-100 text-text-primary rounded border border-border">
                        Patta #{prop.pattaNumber}
                      </span>
                    )}
                    {prop.subdivisions && (
                      <span className="px-2 py-0.5 bg-stone-50 text-text-muted rounded border border-border">
                        Sub-div: {prop.subdivisions.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                  <span>Open property folio</span>
                  <span className="text-green-dark font-medium group-hover:translate-x-0.5 transition-transform">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Matching Documents & Deeds */}
      {displayDocuments.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif font-bold text-lg text-text-primary flex items-center gap-2">
            <span>Matching Documents & Folio Records</span>
            <span className="text-xs font-sans font-normal text-text-muted">
              ({displayDocuments.length})
            </span>
          </h2>

          <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden shadow-xs">
            {displayDocuments.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-green-dark transition-colors truncate">
                      {doc.name}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-text-muted rounded">
                      {doc.type}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Property: <strong className="text-text-primary">{doc.propertyName}</strong> • Added {doc.date}
                    {doc.fileSize ? ` • ${doc.fileSize}` : ''}
                  </p>
                  {doc.description && (
                    <p className="text-xs text-stone-600 line-clamp-1 pt-0.5 font-mono text-[11px]">
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:self-center flex-shrink-0">
                  <span className="text-xs font-medium text-text-primary group-hover:text-green-dark transition-colors">
                    View Record →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
