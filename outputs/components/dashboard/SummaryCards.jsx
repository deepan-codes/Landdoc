'use client';

export default function SummaryCards({ properties = [], documents = [] }) {
  const totalProperties = properties.length;
  const totalDocuments = documents.length;

  const stats = [
    {
      id: 1,
      label: 'Total properties',
      value: totalProperties,
      color: 'text-text-primary',
    },
    {
      id: 2,
      label: 'Archived documents',
      value: totalDocuments,
      color: 'text-text-primary',
    },
    {
      id: 3,
      label: 'Added in October',
      value: 4,
      color: 'text-text-primary',
    },
    {
      id: 4,
      label: 'Common records pending',
      value: 5,
      color: 'text-[#B8893B]',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-x lg:divide-y-0 divide-border">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="p-5 sm:p-6 flex flex-col justify-center"
          >
            <div className={`text-3xl sm:text-4xl font-serif ${stat.color} font-normal leading-tight`}>
              {stat.value}
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-2">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
