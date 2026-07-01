import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Building2, Mail, Phone, MapPin, Briefcase, UserPlus, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MobileActionHeader } from "@/components/common/MobileActionHeader"

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
import { hasPermission, PermissionSlugs } from "@/constants/permissions"

import { ContactTable } from "../components/ContactTable"
import { ContactFormModal } from "../components/ContactFormModal"
import { InteractionList } from "../components/InteractionList"
import { InteractionFormModal } from "../components/InteractionFormModal"
import { StatusBadge } from "@/components/common/StatusBadge"
import { useTranslation } from "react-i18next"

export function CustomerDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const customerId = parseInt(id || "0")

  const user = useAuthStore((s) => s.user)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditCustomers)
  const canDelete = hasPermission(user?.permissions, PermissionSlugs.DeleteCustomers)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [interactionModalOpen, setInteractionModalOpen] = useState(false)

  const lastInteraction = interactions[0] ?? null
  const today = new Date().toISOString().split("T")[0]
  const dueFollowUps = interactions.filter(
    (interaction) => interaction.next_follow_up && interaction.next_follow_up <= today,
  )

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
  }, [customerId, navigate, t])

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            void navigate("/sales/customers")
          }}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <MobileActionHeader
            icon={Building2}
            title={customer.customer_name || t("sales:customer_detail.unknown_customer")}
            subtitle={`${t("sales:customer_detail.tax_number")}: ${customer.tax_number ?? "—"}`}
            actions={
              customer.classification ? (
                <StatusBadge
                  status={customer.classification}
                  className="bg-background px-3 py-1 text-sm"
                />
              ) : (
                <Badge variant="outline" className="bg-background px-3 py-1 text-sm">
                  {t("sales:customer_detail.unclassified")}
                </Badge>
              )
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {customer.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium shadow-sm"
          >
            <Phone className="size-4" />
            {t("sales:customer_detail.phone")}
          </a>
        )}
        {customer.email && (
          <a
            href={`mailto:${customer.email}`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium shadow-sm"
          >
            <Mail className="size-4" />
            Email
          </a>
        )}
        {canEdit && (
          <Button
            variant="outline"
            className="min-h-12 gap-2 rounded-xl"
            onClick={() => {
              setSelectedContact(null)
              setContactModalOpen(true)
            }}
          >
            <UserPlus className="size-4" />
            {t("sales:customer_detail.add_contact")}
          </Button>
        )}
        {canEdit && (
          <Button
            className="min-h-12 gap-2 rounded-xl"
            onClick={() => setInteractionModalOpen(true)}
          >
            <Plus className="size-4" />
            {t("sales:customer_detail.add_interaction")}
          </Button>
        )}
      </div>

      {/* ── Top Overview ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card p-5 space-y-4 lg:col-span-1">
          <h3 className="font-semibold border-b pb-2">{t("sales:customer_detail.contact_info")}</h3>
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
          <div className="rounded-xl border bg-card p-5 space-y-2 lg:col-span-2">
            <h3 className="font-semibold border-b pb-2">{t("sales:customer_detail.notes")}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("sales:interaction.last_interaction", { defaultValue: "Lần tương tác gần nhất" })}
          </p>
          <p className="mt-1 text-sm font-medium">
            {lastInteraction
              ? `${lastInteraction.interaction_type_label || lastInteraction.interaction_type} • ${lastInteraction.interaction_date}`
              : t("sales:interaction.empty_state.title")}
          </p>
        </div>
        <div
          className={`rounded-xl border p-4 ${
            dueFollowUps.length > 0
              ? "border-amber-200 bg-amber-50/70 dark:bg-amber-950/20"
              : "bg-card"
          }`}
        >
          <p className="text-xs font-semibold text-muted-foreground">
            {t("sales:interaction.due_follow_up", { defaultValue: "Follow-up đến hạn" })}
          </p>
          <p className="mt-1 text-sm font-medium">
            {dueFollowUps.length > 0
              ? t("sales:interaction.due_count", {
                  count: dueFollowUps.length,
                  defaultValue: "{{count}} lịch hẹn cần xử lý",
                })
              : t("sales:interaction.no_due_follow_up", {
                  defaultValue: "Không có lịch hẹn quá hạn",
                })}
          </p>
        </div>
      </div>

      {/* ── Main Content Tabs ───────────────────────────────────────────── */}
      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="mb-4 flex h-auto min-h-[48px] w-full justify-start overflow-x-auto whitespace-nowrap rounded-xl bg-muted/50 p-1">
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
            <h3 className="text-lg font-semibold">{t("sales:customer_detail.contacts_list")}</h3>
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
            canEdit={canEdit}
            canDelete={canDelete}
            onDelete={handleDeleteContact}
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
            canDelete={canDelete}
          />
        </TabsContent>
      </Tabs>

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
