import { Trash2, MessageCircle, Phone, Mail, Calendar, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Interaction } from "../types/sales"
import { useTranslation } from "react-i18next"

interface InteractionListProps {
  interactions: Interaction[]
  onDelete: (id: number) => Promise<void>
  isAdmin?: boolean
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

export function InteractionList({ interactions, onDelete, isAdmin = false }: InteractionListProps) {
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
    <div className="space-y-4">
      {interactions.map((interaction) => (
        <div
          key={interaction.id}
          className="relative flex gap-4 p-4 rounded-xl border bg-card transition-colors hover:bg-accent/5"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {getInteractionIcon(interaction.type || "")}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">
                {interaction.type || t("sales:interaction.default_type")}
              </h4>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  <Calendar className="size-3" />
                  {interaction.interaction_date}
                </span>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => void onDelete(interaction.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{interaction.content}</p>
            {interaction.user && (
              <p className="text-xs text-muted-foreground pt-1">
                {t("sales:interaction.recorded_by")}:{" "}
                <span className="font-medium">{interaction.user.full_name}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
