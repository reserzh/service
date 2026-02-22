import { api } from "../client";
import type {
  PricebookItem,
  ApiListResponse,
  ApiResponse,
} from "@/types/models";

export interface ListPricebookParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  type?: string;
  isActive?: string;
}

export const pricebookApi = {
  list(params?: ListPricebookParams) {
    return api.get<ApiListResponse<PricebookItem>>("/pricebook", params as Record<string, string>);
  },

  get(id: string) {
    return api.get<ApiResponse<PricebookItem>>(`/pricebook/${id}`);
  },

  categories() {
    return api.get<{ data: string[] }>("/pricebook", { _categories: "true" });
  },
};
