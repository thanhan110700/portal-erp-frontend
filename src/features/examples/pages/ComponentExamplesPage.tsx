import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import {
  Sparkles,
  Info,
  Trash2,
  Maximize2,
  AlignRight,
  AlignJustify,
  AlignLeft,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDrawer } from "@/components/common/CommonDrawer"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import {
  CommonDateRangePicker,
  type DateRangeValue,
} from "@/components/common/CommonDateRangePicker"
import { DateRangePickerPresets } from "@/components/ui/date-range-picker-presets"
import { FileUploadInput, FileUploadField } from "@/components/common/FileUploadField"
import { Form } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { ActiveFilterChips, type ActiveFilterChip } from "@/components/common/ActiveFilterChips"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import dayjs from "@/lib/dayjs"

// Form values type for the React Hook Form example
interface FormValues {
  appointmentDate: string | null
  rentalPeriod: DateRangeValue
  avatar: File | null
}

type MockOrder = {
  id: string
  customer: string
  status: "pending" | "completed" | "cancelled"
  amount: number
  date: string
  priority: "low" | "normal" | "high"
}

const MOCK_ORDERS: MockOrder[] = [
  {
    id: "ORD-001",
    customer: "John Doe",
    status: "completed",
    amount: 150.0,
    date: "2026-06-20",
    priority: "high",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    status: "pending",
    amount: 89.9,
    date: "2026-06-22",
    priority: "normal",
  },
  {
    id: "ORD-003",
    customer: "Bob Johnson",
    status: "cancelled",
    amount: 200.5,
    date: "2026-06-15",
    priority: "low",
  },
  {
    id: "ORD-004",
    customer: "Alice Brown",
    status: "completed",
    amount: 450.0,
    date: "2026-06-18",
    priority: "high",
  },
  {
    id: "ORD-005",
    customer: "Charlie Wilson",
    status: "pending",
    amount: 25.0,
    date: "2026-06-23",
    priority: "normal",
  },
  {
    id: "ORD-006",
    customer: "Diana Miller",
    status: "completed",
    amount: 120.0,
    date: "2026-06-10",
    priority: "low",
  },
]

