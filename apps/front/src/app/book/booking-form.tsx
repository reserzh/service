"use client";

import { useState } from "react";

type Service = {
  id: string;
  name: string;
  estimatedDuration: number | null;
  priceDisplay: string | null;
};

type Step = "service" | "datetime" | "contact" | "review" | "confirmed";

export function BookingForm({
  tenantId,
  services,
}: {
  tenantId: string;
  services: Service[];
}) {
  const [step, setStep] = useState<Step>(services.length > 0 ? "service" : "contact");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [message, setMessage] = useState("");

  const selectedService = services.find((s) => s.id === selectedServiceId);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          serviceId: selectedServiceId || undefined,
          firstName,
          lastName,
          email,
          phone,
          addressLine1: addressLine1 || undefined,
          city: city || undefined,
          state: state || undefined,
          zip: zip || undefined,
          preferredDate: preferredDate || undefined,
          preferredTimeSlot: preferredTimeSlot || undefined,
          message: message || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "Failed to submit booking. Please try again.");
        return;
      }

      setStep("confirmed");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "confirmed") {
    return (
      <div className="mt-12 rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-4xl">&#10003;</div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">Booking Submitted!</h2>
        <p className="mt-2 text-gray-600">
          Thank you! We&apos;ve received your request and will get back to you shortly to confirm your appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {(services.length > 0 ? ["service", "datetime", "contact", "review"] : ["datetime", "contact", "review"]).map(
          (s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-8 bg-gray-300" />}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  s === step
                    ? "text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
                style={s === step ? { backgroundColor: "var(--color-primary)" } : undefined}
              >
                {i + 1}
              </div>
            </div>
          )
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step: Select Service */}
      {step === "service" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Select a Service</h2>
          <div className="mt-4 grid gap-3">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedServiceId === service.id
                    ? "border-2 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={
                  selectedServiceId === service.id
                    ? { borderColor: "var(--color-primary)" }
                    : undefined
                }
                onClick={() => setSelectedServiceId(service.id)}
              >
                <p className="font-medium text-gray-900">{service.name}</p>
                <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                  {service.priceDisplay && <span>{service.priceDisplay}</span>}
                  {service.estimatedDuration && (
                    <span>{service.estimatedDuration} min</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="rounded-md px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
              disabled={!selectedServiceId}
              onClick={() => setStep("datetime")}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Date & Time */}
      {step === "datetime" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Preferred Date & Time</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Date</label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {["morning", "afternoon", "evening"].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`rounded-md border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      preferredTimeSlot === slot
                        ? "border-2 bg-blue-50 text-gray-900"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                    style={
                      preferredTimeSlot === slot
                        ? { borderColor: "var(--color-primary)" }
                        : undefined
                    }
                    onClick={() => setPreferredTimeSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700"
              onClick={() => setStep(services.length > 0 ? "service" : "contact")}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-md px-6 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
              onClick={() => setStep("contact")}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Contact Info */}
      {step === "contact" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Additional Details</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe the issue or any special instructions..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700"
              onClick={() => setStep("datetime")}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-md px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
              disabled={!firstName || !lastName || !email || !phone}
              onClick={() => setStep("review")}
            >
              Review Booking
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Review Your Booking</h2>
          <div className="mt-4 space-y-4 rounded-lg border border-gray-200 p-6">
            {selectedService && (
              <div>
                <p className="text-sm text-gray-500">Service</p>
                <p className="font-medium">{selectedService.name}</p>
              </div>
            )}
            {preferredDate && (
              <div>
                <p className="text-sm text-gray-500">Preferred Date & Time</p>
                <p className="font-medium">
                  {new Date(preferredDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {preferredTimeSlot && ` - ${preferredTimeSlot}`}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-medium">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-gray-600">{email}</p>
              <p className="text-sm text-gray-600">{phone}</p>
            </div>
            {addressLine1 && (
              <div>
                <p className="text-sm text-gray-500">Service Address</p>
                <p className="text-sm text-gray-600">
                  {addressLine1}
                  {city && `, ${city}`}
                  {state && `, ${state}`}
                  {zip && ` ${zip}`}
                </p>
              </div>
            )}
            {message && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700"
              onClick={() => setStep("contact")}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-md px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
