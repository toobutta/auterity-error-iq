
import { toast } from "sonner"

export function showErrorToast(message: string) {
  toast.error("Workflow Failed", {
    description: message,
    action: {
      label: "View Details",
      onClick: () => console.log("Redirecting to error detail page...")
    }
  })
}
