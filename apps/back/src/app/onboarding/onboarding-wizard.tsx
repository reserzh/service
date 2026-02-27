"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Leaf,
  Flame,
  Droplets,
  Zap,
  Wrench,
  User,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";
import { completeOnboardingAction } from "@/actions/onboarding";

const TRADE_PRESETS = {
  landscaping: {
    label: "Landscaping",
    icon: Leaf,
    services: [
      { name: "Lawn Mowing", unitPrice: 45 },
      { name: "Hedge Trimming", unitPrice: 65 },
      { name: "Mulching", unitPrice: 120 },
      { name: "Spring Cleanup", unitPrice: 200 },
      { name: "Leaf Removal", unitPrice: 150 },
    ],
  },
  hvac: {
    label: "HVAC",
    icon: Flame,
    services: [
      { name: "AC Tune-Up", unitPrice: 150 },
      { name: "Furnace Repair", unitPrice: 250 },
      { name: "Duct Cleaning", unitPrice: 350 },
      { name: "Filter Replacement", unitPrice: 75 },
      { name: "System Install", unitPrice: 5000 },
    ],
  },
  plumbing: {
    label: "Plumbing",
    icon: Droplets,
    services: [
      { name: "Drain Cleaning", unitPrice: 175 },
      { name: "Leak Repair", unitPrice: 200 },
      { name: "Water Heater", unitPrice: 1200 },
      { name: "Fixture Install", unitPrice: 250 },
      { name: "Sewer Line", unitPrice: 3000 },
    ],
  },
  electrical: {
    label: "Electrical",
    icon: Zap,
    services: [
      { name: "Panel Upgrade", unitPrice: 2000 },
      { name: "Outlet Install", unitPrice: 150 },
      { name: "Lighting", unitPrice: 300 },
      { name: "Wiring Repair", unitPrice: 250 },
      { name: "Generator Install", unitPrice: 5000 },
    ],
  },
  general: {
    label: "General / Other",
    icon: Wrench,
    services: [
      { name: "Service Call", unitPrice: 100 },
      { name: "Repair", unitPrice: 200 },
      { name: "Installation", unitPrice: 500 },
      { name: "Maintenance", unitPrice: 150 },
      { name: "Inspection", unitPrice: 100 },
    ],
  },
} as const;

type TradeKey = keyof typeof TRADE_PRESETS;

interface ServiceItem {
  name: string;
  unitPrice: number;
  selected: boolean;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [tradeType, setTradeType] = useState<TradeKey | null>(null);
  const [operatorType, setOperatorType] = useState<"solo" | "crew" | null>(null);

  // Step 2
  const [skipCustomer, setSkipCustomer] = useState(false);
  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    addressLine1: "",
    city: "",
    state: "",
    zip: "",
  });

  // Step 3
  const [services, setServices] = useState<ServiceItem[]>([]);

  function goToStep2() {
    if (!tradeType || !operatorType) return;
    setStep(2);
  }

  function goToStep3() {
    // Initialize services from trade preset
    if (tradeType) {
      const preset = TRADE_PRESETS[tradeType];
      setServices(
        preset.services.map((s) => ({ ...s, selected: true }))
      );
    }
    setStep(3);
  }

  function toggleService(index: number) {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  }

  function updateServicePrice(index: number, price: string) {
    const num = parseFloat(price);
    if (isNaN(num)) return;
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, unitPrice: num } : s))
    );
  }

  async function handleComplete() {
    if (!tradeType || !operatorType) return;
    setError(null);
    setLoading(true);

    const selectedServices = services
      .filter((s) => s.selected)
      .map((s) => ({ name: s.name, unitPrice: s.unitPrice }));

    const hasCustomer =
      !skipCustomer && customer.firstName && customer.lastName && customer.phone;

    const result = await completeOnboardingAction({
      tradeType,
      operatorType,
      customer: hasCustomer
        ? {
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            email: customer.email || undefined,
            addressLine1: customer.addressLine1 || undefined,
            city: customer.city || undefined,
            state: customer.state || undefined,
            zip: customer.zip || undefined,
          }
        : undefined,
      services: selectedServices,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 w-16 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome! Let&apos;s get you set up.</CardTitle>
            <CardDescription>
              Tell us about your business so we can customize your experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">What trade are you in?</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(Object.entries(TRADE_PRESETS) as [TradeKey, (typeof TRADE_PRESETS)[TradeKey]][]).map(
                  ([key, preset]) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTradeType(key)}
                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:border-primary/50 ${
                          tradeType === key
                            ? "border-primary bg-primary/5"
                            : "border-muted"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{preset.label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">How do you operate?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOperatorType("solo")}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:border-primary/50 ${
                    operatorType === "solo"
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  }`}
                >
                  <User className="h-6 w-6" />
                  <span className="text-sm font-medium">Solo Operator</span>
                  <span className="text-xs text-muted-foreground">Just me</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOperatorType("crew")}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:border-primary/50 ${
                    operatorType === "crew"
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  }`}
                >
                  <Users className="h-6 w-6" />
                  <span className="text-sm font-medium">Crew / Team</span>
                  <span className="text-xs text-muted-foreground">
                    Multiple technicians
                  </span>
                </button>
              </div>
            </div>

            <Button
              onClick={goToStep2}
              className="w-full"
              disabled={!tradeType || !operatorType}
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Add your first customer</CardTitle>
            <CardDescription>
              You can always add more customers later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!skipCustomer ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ob-first">First Name</Label>
                    <Input
                      id="ob-first"
                      value={customer.firstName}
                      onChange={(e) =>
                        setCustomer((p) => ({ ...p, firstName: e.target.value }))
                      }
                      placeholder="Jane"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ob-last">Last Name</Label>
                    <Input
                      id="ob-last"
                      value={customer.lastName}
                      onChange={(e) =>
                        setCustomer((p) => ({ ...p, lastName: e.target.value }))
                      }
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-phone">Phone</Label>
                  <Input
                    id="ob-phone"
                    type="tel"
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-email">
                    Email <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="ob-email"
                    type="email"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-address">
                    Address{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="ob-address"
                    value={customer.addressLine1}
                    onChange={(e) =>
                      setCustomer((p) => ({
                        ...p,
                        addressLine1: e.target.value,
                      }))
                    }
                    placeholder="123 Main St"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={customer.city}
                      onChange={(e) =>
                        setCustomer((p) => ({ ...p, city: e.target.value }))
                      }
                      placeholder="City"
                    />
                    <Input
                      value={customer.state}
                      onChange={(e) =>
                        setCustomer((p) => ({ ...p, state: e.target.value }))
                      }
                      placeholder="State"
                    />
                    <Input
                      value={customer.zip}
                      onChange={(e) =>
                        setCustomer((p) => ({ ...p, zip: e.target.value }))
                      }
                      placeholder="ZIP"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>You can add customers from the Customers page later.</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setSkipCustomer(!skipCustomer);
                }}
              >
                {skipCustomer ? "Add a customer" : "Skip for now"}
              </Button>
              <Button onClick={goToStep3}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Your top services</CardTitle>
            <CardDescription>
              We&apos;ve suggested services for your trade. Toggle and adjust prices as
              needed. These will be added to your pricebook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {services.map((service, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    service.selected ? "border-primary/30 bg-primary/5" : "border-muted opacity-60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleService(i)}
                    className="shrink-0"
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        service.selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {service.selected && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                  <span className="flex-1 text-sm font-medium">{service.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={service.unitPrice}
                      onChange={(e) => updateServicePrice(i, e.target.value)}
                      className="h-8 w-24 text-right"
                      min={0}
                      step={5}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finish Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
