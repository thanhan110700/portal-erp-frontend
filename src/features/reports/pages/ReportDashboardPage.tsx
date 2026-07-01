import { useEffect, useState, useMemo } from "react"
import { IncomeExpenseTab } from "../components/IncomeExpenseTab"
import { ReceivablesTab } from "../components/ReceivablesTab"
import { ProjectProfitTab } from "../components/ProjectProfitTab"
import { SalesPerformanceTab } from "../components/SalesPerformanceTab"
import { PipelineTab } from "../components/PipelineTab"
import { Download, Printer } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { PageLoader } from "@/components/common/PageLoader"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import {
  reportApi,
  type IncomeExpenseRow,
  type ReceivableRow,
  type ProjectProfitRow,
  type SalesRevenueRow,
  type QuoteConversionData,
  type SalesPipelineData,
} from "../api/reportApi"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

export function ReportDashboardPage() {
  const { t } = useTranslation(["reports", "common"])
  const [activeTab, setActiveTab] = useState("income-expense")
  const [loading, setLoading] = useState(true)

  // Options lists
  const [salesReps, setSalesReps] = useState<OptionItem[]>([])
  const [customers, setCustomers] = useState<OptionItem[]>([])

  // Global filters
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<string>("all")
  const [salesRepId, setSalesRepId] = useState<string>("")
  const [customerId, setCustomerId] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  // Data states
  const [incomeExpenseData, setIncomeExpenseData] = useState<IncomeExpenseRow[]>([])
  const [receivablesData, setReceivablesData] = useState<ReceivableRow[]>([])
  const [projectProfitData, setProjectProfitData] = useState<ProjectProfitRow[]>([])
  const [salesRevenueData, setSalesRevenueData] = useState<SalesRevenueRow[]>([])
  const [quoteConversionData, setQuoteConversionData] = useState<QuoteConversionData | null>(null)
  const [pipelineData, setPipelineData] = useState<SalesPipelineData | null>(null)

  // Load static option items
  useEffect(() => {
    Promise.all([optionApi.getEmployees(), optionApi.getCustomers()])
      .then(([emp, cust]) => {
        setSalesReps(emp)
        setCustomers(cust)
      })
      .catch(console.error)
  }, [])

  const filterFields = useMemo<FilterFieldDef[]>(() => {
    if (activeTab === "income-expense" || activeTab === "project-profit") {
      return [
        {
          field: "date_from",
          label: t("reports:filters.dateFrom"),
          type: "datepicker",
          value: dateFrom || null,
        },
        {
          field: "date_to",
          label: t("reports:filters.dateTo"),
          type: "datepicker",
          value: dateTo || null,
        },
      ]
    }
    if (activeTab === "receivables") {
      return [
        {
          field: "date_from",
          label: t("reports:filters.dateFrom"),
          type: "datepicker",
          value: dateFrom || null,
        },
        {
          field: "date_to",
          label: t("reports:filters.dateTo"),
          type: "datepicker",
          value: dateTo || null,
        },
        {
          field: "customer_id",
          label: t("reports:filters.customer"),
          type: "select",
          value: customerId || "",
          options: customers.map((c) => ({
            label: c.label,
            value: c.value?.toString() || c.id?.toString() || "",
          })),
          placeholder: t("reports:filters.customer_placeholder"),
        },
        {
          field: "sales_rep_id",
          label: t("reports:filters.salesRep"),
          type: "select",
          value: salesRepId || "",
          options: salesReps.map((e) => ({
            label: e.label,
            value: e.value?.toString() || e.id?.toString() || "",
          })),
          placeholder: t("reports:filters.salesRep_placeholder"),
        },
      ]
    }
    if (activeTab === "sales-performance") {
      return [
        {
          field: "year",
          label: t("reports:filters.year"),
          type: "input",
          value: year ? String(year) : "",
          placeholder: t("reports:filters.year_placeholder"),
        },
        {
          field: "month",
          label: t("reports:filters.month"),
          type: "select",
          value: month || "",
          options: [
            { label: t("reports:filters.month_all"), value: "all" },
            ...Array.from({ length: 12 }, (_, i) => ({
              label: t("reports:filters.month") + ` ${i + 1}`,
              value: String(i + 1),
            })),
          ],
          placeholder: t("reports:filters.month_placeholder"),
        },
        {
          field: "sales_rep_id",
          label: t("reports:filters.salesRep"),
          type: "select",
          value: salesRepId || "",
          options: salesReps.map((e) => ({
            label: e.label,
            value: e.value?.toString() || e.id?.toString() || "",
          })),
          placeholder: t("reports:filters.salesRep_placeholder"),
        },
      ]
    }
    return []
  }, [activeTab, dateFrom, dateTo, customerId, salesRepId, year, month, customers, salesReps])

  const handleApplyFilters = (values: Record<string, unknown>) => {
    if (
      activeTab === "income-expense" ||
      activeTab === "receivables" ||
      activeTab === "project-profit"
    ) {
      setDateFrom((values.date_from as string | null) ?? "")
      setDateTo((values.date_to as string | null) ?? "")
    }
    if (activeTab === "receivables") {
      setCustomerId((values.customer_id as string | null) ?? "")
    }
    if (activeTab === "receivables" || activeTab === "sales-performance") {
      setSalesRepId((values.sales_rep_id as string | null) ?? "")
    }
    if (activeTab === "sales-performance") {
      setYear(parseInt(values.year as string) || new Date().getFullYear())
      setMonth((values.month as string | null) ?? "all")
    }
  }

  const handleResetFilters = () => {
    setDateFrom("")
    setDateTo("")
    setCustomerId("")
    setSalesRepId("")
    setMonth("all")
    setYear(new Date().getFullYear())
  }

  // Load data depending on active tab and filters
  useEffect(() => {
    setLoading(true)
    const loadData = async () => {
      try {
        if (activeTab === "income-expense") {
          const data = await reportApi.getIncomeExpense({
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
          })
          setIncomeExpenseData(data)
        } else if (activeTab === "receivables") {
          const data = await reportApi.getReceivables({
            sales_rep_id: salesRepId ? parseInt(salesRepId) : undefined,
            customer_id: customerId ? parseInt(customerId) : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
          })
          setReceivablesData(data)
        } else if (activeTab === "project-profit") {
          const data = await reportApi.getProjectProfit({
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
          })
          setProjectProfitData(data.data)
        } else if (activeTab === "sales-performance") {
          const mVal = month === "all" ? undefined : parseInt(month)
          const [rev, conv] = await Promise.all([
            reportApi.getSalesRevenue({
              year,
              month: mVal,
              sales_rep_id: salesRepId ? parseInt(salesRepId) : undefined,
            }),
            reportApi.getQuoteConversion({
              year,
              month: mVal,
              sales_rep_id: salesRepId ? parseInt(salesRepId) : undefined,
            }),
          ])
          setSalesRevenueData(rev)
          setQuoteConversionData(conv)
        } else if (activeTab === "pipeline") {
          const data = await reportApi.getSalesPipeline()
          setPipelineData(data)
        }
      } catch {
        toast.error(t("reports:fetch_error"))
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [activeTab, year, month, salesRepId, customerId, dateFrom, dateTo])

  const handlePrintPdf = () => {
    window.print()
  }

  const handleExportCsv = () => {
    let data: any[] = []
    let columns: { header: string; accessorKey: string }[] = []

    if (activeTab === "income-expense") {
      data = incomeExpenseData
      columns = [
        { header: t("reports:incomeExpense.columns.period"), accessorKey: "month" },
        { header: t("reports:incomeExpense.columns.income"), accessorKey: "income" },
        { header: t("reports:incomeExpense.columns.expense"), accessorKey: "expense" },
        { header: t("reports:incomeExpense.columns.net"), accessorKey: "net" },
      ]
    } else if (activeTab === "receivables") {
      data = receivablesData
      columns = [
        { header: t("reports:receivables.columns.contract"), accessorKey: "contract_code" },
        { header: t("reports:receivables.columns.customer"), accessorKey: "customer_name" },
        { header: t("reports:receivables.columns.salesRep"), accessorKey: "sales_rep_name" },
        { header: t("reports:receivables.columns.date"), accessorKey: "contract_date" },
        { header: t("reports:receivables.columns.value"), accessorKey: "contract_value" },
        { header: t("reports:receivables.columns.received"), accessorKey: "payment_received" },
        {
          header: t("reports:receivables.columns.outstanding"),
          accessorKey: "payment_outstanding",
        },
      ]
    } else if (activeTab === "project-profit") {
      data = projectProfitData
      columns = [
        { header: t("reports:projectProfit.columns.code"), accessorKey: "project_code" },
        { header: t("reports:projectProfit.columns.name"), accessorKey: "project_name" },
        { header: t("reports:projectProfit.columns.contractValue"), accessorKey: "contract_value" },
        { header: t("reports:projectProfit.columns.received"), accessorKey: "total_received" },
        { header: t("reports:projectProfit.columns.spent"), accessorKey: "total_spent" },
        { header: t("reports:projectProfit.columns.profit"), accessorKey: "profit" },
      ]
    }

    if (data.length === 0 || columns.length === 0) {
      toast.info(
        t("reports:export.no_data", {
          defaultValue: "Không có dữ liệu để xuất hoặc biểu đồ không hỗ trợ xuất CSV",
        }),
      )
      return
    }

    const headers = columns.map((c) => c.header).join(",")
    const rows = data.map((row) => {
      return columns
        .map((c) => {
          const key = c.accessorKey
          let val = row[key]
          if (typeof val === "string") val = val.replace(/"/g, '""')
          return `"${val ?? ""}"`
        })
        .join(",")
    })

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `report-${activeTab}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Custom tooltips and formatters
  const formatCurrency = (val: string | number) => {
    return Number(val).toLocaleString("vi-VN") + " ₫"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("reports:title")}</h1>
          <p className="text-sm text-muted-foreground">{t("reports:subtitle")}</p>
        </div>
        <div className="flex gap-2 print:hidden self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
            <Download className="size-3.5" />
            {t("common:actions.export", { defaultValue: "Xuất CSV" })}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintPdf} className="gap-1.5">
            <Printer className="size-3.5" />
            {t("common:actions.print", { defaultValue: "In PDF" })}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex justify-start overflow-x-auto no-scrollbar md:grid md:grid-cols-5 p-1 rounded-xl bg-muted/50 h-auto! gap-1 scroll-smooth">
          <TabsTrigger
            value="income-expense"
            className="rounded-lg py-2 px-3 min-h-11 flex-none w-auto text-xs md:text-sm"
          >
            {t("reports:tabs.incomeExpense")}
          </TabsTrigger>
          <TabsTrigger
            value="receivables"
            className="rounded-lg py-2 px-3 min-h-11 flex-none w-auto text-xs md:text-sm"
          >
            {t("reports:tabs.receivables")}
          </TabsTrigger>
          <TabsTrigger
            value="project-profit"
            className="rounded-lg py-2 px-3 min-h-11 flex-none w-auto text-xs md:text-sm"
          >
            {t("reports:tabs.projectProfit")}
          </TabsTrigger>
          <TabsTrigger
            value="sales-performance"
            className="rounded-lg py-2 px-3 min-h-11 flex-none w-auto text-xs md:text-sm"
          >
            {t("reports:tabs.salesPerformance")}
          </TabsTrigger>
          <TabsTrigger
            value="pipeline"
            className="rounded-lg py-2 px-3 min-h-11 flex-none w-auto text-xs md:text-sm"
          >
            {t("reports:tabs.pipeline")}
          </TabsTrigger>
        </TabsList>

        {/* ── Filter bar (Dynamic depending on Tab) ────────────────────────── */}
        {activeTab !== "pipeline" && (
          <FilterPanel
            applyMode
            fields={filterFields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            title={t("reports:filters.title")}
            className="mt-4"
          />
        )}

        {/* ── Main Loading Area ────────────────────────────────────────────── */}
        {loading ? (
          <div className="mt-6 flex h-64 items-center justify-center rounded-xl border bg-card">
            <PageLoader />
          </div>
        ) : (
          <div className="mt-6 animate-in fade-in duration-200">
            {/* ── TAB 1: Income vs Expense ─────────────────────────────────── */}
            <TabsContent value="income-expense" className="m-0 focus-visible:outline-none">
              <IncomeExpenseTab data={incomeExpenseData} formatCurrency={formatCurrency} />
            </TabsContent>

            {/* ── TAB 2: Receivables ───────────────────────────────────────── */}
            <TabsContent value="receivables" className="m-0 focus-visible:outline-none">
              <ReceivablesTab data={receivablesData} />
            </TabsContent>

            {/* ── TAB 3: Project Profitability ─────────────────────────────── */}
            <TabsContent value="project-profit" className="m-0 focus-visible:outline-none">
              <ProjectProfitTab data={projectProfitData} />
            </TabsContent>

            {/* ── TAB 4: Sales Performance & Conversion ───────────────────── */}
            <TabsContent value="sales-performance" className="m-0 focus-visible:outline-none">
              <SalesPerformanceTab
                salesRevenueData={salesRevenueData}
                quoteConversionData={quoteConversionData}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            {/* ── TAB 5: Sales Pipeline ────────────────────────────────────── */}
            <TabsContent value="pipeline" className="m-0 focus-visible:outline-none">
              <PipelineTab pipelineData={pipelineData} />
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  )
}
