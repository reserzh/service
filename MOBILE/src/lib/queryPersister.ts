import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { mmkvStorage } from "./mmkv";

const mmkvClientStorage = {
  getItem: (key: string) => {
    const value = mmkvStorage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string) => {
    mmkvStorage.set(key, value);
  },
  removeItem: (key: string) => {
    mmkvStorage.delete(key);
  },
};

export const queryPersister = createSyncStoragePersister({
  storage: mmkvClientStorage,
});
