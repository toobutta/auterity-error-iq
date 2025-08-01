
// .kiro/hooks/error-intelligence.hook.ts
export const onErrorEvent = async ({ workflowId, error }) => {
  // Log error
  await fetch('/api/logs/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflowId,
      errorType: error.type,
      stackTrace: error.stack,
      timestamp: new Date().toISOString(),
      source: 'kiro_hook'
    })
  })

  // Optional: trigger Slack alert
  if (error.type === "system") {
    await fetch("https://hooks.slack.com/services/your-webhook", {
      method: "POST",
      body: JSON.stringify({
        text: `🚨 System Error in Workflow ${workflowId}: ${error.message}`
      })
    })
  }
}
