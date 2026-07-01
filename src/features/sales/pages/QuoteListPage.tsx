import { useEffect, useState, useMemo, useCallback } from "react"
import { FileText, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { DateRangeValue } from "@/components/ui/date-range-picker-presets"

import { Button } from "@/components/ui/button"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { TablePagination } from "@/components/common/TablePagination"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MobileActionHeader } from "@/components/common/MobileActionHeader"
import { Fab } from "@/components/common/Fab"

import { quoteApi, type ListQuotesParams } from "../api/quoteApi"
import type { Quote, CreateQuotePayload, UpdateQuotePayload } from "../types/sales"
import { QuoteTable } from "../components/QuoteTable"
import { QuoteFormModal } from "../components/QuoteFormModal"
import { QuoteDetailDialog } from "../components/QuoteDetailDialog"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { useTranslation } from "react-i18next"

export function QuoteListPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const canCreate = hasPermission(user?.permissions, PermissionSlugs.CreateQuotes)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditQuotes)
  const canDelete = hasPermission(user?.permissions, PermissionSlugs.DeleteQuotes)
  const canCreateContract = hasPermission(user?.permissions, PermissionSlugs.CreateContracts)

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [statuses, setStatuses] = useState<OptionItem[]>([])
  const [customers, setCustomers] = useState<OptionItem[]>([])
  const [employees, setEmployees] = useState<OptionItem[]>([])

  const [params, setParams] = useState<ListQuotesParams>({
    page: 1,
    per_page: 20,
  })
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Quote | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  const [convertTarget, setConvertTarget] = useState<Quote | null>(null)
  const [convertSalesRepId, setConvertSalesRepId] = useState<string>(
    user?.id ? String(user.id) : "",
  )
  const [convertContractDate, setConvertContractDate] = useState(
    new Date().toISOString().split("T")[0],
  )
  const [convertSignedDate, setConvertSignedDate] = useState<string | null>(null)
  const [convertContent, setConvertContent] = useState("")
  const [convertTerms, setConvertTerms] = useState("")
  const [isConverting, setIsConverting] = useState(false)

  const getOptionValue = (option: OptionItem) => {
    if (typeof option.value === "string" || typeof option.value === "number") {
      return String(option.value)
    }

    if (typeof option.id === "string" || typeof option.id === "number") {
      return String(option.id)
    }

    return ""
  }

  useEffect(() => {
    Promise.all([optionApi.getQuoteStatuses(), optionApi.getCustomers(), optionApi.getEmployees()])
      .then(([st, cus, emp]) => {
        setStatuses(st)
        setCustomers(cus)
        setEmployees(emp)
      })
      .catch(console.error)
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await quoteApi.list(params)
      setQuotes(res.data)
      setTotalCount(res.meta.total)
    } catch {
      toast.error(t("sales:quote.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }, [params, t])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filterFields = useMemo<FilterFieldDef[]>(
    () => [
      {
        field: "search",
        type: "input",
        label: t("common:actions.search"),
        placeholder: t("sales:quote.filters.search_placeholder"),
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
          value: c.value.toString(),
        })),
      },
      {
        field: "customer_id",
        type: "select",
        label: t("sales:quote.columns.customer"),
        placeholder: t("sales:quote.filters.all_customers"),
        value: params.customer_id?.toString() || "",
        options: customers.map((c) => ({
          label: c.label,
          value: c.id?.toString() || "",
        })),
      },
      {
        field: "created_by",
        type: "select",
        label: t("sales:quote.filters.created_by"),
        placeholder: t("sales:quote.filters.all_creators"),
        value: params.created_by?.toString() || "",
        options: employees.map((e) => ({
          label: e.label,
          value: e.id?.toString() || "",
        })),
      },
      {
        field: "dateRange",
        type: "daterange",
        label: t("sales:quote.filters.created_date"),
        placeholder: t("sales:quote.filters.time_range"),
        value: dateRange,
      },
    ],
    [
      customers,
      dateRange,
      employees,
      params.created_by,
      params.customer_id,
      params.search,
      params.status,
      statuses,
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
      created_by: values.created_by ? Number(values.created_by) : undefined,
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
      created_by: undefined,
      date_from: undefined,
      date_to: undefined,
    }))
  }

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }

  const handleOpenCreate = () => {
    setEditTarget(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (quote: Quote) => {
    setEditTarget(quote)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await quoteApi.delete(id)
      toast.success(t("sales:quote.delete_success"))
      void loadData()
    } catch {
      toast.error(t("sales:quote.delete_error"))
    }
  }

  const handleSubmitForm = async (payload: CreateQuotePayload) => {
    try {
      if (editTarget) {
        await quoteApi.update(editTarget.id, payload as UpdateQuotePayload)
        toast.success(t("sales:quote.update_success"))
      } else {
        await quoteApi.create(payload)
        toast.success(t("sales:quote.create_success"))
      }
      setModalOpen(false)
      void loadData()
    } catch {
      // Form component should show error via toast
    }
  }

  const openConvertDialog = (quote: Quote) => {
    setConvertTarget(quote)
    setConvertSalesRepId(user?.id ? String(user.id) : "")
    setConvertContractDate(new Date().toISOString().split("T")[0])
    setConvertSignedDate(null)
    setConvertContent(quote.description || "")
    setConvertTerms("")
  }

  const handleConvertToContract = async () => {
    if (!convertTarget || !convertSalesRepId) {
      toast.error(t("sales:contract.form.validation.sales_required"))
      return
    }

    setIsConverting(true)
    try {
      await quoteApi.convertToContract(convertTarget.id, {
        sales_rep_id: Number(convertSalesRepId),
        contract_date: convertContractDate,
        signed_date: convertSignedDate,
        content: convertContent || null,
        terms: convertTerms || null,
      })
      toast.success(
        t("sales:quote.convert_success", { defaultValue: "Đã tạo hợp đồng từ báo giá" }),
      )
      setConvertTarget(null)
      void loadData()
    } catch {
      toast.error(
        t("sales:quote.convert_error", { defaultValue: "Tạo hợp đồng từ báo giá thất bại" }),
      )
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-0">
      <MobileActionHeader
        icon={FileText}
        title={t("sales:quote.title")}
        subtitle={t("sales:quote.description")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadData()}
              disabled={isLoading}
              className="gap-1.5 min-h-11 md:min-h-9"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              {t("common:actions.refresh")}
            </Button>
            {canCreate && (
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="hidden gap-2 min-h-11 md:flex md:min-h-9"
              >
                <Plus className="size-4" />
                {t("sales:quote.create")}
              </Button>
            )}
          </>
        }
      />

      {canCreate && <Fab onClick={handleOpenCreate} label={t("sales:quote.create")} />}

      <FilterPanel
        applyMode
        fields={filterFields}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <div className="flex flex-col gap-3">
        <QuoteTable
          quotes={quotes}
          isLoading={isLoading}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onViewDetail={(quote) => {
            setSelectedQuote(quote)
            setDetailOpen(true)
          }}
          canEdit={canEdit}
          canDelete={canDelete}
        />

        <TablePagination
          total={totalCount}
          page={params.page ?? 1}
          perPage={params.per_page ?? 20}
          totalPages={Math.ceil(totalCount / (params.per_page || 20))}
          onPageChange={handlePageChange}
        />
      </div>

      {modalOpen && (
        <QuoteFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmitForm}
          editData={editTarget}
        />
      )}

      {detailOpen && selectedQuote && (
        <QuoteDetailDialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          quoteId={selectedQuote.id}
          onRefresh={() => void loadData()}
          onConvertToContract={canCreateContract ? openConvertDialog : undefined}
        />
      )}

      <CommonDialog
        open={!!convertTarget}
        onClose={() => {
          if (isConverting) return
          setConvertTarget(null)
        }}
        title={t("sales:quote.convert_dialog_title", {
          defaultValue: "Tạo hợp đồng từ báo giá",
        })}
        size="lg"
        primaryAction={{
          label: t("sales:quote.convert_action", { defaultValue: "Tạo hợp đồng" }),
          onClick: () => void handleConvertToContract(),
          loading: isConverting,
        }}
        cancelAction={{
          label: t("common:actions.cancel"),
          onClick: () => setConvertTarget(null),
          disabled: isConverting,
        }}
      >
        <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label required>{t("sales:contract.columns.sales_rep")}</Label>
            <SearchableSelect
              value={convertSalesRepId}
              onValueChange={setConvertSalesRepId}
              options={employees.map((employee) => ({
                label: employee.label,
                value: getOptionValue(employee),
              }))}
              placeholder={t("sales:contract.form.sales_rep_placeholder")}
              className="h-10"
              disabled={isConverting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label required>{t("sales:contract.columns.contract_date")}</Label>
            <CommonDatePicker
              value={convertContractDate}
              onChange={(date) => setConvertContractDate(date || "")}
              disabled={isConverting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("sales:contract.columns.signed_date")}</Label>
            <CommonDatePicker
              value={convertSignedDate}
              onChange={(date) => setConvertSignedDate(date)}
              disabled={isConverting}
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <Label>{t("sales:contract.columns.content")}</Label>
            <Textarea
              value={convertContent}
              onChange={(e) => setConvertContent(e.target.value)}
              rows={4}
              placeholder={t("sales:contract.form.content_placeholder")}
              disabled={isConverting}
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <Label>{t("sales:contract.columns.terms")}</Label>
            <Textarea
              value={convertTerms}
              onChange={(e) => setConvertTerms(e.target.value)}
              rows={4}
              placeholder={t("sales:contract.form.terms_placeholder")}
              disabled={isConverting}
            />
          </div>
        </div>
      </CommonDialog>
    </div>
  )
}
