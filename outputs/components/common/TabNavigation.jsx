'use client';

import { useState } from 'react';

export default function TabNavigation({
  tabs = [],
  defaultTab = 0,
  onTabChange = null,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (index) => {
    setActiveTab(index);
    if (onTabChange) onTabChange(index, tabs[index]);
  };

  return (
    <div className={className}>
      <div className="flex gap-lg border-b border-border overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(index)}
            className={`
              px-md py-sm text-body font-medium transition-colors duration-200
              border-b-2 whitespace-nowrap -mb-px
              ${
                activeTab === index
                  ? 'text-green-dark border-green-dark'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }
            `}
          >
            <span className="flex items-center gap-xs">
              {tab.icon && <span className="w-5 h-5">{tab.icon}</span>}
              {tab.label}
              {tab.badge && (
                <span className="ml-xs px-xs py-0 bg-text-muted bg-opacity-20 rounded text-xs font-semibold">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-md">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
}
