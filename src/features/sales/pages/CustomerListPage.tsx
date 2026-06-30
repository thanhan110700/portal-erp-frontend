import { useEffect, useState, useMemo, useCallback } from "react"
import { Users, Plus, RefreshCw, Download, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { TablePagination } from "@/components/common/TablePagination"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"

import { customerApi, type ListCustomersParams } from "../api/customerApi"
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from "../types/sales"
import { CustomerTable } from "../components/CustomerTable"
import { CustomerFormModal } from "../components/CustomerFormModal"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { useTranslation } from "react-i18next"

export function CustomerListPage() {
  const user = useAuthStore((s) => s.user)
  const canCreate = hasPermission(user?.permissions, PermissionSlugs.CreateCustomers)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditCustomers)
  const canDelete = hasPermission(user?.permissions, PermissionSlugs.DeleteCustomers)

  const { t } = useTranslation()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Options
  const [classifications, setClassifications] = useState<OptionItem[]>([])
  const [salesReps, setSalesReps] = useState<OptionItem[]>([])

  // Filters state
  const [params, setParams] = useState<ListCustomersParams>({
    page: 1,
    per_page: 20,
  })

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)

  // Load options once
  useEffect(() => {
    Promise.all([optionApi.getCustomerClassifications(), optionApi.getEmployees()])
      .then(([classes, employees]) => {
        setClassifications(classes)
        setSalesReps(employees)
      })
      .catch(console.error)
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await customerApi.list(params)
      setCustomers(res.data)
      setTotalCount(res.meta.total)
      setSelectedIds((current) =>
        current.filter((id) => res.data.some((customer) => customer.id === id)),
      )
    } catch {
      toast.error(t("sales:customer_list.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }, [params])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Filters definition
  const filterFields = useMemo<FilterFieldDef[]>(() => {
    return [
      {
        field: "search",
        type: "input",
        label: t("sales:customer_list.search"),
        placeholder: t("sales:customer_list.search_placeholder"),
        value: params.search || "",
      },
      {
        field: "classification",
        type: "select",
        label: t("sales:customer_list.classification"),
        placeholder: t("common:filter.all"),
        value: params.classification || "",
        options: classifications.map((c) => ({
          label: c.label,
          value: c.value.toString(),
        })),
      },
      {
        field: "sales_rep_id",
        type: "select",
        label: t("sales:customer_list.sales_rep"),
        placeholder: t("common:filter.all"),
        value: params.sales_rep_id?.toString() || "",
        options: salesReps.map((e) => ({
          label: e.label,
          value: e.id?.toString() || "",
        })),
      },
    ]
  }, [params.search, params.classification, params.sales_rep_id, classifications, salesReps, t])

  const handleApplyFilters = (values: Record<string, unknown>) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      search: (values.search as string) || undefined,
      classification: (values.classification as string) || undefined,
      sales_rep_id: values.sales_rep_id ? Number(values.sales_rep_id) : undefined,
    }))
  }

  const handleResetFilters = () => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      search: undefined,
      classification: undefined,
      sales_rep_id: undefined,
    }))
  }

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }

  // Actions
  const handleOpenCreate = () => {
    setEditTarget(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (customer: Customer) => {
    setEditTarget(customer)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await customerApi.delete(id)
      toast.success(t("sales:customer_list.delete_success"))
      void loadData()
    } catch {
      toast.error(t("sales:customer_list.delete_error"))
    }
  }

  const handleExport = async () => {
    try {
      const blob = await customerApi.export({
        search: params.search,
        classification: params.classification,
        sales_rep_id: params.sales_rep_id,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "customers.xlsx"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(
        t("sales:customer_list.export_success", { defaultValue: "Đã xuất file khách hàng" }),
      )
    } catch {
      toast.error(t("sales:customer_list.export_error", { defaultValue: "Xuất file thất bại" }))
    }
  }

  const handleBulkDelete = async () => {
    try {
      await customerApi.bulkDelete(selectedIds)
      toast.success(
        t("sales:customer_list.bulk_delete_success", {
          count: selectedIds.length,
          defaultValue: "Đã xóa khách hàng đã chọn",
        }),
      )
      setSelectedIds([])
      setBulkDeleteOpen(false)
      void loadData()
    } catch {
      toast.error(
        t("sales:customer_list.bulk_delete_error", { defaultValue: "Xóa hàng loạt thất bại" }),
      )
    }
  }

  const handleSubmitForm = async (payload: CreateCustomerPayload | UpdateCustomerPayload) => {
    try {
      if (editTarget) {
        await customerApi.update(editTarget.id, payload as UpdateCustomerPayload)
        toast.success(t("sales:customer_list.update_success"))
      } else {
        await customerApi.create(payload as CreateCustomerPayload)
        toast.success(t("sales:customer_list.create_success"))
      }
      setModalOpen(false)
      void loadData()
    } catch {
      // Form component should show error
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t("sales:customer_list.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("sales:customer_list.subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExport()}
            className="gap-1.5"
          >
            <Download className="size-3.5" />
            {t("sales:customer_list.export", { defaultValue: "Xuất Excel" })}
          </Button>
          {canDelete && selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" />
              {t("sales:customer_list.bulk_delete", {
                count: selectedIds.length,
                defaultValue: "Xóa đã chọn",
              })}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadData()}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {t("common:actions.refresh")}
          </Button>
          {canCreate && (
            <Button size="sm" onClick={handleOpenCreate} className="gap-2">
              <Plus className="size-4" />
              {t("sales:customer_list.add_new")}
            </Button>
          )}
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <FilterPanel
        applyMode
        fields={filterFields}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <CustomerTable
          customers={customers}
          isLoading={isLoading}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
        />

        <TablePagination
          total={totalCount}
          page={params.page!}
          perPage={params.per_page!}
          totalPages={Math.ceil(totalCount / (params.per_page || 20))}
          onPageChange={handlePageChange}
        />
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      {modalOpen && (
        <CustomerFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmitForm}
          editData={editTarget}
          classifications={classifications}
          salesReps={salesReps}
        />
      )}

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={t("sales:customer_list.bulk_delete_title", {
          defaultValue: "Xóa khách hàng đã chọn?",
        })}
        description={t("sales:customer_list.bulk_delete_confirm", {
          count: selectedIds.length,
          defaultValue: "Hành động này sẽ xóa các khách hàng đã chọn và không thể hoàn tác.",
        })}
      />
    </div>
  )
}
