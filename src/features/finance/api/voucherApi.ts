import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"
import type {
  Voucher,
  VoucherPaginatedResponse,
  CreateVoucherPayload,
  UpdateVoucherPayload,
  ListVouchersParams,
  VoucherAuditLog,
} from "../types/voucher"

export const voucherApi = {
  async list(params: ListVouchersParams = {}): Promise<VoucherPaginatedResponse> {
    const response = await axiosInstance.get<VoucherPaginatedResponse>("/v1/vouchers", {
      params,
    })
    return response.data
  },

  async get(id: number): Promise<Voucher> {
    const response = await axiosInstance.get<ApiResponse<Voucher>>(`/v1/vouchers/${id}`)
    return response.data.data
  },

  async create(payload: CreateVoucherPayload): Promise<Voucher> {
    const response = await axiosInstance.post<ApiResponse<Voucher>>("/v1/vouchers", payload)
    return response.data.data
  },

  async update(id: number, payload: UpdateVoucherPayload): Promise<Voucher> {
    const response = await axiosInstance.put<ApiResponse<Voucher>>(`/v1/vouchers/${id}`, payload)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/v1/vouchers/${id}`)
  },

  async approve(
    id: number,
    action: "approve" | "reject",
    rejectionReason?: string,
  ): Promise<Voucher> {
    const response = await axiosInstance.patch<ApiResponse<Voucher>>(`/v1/vouchers/${id}/approve`, {
      action,
      rejection_reason: rejectionReason,
    })
    return response.data.data
  },

  async uploadFile(voucherId: number, file: File): Promise<unknown> {
    const formData = new FormData()
    formData.append("file", file)
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `/v1/vouchers/${voucherId}/files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    )
    return response.data.data
  },

  async deleteFile(voucherId: number, fileId: number): Promise<void> {
    await axiosInstance.delete(`/v1/vouchers/${voucherId}/files/${fileId}`)
  },

  async getHistory(id: number): Promise<VoucherAuditLog[]> {
    const response = await axiosInstance.get<ApiResponse<VoucherAuditLog[]>>(
      `/v1/vouchers/${id}/history`,
    )
    return response.data.data
  },
}
