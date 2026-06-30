import { Trash2, MessageCircle, Phone, Mail, Calendar, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Interaction } from "../types/sales"
import { useTranslation } from "react-i18next"

interface InteractionListProps {
  interactions: Interaction[]
  onDelete: (id: number) => Promise<void>
  canDelete?: boolean
}

function getInteractionIcon(type: string) {
  switch (type.toLowerCase()) {
    case "call":
      return <Phone className="size-4" />
    case "email":
      return <Mail className="size-4" />
    case "meeting":
      return <UserCheck className="size-4" />
    default:
      return <MessageCircle className="size-4" />
  }
}

export function InteractionList({
  interactions,
  onDelete,
  canDelete = false,
}: InteractionListProps) {
  const { t } = useTranslation()
  if (!interactions.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-card border-dashed">
        <MessageCircle className="size-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium">{t("sales:interaction.empty_state.title")}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("sales:interaction.empty_state.description")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent pl-2 py-2">
      {interactions.map((interaction) => (
        <div key={interaction.id} className="relative flex gap-4 transition-colors group">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary/10 text-primary z-10 shadow-sm relative">
            {getInteractionIcon(interaction.interaction_type || "")}
          </div>
          <div className="flex-1 space-y-2 p-4 rounded-xl border bg-card shadow-sm group-hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm capitalize text-primary">
                {interaction.interaction_type_label ||
                  interaction.interaction_type ||
                  t("sales:interaction.default_type")}
              </h4>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  <Calendar className="size-3" />
                  {interaction.interaction_date}
                </span>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => void onDelete(interaction.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{interaction.content}</p>
            {interaction.next_follow_up && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t("sales:interaction.next_follow_up", {
                  defaultValue: "Hẹn tiếp theo",
                })}
                : <span className="font-medium">{interaction.next_follow_up}</span>
              </p>
            )}
            {interaction.user && (
              <p className="text-xs text-muted-foreground pt-2 mt-2 border-t flex items-center gap-1">
                {t("sales:interaction.recorded_by")}:{" "}
                <span className="font-medium text-foreground">{interaction.user.full_name}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
