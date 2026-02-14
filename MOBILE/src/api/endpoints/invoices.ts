import { api } from "../client";
import type {
  Invoice,
  InvoiceWithRelations,
  InvoiceListItem,
  PaymentMethod,
  ApiListResponse,
  ApiResponse,
} from "@/types/models";

export interface ListInvoicesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: string;
  from?: string;
  to?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface RecordPaymentInput {
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export const invoicesApi = {
  list(params?: ListInvoicesParams) {
    return api.get<ApiListResponse<InvoiceListItem>>("/invoices", params as Record<string, string>);
  },

  get(id: string) {
    return api.get<ApiResponse<InvoiceWithRelations>>(`/invoices/${id}`);
  },

  send(id: string) {
    return api.post<ApiResponse<Invoice>>(`/invoices/${id}/send`);
  },

  void(id: string) {
    return api.post<ApiResponse<Invoice>>(`/invoices/${id}/void`);
  },

  recordPayment(id: string, data: RecordPaymentInput) {
    return api.post<ApiResponse<Invoice>>(`/invoices/${id}/payments`, data);
  },
};
