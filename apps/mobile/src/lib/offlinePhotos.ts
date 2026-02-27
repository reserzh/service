import { Paths, File, Directory } from "expo-file-system";

const OFFLINE_DIR_NAME = "offline-photos";
const MAX_PENDING_PHOTOS = 100;

function getDir(): Directory {
  return new Directory(Paths.document, OFFLINE_DIR_NAME);
}

function ensureDir(): void {
  const dir = getDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/**
 * Copy a temporary image picker URI to persistent storage.
 * Returns the persistent file:// URI.
 */
export async function saveOfflinePhoto(
  tempUri: string,
  id: string,
  mimeType: string
): Promise<string> {
  ensureDir();

  // Check pending photo count
  const count = getPendingPhotoCount();
  if (count >= MAX_PENDING_PHOTOS) {
    throw new Error(
      `Offline photo limit reached (${MAX_PENDING_PHOTOS}). Please sync before taking more photos.`
    );
  }

  const ext = mimeType === "image/png" ? "png" : "jpg";
  const dest = new File(Paths.document, OFFLINE_DIR_NAME, `${id}.${ext}`);
  const source = new File(tempUri);

  source.copy(dest);
  return dest.uri;
}

/**
 * Delete a persisted offline photo after successful upload.
 */
export function deleteOfflinePhoto(id: string): void {
  try {
    for (const ext of ["jpg", "png"]) {
      const file = new File(Paths.document, OFFLINE_DIR_NAME, `${id}.${ext}`);
      if (file.exists) {
        file.delete();
        return;
      }
    }
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Get the persistent URI for an offline photo.
 */
export function getOfflinePhotoUri(id: string, mimeType: string): string {
  const ext = mimeType === "image/png" ? "png" : "jpg";
  const file = new File(Paths.document, OFFLINE_DIR_NAME, `${id}.${ext}`);
  return file.uri;
}

/**
 * Check if an offline photo file exists.
 */
export function offlinePhotoExists(id: string): boolean {
  for (const ext of ["jpg", "png"]) {
    const file = new File(Paths.document, OFFLINE_DIR_NAME, `${id}.${ext}`);
    if (file.exists) return true;
  }
  return false;
}

/**
 * Count pending offline photos on disk.
 */
export function getPendingPhotoCount(): number {
  try {
    ensureDir();
    const dir = getDir();
    return dir.list().length;
  } catch {
    return 0;
  }
}
