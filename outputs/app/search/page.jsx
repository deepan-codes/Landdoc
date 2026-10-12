'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { properties as mockProperties, documents as mockDocuments } from '@/mockData';
import { getAllProperties, getAllDocuments } from '@/lib/db';
import { executeGlobalSearch, parseQueryTerms } from '@/lib/search';

export default function SearchVaultPage() {
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [propertiesList, setPropertiesList] = useState([]);
  const [documentsList, setDocumentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load properties and documents from IndexedDB (with mockData fallback)
  useEffect(() => {
    let isMounted = true;
    async function loadVaultData() {
      try {
        const [storedProps, storedDocs] = await Promise.all([
          getAllProperties().catch(() => []),
          getAllDocuments().catch(() => []),
        ]);
        if (!isMounted) return;

        // Combine stored properties with mock properties (deduplicating by ID)
        const mergedProps = [...(storedProps || [])];
        for (const p of mockProperties) {
          if (!mergedProps.some((m) => m.id === p.id)) {
            mergedProps.push(p);
          }
        }

        // Combine stored documents with mock documents (deduplicating by ID)
        const mergedDocs = [...(storedDocs || [])];
        for (const d of mockDocuments) {
          if (!mergedDocs.some((m) => m.id === d.id)) {
            mergedDocs.push(d);
          }
        }

        setPropertiesList(mergedProps);
        setDocumentsList(mergedDocs);
      } catch (err) {
        console.warn('Failed to load vault data from IndexedDB:', err);
        if (isMounted) {
          setPropertiesList(mockProperties);
          setDocumentsList(mockDocuments);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadVaultData();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { id: 'all', label: 'All Results' },
    { id: 'properties', label: 'Properties' },
    { id: 'deeds', label: 'Title Deeds' },
    { id: 'revenue', label: 'Patta & Revenue' },
    { id: 'ec', label: 'Encumbrance (EC)' },
  ];

  // Execute multi-field AND-logic search across all records
  const searchResults = useMemo(() => {
    return executeGlobalSearch(propertiesList, documentsList, query);
  }, [propertiesList, documentsList, query]);

  // Apply secondary category tabs filter
  const displayProperties = useMemo(() => {
    if (filterCategory !== 'all' && filterCategory !== 'properties') return [];
    return searchResults.matchedProperties;
  }, [searchResults.matchedProperties, filterCategory]);

  const displayDocuments = useMemo(() => {
    if (filterCategory === 'properties') return [];
    return searchResults.matchedDocuments.filter((d) => {
      if (filterCategory === 'all') return true;
      const typeStr = (d.documentType || d.type || '').toLowerCase();
      const nameStr = (d.name || d.title || '').toLowerCase();
      if (filterCategory === 'deeds') {
        return typeStr.includes('title') || typeStr.includes('sale') || typeStr.includes('deed') || nameStr.includes('deed');
      }
      if (filterCategory === 'revenue') {
        return typeStr.includes('revenue') || typeStr.includes('patta') || typeStr.includes('fmb') || nameStr.includes('patta') || nameStr.includes('tax');
      }
      if (filterCategory === 'ec') {
        return typeStr.includes('encumbrance') || typeStr.includes('ec') || nameStr.includes('encumbrance') || nameStr.includes('ec');
      }
      return true;
    });
  }, [searchResults.matchedDocuments, filterCategory]);

  const totalCount = displayProperties.length + displayDocuments.length;
  const parsedTerms = useMemo(() => parseQueryTerms(query), [query]);

  // Compute live document count for each property
  const propDocCounts = useMemo(() => {
    const counts = {};
    for (const d of documentsList) {
      if (d.propertyId) {
        counts[d.propertyId] = (counts[d.propertyId] || 0) + 1;
      }
    }
    return counts;
  }, [documentsList]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-5xl mx-auto">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary">
          Vault Search
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1.5 leading-relaxed">
          Fast offline multi-field search across survey numbers, subdivisions, locations, owners, patta numbers, and title deeds.
        </p>
      </div>

      {/* 2. Main Search Input Box */}
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
            placeholder="Search by multiple terms e.g. '25, Avadi', '25, patta', '25, Avadi, sale deed'..."
            className="w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-stone-50 border border-border rounded-lg focus:outline-none focus:border-green-dark focus:bg-white transition-all text-text-primary placeholder:text-text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 text-sm transition-colors"
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
                    ? 'bg-green-dark text-white border-green-dark font-medium shadow-2xs'
                    : 'bg-white text-text-muted border-border hover:text-text-primary hover:border-stone-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Quick search tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
            <span className="hidden sm:inline">Try:</span>
            {['25', '25, Avadi', 'Avadi', '25, patta', '25, Avadi, sale deed', 'Tambaram'].map((tag) => (
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

      {/* 3. Search Feedback & Terms Breakdown Banner */}
      {parsedTerms.length > 0 && (
        <div className="bg-[#FAF9F5] border border-border rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-muted font-medium">Active Terms (AND logic):</span>
            {parsedTerms.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-border rounded-md font-medium text-text-primary"
              >
                <span>&ldquo;{t}&rdquo;</span>
              </span>
            ))}
          </div>
          <span className="text-text-muted">
            Found <strong>{totalCount}</strong> matching records
          </span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-28 bg-white border border-border rounded-xl animate-pulse" />
          <div className="h-28 bg-white border border-border rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* No Results State */}
          {totalCount === 0 && query.trim() && (
            <div className="bg-white border border-border rounded-xl p-10 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-500 mb-2">
                <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="font-serif text-lg text-text-primary">
                No records found matching all terms: &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
                Because all search terms are combined with AND-logic, try removing one of the terms or checking the survey number spelling.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-text-primary rounded-lg transition-colors"
                >
                  Clear search terms
                </button>
              </div>
            </div>
          )}

          {/* 6. Section 1: Matching Properties */}
          {displayProperties.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif font-bold text-lg text-text-primary flex items-center gap-2">
                <span>Matching Properties</span>
                <span className="text-xs font-sans font-normal text-text-muted">
                  ({displayProperties.length})
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayProperties.map((prop) => {
                  const docCount = propDocCounts[prop.id] ?? prop.documents ?? (prop.addedDocuments || 0);
                  const displaySurvey = prop.surveyNumber || (prop.surveyNumbers && prop.surveyNumbers.join(', '));

                  return (
                    <Link
                      key={prop.id}
                      href={`/properties/${prop.id}`}
                      className="bg-white border border-border rounded-xl p-4 sm:p-5 hover:border-stone-400 transition-all group flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif font-bold text-base text-text-primary group-hover:text-green-dark transition-colors truncate">
                            {prop.name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 bg-stone-100 rounded text-text-muted flex-shrink-0">
                            {docCount} docs
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-1 truncate">{prop.location}</p>

                        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                          {displaySurvey && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium border border-emerald-200">
                              Survey #{displaySurvey}
                            </span>
                          )}
                          {prop.pattaNumber && (
                            <span className="px-2 py-0.5 bg-stone-100 text-text-primary rounded border border-border">
                              Patta #{prop.pattaNumber}
                            </span>
                          )}
                          {prop.owner && (
                            <span className="px-2 py-0.5 bg-stone-50 text-text-muted rounded border border-border truncate max-w-[200px]">
                              Owner: {prop.owner}
                            </span>
                          )}
                          {prop.subdivisions && prop.subdivisions.length > 0 && (
                            <span className="px-2 py-0.5 bg-stone-50 text-text-muted rounded border border-border">
                              Sub-div: {prop.subdivisions.join(', ')}
                            </span>
                          )}
                        </div>

                        {/* Match Explanation Badges */}
                        {prop.matchReasons && prop.matchReasons.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-border/70">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                              Matches:
                            </span>
                            {prop.matchReasons.map((reason, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-800 rounded border border-emerald-200"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                        <span>Open property folio</span>
                        <span className="text-green-dark font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          <span>View</span>
                          <span>→</span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. Section 2: Matching Documents & Deeds */}
          {displayDocuments.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="font-serif font-bold text-lg text-text-primary flex items-center gap-2">
                <span>Matching Documents & Folio Records</span>
                <span className="text-xs font-sans font-normal text-text-muted">
                  ({displayDocuments.length})
                </span>
              </h2>

              <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden shadow-xs">
                {displayDocuments.map((doc) => {
                  const docTitle = doc.name || doc.title || doc.fileName || 'Untitled Document';
                  const docType = doc.documentType || doc.type || 'Document';
                  const linkedPropName = doc.propertyName || doc.linkedProperty?.name || 'Linked Property';
                  const linkedPropLoc = doc.linkedProperty?.location;
                  const docSurvey = doc.surveyNumber || doc.linkedProperty?.surveyNumber;
                  const docNumber = doc.documentNumber || doc.docNumber || doc.reference;

                  return (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors group"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-text-primary group-hover:text-green-dark transition-colors truncate">
                            {docTitle}
                          </h3>
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-text-muted rounded">
                            {docType}
                          </span>
                          {(doc.isImportant || doc.isKey) && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FDF6ED] text-[#8C5E28] border border-[#F3E2CF] rounded">
                              ★ Key Document
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-text-muted">
                          Property: <strong className="text-text-primary font-medium">{linkedPropName}</strong>
                          {linkedPropLoc ? ` • ${linkedPropLoc}` : ''}
                          {docSurvey ? ` • Survey No. ${docSurvey}` : ''}
                          {docNumber ? ` • Ref: ${docNumber}` : ''}
                        </p>

                        {doc.notes && (
                          <p className="text-xs text-stone-600 line-clamp-1 pt-0.5 font-sans">
                            {doc.notes}
                          </p>
                        )}

                        {/* Match Explanation Badges */}
                        {doc.matchReasons && doc.matchReasons.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                              Matches:
                            </span>
                            {doc.matchReasons.map((reason, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-800 rounded border border-emerald-200"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 sm:self-center flex-shrink-0 text-xs font-medium text-text-primary group-hover:text-green-dark transition-colors">
                        <span>View Record</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
