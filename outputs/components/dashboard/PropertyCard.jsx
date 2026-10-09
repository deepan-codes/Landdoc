'use client';

import Link from 'next/link';

export default function PropertyCard({ property }) {
  const percentage = Math.round((property.addedDocuments / property.requiredDocuments) * 100);

  // Subtitle string matching Figma format
  const subtitle = property.extent
    ? `${property.location} • Survey No. ${property.surveyNumber} • ${property.extent}`
    : `${property.location} • Survey No. ${property.surveyNumber} • Patta No. ${property.pattaNumber}`;

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden hover:border-text-muted transition-colors">
      <Link href={`/properties/${property.id}`} className="block">
        {/* Photo */}
        <div className="relative w-full h-44 sm:h-48 bg-stone-100 overflow-hidden">
          <img
            src={property.photo}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and Docs Badge */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-text-primary">
              {property.name}
            </h3>
            <span className="bg-[#F2EFEB] text-text-muted text-xs font-normal px-2.5 py-0.5 rounded-full flex-shrink-0">
              {property.documents} docs
            </span>
          </div>

          {/* Location and Parcel Metadata */}
          <p className="text-xs text-text-muted mt-1.5">
            {subtitle}
          </p>

          {/* Essential Records Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-text-primary font-medium">
              <span>Essential records</span>
              <span>{property.addedDocuments} of {property.requiredDocuments} ({percentage}%)</span>
            </div>
            <div className="w-full bg-[#E4E0D6] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-green-dark h-full rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
