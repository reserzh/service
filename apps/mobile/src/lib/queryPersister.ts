import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { asyncStorageAdapter } from "./mmkv";

export const queryPersister = createAsyncStoragePersister({
  storage: asyncStorageAdapter,
});
