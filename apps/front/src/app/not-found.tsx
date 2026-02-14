import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-xl font-semibold text-gray-900">Page not found</p>
        <p className="mt-2 text-gray-600">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
