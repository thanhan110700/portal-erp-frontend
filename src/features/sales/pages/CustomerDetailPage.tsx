import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Building2, Mail, Phone, MapPin, Briefcase, UserPlus, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { customerApi } from "../api/customerApi"
import type {
  Customer,
  Contact,
  Interaction,
  CreateContactPayload,
  UpdateContactPayload,
  CreateInteractionPayload,
} from "../types/sales"
import { useAuthStore } from "@/hooks/useAuthStore"

import { ContactTable } from "../components/ContactTable"
import { ContactFormModal } from "../components/ContactFormModal"
import { InteractionList } from "../components/InteractionList"
import { InteractionFormModal } from "../components/InteractionFormModal"

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const customerId = parseInt(id || "0")

  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles?.includes("admin") ?? false
  const isSales = user?.roles?.includes("sales") ?? false
  const canEdit = isAdmin || isSales

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [interactionModalOpen, setInteractionModalOpen] = useState(false)

  const loadCustomerData = useCallback(async () => {
    if (!customerId) return
    setIsLoading(true)
    try {
      const [cusRes, contactRes, interactRes] = await Promise.all([
        customerApi.get(customerId),
        customerApi.getContacts(customerId),
        customerApi.getInteractions(customerId),
      ])
      setCustomer(cusRes)
      setContacts(contactRes)
      setInteractions(interactRes)
    } catch {
      toast.error("Không thể tải thông tin khách hàng")
      void navigate("/sales/customers")
    } finally {
      setIsLoading(false)
    }
  }, [customerId, navigate])

  useEffect(() => {
    void loadCustomerData()
  }, [loadCustomerData])

  // Handlers for Contacts
  const handleSubmitContact = async (payload: CreateContactPayload | UpdateContactPayload) => {
    try {
      if (selectedContact) {
        await customerApi.updateContact(
          customerId,
          selectedContact.id,
          payload as UpdateContactPayload,
        )
        toast.success("Đã cập nhật liên hệ")
      } else {
        await customerApi.createContact(customerId, payload as CreateContactPayload)
        toast.success("Đã thêm liên hệ mới")
      }
      setContactModalOpen(false)
      const contactRes = await customerApi.getContacts(customerId)
      setContacts(contactRes)
    } catch {
      toast.error(selectedContact ? "Cập nhật liên hệ thất bại" : "Thêm liên hệ thất bại")
    }
  }

  const handleDeleteContact = async (contactId: number) => {
    try {
      await customerApi.deleteContact(customerId, contactId)
      toast.success("Đã xóa liên hệ")
      const contactRes = await customerApi.getContacts(customerId)
      setContacts(contactRes)
    } catch {
      toast.error("Xóa liên hệ thất bại")
    }
  }

  // Handlers for Interactions
  const handleCreateInteraction = async (payload: CreateInteractionPayload) => {
    try {
      await customerApi.createInteraction(customerId, payload)
      toast.success("Đã ghi nhận tương tác")
      setInteractionModalOpen(false)
      const interactRes = await customerApi.getInteractions(customerId)
      setInteractions(interactRes)
    } catch {
      toast.error("Thêm tương tác thất bại")
    }
  }

  const handleDeleteInteraction = async (interactionId: number) => {
    try {
      await customerApi.deleteInteraction(customerId, interactionId)
      toast.success("Đã xóa tương tác")
      const interactRes = await customerApi.getInteractions(customerId)
      setInteractions(interactRes)
    } catch {
      toast.error("Xóa tương tác thất bại")
    }
  }

  if (isLoading || !customer) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/sales/customers")}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{customer.customer_name ?? customer.name}</h1>
              <p className="text-sm text-muted-foreground">
                Mã số thuế: {customer.tax_number ?? customer.tax_code ?? "—"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1 bg-background">
            {customer.classification || "Chưa phân loại"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Overview Sidebar ────────────────────────────────────────────── */}
        <div className="col-span-1 space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h3 className="font-semibold border-b pb-2">Thông tin liên hệ</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Phone className="size-4 text-muted-foreground mt-0.5" />
                <span className="font-medium">{customer.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="size-4 text-muted-foreground mt-0.5" />
                <span>{customer.email || "—"}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-muted-foreground mt-0.5" />
                <span>{customer.address || "—"}</span>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="size-4 text-muted-foreground mt-0.5" />
                <span>
                  Sales phụ trách:{" "}
                  <span className="font-medium">
                    {customer.sales_rep?.full_name || "Chưa phân công"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <h3 className="font-semibold">Ghi chú</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* ── Main Content Tabs ───────────────────────────────────────────── */}
        <div className="col-span-1 md:col-span-2">
          <Tabs defaultValue="contacts" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="contacts" className="gap-2">
                Người liên hệ <Badge variant="secondary">{contacts.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="interactions" className="gap-2">
                Lịch sử tương tác <Badge variant="secondary">{interactions.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="space-y-4 outline-none">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Danh sách người liên hệ</h3>
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedContact(null)
                      setContactModalOpen(true)
                    }}
                    className="gap-2"
                  >
                    <UserPlus className="size-4" />
                    Thêm liên hệ
                  </Button>
                )}
              </div>
              <ContactTable
                contacts={contacts}
                onEdit={(contact) => {
                  setSelectedContact(contact)
                  setContactModalOpen(true)
                }}
                onDelete={handleDeleteContact}
                isAdmin={isAdmin}
              />
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4 outline-none">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Lịch sử làm việc</h3>
                {canEdit && (
                  <Button size="sm" onClick={() => setInteractionModalOpen(true)} className="gap-2">
                    <Plus className="size-4" />
                    Ghi nhận tương tác
                  </Button>
                )}
              </div>
              <InteractionList
                interactions={interactions}
                onDelete={handleDeleteInteraction}
                isAdmin={isAdmin}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {contactModalOpen && (
        <ContactFormModal
          open={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          onSubmit={handleSubmitContact}
          initialData={selectedContact}
        />
      )}

      {interactionModalOpen && (
        <InteractionFormModal
          open={interactionModalOpen}
          onClose={() => setInteractionModalOpen(false)}
          onSubmit={handleCreateInteraction}
        />
      )}
    </div>
  )
}
