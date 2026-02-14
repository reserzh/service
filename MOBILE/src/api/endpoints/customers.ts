import { api } from "../client";
import type { Customer, CustomerWithRelations, ApiListResponse, ApiResponse } from "@/types/models";

export interface ListCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export const customersApi = {
  list(params?: ListCustomersParams) {
    return api.get<ApiListResponse<Customer>>("/customers", params as Record<string, string>);
  },

  get(id: string) {
    return api.get<ApiResponse<CustomerWithRelations>>(`/customers/${id}`);
  },
};
