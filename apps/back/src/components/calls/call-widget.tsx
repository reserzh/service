"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  Pause,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DialPad } from "./dial-pad";

type WidgetState = "idle" | "connecting" | "active" | "incoming" | "error";

export function CallWidget() {
  const [state, setState] = useState<WidgetState>("idle");
  const [minimized, setMinimized] = useState(true);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callerInfo, setCallerInfo] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [deviceReady, setDeviceReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Initialize Twilio Device
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch("/api/v1/calls/token");
        if (!res.ok) return; // Not configured, silently skip

        const { data } = await res.json();
        if (!data?.token || cancelled) return;

        // Dynamic import of @twilio/voice-sdk (optional dependency)
        // @ts-ignore -- @twilio/voice-sdk types are only available when the package is installed
        const { Device } = await import("@twilio/voice-sdk");

        const device = new Device(data.token, {
          logLevel: 1,
          codecPreferences: [Device.Codec.Opus, Device.Codec.PCMU],
        });

        device.on("registered", () => {
          if (!cancelled) setDeviceReady(true);
        });

        device.on("incoming", (call: any) => {
          if (cancelled) return;
          callRef.current = call;
          setCallerInfo(call.parameters.From || "Unknown");
          setState("incoming");
          setMinimized(false);

          call.on("accept", () => {
            setState("active");
            startTimer();
          });

          call.on("disconnect", () => handleCallEnd());
          call.on("cancel", () => handleCallEnd());
        });

        device.on("error", (err: any) => {
          console.error("[CallWidget] Device error:", err);
          if (!cancelled) setError(err.message);
        });

        device.register();
        deviceRef.current = device;
      } catch (err) {
        // @twilio/voice-sdk not installed or token endpoint not configured
        console.debug("[CallWidget] Twilio Voice not available:", err);
      }
    }

    init();

    return () => {
      cancelled = true;
      deviceRef.current?.destroy();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }, []);

  const handleCallEnd = useCallback(() => {
    callRef.current = null;
    setState("idle");
    setMuted(false);
    setHeld(false);
    setElapsed(0);
    setCallerInfo("");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const handleOutboundCall = async () => {
    if (!phoneNumber || !deviceRef.current) return;

    try {
      setState("connecting");
      setMinimized(false);

      const call = await deviceRef.current.connect({
        params: { To: phoneNumber },
      });

      callRef.current = call;
      setCallerInfo(phoneNumber);

      call.on("accept", () => {
        setState("active");
        startTimer();
      });

      call.on("disconnect", () => handleCallEnd());
      call.on("cancel", () => handleCallEnd());
      call.on("error", () => handleCallEnd());
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Call failed");
    }
  };

  const handleAccept = () => {
    callRef.current?.accept();
  };

  const handleReject = () => {
    callRef.current?.reject();
    handleCallEnd();
  };

  const handleHangup = () => {
    callRef.current?.disconnect();
    handleCallEnd();
  };

  const toggleMute = () => {
    if (callRef.current) {
      callRef.current.mute(!muted);
      setMuted(!muted);
    }
  };

  const toggleHold = () => {
    // Twilio Client SDK doesn't have native hold - send DTMF or use conference
    setHeld(!held);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Don't render if device not available
  if (!deviceReady) return null;

  if (minimized && state === "idle") {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setMinimized(false)}
        >
          <Phone className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-72 shadow-xl">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {state === "idle" && "Phone"}
              {state === "connecting" && "Connecting..."}
              {state === "active" && formatTime(elapsed)}
              {state === "incoming" && "Incoming Call"}
              {state === "error" && "Error"}
            </span>
            {state === "idle" && (
              <button
                onClick={() => setMinimized(true)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Caller Info */}
          {callerInfo && (
            <p className="text-center text-sm text-muted-foreground">
              {callerInfo}
            </p>
          )}

          {/* Idle: Dial pad */}
          {state === "idle" && (
            <>
              <DialPad
                value={phoneNumber}
                onChange={setPhoneNumber}
              />
              <Button
                className="w-full"
                onClick={handleOutboundCall}
                disabled={!phoneNumber}
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
            </>
          )}

          {/* Incoming: Accept/Reject */}
          {state === "incoming" && (
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleAccept}
              >
                <PhoneIncoming className="mr-2 h-4 w-4" />
                Accept
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
              >
                <PhoneOff className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}

          {/* Active: Controls */}
          {(state === "active" || state === "connecting") && (
            <div className="flex items-center justify-center gap-3">
              <Button
                size="icon"
                variant={muted ? "destructive" : "outline"}
                onClick={toggleMute}
                disabled={state === "connecting"}
              >
                {muted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant={held ? "secondary" : "outline"}
                onClick={toggleHold}
                disabled={state === "connecting"}
              >
                {held ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={handleHangup}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Error */}
          {state === "error" && error && (
            <div className="space-y-2">
              <p className="text-sm text-destructive" role="alert">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setState("idle");
                  setError(null);
                }}
              >
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
