import { Trash2, MessageCircle, Phone, Mail, Calendar, UserCheck, Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Interaction } from "../types/sales"
import { useTranslation } from "react-i18next"
import { EmptyState } from "@/components/common/EmptyState"

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
      <EmptyState
        icon={MessageCircle}
        title={t("sales:interaction.empty_state.title")}
        description={t("sales:interaction.empty_state.description")}
      />
    )
  }

  return (
    <div className="relative space-y-6 py-2 pl-2 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {interactions.map((interaction) => (
        <div key={interaction.id} className="group relative flex gap-4 transition-colors">
          <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary/10 text-primary shadow-sm">
            {getInteractionIcon(interaction.interaction_type || "")}
          </div>
          <div className="flex-1 rounded-xl border bg-card p-4 shadow-sm transition-all group-hover:border-primary/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold capitalize text-primary">
                  {interaction.interaction_type_label ||
                    interaction.interaction_type ||
                    t("sales:interaction.default_type")}
                </h4>
                <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {interaction.interaction_date}
                </div>
              </div>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => void onDelete(interaction.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
              {interaction.content}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {interaction.next_follow_up && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                  <Clock3 className="size-3" />
                  {t("sales:interaction.next_follow_up", {
                    defaultValue: "Hẹn tiếp theo",
                  })}
                  : {interaction.next_follow_up}
                </span>
              )}
              {interaction.user && (
                <span>
                  {t("sales:interaction.recorded_by")}:{" "}
                  <span className="font-medium text-foreground">{interaction.user.full_name}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
