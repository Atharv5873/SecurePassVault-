import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
    return (
        <header className="w-full bg-white/70 dark:bg-black/60 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-2 flex items-center justify-between">
            {/* Left: Main Logo */}
            <Link href="/" className="flex items-center">
                <Image
                    src="/logo.png.png"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="object-contain h-10 w-auto"
                    priority
                />
            </Link>
            {/* Right: App Logo */}
            <div className="flex items-center">
                <Image
                    src="/applogo.png.png"
                    alt="App Logo"
                    width={36}
                    height={36}
                    className="object-contain h-9 w-auto"
                    priority
                />
            </div>
        </header>
    );
}
