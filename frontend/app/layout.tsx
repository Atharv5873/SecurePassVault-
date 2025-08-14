import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { CryptoProvider } from "@/contexts/cryptocontext";
import { Toaster } from "react-hot-toast";
// import Navbar from "@/components/navbar";

export const metadata: Metadata = {
    title: "SecurePass Vault | Cyber Cordon",
    description:
        "The safest place to store your passwords — zero-knowledge architecture & two-layer encryption. SecurePass Vault protects your data with enterprise-grade encryption, penetration-tested infrastructure, and trusted by cybersecurity experts.",
    keywords:
        "Password manager, Password Vault, Privacy-first password storage, Zero-knowledge encryption, Secure password app, Cybersecurity, VAPT services, Web application penetration testing, Secure data storage, Cybersecurity India, Cyber Cordon, Encrypted vault, Cloud password manager, Digital security solutions, Startup cybersecurity, Enterprise password protection, Application security testing, OWASP Top 10 prevention, SecurePass Vault reviews, Best password manager India, Amaravati cybersecurity, Andhra Pradesh cybersecurity, Affordable VAPT services, Encrypted credential manager, Secure login vault, Prevent website attacks, Protect online accounts, Ethical hacking services, API security testing, Cybersecurity for startups",
    icons: {
        icon: "/cc1.ico",
    },
    openGraph: {
        title: "SecurePass Vault | Cyber Cordon",
        description:
            "Store passwords securely with complete privacy. Zero-knowledge architecture & two-layer encryption.",
        url: "https://securepass-vault.onrender.com/",
        siteName: "SecurePass Vault",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Vault Banner",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "SecurePass Vault | Cyber Cordon",
        description: "Save your passwords securely with complete privacy.",
        images: ["/og-image.png"],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "What is VAPT?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "VAPT stands for Vulnerability Assessment and Penetration Testing. It helps find and fix security flaws in your web apps.",
                },
            },
            {
                "@type": "Question",
                name: "Who should use your service?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Startups, developers, and businesses who want to protect their digital assets from hackers and vulnerabilities.",
                },
            },
        ],
    };

    const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: "SecurePass Vault",
        url: "https://securepass-vault.onrender.com/",
        logo: "https://securepass-vault.onrender.com/logo.png",
        image: "https://securepass-vault.onrender.com/og-image.png",
        description:
            "SecurePass Vault is a privacy-first encrypted password manager with zero-knowledge architecture, two-layer encryption, and penetration-tested infrastructure. Ideal for startups, businesses, and individuals who value security and privacy.",
        offers: {
            "@type": "Offer",
            price: "0.00",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: "https://securepass-vault.onrender.com/"
        },
        aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "124"
        },
        review: {
            "@type": "Review",
            author: {
                "@type": "Person",
                name: "Jane Doe"
            },
            reviewRating: {
                "@type": "Rating",
                ratingValue: "5",
                bestRating: "5"
            },
            reviewBody:
                "SecurePass Vault is a secure, reliable, and easy-to-use password manager. Highly recommended for anyone who values data security."
        }
    };

    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="icon" href="/favicon.ico" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            </head>
            <body className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                    {/* <Navbar /> */}
                    <CryptoProvider>
                        {children}
                        <footer className="w-full mt-auto py-6 text-center text-xs text-gray-400 border-t border-gray-800 bg-black/70 backdrop-blur-sm">
                            © 2025 Cyber Cordon. All rights reserved. | Empowering Security for a Safer India
                        </footer>
                        <Toaster position="top-right" />
                    </CryptoProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
