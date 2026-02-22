import { useQuery } from "@tanstack/react-query";
import { pricebookApi, type ListPricebookParams } from "@/api/endpoints/pricebook";

export function usePricebookItems(params?: ListPricebookParams) {
  return useQuery({
    queryKey: ["pricebook", params],
    queryFn: () => pricebookApi.list(params),
  });
}

export function usePricebookItem(id: string) {
  return useQuery({
    queryKey: ["pricebook", id],
    queryFn: () => pricebookApi.get(id),
    enabled: !!id,
  });
}

export function usePricebookCategories() {
  return useQuery({
    queryKey: ["pricebook", "categories"],
    queryFn: () => pricebookApi.categories(),
  });
}
