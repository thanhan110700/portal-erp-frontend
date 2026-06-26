import { useEffect, useState, useMemo, useCallback } from "react"
import { FileText, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { DateRangeValue } from "@/components/ui/date-range-picker-presets"

import { Button } from "@/components/ui/button"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { TablePagination } from "@/components/common/TablePagination"

import { quoteApi, type ListQuotesParams } from "../api/quoteApi"
import type { Quote, CreateQuotePayload, UpdateQuotePayload } from "../types/sales"
import { QuoteTable } from "../components/QuoteTable"
import { QuoteFormModal } from "../components/QuoteFormModal"
import { useAuthStore } from "@/hooks/useAuthStore"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"

export function QuoteListPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles?.includes("admin") ?? false
  const isSales = user?.roles?.includes("sales") ?? false
  const canEdit = isAdmin || isSales

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Options
  const [statuses, setStatuses] = useState<OptionItem[]>([])
  const [customers, setCustomers] = useState<OptionItem[]>([])
  const [employees, setEmployees] = useState<OptionItem[]>([])

  // Filters state
  const [params, setParams] = useState<ListQuotesParams>({
    page: 1,
    per_page: 20,
  })
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Quote | null>(null)

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
      toast.error("Không thể tải danh sách báo giá")
    } finally {
      setIsLoading(false)
    }
  }, [params])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Filters definition
  const filterFields = useMemo<FilterFieldDef[]>(
    () => [
      {
        field: "search",
        type: "input",
        label: "Tìm kiếm",
        placeholder: "Mã BG, Khách hàng...",
        value: params.search || "",
      },
      {
        field: "status",
        type: "select",
        label: "Trạng thái",
        placeholder: "Tất cả",
        value: params.status || null,
        options: statuses.map((c) => ({
          label: c.label,
          value: c.value.toString(),
        })),
      },
      {
        field: "customer_id",
        type: "select",
        label: "Khách hàng",
        placeholder: "Tất cả khách hàng",
        value: params.customer_id?.toString() || null,
        options: customers.map((c) => ({
          label: c.label,
          value: c.id?.toString() || "",
        })),
      },
      {
        field: "created_by",
        type: "select",
        label: "Người tạo",
        placeholder: "Tất cả người tạo",
        value: params.created_by?.toString() || null,
        options: employees.map((e) => ({
          label: e.label,
          value: e.id?.toString() || "",
        })),
      },
      {
        field: "dateRange",
        type: "daterange",
        label: "Ngày tạo",
        placeholder: "Khoảng thời gian",
        value: dateRange,
      },
    ],
    [
      params.search,
      params.status,
      params.customer_id,
      params.created_by,
      dateRange,
      statuses,
      customers,
      employees,
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

  // Actions
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
      toast.success("Đã xóa báo giá")
      void loadData()
    } catch {
      toast.error("Xóa thất bại")
    }
  }

  const handleSubmitForm = async (payload: CreateQuotePayload) => {
    try {
      if (editTarget) {
        await quoteApi.update(editTarget.id, payload as UpdateQuotePayload)
        toast.success("Đã cập nhật báo giá")
      } else {
        await quoteApi.create(payload)
        toast.success("Đã tạo báo giá mới")
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
            <FileText className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Báo Giá</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý danh sách báo giá gửi khách hàng
            </p>
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
            Làm mới
          </Button>
          {canEdit && (
            <Button size="sm" onClick={handleOpenCreate} className="gap-2">
              <Plus className="size-4" />
              Tạo báo giá
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
        <QuoteTable
          quotes={quotes}
          isLoading={isLoading}
          isAdmin={isAdmin}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
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
        <QuoteFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmitForm}
          editData={editTarget}
        />
      )}
    </div>
  )
}
