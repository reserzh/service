import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LineItemType } from "@/types/models";

interface DraftOptionItem {
  description: string;
  quantity: string;
  unitPrice: string;
  type: LineItemType;
}

interface DraftOption {
  name: string;
  description: string;
  isRecommended: boolean;
  items: DraftOptionItem[];
}

interface EstimateDraftState {
  step: number;
  customerId: string;
  customerName: string;
  propertyId: string;
  propertyAddress: string;
  options: DraftOption[];
  summary: string;
  notes: string;
  validUntil: string;
  hasDraft: boolean;

  setStep: (step: number) => void;
  setCustomer: (id: string, name: string) => void;
  setProperty: (id: string, address: string) => void;
  setOptions: (options: DraftOption[]) => void;
  setDetails: (summary: string, notes: string, validUntil: string) => void;
  save: () => Promise<void>;
  restore: () => Promise<void>;
  clear: () => Promise<void>;
}

const STORAGE_KEY = "estimate_draft";

export const useEstimateDraftStore = create<EstimateDraftState>((set, get) => ({
  step: 1,
  customerId: "",
  customerName: "",
  propertyId: "",
  propertyAddress: "",
  options: [{ name: "", description: "", isRecommended: false, items: [{ description: "", quantity: "1", unitPrice: "", type: "service" }] }],
  summary: "",
  notes: "",
  validUntil: "",
  hasDraft: false,

  setStep: (step) => {
    set({ step });
    get().save();
  },
  setCustomer: (customerId, customerName) => {
    set({ customerId, customerName });
    get().save();
  },
  setProperty: (propertyId, propertyAddress) => {
    set({ propertyId, propertyAddress });
    get().save();
  },
  setOptions: (options) => {
    set({ options });
    get().save();
  },
  setDetails: (summary, notes, validUntil) => {
    set({ summary, notes, validUntil });
    get().save();
  },

  save: async () => {
    try {
      const state = get();
      const data = {
        step: state.step,
        customerId: state.customerId,
        customerName: state.customerName,
        propertyId: state.propertyId,
        propertyAddress: state.propertyAddress,
        options: state.options,
        summary: state.summary,
        notes: state.notes,
        validUntil: state.validUntil,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  },

  restore: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({ ...data, hasDraft: true });
      }
    } catch {
      // ignore
    }
  },

  clear: async () => {
    set({
      step: 1,
      customerId: "",
      customerName: "",
      propertyId: "",
      propertyAddress: "",
      options: [{ name: "", description: "", isRecommended: false, items: [{ description: "", quantity: "1", unitPrice: "", type: "service" }] }],
      summary: "",
      notes: "",
      validUntil: "",
      hasDraft: false,
    });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
