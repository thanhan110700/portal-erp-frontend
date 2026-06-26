import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"
import type {
  Contract,
  ContractPaginatedResponse,
  CreateContractPayload,
  UpdateContractPayload,
} from "../types/sales"

export interface ListContractsParams {
  search?: string
  customer_id?: number | string
  status?: string
  per_page?: number
  page?: number
}

export const contractApi = {
  async list(params: ListContractsParams = {}): Promise<ContractPaginatedResponse> {
    const response = await axiosInstance.get<ContractPaginatedResponse>("/v1/contracts", { params })
    return response.data
  },

  async get(id: number): Promise<Contract> {
    const response = await axiosInstance.get<ApiResponse<Contract>>(`/v1/contracts/${id}`)
    return response.data.data
  },

  async create(payload: CreateContractPayload): Promise<Contract> {
    const response = await axiosInstance.post<ApiResponse<Contract>>("/v1/contracts", payload)
    return response.data.data
  },

  async update(id: number, payload: UpdateContractPayload): Promise<Contract> {
    const response = await axiosInstance.put<ApiResponse<Contract>>(`/v1/contracts/${id}`, payload)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/v1/contracts/${id}`)
  },

  async uploadFile(id: number, file: File): Promise<void> {
    const formData = new FormData()
    formData.append("file", file)
    await axiosInstance.post(`/v1/contracts/${id}/files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },

  async deleteFile(id: number, fileId: number): Promise<void> {
    await axiosInstance.delete(`/v1/contracts/${id}/files/${fileId}`)
  },
}
