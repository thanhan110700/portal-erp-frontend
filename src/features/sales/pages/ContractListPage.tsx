import { useEffect, useState, useMemo, useCallback } from "react"
import { FileSignature, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { DateRangeValue } from "@/components/ui/date-range-picker-presets"

import { Button } from "@/components/ui/button"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { TablePagination } from "@/components/common/TablePagination"

import { contractApi, type ListContractsParams } from "../api/contractApi"
import type { Contract, CreateContractPayload, UpdateContractPayload } from "../types/sales"
import { ContractTable } from "../components/ContractTable"
import { ContractFormModal } from "../components/ContractFormModal"
import { ContractDetailDialog } from "../components/ContractDetailDialog"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { useTranslation } from "react-i18next"

export function ContractListPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const canCreate = hasPermission(user?.permissions, PermissionSlugs.CreateContracts)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditContracts)
  const canDelete = hasPermission(user?.permissions, PermissionSlugs.DeleteContracts)

  const [contracts, setContracts] = useState<Contract[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Options
  const [statuses, setStatuses] = useState<OptionItem[]>([])
  const [customers, setCustomers] = useState<OptionItem[]>([])
  const [salesReps, setSalesReps] = useState<OptionItem[]>([])
  const [quotes, setQuotes] = useState<OptionItem[]>([])

  // Filters state
  const [params, setParams] = useState<ListContractsParams>({
    page: 1,
    per_page: 20,
    search: "",
    status: "",
  })
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Contract | null>(null)

  // Drawer state
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  useEffect(() => {
    Promise.all([
      optionApi.getContractStatuses(),
      optionApi.getCustomers(),
      optionApi.getEmployees(),
      optionApi.getQuotes(),
    ])
      .then(([statusRes, custRes, empRes, quoteRes]) => {
        setStatuses(statusRes)
        setCustomers(custRes)
        setSalesReps(empRes)
        setQuotes(quoteRes)
      })
      .catch(console.error)
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await contractApi.list(params)
      setContracts(res.data)
      setTotalCount(res.meta.total)
    } catch {
      toast.error(t("sales:contract.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }, [params, t])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Filters definition
  const filterFields = useMemo<FilterFieldDef[]>(
    () => [
      {
        field: "search",
        type: "input",
        label: t("common:actions.search"),
        placeholder: t("sales:contract.filters.search_placeholder"),
        value: params.search || "",
      },
      {
        field: "status",
        type: "select",
        label: t("common:status.status"),
        placeholder: t("common:filter.all"),
        value: params.status || "",
        options: statuses.map((c) => ({
          label: c.label,
          value: c.value?.toString(),
        })),
      },
      {
        field: "customer_id",
        type: "select",
        label: t("sales:contract.columns.customer"),
        placeholder: t("sales:quote.filters.all_customers"),
        value: params.customer_id?.toString() || "",
        options: customers.map((customer) => ({
          label: customer.label,
          value: customer.value?.toString() || customer.id?.toString() || "",
        })),
      },
      {
        field: "sales_rep_id",
        type: "select",
        label: t("sales:contract.columns.sales_rep"),
        placeholder: t("common:filter.all"),
        value: params.sales_rep_id?.toString() || "",
        options: salesReps.map((employee) => ({
          label: employee.label,
          value: employee.value?.toString() || employee.id?.toString() || "",
        })),
      },
      {
        field: "dateRange",
        type: "daterange",
        label: t("sales:contract.filters.contract_date", { defaultValue: "Ngày hợp đồng" }),
        placeholder: t("sales:quote.filters.time_range"),
        value: dateRange,
      },
    ],
    [
      params.search,
      params.status,
      params.customer_id,
      params.sales_rep_id,
      statuses,
      customers,
      salesReps,
      dateRange,
      t,
    ],
  )

  const handleApplyFilters = (values: Record<string, unknown>) => {
    const range = values.dateRange as DateRangeValue | null
    setDateRange(range)
    setParams((prev) => ({
      ...prev,
      page: 1,
      search: (values.search as string) || undefined,
      status: (values.status as string) || undefined,
      customer_id: values.customer_id ? Number(values.customer_id) : undefined,
      sales_rep_id: values.sales_rep_id ? Number(values.sales_rep_id) : undefined,
      date_from: range?.from || undefined,
      date_to: range?.to || undefined,
    }))
  }

  const handleResetFilters = () => {
    setDateRange(null)
    setParams((prev) => ({
      ...prev,
      page: 1,
      search: undefined,
      status: undefined,
      customer_id: undefined,
      sales_rep_id: undefined,
      date_from: undefined,
      date_to: undefined,
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

  const handleOpenEdit = async (contract: Contract) => {
    try {
      const fullContract = await contractApi.get(contract.id)
      toast.dismiss("load-contract")
      setEditTarget(fullContract)
      setModalOpen(true)
    } catch {
      toast.error(t("sales:contract.fetch_detail_error"))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await contractApi.delete(id)
      toast.success(t("sales:contract.delete_success"))
      void loadData()
    } catch {
      toast.error(t("sales:contract.delete_error"))
    }
  }

  const handleSubmitForm = async (payload: CreateContractPayload) => {
    try {
      if (editTarget) {
        await contractApi.update(editTarget.id, payload as UpdateContractPayload)
        toast.success(t("sales:contract.update_success"))
      } else {
        await contractApi.create(payload)
        toast.success(t("sales:contract.create_success"))
      }
      setModalOpen(false)
      void loadData()
    } catch {
      // Form component should show error via toast
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileSignature className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t("sales:contract.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("sales:contract.description")}</p>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
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
              {t("sales:contract.create")}
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
        <ContractTable
          contracts={contracts}
          isLoading={isLoading}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onViewDetail={(contract) => {
            setSelectedContract(contract)
            setDetailOpen(true)
          }}
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
        <ContractFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmitForm}
          editData={editTarget}
          statuses={statuses}
          customers={customers}
          salesReps={salesReps}
          quotes={quotes}
        />
      )}

      {/* ── Detail Drawer ───────────────────────────────────────────────── */}
      {detailOpen && selectedContract && (
        <ContractDetailDialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          contractId={selectedContract.id}
          onRefresh={() => void loadData()}
        />
      )}
    </div>
  )
}
