import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { CryptoProvider } from "@/contexts/cryptocontext";
import { Toaster } from "react-hot-toast";
// import Navbar from "@/components/navbar";

export const metadata: Metadata = {
    title: "SecurePass Vault | Cyber Cordon",
    description:
        "The safest place to store your passwords — zero-knowledge architecture & two-layer encryption.",
    keywords:
        "Password, Vault, Privacy, Encryption, Safe, data, security,VAPT services, web application penetration testing, website security audit, vulnerability assessment and penetration testing, application security testing services, ethical hacking services, API security testing, mobile app VAPT, cloud web app security assessment, DevSecOps consulting, web infrastructure security audit, OWASP Top 10 testing services, source code review for security, configuration audit web server, online penetration testing, remote VAPT services, digital security audit, application security posture assessment, affordable VAPT services, cost-effective penetration testing, budget-friendly web security audit, low cost VAPT for startups, economic cybersecurity solutions, competitive VAPT pricing, cheap web application security audit, VAPT packages prices, best value VAPT services, affordable cybersecurity solutions, VAPT services India, web application penetration testing India, website security audit India, ethical hacking services India, cybersecurity services India, best VAPT company India, Indian cybersecurity startup, VAPT services Amaravati, web application security Amaravati, cybersecurity audit Amaravati, penetration testing Andhra Pradesh, cybersecurity company Amaravati, Amaravati based VAPT services, security assessment Vijayawada, Andhra Pradesh cybersecurity firms, global VAPT services, international penetration testing, worldwide cybersecurity services, expert VAPT services, certified ethical hackers, award-winning cybersecurity solutions, innovative VAPT methodology, skilled penetration testers, next-gen web security solutions, trusted cybersecurity partner, reliable VAPT company, experienced cybersecurity consultants, hackathon based security solutions, cutting-edge cybersecurity, secure web application development, website hacking prevention services, data breach protection for web apps, cyber risk assessment, digital asset protection services, prevent website attacks, fix website vulnerabilities, protect online business from cyber threats, malware removal for websites, phishing prevention for web apps, DDoS protection assessment, SQL injection prevention, cross-site scripting (XSS) prevention, broken authentication detection, security misconfiguration audit, unrestricted file upload vulnerabilities fix, web security best practices, easy to understand VAPT reports, simple security audit reports, non-technical vulnerability assessment reports, clear penetration testing findings, user-friendly cybersecurity reports, actionable VAPT recommendations, plain language security reports, VAPT reports for business owners, understandable web security audit, easy to read vulnerability reports, VAPT for non-tech users, clear remediation steps VAPT, simplified security reports, business-focused VAPT reports, jargon-free security reports, PCI DSS compliance VAPT, GDPR compliance security audit, ISO 27001 VAPT requirements, HIPAA compliance security, SOC 2 security assessment, cybersecurity for startups, SME cybersecurity solutions, e-commerce security solutions, CERT-In empanelled VAPT India, DPDP Act compliance security assessment, RBI cybersecurity guidelines compliance, cyber security solutions for businesses, online security assessment services, information security consulting, digital security services, enterprise cybersecurity solutions, risk management cyber security, cyber threat intelligence services, security posture assessment, managed security services, cybersecurity firm, cyber security company, web security company, application security vendor, Cyber Cordon, Cyber Cordon VAPT, Cyber Cordon India, Cyber Cordon cybersecurity, Cyber Cordon reviews",
    icons: {
        icon: "/cc1.ico",
    },
    openGraph: {
        title: "SecurePass Vault | Cyber Cordon",
        description:
            "Expert VAPT services for startups, businesses, and developers. Identify and fix vulnerabilities fast.",
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

    const orgSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "SecurePass Vault",
        url: "https://securepass-vault.onrender.com/",
        logo: "https://securepass-vault.onrender.com/logo.png",
    };

    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="icon" href="/favicon.ico" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
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
