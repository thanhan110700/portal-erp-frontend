import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"
import type {
  Customer,
  CustomerPaginatedResponse,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  Contact,
  CreateContactPayload,
  UpdateContactPayload,
  Interaction,
  CreateInteractionPayload,
} from "../types/sales"

export interface ListCustomersParams {
  search?: string | null
  classification?: string | null
  sales_rep_id?: number | null
  per_page?: number | null
  page?: number
}

export const customerApi = {
  // ── Customer CRUD ────────────────────────────────────────────────────────
  async list(params: ListCustomersParams = {}): Promise<CustomerPaginatedResponse> {
    const response = await axiosInstance.get<CustomerPaginatedResponse>("/v1/customers", { params })
    return response.data
  },

  async get(id: number): Promise<Customer> {
    const response = await axiosInstance.get<ApiResponse<Customer>>(`/v1/customers/${id}`)
    return response.data.data
  },

  async create(payload: CreateCustomerPayload): Promise<Customer> {
    const response = await axiosInstance.post<ApiResponse<Customer>>("/v1/customers", payload)
    return response.data.data
  },

  async update(id: number, payload: UpdateCustomerPayload): Promise<Customer> {
    const response = await axiosInstance.put<ApiResponse<Customer>>(`/v1/customers/${id}`, payload)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/v1/customers/${id}`)
  },

  // ── Contacts ─────────────────────────────────────────────────────────────
  async getContacts(customerId: number): Promise<Contact[]> {
    const response = await axiosInstance.get<ApiResponse<Contact[]>>(
      `/v1/customers/${customerId}/contacts`,
    )
    return response.data.data
  },

  async createContact(customerId: number, payload: CreateContactPayload): Promise<Contact> {
    const response = await axiosInstance.post<ApiResponse<Contact>>(
      `/v1/customers/${customerId}/contacts`,
      payload,
    )
    return response.data.data
  },

  async updateContact(
    customerId: number,
    contactId: number,
    payload: UpdateContactPayload,
  ): Promise<Contact> {
    const response = await axiosInstance.patch<ApiResponse<Contact>>(
      `/v1/customers/${customerId}/contacts/${contactId}`,
      payload,
    )
    return response.data.data
  },

  async deleteContact(customerId: number, contactId: number): Promise<void> {
    await axiosInstance.delete(`/v1/customers/${customerId}/contacts/${contactId}`)
  },

  // ── Interactions ─────────────────────────────────────────────────────────
  async getInteractions(customerId: number): Promise<Interaction[]> {
    const response = await axiosInstance.get<ApiResponse<Interaction[]>>(
      `/v1/customers/${customerId}/interactions`,
    )
    return response.data.data
  },

  async createInteraction(
    customerId: number,
    payload: CreateInteractionPayload,
  ): Promise<Interaction> {
    const response = await axiosInstance.post<ApiResponse<Interaction>>(
      `/v1/customers/${customerId}/interactions`,
      payload,
    )
    return response.data.data
  },

  async deleteInteraction(customerId: number, interactionId: number): Promise<void> {
    await axiosInstance.delete(`/v1/customers/${customerId}/interactions/${interactionId}`)
  },
}
