"use client";

import { useState } from "react";

interface FaqSectionProps {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export function FaqSection({ content, settings }: FaqSectionProps) {
  const heading = (content.heading as string) || "";
  const items = (content.items as Array<{ question: string; answer: string }>) || [];

  const backgroundColor = (settings.backgroundColor as string) || undefined;

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <section
      className="py-16 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor }}
    >
      <div className="mx-auto max-w-3xl">
        {heading && (
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl mb-12">
            {heading}
          </h2>
        )}
        <dl className="divide-y divide-gray-200">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="py-4">
                <dt>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-lg font-semibold leading-7">
                      {item.question}
                    </span>
                    <span className="ml-4 flex-shrink-0">
                      <svg
                        className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </button>
                </dt>
                {isOpen && (
                  <dd className="mt-3 pr-12">
                    <p className="text-base leading-7 text-gray-600">
                      {item.answer}
                    </p>
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
