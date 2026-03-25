"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EstimateOption {
  id: string;
  name: string;
  isRecommended: boolean;
  total: string | null;
}

interface EstimateActionsProps {
  estimateId: string;
  options: EstimateOption[];
  currentStatus: string;
}

function formatCurrency(value: string | null | undefined): string {
  const num = parseFloat(value ?? "0");
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

export function EstimateActions({
  estimateId,
  options,
  currentStatus,
}: EstimateActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    () => options.find((o) => o.isRecommended)?.id ?? options[0]?.id ?? ""
  );
  const [showModification, setShowModification] = useState(false);
  const [modificationNote, setModificationNote] = useState("");

  if (currentStatus !== "sent" && currentStatus !== "viewed") {
    return null;
  }

  async function handleRespond(action: "approve" | "decline") {
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = { action };
      if (action === "approve") {
        body.optionId = selectedOptionId;
      }
      if (action === "decline" && modificationNote.trim()) {
        body.note = modificationNote.trim();
      }

      const res = await fetch(`/api/portal/estimates/${estimateId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Something went wrong. Please try again.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Respond to Estimate
      </h2>

      {error && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Option selection as radio cards */}
      {options.length > 1 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Select an option to approve
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={loading}
                onClick={() => setSelectedOptionId(opt.id)}
                className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                  selectedOptionId === opt.id
                    ? "portal-selected"
                    : "border-gray-200 bg-white hover:border-gray-300"
                } disabled:opacity-50`}
              >
                {opt.isRecommended && (
                  <span
                    className="absolute -top-2.5 right-3 inline-flex items-center rounded-full portal-btn-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  >
                    Recommended
                  </span>
                )}
                <p className="text-sm font-semibold text-gray-900">
                  {opt.name}
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {formatCurrency(opt.total)}
                </p>
                {selectedOptionId === opt.id && (
                  <div className="absolute top-3 right-3">
                    <svg className="h-5 w-5" style={{ color: 'var(--color-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single option display */}
      {options.length === 1 && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">{options[0].name}</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {formatCurrency(options[0].total)}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleRespond("approve")}
            disabled={loading || !selectedOptionId}
            className="flex-1 inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Approve Estimate"}
          </button>
          <button
            type="button"
            onClick={() => handleRespond("decline")}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Decline
          </button>
        </div>

        {/* Request Modification toggle */}
        {!showModification ? (
          <button
            type="button"
            onClick={() => setShowModification(true)}
            className="text-sm portal-link text-left"
          >
            Request a modification instead
          </button>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              What changes would you like?
            </p>
            <textarea
              value={modificationNote}
              onChange={(e) => setModificationNote(e.target.value)}
              rows={3}
              placeholder="Describe the changes you'd like to the estimate..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm portal-focus"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleRespond("decline")}
                disabled={loading || !modificationNote.trim()}
                className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Modification Request"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModification(false);
                  setModificationNote("");
                }}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
