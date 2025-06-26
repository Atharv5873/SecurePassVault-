import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { CryptoProvider } from '@/contexts/cryptocontext';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider attribute="class">
            <CryptoProvider>
                <Component {...pageProps} />
                <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            </CryptoProvider>
        </ThemeProvider>
    );
}