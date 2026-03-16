import { api } from "../client";
import type {
  Estimate,
  EstimateWithRelations,
  LineItemType,
  ApiListResponse,
  ApiResponse,
} from "@/types/models";

export interface ListEstimatesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CreateEstimateInput {
  customerId: string;
  propertyId: string;
  jobId?: string;
  summary: string;
  notes?: string;
  validUntil?: string;
  options: {
    name: string;
    description?: string;
    isRecommended?: boolean;
    items: {
      pricebookItemId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      type?: LineItemType;
    }[];
  }[];
}

export const estimatesApi = {
  list(params?: ListEstimatesParams) {
    return api.get<ApiListResponse<Estimate>>("/estimates", params as Record<string, string>);
  },

  get(id: string) {
    return api.get<ApiResponse<EstimateWithRelations>>(`/estimates/${id}`);
  },

  create(data: CreateEstimateInput) {
    return api.post<ApiResponse<Estimate>>("/estimates", data);
  },

  convertToJob(estimateId: string) {
    return api.post<ApiResponse<{ jobId: string }>>(`/estimates/${estimateId}/convert-to-job`);
  },

  calculateArea(data: { propertyId?: string; areaSqft: number; serviceCategories: string[] }) {
    return api.post<ApiResponse<{
      options: {
        name: string;
        description: string;
        isRecommended: boolean;
        items: { pricebookItemId: string; description: string; quantity: number; unitPrice: number; type: string }[];
        total: number;
      }[];
    }>>("/estimates/calculate", data);
  },

  analyzePhoto(fileUri: string, mimeType: string, context?: string) {
    const formData = new FormData();
    const fileName = fileUri.split("/").pop() || "photo.jpg";
    formData.append("photo", {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
    if (context) {
      formData.append("context", context);
    }
    return api.upload<ApiResponse<{
      estimatedSqft: number;
      confidence: "low" | "medium" | "high";
      reasoning: string;
      range: { min: number; max: number };
      zones?: { name: string; estimatedSqft: number }[];
    }>>("/estimates/analyze-photo", formData);
  },

  generateBOM(data: {
    jobType: string;
    areaSqft?: number;
    length?: number;
    width?: number;
    useAI?: boolean;
    description?: string;
  }) {
    return api.post<ApiResponse<{
      source: "template" | "ai";
      options: {
        name: string;
        description: string;
        isRecommended: boolean;
        items: {
          pricebookItemId?: string;
          description: string;
          quantity: number;
          unitPrice: number;
          type: string;
          isEstimated?: boolean;
        }[];
        total: number;
      }[];
    }>>("/estimates/generate-bom", data);
  },
};
