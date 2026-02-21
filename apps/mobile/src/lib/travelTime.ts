const EARTH_RADIUS_KM = 6371;
const URBAN_AVG_SPEED_KMH = 30;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Haversine distance between two points in km
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Estimate travel time in minutes based on haversine distance
 * and an urban average speed of ~30 km/h with a 1.3 route factor
 */
export function estimateTravelMinutes(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): number {
  const distance = haversineDistance(fromLat, fromLon, toLat, toLon);
  const routeDistance = distance * 1.3; // road route factor
  const hours = routeDistance / URBAN_AVG_SPEED_KMH;
  return Math.round(hours * 60);
}

/**
 * Format travel time as a human-readable string
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 1) return "< 1 min drive";
  if (minutes < 60) return `~${minutes} min drive`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `~${hours}h drive`;
  return `~${hours}h ${mins}m drive`;
}
