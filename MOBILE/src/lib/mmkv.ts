import { MMKV } from "react-native-mmkv";

export const mmkvStorage = new MMKV({
  id: "fieldservice-query-cache",
});
