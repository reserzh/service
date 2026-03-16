"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface TrackingData {
  currentLatitude: string | null;
  currentLongitude: string | null;
  destinationLatitude: string | null;
  destinationLongitude: string | null;
  etaMinutes: number | null;
  lastLocationAt: string | null;
}

interface TrackingMapProps {
  token: string;
  companyName: string;
  techFirstName: string;
  techAvatarUrl: string | null;
  techBio: string | null;
  jobNumber: string;
  address: string;
  initialData: TrackingData;
}

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function TrackingMap({
  token,
  companyName,
  techFirstName,
  techAvatarUrl,
  techBio,
  jobNumber,
  address,
  initialData,
}: TrackingMapProps) {
  const [data, setData] = useState<TrackingData>(initialData);
  const [ended, setEnded] = useState(false);
  const [timeAgo, setTimeAgo] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<{ map: any; techMarker: any; destMarker: any }>({
    map: null,
    techMarker: null,
    destMarker: null,
  });

  // Poll for updates
  const fetchUpdate = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracking/${token}`);
      if (res.status === 404) {
        setEnded(true);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData({
          currentLatitude: json.data.currentLatitude,
          currentLongitude: json.data.currentLongitude,
          destinationLatitude: json.data.destinationLatitude,
          destinationLongitude: json.data.destinationLongitude,
          etaMinutes: json.data.etaMinutes,
          lastLocationAt: json.data.lastLocationAt,
        });
      }
    } catch {
      // Silent retry on next interval
    }
  }, [token]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      const hasLocation = data.currentLatitude && data.currentLongitude;
      const hasDest = data.destinationLatitude && data.destinationLongitude;
      const centerLat = hasLocation
        ? Number(data.currentLatitude)
        : hasDest
          ? Number(data.destinationLatitude)
          : 39.8283;
      const centerLng = hasLocation
        ? Number(data.currentLongitude)
        : hasDest
          ? Number(data.destinationLongitude)
          : -98.5795;

      const map = L.map(mapRef.current, { zoomControl: false }).setView(
        [centerLat, centerLng],
        13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      leafletRef.current.map = map;

      // Tech marker
      if (hasLocation) {
        leafletRef.current.techMarker = L.marker([
          Number(data.currentLatitude),
          Number(data.currentLongitude),
        ])
          .addTo(map)
          .bindPopup(`${techFirstName} — En Route`);
      }

      // Destination marker
      if (hasDest) {
        const greenIcon = L.icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
          shadowUrl:
            "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
        leafletRef.current.destMarker = L.marker(
          [Number(data.destinationLatitude), Number(data.destinationLongitude)],
          { icon: greenIcon }
        )
          .addTo(map)
          .bindPopup(address || "Destination");
      }

      // Fit bounds if both markers exist
      if (hasLocation && hasDest) {
        const bounds = L.latLngBounds(
          [Number(data.currentLatitude), Number(data.currentLongitude)],
          [Number(data.destinationLatitude), Number(data.destinationLongitude)]
        );
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    };
    document.head.appendChild(script);

    // Start polling
    const interval = setInterval(fetchUpdate, 10000);

    return () => {
      clearInterval(interval);
      if (leafletRef.current.map) {
        leafletRef.current.map.remove();
        leafletRef.current.map = null;
      }
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when data changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L || !leafletRef.current.map) return;

    const hasLocation = data.currentLatitude && data.currentLongitude;
    if (!hasLocation) return;

    const latLng = [Number(data.currentLatitude), Number(data.currentLongitude)];

    if (leafletRef.current.techMarker) {
      leafletRef.current.techMarker.setLatLng(latLng);
    } else {
      leafletRef.current.techMarker = L.marker(latLng)
        .addTo(leafletRef.current.map)
        .bindPopup(`${techFirstName} — En Route`);
    }
  }, [data.currentLatitude, data.currentLongitude, techFirstName]);

  // Update time ago display
  useEffect(() => {
    if (!data.lastLocationAt) return;
    const update = () => setTimeAgo(formatTimeAgo(data.lastLocationAt!));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [data.lastLocationAt]);

  if (ended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Your technician has arrived!
          </h1>
          <p className="mt-2 text-gray-500">The tracking session has ended.</p>
          {companyName && (
            <p className="mt-1 text-sm text-gray-400">— {companyName}</p>
          )}
        </div>
      </div>
    );
  }

  const hasLocation = data.currentLatitude && data.currentLongitude;

  return (
    <div className="relative h-screen w-full">
      {/* Header overlay */}
      <div className="absolute left-0 right-0 top-0 z-[1000] bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{companyName}</p>
              <p className="text-xs text-gray-500">Job #{jobNumber}</p>
              <div className="mt-2 flex items-center gap-2">
                {techAvatarUrl ? (
                  <img
                    src={techAvatarUrl}
                    alt={techFirstName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                    {techFirstName[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{techFirstName}</p>
                  {techBio && (
                    <p className="truncate text-xs text-gray-500">{techBio}</p>
                  )}
                </div>
              </div>
            </div>
            {data.etaMinutes != null && (
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">
                  ~{data.etaMinutes} min
                </p>
                <p className="text-xs text-gray-500">estimated arrival</p>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-600"></span>
            </span>
            <span className="text-sm text-gray-700">
              {hasLocation
                ? `${techFirstName} is on the way`
                : "Waiting for location..."}
            </span>
            {timeAgo && (
              <span className="ml-auto text-xs text-gray-400">
                Updated {timeAgo}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Destination address bar */}
      {address && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <div className="mx-auto max-w-lg px-4 py-3">
            <p className="text-xs text-gray-500">Destination</p>
            <p className="text-sm font-medium text-gray-900">{address}</p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
