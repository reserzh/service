import { Phone, Mail } from "lucide-react";

export function SiteFooter({
  companyName,
  phone,
  email,
  socialLinks,
}: {
  companyName: string;
  phone?: string;
  email?: string;
  socialLinks?: Record<string, string> | null;
}) {
  const year = new Date().getFullYear();
  const links = socialLinks ?? {};

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{companyName}</h3>
            <div className="mt-4 space-y-2">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <Mail className="h-4 w-4" />
                  {email}
                </a>
              )}
            </div>
          </div>

          {/* Social Links */}
          {Object.keys(links).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Follow Us</h4>
              <div className="mt-4 flex gap-4">
                {links.facebook && (
                  <a href={links.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">Facebook</a>
                )}
                {links.instagram && (
                  <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">Instagram</a>
                )}
                {links.google && (
                  <a href={links.google} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">Google</a>
                )}
                {links.yelp && (
                  <a href={links.yelp} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">Yelp</a>
                )}
                {links.nextdoor && (
                  <a href={links.nextdoor} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900">Nextdoor</a>
                )}
              </div>
            </div>
          )}

          {/* Book CTA */}
          <div className="md:text-right">
            <a
              href="/book"
              className="inline-block rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Schedule Service
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          &copy; {year} {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
