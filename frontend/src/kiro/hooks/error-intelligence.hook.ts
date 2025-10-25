// Kiro Error Intelligence Hook
export interface KiroErrorEvent {
  workflowId: string;
  error: {
    type: "validation" | "runtime" | "ai_service" | "system";
    message: string;
    stack?: string;
  };
}

export const onErrorEvent = async ({ workflowId, error }: KiroErrorEvent) => {
  try {
    // Log error to backend
    await fetch("/api/logs/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowId,
        errorType: error.type,
        stackTrace: error.stack,
        timestamp: new Date().toISOString(),
        source: "kiro_hook",
      }),
    });

    // Optional: trigger Slack alert for system errors
    if (error.type === "system") {
      const webhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🚨 System Error in Workflow ${workflowId}: ${error.message}`,
          }),
        });
      }
    }
  } catch (hookError) {

  }
};


