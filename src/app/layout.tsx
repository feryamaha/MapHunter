import type { Metadata } from 'next';
import { Inter, Lato, Open_Sans, IBM_Plex_Mono } from 'next/font/google';

import './globals.css';
// import UIKitGlobal from '@/components/UI-KIT/ui-kit-global';

// Renderização dinâmica em toda a app: necessário para que o nonce do CSP
// (gerado por request no src/proxy.ts) seja injetado nos scripts do Next.
// Páginas estáticas não recebem nonce e quebrariam sob `strict-dynamic`.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MapHunter',
  description: 'Minerador de Leads B2B Regional',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon', rel: 'icon' }],
    shortcut: ['/favicon.ico'],
    apple: ['/favicon.ico'],
  },
};

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

const ibmMono = IBM_Plex_Mono({
  variable: '--font-ibmMono-sans',
  subsets: ['latin'],
  weight: ['400', '500']
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${lato.variable} ${inter.variable} ${openSans.variable} ${ibmMono.variable}`}
    >
      <head suppressHydrationWarning></head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
