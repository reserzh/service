import { useQuery } from "@tanstack/react-query";
import { customersApi, type ListCustomersParams } from "@/api/endpoints/customers";

export function useCustomers(params?: ListCustomersParams) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customersApi.list(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });
}
