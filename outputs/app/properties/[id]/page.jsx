'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { properties, documents } from '@/mockData';

export default function PropertyDetailPage({ params }) {
  const property = properties.find((p) => p.id === params.id) || properties[0];

  if (!property) {
    notFound();
  }

  // Documents belonging to this property
  const propertyDocs = documents.filter((d) => d.propertyId === property.id);
  const percentage = Math.round(
    (property.addedDocuments / property.requiredDocuments) * 100
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <span>←</span>
          <span>Back to Properties</span>
        </Link>
      </div>

      {/* Property Hero Banner */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="relative w-full h-48 sm:h-64 bg-stone-100 overflow-hidden">
          <img
            src={property.photo}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary">
                {property.name}
              </h1>
              <p className="text-sm text-text-muted mt-1">
                {property.location} • Survey No. {property.surveyNumber}
                {property.pattaNumber ? ` • Patta No. ${property.pattaNumber}` : ''}
                {property.extent ? ` • ${property.extent}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/documents/add"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-dark text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#134e3b] transition-colors"
              >
                + Add Document
              </Link>
            </div>
          </div>

          {/* Records Progress Bar */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center justify-between text-xs text-text-primary font-medium">
              <span>Required records repository ({percentage}% complete)</span>
              <span>
                {property.addedDocuments} of {property.requiredDocuments} added
              </span>
            </div>
            <div className="w-full bg-[#E4E0D6] h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-green-dark h-full rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Property Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-text-primary">
            Attached Documents ({propertyDocs.length})
          </h2>
          <Link
            href="/documents/add"
            className="text-xs sm:text-sm font-medium text-green-dark hover:text-green-900 transition-colors"
          >
            + Upload new file
          </Link>
        </div>

        {propertyDocs.length > 0 ? (
          <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
            {propertyDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {doc.type} • Added {doc.date}
                    {doc.fileSize ? ` • ${doc.fileSize}` : ''}
                  </p>
                </div>
                <span className="text-xs font-medium text-text-primary hover:text-green-dark transition-colors flex-shrink-0">
                  View →
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl p-8 text-center text-text-muted text-sm">
            No documents uploaded yet for this property.
          </div>
        )}
      </div>
    </div>
  );
}
