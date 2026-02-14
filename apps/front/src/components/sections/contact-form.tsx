"use client";

import { useState } from "react";

export function ContactFormSection({
  content,
  settings,
}: {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}) {
  const heading = (content.heading as string) ?? "";
  const description = content.description as string | undefined;
  const showPhone = (content.showPhone as boolean) ?? false;
  const showEmail = (content.showEmail as boolean) ?? false;
  const phone = content.phone as string | undefined;
  const email = content.email as string | undefined;

  const backgroundColor = (settings.backgroundColor as string) ?? undefined;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <section
      className="w-full py-16 lg:py-24"
      style={{ backgroundColor: backgroundColor ?? "#f9fafb" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {heading && (
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
        )}

        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
            {description}
          </p>
        )}

        <div className="mt-12 flex flex-col gap-12 lg:flex-row">
          <form
            onSubmit={handleSubmit}
            className="flex-1 space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            <div>
              <label
                htmlFor="contact-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                type="text"
                id="contact-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:border-transparent focus:outline-none focus:ring-2"
                style={
                  { "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:border-transparent focus:outline-none focus:ring-2"
                  style={
                    {
                      "--tw-ring-color": "var(--color-primary)",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="contact-phone"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:border-transparent focus:outline-none focus:ring-2"
                  style={
                    {
                      "--tw-ring-color": "var(--color-primary)",
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:border-transparent focus:outline-none focus:ring-2"
                style={
                  { "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties
                }
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg px-6 py-3 text-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Send Message
            </button>
          </form>

          {(showPhone || showEmail) && (
            <aside className="flex flex-col justify-center gap-6 lg:w-80">
              {showPhone && phone && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500">
                    Phone
                  </h3>
                  <a
                    href={`tel:${phone.replace(/\D/g, "")}`}
                    className="mt-2 block text-xl font-semibold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {phone}
                  </a>
                </div>
              )}

              {showEmail && email && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </h3>
                  <a
                    href={`mailto:${email}`}
                    className="mt-2 block text-lg font-semibold break-all"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {email}
                  </a>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
