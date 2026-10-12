'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getAllProperties, getAllDocuments } from '@/lib/db';

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recently-updated');
  const [propertiesList, setPropertiesList] = useState([]);
  const [docCounts, setDocCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load saved properties and document counts from IndexedDB on client mount
  useEffect(() => {
    let isMounted = true;
    async function loadProperties() {
      try {
        const [stored, docs] = await Promise.all([
          getAllProperties(),
          getAllDocuments().catch(() => []),
        ]);
        if (isMounted) {
          // Sort newly created/updated properties first by default
          const sortedStored = (stored || []).sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          setPropertiesList(sortedStored);

          // Calculate document counts per property
          const counts = {};
          if (Array.isArray(docs)) {
            for (const d of docs) {
              if (d.propertyId) {
                counts[d.propertyId] = (counts[d.propertyId] || 0) + 1;
              }
            }
          }
          setDocCounts(counts);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load properties from IndexedDB:', err);
        if (isMounted) {
          setPropertiesList([]);
          setIsLoading(false);
        }
      }
    }
    loadProperties();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and sort actual saved properties from IndexedDB
  const filteredProperties = useMemo(() => {
    let result = [...propertiesList];

    // Search filter across all actual saved property attributes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const locMatch = (p.location || '').toLowerCase().includes(q);
        const ownerMatch = (p.owner || '').toLowerCase().includes(q);
        const pattaMatch = (p.pattaNumber || '').toLowerCase().includes(q);
        const surveyMatch = (p.surveyNumber || '').toLowerCase().includes(q);
        const talukMatch = (p.taluk || '').toLowerCase().includes(q);
        const extentMatch = (p.extent || '').toLowerCase().includes(q);
        const notesMatch = (p.notes || '').toLowerCase().includes(q);
        const categoryMatch = (p.category || '').toLowerCase().includes(q);
        const idMatch = (p.id || '').toLowerCase().includes(q);
        const refMatch = (p.refCode || '').toLowerCase().includes(q);

        // Multiple survey numbers array
        const surveyNumbersMatch =
          Array.isArray(p.surveyNumbers) &&
          p.surveyNumbers.some((num) => String(num).toLowerCase().includes(q));

        // Subdivisions array
        const subdivMatch =
          Array.isArray(p.subdivisions) &&
          p.subdivisions.some((sub) => String(sub).toLowerCase().includes(q));

        // Rich surveys objects list
        const surveysObjMatch =
          Array.isArray(p.surveys) &&
          p.surveys.some((s) => {
            const numMatch = s?.number && String(s.number).toLowerCase().includes(q);
            const subMatch =
              Array.isArray(s?.subdivisions) &&
              s.subdivisions.some((sub) => String(sub).toLowerCase().includes(q));
            return numMatch || subMatch;
          });

        return (
          nameMatch ||
          locMatch ||
          ownerMatch ||
          pattaMatch ||
          surveyMatch ||
          surveyNumbersMatch ||
          subdivMatch ||
          surveysObjMatch ||
          talukMatch ||
          extentMatch ||
          notesMatch ||
          categoryMatch ||
          idMatch ||
          refMatch
        );
      });
    }

    // Sorting
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'oldest-first':
        result.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime() || 0;
          const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime() || 0;
          return timeA - timeB;
        });
        break;
      case 'most-documents':
        result.sort((a, b) => (b.documents || b.addedDocuments || 0) - (a.documents || a.addedDocuments || 0));
        break;
      case 'recently-updated':
      default:
        result.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          if (timeA && timeB && timeA !== timeB) return timeB - timeA;
          return (a.updatedDays || 0) - (b.updatedDays || 0);
        });
        break;
    }

    return result;
  }, [propertiesList, searchQuery, sortBy]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif text-text-primary font-normal leading-tight">
            My Properties
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            {isLoading ? (
              'Accessing local encrypted database...'
            ) : (
              <>
                {filteredProperties.length}{' '}
                {filteredProperties.length === 1 ? 'family property' : 'family properties'}{' '}
                registered in this local vault.
              </>
            )}
          </p>
        </div>

        {/* Add Property Button */}
        <Link
          href="/properties/add"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-dark text-white text-sm font-semibold rounded-lg hover:bg-[#134e3b] shadow-xs active:scale-[0.99] transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add property</span>
        </Link>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
            placeholder="Search by name, survey number or patta"
            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-border/80 rounded-lg focus:outline-none focus:border-green-dark transition-colors placeholder:text-text-muted"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <span className="text-sm text-text-muted">Sort:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-border/80 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-text-primary focus:outline-none focus:border-green-dark cursor-pointer transition-colors"
            >
              <option value="recently-updated">Recently updated</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="oldest-first">Oldest first</option>
              <option value="most-documents">Most documents</option>
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
        </div>
      </div>

      {/* Property Cards List / Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white border border-border rounded-xl p-5 flex flex-col md:flex-row items-stretch md:items-center gap-6 animate-pulse"
            >
              <div className="w-full md:w-44 h-36 md:h-28 rounded-lg bg-stone-100 flex-shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-5 bg-stone-200 rounded w-1/3" />
                <div className="h-4 bg-stone-100 rounded w-1/2" />
                <div className="h-2 bg-stone-100 rounded w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="space-y-4">
          {filteredProperties.map((property) => {
            const reqTotal = property.requiredDocuments || 9;
            const reqAdded = docCounts[property.id] !== undefined ? docCounts[property.id] : (property.addedDocuments || 0);
            const percentage = Math.round((reqAdded / reqTotal) * 100);

            // Subtitle string with bullet dots
            const displaySurvey = property.surveyNumber
              ? `Survey No. ${property.surveyNumber}`
              : property.surveyNumbers?.length
              ? `Survey No. ${property.surveyNumbers.join(', ')}`
              : null;

            const metaParts = [
              property.location,
              displaySurvey,
              property.pattaNumber ? `Patta No. ${property.pattaNumber}` : null,
              property.extent ? property.extent : null,
              `${docCounts[property.id] !== undefined ? docCounts[property.id] : (property.documents ?? reqAdded)} documents`,
            ].filter(Boolean);

            return (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="block group"
              >
                <div className="bg-white border border-border rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center gap-4 sm:gap-6 hover:border-text-muted transition-colors">
                  {/* Property Thumbnail */}
                  <div className="w-full md:w-44 h-36 md:h-28 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                    <img
                      src={property.photo || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&h=300&fit=crop'}
                      alt={property.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </div>

                  {/* Main Details & Progress */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                    {/* Top Row: Title, Metadata, Updated & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3 md:mb-0">
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-serif font-semibold text-text-primary group-hover:text-green-dark transition-colors truncate">
                          {property.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-text-muted mt-1 truncate">
                          {metaParts.join(' • ')}
                        </p>
                      </div>

                      <div className="flex-shrink-0 sm:text-right">
                        <p className="text-xs text-text-muted">
                          Updated {property.lastUpdated || 'Just now'}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-text-primary group-hover:text-green-dark mt-1 transition-colors">
                          <span>View property</span>
                          <span className="transition-transform group-hover:translate-x-0.5">→</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Checklist Progress */}
                    <div className="mt-3 md:mt-2">
                      <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                        <span>Required records repository</span>
                        <span>
                          {reqAdded} of {reqTotal} added
                        </span>
                      </div>
                      <div className="w-full bg-[#E4E0D6] h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-green-dark h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-border rounded-xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-text-muted">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-serif font-semibold text-text-primary">
            No properties found
          </h3>
          <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No properties matched "${searchQuery}". Try searching with a different term.`
              : 'You have not registered any properties yet.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-stone-50 transition-colors"
              >
                Clear search
              </button>
            )}
            <Link
              href="/properties/add"
              className="px-4 py-1.5 bg-green-dark text-white rounded-lg text-xs font-semibold hover:bg-[#134e3b] transition-colors"
            >
              + Add Property
            </Link>
          </div>
        </div>
      )}

      {/* Local-Storage Privacy Notice */}
      <div className="pt-6 pb-2 text-center">
        <p className="text-xs text-text-muted inline-flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span>All property identifiers and local documents remain strictly inside your browser storage.</span>
        </p>
      </div>
    </div>
  );
}
