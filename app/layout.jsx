// layout.js (Server Component)
import './globals.css';
import { Providers } from './providers';
import ClientLayout from './client-layout';

const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    'tilottama.vercel.app';

const metadataBase = new URL(
    siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
);

export const metadata = {
    metadataBase,
    title: {
        default: 'Tilottama',
        template: '%s | Tilottama',
    },
    description: 'Tilottama by Archana',
    applicationName: 'Tilottama',
    icons: {
        icon: [
            { url: '/icon.png', type: 'image/png' },
            { url: '/images/Logo.png', type: 'image/png' },
        ],
        apple: [{ url: '/images/Logo.png', type: 'image/png' }],
    },
    openGraph: {
        title: 'Tilottama',
        description: 'Tilottama by Archana',
        siteName: 'Tilottama',
        images: [
            {
                url: '/images/Logo.png',
                width: 1080,
                height: 1080,
                alt: 'Tilottama logo',
            },
        ],
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body>
        <Providers>

            <ClientLayout>
                {children}
            </ClientLayout>
        </Providers>
        </body>
        </html>
    );
}
