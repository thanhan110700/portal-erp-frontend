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
import { useTranslation } from "react-i18next"

export function CustomerDetailPage() {
  const { t } = useTranslation()
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
      toast.error(t("sales:customer_detail.fetch_error"))
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
        toast.success(t("sales:customer_detail.contact_update_success"))
      } else {
        await customerApi.createContact(customerId, payload as CreateContactPayload)
        toast.success(t("sales:customer_detail.contact_create_success"))
      }
      setContactModalOpen(false)
      const contactRes = await customerApi.getContacts(customerId)
      setContacts(contactRes)
    } catch {
      toast.error(
        selectedContact
          ? t("sales:customer_detail.contact_update_error")
          : t("sales:customer_detail.contact_create_error"),
      )
    }
  }

  const handleDeleteContact = async (contactId: number) => {
    try {
      await customerApi.deleteContact(customerId, contactId)
      toast.success(t("sales:customer_detail.contact_delete_success"))
      const contactRes = await customerApi.getContacts(customerId)
      setContacts(contactRes)
    } catch {
      toast.error(t("sales:customer_detail.contact_delete_error"))
    }
  }

  // Handlers for Interactions
  const handleCreateInteraction = async (payload: CreateInteractionPayload) => {
    try {
      await customerApi.createInteraction(customerId, payload)
      toast.success(t("sales:customer_detail.interaction_create_success"))
      setInteractionModalOpen(false)
      const interactRes = await customerApi.getInteractions(customerId)
      setInteractions(interactRes)
    } catch {
      toast.error(t("sales:customer_detail.interaction_create_error"))
    }
  }

  const handleDeleteInteraction = async (interactionId: number) => {
    try {
      await customerApi.deleteInteraction(customerId, interactionId)
      toast.success(t("sales:customer_detail.interaction_delete_success"))
      const interactRes = await customerApi.getInteractions(customerId)
      setInteractions(interactRes)
    } catch {
      toast.error(t("sales:customer_detail.interaction_delete_error"))
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
                {t("sales:customer_detail.tax_number")}:{" "}
                {customer.tax_number ?? customer.tax_code ?? "—"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1 bg-background">
            {customer.classification || t("sales:customer_detail.unclassified")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Overview Sidebar ────────────────────────────────────────────── */}
        <div className="col-span-1 space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h3 className="font-semibold border-b pb-2">
              {t("sales:customer_detail.contact_info")}
            </h3>
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
                  {t("sales:customer_detail.sales_rep")}:{" "}
                  <span className="font-medium">
                    {customer.sales_rep?.full_name || t("sales:customer_detail.unassigned")}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <h3 className="font-semibold">{t("sales:customer_detail.notes")}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* ── Main Content Tabs ───────────────────────────────────────────── */}
        <div className="col-span-1 md:col-span-2">
          <Tabs defaultValue="contacts" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="contacts" className="gap-2">
                {t("sales:customer_detail.contacts_tab")}{" "}
                <Badge variant="secondary">{contacts.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="interactions" className="gap-2">
                {t("sales:customer_detail.interactions_tab")}{" "}
                <Badge variant="secondary">{interactions.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="space-y-4 outline-none">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {t("sales:customer_detail.contacts_list")}
                </h3>
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
                    {t("sales:customer_detail.add_contact")}
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
                <h3 className="text-lg font-semibold">
                  {t("sales:customer_detail.interactions_list")}
                </h3>
                {canEdit && (
                  <Button size="sm" onClick={() => setInteractionModalOpen(true)} className="gap-2">
                    <Plus className="size-4" />
                    {t("sales:customer_detail.add_interaction")}
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
