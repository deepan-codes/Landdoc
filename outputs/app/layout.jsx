import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import '@/styles/globals.css';

export const metadata = {
  title: 'LandDoc - Private Property Vault',
  description: 'Secure, offline property document management for families in Tamil Nadu.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col min-h-screen bg-paper">
          <Header />
          
          <main className="flex-1 container-max py-xl">
            {children}
          </main>
          
          <Footer />
        </div>
      </body>
    </html>
  );
}
