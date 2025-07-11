import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center space-x-2 ${className}`}>
      <div className="relative w-12 h-8">
        <Image
          src="/logo.svg"
          alt="Asaba Bank"
          width={48}
          height={32}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-indigo-600">ASABA</span>
          <span className="text-xs text-gray-600 -mt-1">BANK</span>
        </div>
      )}
    </Link>
  );
}
