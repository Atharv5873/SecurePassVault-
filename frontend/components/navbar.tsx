import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
    return (
        <header className="w-full bg-transparent shadow-md px-4 py-2 flex items-center">
            <Link href="/">
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={693}
                    height={693}
                    className="object-contain max-w-[100px] h-auto"
                />
            </Link>
        </header>
    );
}
