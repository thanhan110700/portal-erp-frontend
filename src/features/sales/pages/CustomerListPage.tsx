import { useEffect, useState, useMemo, useCallback } from "react"
import { Users, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { TablePagination } from "@/components/common/TablePagination"

import { customerApi, type ListCustomersParams } from "../api/customerApi"
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from "../types/sales"
import { CustomerTable } from "../components/CustomerTable"
import { CustomerFormModal } from "../components/CustomerFormModal"
import { useAuthStore } from "@/hooks/useAuthStore"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"

export function CustomerListPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles?.includes("admin") ?? false
  const isSales = user?.roles?.includes("sales") ?? false
  const canEdit = isAdmin || isSales

  const [customers, setCustomers] = useState<Customer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

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
    } catch {
      toast.error("Không thể tải danh sách khách hàng")
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
        label: "Tìm kiếm",
        placeholder: "Tên, SĐT, Email...",
        value: params.search || "",
      },
      {
        field: "classification",
        type: "select",
        label: "Phân loại",
        placeholder: "Tất cả",
        value: params.classification || null,
        options: classifications.map((c) => ({
          label: c.label,
          value: c.value.toString(),
        })),
      },
      {
        field: "sales_rep_id",
        type: "select",
        label: "Sale phụ trách",
        placeholder: "Tất cả",
        value: params.sales_rep_id?.toString() || null,
        options: salesReps.map((e) => ({
          label: e.label,
          value: e.id?.toString() || "",
        })),
      },
    ]
  }, [params.search, params.classification, params.sales_rep_id, classifications, salesReps])

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
      toast.success("Đã xóa khách hàng")
      void loadData()
    } catch {
      toast.error("Xóa thất bại")
    }
  }

  const handleSubmitForm = async (payload: CreateCustomerPayload | UpdateCustomerPayload) => {
    try {
      if (editTarget) {
        await customerApi.update(editTarget.id, payload as UpdateCustomerPayload)
        toast.success("Đã cập nhật khách hàng")
      } else {
        await customerApi.create(payload as CreateCustomerPayload)
        toast.success("Đã thêm khách hàng mới")
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
            <h1 className="text-xl font-semibold">Khách Hàng</h1>
            <p className="text-sm text-muted-foreground">Quản lý hồ sơ khách hàng & đối tác</p>
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
              Thêm khách hàng
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
        <CustomerFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmitForm}
          editData={editTarget}
          classifications={classifications}
          salesReps={salesReps}
        />
      )}
    </div>
  )
}
