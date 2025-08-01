
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import WorkflowErrorFlow from "./WorkflowErrorFlow"

export default function WorkflowErrorDisplay({ workflowId }: { workflowId: string }) {
  const [errorInfo, setErrorInfo] = useState(null)
  const [email, setEmail] = useState("")

  useEffect(() => {
    async function fetchError() {
      try {
        const res = await fetch(`/api/workflows/${workflowId}/errors/latest`)
        const data = await res.json()
        setErrorInfo(data)

        // Log error for analytics
        await fetch('/api/logs/client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId,
            errorType: data?.type,
            stackTrace: data?.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          })
        })
      } catch (err) {
        toast.error("Error fetching error details")
        console.error(err)
      }
    }
    fetchError()
  }, [workflowId])

  const handleRetry = async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Workflow retried successfully")
      } else {
        toast.error("Retry failed")
      }
    } catch (e) {
      toast.error("Unexpected error during retry")
      console.error(e)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-red-100 p-4 rounded-md text-red-800">
        <h2 className="text-lg font-semibold">Workflow Execution Failed</h2>
        <p>An error occurred in Step 2. Review the error details and retry below.</p>
      </div>

      <Tabs defaultValue="message">
        <TabsList>
          <TabsTrigger value="message">Error Message</TabsTrigger>
          <TabsTrigger value="stack">Stack Trace</TabsTrigger>
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
        </TabsList>
        <TabsContent value="message">
          <div className="p-4 border rounded-md bg-white">
            <p className="font-semibold text-red-600">Validation Error</p>
            <p>Missing field 'email' in payload</p>
            <p className="text-sm text-gray-500 mt-2">Failure Point: Step 2</p>
          </div>
        </TabsContent>
        <TabsContent value="stack">
          <pre className="bg-gray-900 text-white p-4 rounded-md text-sm overflow-auto">
{errorInfo?.stack || "No stack trace available."}
          </pre>
        </TabsContent>
        <TabsContent value="inputs">
          <div className="flex items-center gap-2">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@example.com" />
            <Button onClick={handleRetry}>Retry Workflow</Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-6">
        <h3 className="font-semibold mb-2">Workflow Map</h3>
        <WorkflowErrorFlow />
      </div>

      <div className="pt-6 text-sm text-gray-600">
        <p>Was this error helpful?</p>
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => fetch("/api/feedback/error", {
              method: "POST",
              body: JSON.stringify({ workflowId, userFeedback: "positive" })
            })}
          >👍</Button>
          <Button
            variant="outline"
            onClick={() => fetch("/api/feedback/error", {
              method: "POST",
              body: JSON.stringify({ workflowId, userFeedback: "negative" })
            })}
          >👎</Button>
        </div>
      </div>
    </div>
  )
}
