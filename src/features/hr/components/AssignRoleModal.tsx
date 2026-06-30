import { useState, useMemo } from "react"
import { CommonDialog } from "@/components/common/CommonDialog"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { Badge } from "@/components/ui/badge"
import type { Employee } from "../types/employee"
import { useTranslation } from "react-i18next"

const ROLE_OPTIONS_KEYS = [
  { value: "admin", labelKey: "common:roles.admin" },
  { value: "director", labelKey: "common:roles.director" },
  { value: "accountant", labelKey: "common:roles.accountant" },
  { value: "sales", labelKey: "common:roles.sales" },
  { value: "tech", labelKey: "common:roles.tech" },
  { value: "employee", labelKey: "common:roles.employee" },
]

interface AssignRoleModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (role: string) => Promise<void>
  employee: Employee | null
}

export function AssignRoleModal({ open, onClose, onSubmit, employee }: AssignRoleModalProps) {
  const { t } = useTranslation(["hr", "common"])
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const roleName = employee?.role?.name
  const currentRoles = employee?.roles ?? (roleName ? [roleName] : [])

  const roleSelectOptions = useMemo(() => {
    return ROLE_OPTIONS_KEYS.map((r) => ({
      label: `${t(r.labelKey)} - ${t(`hr:employees.assign_role.roles.${r.value}`)}`,
      value: r.value,
    }))
  }, [t])

  const handleSubmit = () => {
    if (!selectedRole) return
    setIsSubmitting(true)
    onSubmit(selectedRole).finally(() => {
      setSelectedRole("")
      setIsSubmitting(false)
    })
  }

  const handleClose = () => {
    setSelectedRole("")
    onClose()
  }

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title={t("hr:employees.assign_role.title", { name: employee?.full_name })}
      size="md"
      primaryAction={{
        label: isSubmitting ? t("hr:employees.form.saving") : t("hr:employees.assign_role.submit"),
        disabled: !selectedRole || isSubmitting,
        onClick: handleSubmit,
      }}
      cancelAction={{
        label: t("common:actions.cancel"),
        disabled: isSubmitting,
        onClick: handleClose,
      }}
    >
      <div className="flex flex-col gap-5 py-2">
        {/* Current roles display */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("hr:employees.assign_role.current_roles")}
          </Label>
          <div className="flex flex-wrap gap-2 min-h-8">
            {currentRoles.length > 0 ? (
              currentRoles.map((role) => {
                const opt = ROLE_OPTIONS_KEYS.find((r) => r.value === role)
                return (
                  <Badge key={role} variant="secondary" className="text-sm py-1 px-2.5">
                    {opt ? t(opt.labelKey) : role}
                  </Badge>
                )
              })
            ) : (
              <span className="text-sm text-muted-foreground italic">
                {t("hr:employees.assign_role.no_roles")}
              </span>
            )}
          </div>
        </div>

        {/* Role selector */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="assign-role-select" className="text-sm font-medium">
            {t("hr:employees.assign_role.assign_new")}
          </Label>
          <SearchableSelect
            value={selectedRole}
            onValueChange={setSelectedRole}
            options={roleSelectOptions}
            placeholder={t("hr:employees.assign_role.placeholder")}
          />
          <p className="text-xs text-muted-foreground">{t("hr:employees.assign_role.warning")}</p>
        </div>
      </div>
    </CommonDialog>
  )
}
