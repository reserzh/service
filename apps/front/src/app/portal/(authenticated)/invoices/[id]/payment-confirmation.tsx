"use client";

import { useState } from "react";

interface PaymentConfirmationProps {
  invoiceId: string;
  invoiceNumber: string;
  balanceDue: string;
  dueDate: string;
}

export function PaymentConfirmation({
  invoiceId,
  invoiceNumber,
  balanceDue,
  dueDate,
}: PaymentConfirmationProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Pay Now
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => setShowConfirm(false)}
      onKeyDown={(e) => { if (e.key === "Escape") setShowConfirm(false); }}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">
          Confirm Payment
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          You are about to pay invoice <strong>{invoiceNumber}</strong>.
        </p>

        <div className="mt-4 rounded-md bg-gray-50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount Due</span>
            <span className="font-semibold text-gray-900">{balanceDue}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Due Date</span>
            <span className="text-gray-900">{dueDate}</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          You'll be redirected to our secure payment processor to complete the transaction.
        </p>

        <div className="mt-5 flex gap-3">
          <a
            href={`/api/portal/invoices/${invoiceId}/checkout`}
            className="flex-1 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Proceed to Payment
          </a>
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
