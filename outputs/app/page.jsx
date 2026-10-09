'use client';

import Link from 'next/link';
import { properties, documents, recentDocumentsForDashboard, pendingDocuments } from '@/mockData';
import QuickActions from '@/components/dashboard/QuickActions';
import SummaryCards from '@/components/dashboard/SummaryCards';
import PropertyCard from '@/components/dashboard/PropertyCard';
import DocumentRow from '@/components/dashboard/DocumentRow';
import BackupStatus from '@/components/dashboard/BackupStatus';

export default function Dashboard() {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const dateStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' }).toUpperCase();

  // Pending groups
  const pendingGroups = [
    {
      propertyName: 'AVADI LAND',
      items: pendingDocuments.filter((d) => d.propertyId === '1'),
    },
    {
      propertyName: 'TAMBARAM ANCESTRAL HOUSE',
      items: pendingDocuments.filter((d) => d.propertyId === '2'),
    },
    {
      propertyName: 'VILLAGE FARMLAND',
      items: pendingDocuments.filter((d) => d.propertyId === '3'),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero Greeting Section */}
      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5">
          {dayName}, {dateStr}
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif text-text-primary font-normal mb-2">
          Good morning, Sundaram
        </h1>
        <p className="text-sm sm:text-base text-text-muted mb-6">
          3 properties and 24 documents, all stored on this device.
        </p>

        {/* Four Quick Actions */}
        <QuickActions />
      </section>

      {/* Summary Statistics Card */}
      <section>
        <SummaryCards properties={properties} documents={documents} />
      </section>

      {/* My Properties Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-serif text-text-primary font-normal">
            My properties
          </h2>
          <Link
            href="/properties"
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            View all properties
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* Recent Documents & Still to Add Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents (Left 2 columns) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif text-text-primary font-normal">
              Recent documents
            </h2>
            <Link
              href="/documents"
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              View all (24)
            </Link>
          </div>

          <div className="bg-white border border-border rounded-xl p-4 sm:p-5">
            <div className="divide-y divide-border">
              {recentDocumentsForDashboard.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </div>
          </div>
        </div>

        {/* Still to Add (Right 1 column) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif text-text-primary font-normal">
              Still to add
            </h2>
            <span className="text-sm text-[#B8893B] font-medium">
              {pendingDocuments.length} pending
            </span>
          </div>

          {/* Single clean outer card matching Figma */}
          <div className="bg-white border border-border rounded-xl p-4 sm:p-5 space-y-4">
            {pendingGroups.map((group, groupIndex) => (
              <div
                key={group.propertyName}
                className={groupIndex > 0 ? 'border-t border-border pt-4' : ''}
              >
                <h3 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2.5">
                  {group.propertyName}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="border border-border/80 rounded-lg p-2.5 sm:p-3 flex items-center justify-between bg-white hover:border-text-muted transition-colors"
                    >
                      <p className="text-sm text-text-primary">
                        {item.name}
                      </p>
                      <Link
                        href={`/documents/add?name=${encodeURIComponent(item.name)}`}
                        className="px-3 py-1 border border-border rounded-md text-xs font-medium text-text-primary hover:border-text-primary hover:bg-stone-50 transition-colors"
                      >
                        Add
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Backup Status */}
      <section>
        <BackupStatus />
      </section>
    </div>
  );
}
