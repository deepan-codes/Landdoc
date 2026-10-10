'use client';

import { useState } from 'react';
import Link from 'next/link';
import { properties, checklist as initialChecklist } from '@/mockData';

export default function ChecklistPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '1');
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];

  const checklist = initialChecklist;
  const percentage = Math.round((checklist.added / checklist.totalRequired) * 100);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Page Title & Property Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary">
            Legal Records Checklist
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            Tamil Nadu property deed & revenue compliance audit to ensure undisputed clear title.
          </p>
        </div>

        {/* Property Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="property-select" className="text-xs font-semibold uppercase text-text-muted">
            Property:
          </label>
          <select
            id="property-select"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:border-green-dark transition-colors font-medium"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress & Compliance Audit Card */}
      <div className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif font-bold text-text-primary">
                {selectedProperty.name} Completeness
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                {percentage >= 70 ? 'Sound Legal Standing' : 'Incomplete Records'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              {checklist.added} of {checklist.totalRequired} required statutory records archived and verified.
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-border sm:pl-6">
            <span className="text-3xl font-serif font-bold text-green-dark">{percentage}%</span>
            <span className="block text-xs text-text-muted font-medium">Compliance Rate</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#E4E0D6] h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-green-dark h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Stats counter strip */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center text-xs">
          <div className="py-1">
            <span className="font-bold text-emerald-700 text-sm">{checklist.added}</span>
            <span className="block text-text-muted text-[11px] mt-0.5">Records Added</span>
          </div>
          <div className="py-1 border-x border-border">
            <span className="font-bold text-amber-700 text-sm">
              {checklist.totalRequired - checklist.added}
            </span>
            <span className="block text-text-muted text-[11px] mt-0.5">Missing / Pending</span>
          </div>
          <div className="py-1">
            <span className="font-bold text-text-primary text-sm">1</span>
            <span className="block text-text-muted text-[11px] mt-0.5">Optional (GPA)</span>
          </div>
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-6">
        {checklist.sections.map((section, idx) => (
          <div key={idx} className="bg-white border border-border rounded-xl overflow-hidden shadow-xs">
            {/* Section Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-[#FAF9F5] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-text-primary">
                  {section.title}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {section.added} verified • {section.notAdded} missing
                </p>
              </div>
              <span className="text-xs font-medium text-text-muted">
                Section {idx + 1} of {checklist.sections.length}
              </span>
            </div>

            {/* Checklist Items */}
            <div className="divide-y divide-border">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Status Checkbox / Icon */}
                    <div className="pt-0.5 flex-shrink-0">
                      {item.status === 'added' ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-stone-300 text-transparent flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-stone-300" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text-primary truncate">
                          {item.name}
                        </h4>
                        {item.optional && (
                          <span className="px-2 py-0.5 text-[10px] bg-stone-100 text-text-muted rounded-full">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {item.details}
                      </p>
                      {item.date && (
                        <p className="text-[11px] text-emerald-700 font-medium mt-1">
                          Verified in vault ({item.date})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Link / Button */}
                  <div className="flex items-center gap-2 sm:self-center flex-shrink-0 pl-8 sm:pl-0">
                    {item.status === 'added' ? (
                      <Link
                        href={item.docId ? `/documents/${item.docId}` : '/documents'}
                        className="text-xs font-medium text-text-primary hover:text-green-dark transition-colors px-3 py-1.5 bg-stone-50 border border-border rounded-lg hover:bg-white"
                      >
                        View Record →
                      </Link>
                    ) : (
                      <Link
                        href="/documents/add"
                        className="text-xs font-semibold text-green-dark hover:text-white hover:bg-green-dark transition-all px-3 py-1.5 border border-green-dark/40 rounded-lg"
                      >
                        + Add Record
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tamil Nadu Property Law Guidance Note */}
      <div className="bg-[#FAF9F5] border border-border rounded-xl p-5 sm:p-6 space-y-2">
        <div className="flex items-center gap-2 text-text-primary font-serif font-bold text-sm sm:text-base">
          <svg className="w-4 h-4 text-green-dark" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>Tamil Nadu Land Records Note</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Under the Tamil Nadu Patta Passbook Act 1983 and Registration Act 1908, a Sale Deed alone does not confer complete marketable title without a valid revenue Patta issued by the Tahsildar and an Encumbrance Certificate (EC) verifying a minimum 30-year unencumbered chain of title.
        </p>
      </div>
    </div>
  );
}
