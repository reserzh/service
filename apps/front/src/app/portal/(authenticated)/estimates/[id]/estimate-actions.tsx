"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EstimateActionsProps {
  estimateId: string;
  options: { id: string; name: string; isRecommended: boolean }[];
  currentStatus: string;
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

      const res = await fetch(`/api/portal/estimates/${estimateId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
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

      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        {/* Option selector (only for approve with multiple options) */}
        {options.length > 1 && (
          <div className="flex-1">
            <label
              htmlFor="option-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Option to Approve
            </label>
            <select
              id="option-select"
              value={selectedOptionId}
              onChange={(e) => setSelectedOptionId(e.target.value)}
              disabled={loading}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                  {opt.isRecommended ? " (Recommended)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleRespond("approve")}
            disabled={loading || !selectedOptionId}
            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => handleRespond("decline")}
            disabled={loading}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}
