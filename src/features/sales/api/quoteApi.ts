import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"
import type {
  Quote,
  QuotePaginatedResponse,
  CreateQuotePayload,
  UpdateQuotePayload,
} from "../types/sales"

export interface ListQuotesParams {
  search?: string | null
  status?: string | null
  customer_id?: number | null
  created_by?: number | null
  date_from?: string | null
  date_to?: string | null
  per_page?: number | null
  page?: number
}

export const quoteApi = {
  async list(params: ListQuotesParams = {}): Promise<QuotePaginatedResponse> {
    const response = await axiosInstance.get<QuotePaginatedResponse>("/v1/quotes", { params })
    return response.data
  },

  async get(id: number): Promise<Quote> {
    const response = await axiosInstance.get<ApiResponse<Quote>>(`/v1/quotes/${id}`)
    return response.data.data
  },

  async create(payload: CreateQuotePayload): Promise<Quote> {
    const response = await axiosInstance.post<ApiResponse<Quote>>("/v1/quotes", payload)
    return response.data.data
  },

  async update(id: number, payload: UpdateQuotePayload): Promise<Quote> {
    const response = await axiosInstance.put<ApiResponse<Quote>>(`/v1/quotes/${id}`, payload)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/v1/quotes/${id}`)
  },

  async updateStatus(id: number, status: string): Promise<Quote> {
    const response = await axiosInstance.patch<ApiResponse<Quote>>(`/v1/quotes/${id}/status`, {
      status,
    })
    return response.data.data
  },

  async uploadFile(id: number, file: File): Promise<void> {
    const formData = new FormData()
    formData.append("file", file)
    await axiosInstance.post(`/v1/quotes/${id}/files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },

  async deleteFile(id: number, fileId: number): Promise<void> {
    await axiosInstance.delete(`/v1/quotes/${id}/files/${fileId}`)
  },
}
