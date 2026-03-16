import { getTrackingSessionByToken } from "@/lib/tracking-queries";
import { TrackingMap } from "./tracking-map";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getTrackingSessionByToken(token);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Tracking session not found</h1>
          <p className="mt-2 text-gray-500">This tracking link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  if (session.status === "completed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Your technician has arrived!</h1>
          <p className="mt-2 text-gray-500">
            The tracking session for job #{session.jobNumber} has ended.
          </p>
          {session.companyName && (
            <p className="mt-1 text-sm text-gray-400">— {session.companyName}</p>
          )}
        </div>
      </div>
    );
  }

  if (session.status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Tracking session expired</h1>
          <p className="mt-2 text-gray-500">This tracking session is no longer active.</p>
          {session.companyName && (
            <p className="mt-1 text-sm text-gray-400">— {session.companyName}</p>
          )}
        </div>
      </div>
    );
  }

  // Active session — render live map
  const address = [session.propertyAddress, session.propertyCity, session.propertyState, session.propertyZip]
    .filter(Boolean)
    .join(", ");

  return (
    <TrackingMap
      token={token}
      companyName={session.companyName}
      techFirstName={session.techFirstName}
      techAvatarUrl={session.techAvatarUrl}
      techBio={session.techBio}
      jobNumber={session.jobNumber!}
      address={address}
      initialData={{
        currentLatitude: session.currentLatitude,
        currentLongitude: session.currentLongitude,
        destinationLatitude: session.destinationLatitude,
        destinationLongitude: session.destinationLongitude,
        etaMinutes: session.etaMinutes,
        lastLocationAt: session.lastLocationAt ? new Date(session.lastLocationAt).toISOString() : null,
      }}
    />
  );
}
