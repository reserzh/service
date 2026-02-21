import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, type ListInvoicesParams } from "@/api/endpoints/invoices";

export function useInvoices(params?: ListInvoicesParams) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoicesApi.list(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoicesApi.get(id),
    enabled: !!id,
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesApi.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useVoidInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesApi.void(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; method: string; referenceNumber?: string; notes?: string } }) =>
      invoicesApi.recordPayment(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useCreateInvoiceFromJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, taxRate }: { jobId: string; taxRate: number }) =>
      invoicesApi.createFromJob(jobId, { taxRate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