export function ComponentExamplesPage() {
  // ── Dialog States ───────────────────────────────────────────────────────
  const [infoOpen, setInfoOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState(false)
  const [largeOpen, setLargeOpen] = React.useState(false)

  // ── Drawer States ────────────────────────────────────────────────────────
  const [rightOpen, setRightOpen] = React.useState(false)
  const [bottomOpen, setBottomOpen] = React.useState(false)
  const [leftOpen, setLeftOpen] = React.useState(false)

  // ── DatePicker Standalone States ────────────────────────────────────────
  const [singleDate, setSingleDate] = React.useState<string | null>(null)
  const [rangeFrom, setRangeFrom] = React.useState<string | null>(null)
  const [rangeTo, setRangeTo] = React.useState<string | null>(null)
  const [presetFrom, setPresetFrom] = React.useState<string | null>(null)
  const [presetTo, setPresetTo] = React.useState<string | null>(null)
  const [pickerError, setPickerError] = React.useState<string | undefined>(undefined)

  // ── File Upload Standalone States ────────────────────────────────────────
  const [standaloneFile, setStandaloneFile] = React.useState<File | null>(null)
  const [existingFile, setExistingFile] = React.useState<File | null>(null)

  // ── React Hook Form Setup ────────────────────────────────────────────────
  const form = useForm<FormValues>({
    defaultValues: {
      appointmentDate: null,
      rentalPeriod: { from: null, to: null },
      avatar: null,
    },
  })

  const [formOutput, setFormOutput] = React.useState<string | null>(null)

  // ── Table with Filters & Chips States ──────────────────────────────────
  const [tableFilters, setTableFilters] = React.useState({
    search: null as string | null,
    status: null as string | null,
    priorities: [] as string[],
    dateRange: { from: null, to: null } as DateRangeValue,
  })

  const filterFields = React.useMemo<FilterFieldDef[]>(
    () => [
      {
        field: "search",
        type: "input",
        label: "Search Customer",
        placeholder: "Type customer name...",
        value: tableFilters.search || "",
      },
      {
        field: "status",
        type: "select",
        label: "Order Status",
        placeholder: "All Statuses",
        value: tableFilters.status || "",
        options: [
          { label: "Pending", value: "pending" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ],
      },
      {
        field: "priorities",
        type: "multiselect",
        label: "Priority Levels",
        placeholder: "Select priorities",
        value: tableFilters.priorities,
        options: [
          { label: "Low", value: "low" },
          { label: "Normal", value: "normal" },
          { label: "High", value: "high" },
        ],
      },
      {
        field: "dateRange",
        type: "daterange",
        label: "Order Date Range",
        placeholder: "Select range",
        value: tableFilters.dateRange,
      },
    ],
    [tableFilters],
  )

  const handleApplyFilters = (values: Record<string, unknown>) => {
    setTableFilters({
      search: (values.search as string | null) ?? null,
      status: (values.status as string | null) ?? null,
      priorities: (values.priorities as string[]) ?? [],
      dateRange: (values.dateRange as DateRangeValue) ?? { from: null, to: null },
    })
  }

  const handleTableFilterReset = () => {
    setTableFilters({
      search: null,
      status: null,
      priorities: [],
      dateRange: { from: null, to: null },
    })
  }

  const activeChips = React.useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = []

    if (tableFilters.search) {
      chips.push({
        key: "search",
        label: "Customer",
        displayValue: tableFilters.search,
      })
    }
    if (tableFilters.status) {
      chips.push({
        key: "status",
        label: "Status",
        displayValue: tableFilters.status.charAt(0).toUpperCase() + tableFilters.status.slice(1),
      })
    }
    if (tableFilters.priorities.length > 0) {
      chips.push({
        key: "priorities",
        label: "Priority",
        displayValue: tableFilters.priorities
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(", "),
      })
    }
    if (tableFilters.dateRange.from || tableFilters.dateRange.to) {
      const fromStr = tableFilters.dateRange.from
        ? dayjs(tableFilters.dateRange.from).format("DD/MM/YYYY")
        : "..."
      const toStr = tableFilters.dateRange.to
        ? dayjs(tableFilters.dateRange.to).format("DD/MM/YYYY")
        : "..."
      chips.push({
        key: "dateRange",
        label: "Date Range",
        displayValue: `${fromStr} - ${toStr}`,
      })
    }

    return chips
  }, [tableFilters])

  const handleRemoveChip = (key: string) => {
    setTableFilters((prev) => ({
      ...prev,
      [key]: key === "priorities" ? [] : key === "dateRange" ? { from: null, to: null } : null,
    }))
  }

  const filteredOrders = React.useMemo(() => {
    return MOCK_ORDERS.filter((order) => {
      if (tableFilters.search) {
        const query = tableFilters.search.toLowerCase()
        if (
          !order.customer.toLowerCase().includes(query) &&
          !order.id.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      if (tableFilters.status && order.status !== tableFilters.status) {
        return false
      }
      if (tableFilters.priorities.length > 0 && !tableFilters.priorities.includes(order.priority)) {
        return false
      }
      if (tableFilters.dateRange.from) {
        if (dayjs(order.date).isBefore(dayjs(tableFilters.dateRange.from), "day")) {
          return false
        }
      }
      if (tableFilters.dateRange.to) {
        if (dayjs(order.date).isAfter(dayjs(tableFilters.dateRange.to), "day")) {
          return false
        }
      }
      return true
    })
  }, [tableFilters])

  const columns = React.useMemo<MRT_ColumnDef<MockOrder>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Order ID",
        size: 100,
      },
      {
        accessorKey: "customer",
        header: "Customer",
        size: 150,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        Cell: ({ cell }) => {
          const val = cell.getValue<string>()
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
                val === "completed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                val === "pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                val === "cancelled" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
              )}
            >
              {val}
            </span>
          )
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        size: 100,
        Cell: ({ cell }) => {
          const val = cell.getValue<string>()
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                val === "high" && "bg-red-500/10 text-red-600 dark:text-red-400",
                val === "normal" && "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
                val === "low" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
              )}
            >
              {val}
            </span>
          )
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        size: 100,
        Cell: ({ cell }) => `$${cell.getValue<number>().toFixed(2)}`,
      },
      {
        accessorKey: "date",
        header: "Date",
        size: 120,
        Cell: ({ cell }) => dayjs(cell.getValue<string>()).format("DD/MM/YYYY"),
      },
    ],
    [],
  )

  const table = useMantineReactTable({
    columns,
    data: filteredOrders,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: true,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableFullScreenToggle: false,
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withBorder: false,
      withColumnBorders: false,
    },
    mantineTableContainerProps: {
      onScroll: (e: React.UIEvent<HTMLDivElement>) => {
        e.currentTarget.style.setProperty("--mrt-scroll-left", `${e.currentTarget.scrollLeft}px`)
      },
      sx: { overflowX: "auto", WebkitOverflowScrolling: "touch" },
    },
  })

  const onSubmit = (data: FormValues) => {
    // Convert File details for JSON display
    const formattedData = {
      ...data,
      avatar: data.avatar
        ? {
            name: data.avatar.name,
            size: `${(data.avatar.size / 1024).toFixed(0)} KB`,
            type: data.avatar.type,
          }
        : null,
    }
    setFormOutput(JSON.stringify(formattedData, null, 2))
  }

  // Mock Delete action with simulated api delay
  const handleDeleteConfirm = () => {
    setDeleteLoading(true)
    setTimeout(() => {
      setDeleteLoading(false)
      setDeleteOpen(false)
      alert("Record deleted successfully!")
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-8 pb-16 animate-in fade-in duration-500">
      {/* Banner / Header */}
      <div className="relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8 p-8 sm:p-10 rounded-3xl border border-border/50 shadow-sm bg-zinc-950 text-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-amber-500/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="relative z-10 w-full lg:w-2/3">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-red-400" />
            <span className="text-xs font-semibold tracking-wide uppercase text-zinc-100">
              Interactive Showroom
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Common Components</h1>
          <p className="text-zinc-300 text-base max-w-xl leading-relaxed">
            Explore live examples and configurations of our standard Dialog, Drawer, DatePicker,
            DateRangePicker, and FileUpload components.
          </p>
        </div>
      </div>

      {/* Grid containing Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION 1: Dialog Showcases */}
        <section className="flex flex-col gap-4 p-6 rounded-2xl border border-border/55 bg-card text-card-foreground shadow-xs">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">CommonDialog</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fully customisable overlay dialogs supporting header configurations, footer action
              arrays, size mappings, and custom contents.
            </p>
          </div>
          <hr className="border-border/60" />

          <div className="flex flex-wrap gap-3">
            {/* Example 1: Info Dialog */}
            <Button variant="outline" className="text-xs gap-1.5" onClick={() => setInfoOpen(true)}>
              <Info className="size-4" /> Info Dialog
            </Button>

            {/* Example 2: Danger / Confirmation with Loading State */}
            <Button
              variant="destructive"
              className="text-xs gap-1.5"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" /> Danger Confirm (Delete)
            </Button>

            {/* Example 3: Large Scrollable Content */}
            <Button
              variant="secondary"
              className="text-xs gap-1.5"
              onClick={() => setLargeOpen(true)}
            >
              <Maximize2 className="size-4" /> Large Form Dialog (Size XL)
            </Button>
          </div>
        </section>

        {/* SECTION 2: Drawer Showcases */}
        <section className="flex flex-col gap-4 p-6 rounded-2xl border border-border/55 bg-card text-card-foreground shadow-xs">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">CommonDrawer</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drawer / sheet modals with full slide animation. Supports all 4 directions (left/right
              side panels, top/bottom sheets).
            </p>
          </div>
          <hr className="border-border/60" />

          <div className="flex flex-wrap gap-3">
            {/* Example 1: Right Side (Default Form Panel) */}
            <Button
              variant="outline"
              className="text-xs gap-1.5"
              onClick={() => setRightOpen(true)}
            >
              <AlignRight className="size-4" /> Right Panel (Standard)
            </Button>

            {/* Example 2: Bottom Sheet (Filters) */}
            <Button
              variant="outline"
              className="text-xs gap-1.5"
              onClick={() => setBottomOpen(true)}
            >
              <AlignJustify className="size-4" /> Bottom Sheet
            </Button>

            {/* Example 3: Left side panel */}
            <Button variant="outline" className="text-xs gap-1.5" onClick={() => setLeftOpen(true)}>
              <AlignLeft className="size-4" /> Left Side Panel
            </Button>
          </div>
        </section>

        {/* SECTION 3: DatePicker Standalone usage */}
        <section className="flex flex-col gap-4 p-6 rounded-2xl border border-border/55 bg-card text-card-foreground shadow-xs">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">DatePickers (Standalone)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Standard pickers mapping directly to component states. Demonstrates validation error
              rendering, hint styling, and clear actions.
            </p>
          </div>
          <hr className="border-border/60" />

          <div className="flex flex-col gap-4">
            <CommonDatePicker
              label="Select a Single Date"
              value={singleDate}
              onChange={setSingleDate}
              placeholder="Pick custom date"
              hint="Selected value formats as YYYY-MM-DD"
              error={pickerError}
              required
            />

            <CommonDateRangePicker
              label="Select Date Range"
              from={rangeFrom}
              to={rangeTo}
              onChange={(f, t) => {
                setRangeFrom(f)
                setRangeTo(t)
              }}
              placeholder="Pick starting and ending dates"
              hint="Values are saved separately as From & To dates"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium leading-none text-foreground">
                Date Range with Presets
              </label>
              <DateRangePickerPresets
                from={presetFrom}
                to={presetTo}
                onChange={(f, t) => {
                  setPresetFrom(f)
                  setPresetTo(t)
                }}
                placeholder="Select date range using presets"
              />
              <p className="text-xs text-muted-foreground">
                Supports pre-defined filters like 'Today', 'Last Month', etc.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setSingleDate(null)
                  setRangeFrom(null)
                  setRangeTo(null)
                  setPresetFrom(null)
                  setPresetTo(null)
                  setPickerError(undefined)
                }}
              >
                Clear All Pickers
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive"
                onClick={() =>
                  setPickerError(
                    pickerError ? undefined : "This is a custom validation error message!",
                  )
                }
              >
                Toggle Error State
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 4: File Upload (Standalone) */}
        <section className="flex flex-col gap-4 p-6 rounded-2xl border border-border/55 bg-card text-card-foreground shadow-xs">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">File Uploads (Standalone)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload fields supporting drag & drop, file type restriction, size display, and modal
              zoom previewing.
            </p>
          </div>
          <hr className="border-border/60" />

          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Standard Uploader (No Initial Value)</label>
              <FileUploadInput
                value={standaloneFile}
                onChange={setStandaloneFile}
                hint="Images (PNG, JPG, WEBP) only"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Uploader with Pre-existing Image</label>
              <FileUploadInput
                value={existingFile}
                onChange={setExistingFile}
                existingUrl="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80"
                hint="Click Change to choose a new file"
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: React Hook Form integration */}
        <section className="flex flex-col gap-4 p-6 rounded-2xl border border-border/55 bg-card text-card-foreground shadow-xs lg:col-span-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Full Form Validation (React Hook Form)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Demonstrates complete form control, custom rules, touched status, and error states
              using RHF Controllers and Form elements.
            </p>
          </div>
          <hr className="border-border/60" />

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="space-y-4 md:col-span-2">
                {/* Controller for DatePicker */}
                <Controller
                  name="appointmentDate"
                  control={form.control}
                  rules={{ required: "Appointment date is required" }}
                  render={({ field, fieldState }) => (
                    <CommonDatePicker
                      label="Appointment Date"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      required
                    />
                  )}
                />

                {/* Controller for DateRangePicker */}
                <Controller
                  name="rentalPeriod"
                  control={form.control}
                  rules={{
                    validate: (val) => {
                      if (!val.from || !val.to) {
                        return "Please complete both start and end rental dates"
                      }
                      return true
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <CommonDateRangePicker
                      label="Rental Duration"
                      from={field.value?.from ?? null}
                      to={field.value?.to ?? null}
                      onChange={() => {}}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      required
                    />
                  )}
                />
              </div>

              <div className="space-y-4">
                {/* FileUploadField RHF Wrapper */}
                <FileUploadField
                  control={form.control}
                  name="avatar"
                  label="Upload Avatar Logo"
                  hint="Square image file up to 5MB"
                />
              </div>

              <div className="flex gap-2 md:col-span-3">
                <Button type="submit" size="sm" className="text-xs">
                  Submit Form
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    form.reset()
                    setFormOutput(null)
                  }}
                >
                  Reset Form
                </Button>
              </div>

              {/* Form output display */}
              {formOutput && (
                <div className="mt-3 p-3 bg-muted rounded-lg border border-border/70 md:col-span-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Submitted Form Data:
                  </p>
                  <pre className="text-xs overflow-x-auto text-foreground font-mono">
                    {formOutput}
                  </pre>
                </div>
              )}

              {form.formState.isSubmitSuccessful && !formOutput && (
                <p className="text-xs text-emerald-600 flex items-center gap-1 md:col-span-3">
                  <AlertCircle className="size-3.5" /> Form submitted! Data logged above.
                </p>
              )}
            </form>
          </Form>
        </section>

        {/* SECTION 6: Table with Filters & Chips */}
        <section className="flex flex-col gap-4 p-6 rounded-2xl border border-border/55 bg-card text-card-foreground shadow-xs lg:col-span-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Table with Filter Panel & Active Chips (Mantine React Table)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Demonstrates integration between a collapsible FilterPanel, dynamic ActiveFilterChips,
              and MantineReactTable with searching, sorting, and status formatting.
            </p>
          </div>
          <hr className="border-border/60" />

          {/* Filter Panel */}
          <FilterPanel
            applyMode
            fields={filterFields}
            onApply={handleApplyFilters}
            onReset={handleTableFilterReset}
            title="Search & Filters"
            defaultOpen={false}
          />

          {/* Active Chips */}
          <ActiveFilterChips
            chips={activeChips}
            onRemove={handleRemoveChip}
            onClearAll={handleTableFilterReset}
          />

          {/* Table Container */}
          <div className="rounded-lg border border-border overflow-hidden">
            <MantineReactTable table={table} />
          </div>
        </section>
      </div>

      {/* ── Dialog Components Rendered ─────────────────────────────────────── */}

      {/* 1. Info Dialog */}
      <CommonDialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Notice & Terms"
        description="Please review our terms before proceeding."
        size="md"
        primaryAction={{
          label: "I Agree",
          onClick: () => {
            alert("Agreed!")
            setInfoOpen(false)
          },
        }}
        cancelAction={{
          label: "Decline",
          variant: "outline",
          onClick: () => setInfoOpen(false),
        }}
      >
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            By accepting, you agree to store session cookies, cache assets, and follow the basic
            user experience guidelines for the application shell.
          </p>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs">
            Notice: Operations inside the portal are audited under security log standards.
          </div>
        </div>
      </CommonDialog>

      {/* 2. Confirm Delete Dialog */}
      <CommonDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Confirm Record Deletion"
        description="Are you absolutely sure you want to delete this resource?"
        size="sm"
        primaryAction={{
          label: "Delete Resource",
          variant: "destructive",
          loading: deleteLoading,
          onClick: handleDeleteConfirm,
        }}
        cancelAction
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          This operation is irreversible. All related transaction records, invoices, and activity
          logs will be permanently deleted from the database.
        </p>
      </CommonDialog>

      {/* 3. Large Form Dialog */}
      <CommonDialog
        open={largeOpen}
        onClose={() => setLargeOpen(false)}
        title="Create New Project"
        description="Specify core parameters and launch setup."
        size="xl"
        primaryAction={{
          label: "Create Project",
          onClick: () => {
            alert("Created project!")
            setLargeOpen(false)
          },
        }}
        cancelAction
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[50vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Project Name</label>
            <input
              type="text"
              placeholder="e.g. ERP Expansion"
              className="h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Client Division</label>
            <input
              type="text"
              placeholder="e.g. Sales APAC"
              className="h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold">Scope of Work</label>
            <textarea
              rows={3}
              placeholder="Describe targets and milestones..."
              className="p-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="md:col-span-2">
            <CommonDatePicker
              label="Estimated Launch Date"
              value={null}
              onChange={() => {}}
              hint="Optional scheduling target"
            />
          </div>
        </div>
      </CommonDialog>

      {/* ── Drawer Components Rendered ─────────────────────────────────────── */}

      {/* 1. Right side form drawer */}
      <CommonDrawer
        open={rightOpen}
        onClose={() => setRightOpen(false)}
        title="User Settings Panel"
        description="Manage security keys and roles"
        width="450px"
        primaryAction={{
          label: "Save Profile",
          onClick: () => {
            alert("Saved Profile!")
            setRightOpen(false)
          },
        }}
        cancelAction
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Account Information</h3>
            <p className="text-xs text-muted-foreground">
              Modify settings related to security credentials.
            </p>
          </div>
          <hr className="border-border/60" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold">System Display Name</label>
              <input
                type="text"
                defaultValue="ERP System Lead"
                className="h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold">Notification E-mail</label>
              <input
                type="email"
                defaultValue="lead@erp.corp"
                className="h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </CommonDrawer>

      {/* 2. Bottom Sheet Filters */}
      <CommonDrawer
        open={bottomOpen}
        onClose={() => setBottomOpen(false)}
        title="Filter Records"
        description="Filter your current records using the settings below"
        direction="bottom"
        primaryAction={{
          label: "Apply Filters",
          onClick: () => setBottomOpen(false),
        }}
        cancelAction
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <select className="h-9 px-2 border border-border rounded-lg bg-background text-sm">
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Priority
            </label>
            <select className="h-9 px-2 border border-border rounded-lg bg-background text-sm">
              <option>Any Priority</option>
              <option>High</option>
              <option>Normal</option>
              <option>Low</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Author
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              className="h-9 px-3 border border-border rounded-lg bg-background text-sm"
            />
          </div>
        </div>
      </CommonDrawer>

      {/* 3. Left Side Panel */}
      <CommonDrawer
        open={leftOpen}
        onClose={() => setLeftOpen(false)}
        title="Documentation Index"
        description="Navigation shortcuts and documentation index."
        direction="left"
        cancelAction={false}
      >
        <div className="flex flex-col gap-3 py-2">
          {[
            "Introduction",
            "Architecture Design",
            "Design Tokens",
            "Form Validation",
            "API Integrations",
          ].map((item, index) => (
            <button
              key={index}
              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted text-foreground transition-colors font-medium"
              onClick={() => {
                alert(`Navigating to doc section: ${item}`)
                setLeftOpen(false)
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </CommonDrawer>
    </div>
  )
}
