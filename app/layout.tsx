import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clínyco Steps',
  description:
    'Tips informativos y checklists de gestión. La información es educativa y no reemplaza orientación profesional sanitaria.',
  themeColor: '#e60e68',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: ['/icon-192.png', '/icon-512.png'],
    apple: '/icon-180.png'
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Clínyco Steps',
    'mobile-web-app-capable': 'yes'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <div className="container">
            <h1>Clínyco Steps</h1>
            <p className="disclaimer">La información es educativa y no reemplaza orientación profesional sanitaria.</p>
          </div>
        </header>
        <main className="container">{children}</main>
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            }
          `}
        </Script>
      </body>
    </html>
  );
}
