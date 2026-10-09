'use client';

export default function BackupStatus() {
  const lastBackup = 'never';

  return (
    <div className="bg-white border border-border rounded-xl p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Simple outline lock icon */}
        <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>

        {/* Status text */}
        <p className="text-xs sm:text-sm text-text-muted">
          Last backup: <span className="font-normal text-text-primary">{lastBackup}</span> • Local vault encrypted with AES-256 on this device
        </p>
      </div>

      {/* Outlined Export Button */}
      <button
        type="button"
        className="px-4 py-2 border border-border rounded-lg text-xs sm:text-sm font-medium text-text-primary hover:border-text-primary hover:bg-stone-50 transition-colors bg-white flex-shrink-0"
      >
        Export encrypted backup
      </button>
    </div>
  );
}
