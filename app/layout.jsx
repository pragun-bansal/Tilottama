// layout.js (Server Component)
import './globals.css';
import { Providers } from './providers';
import ClientLayout from './client-layout';


export const metadata = {
    title: 'Your App Name',
    description: 'Your app description',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <head>
            <link rel="icon" href="/images/Logo.png" type="image/png" />
        </head>
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