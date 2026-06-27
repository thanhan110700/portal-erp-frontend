import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { CommonDialog } from "@/components/common/CommonDialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Department } from "../types/employee"
import type { CreateDepartmentPayload } from "../api/departmentApi"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

interface DepartmentFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateDepartmentPayload) => Promise<void>
  editData?: Department | null
}

const createFormSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("hr:department.form.validation.name_required")),
    code: z.string().min(1, t("hr:department.form.validation.code_required")),
    description: z.string().optional().nullable(),
  })

type DepartmentFormData = z.infer<ReturnType<typeof createFormSchema>>

export function DepartmentFormModal({
  open,
  onClose,
  onSubmit,
  editData,
}: DepartmentFormModalProps) {
  const { t } = useTranslation()
  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (editData) {
        form.reset({
          name: editData.name,
          code: editData.code,
          description: editData.description || "",
        })
      } else {
        form.reset({
          name: "",
          code: "",
          description: "",
        })
      }
    }
  }, [open, editData, form])

  const handleSubmit = async (values: DepartmentFormData) => {
    try {
      await onSubmit(values)
      form.reset()
    } catch {
      // Error handled by parent
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={editData ? t("hr:department.form.edit_title") : t("hr:department.form.add_title")}
      size="sm"
      primaryAction={{
        label: editData ? t("hr:department.form.update") : t("hr:department.form.create"),
        onClick: form.handleSubmit(handleSubmit),
        loading: form.formState.isSubmitting,
      }}
      cancelAction={{
        label: t("common:actions.cancel"),
        onClick: onClose,
        disabled: form.formState.isSubmitting,
      }}
    >
      <div className="py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("hr:department.form.fields.code")} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("hr:department.form.fields.code_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("hr:department.form.fields.name")} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("hr:department.form.fields.name_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("hr:department.form.fields.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("hr:department.form.fields.description_placeholder")}
                      className="resize-none min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </CommonDialog>
  )
}
