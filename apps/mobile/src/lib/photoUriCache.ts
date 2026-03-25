const MAX_ENTRIES = 50;

/** Maps server photo IDs to local file URIs from recent uploads.
 *  Survives query cache invalidation so thumbnails don't go blank.
 *  Capped at MAX_ENTRIES — oldest entries are evicted first. */
class PhotoUriCache {
  private map = new Map<string, string>();

  get(id: string): string | undefined {
    return this.map.get(id);
  }

  set(id: string, uri: string): void {
    // Evict oldest entries when at capacity
    if (this.map.size >= MAX_ENTRIES && !this.map.has(id)) {
      const firstKey = this.map.keys().next().value!;
      this.map.delete(firstKey);
    }
    this.map.set(id, uri);
  }

  delete(id: string): void {
    this.map.delete(id);
  }
}

export const photoUriCache = new PhotoUriCache();
