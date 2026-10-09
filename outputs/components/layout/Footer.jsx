'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-xxl border-t border-border bg-white">
      <div className="container-max py-md">
        <p className="text-secondary text-text-muted">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            LandDoc • Stored on this device
          </span>
        </p>
        <p className="text-small text-text-muted mt-sm">
          © {currentYear} LandDoc Personal Property Vault. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
