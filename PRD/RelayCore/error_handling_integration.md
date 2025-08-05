# Error Handling Integration: RelayCore to Auterity

## 1. Overview

This document outlines the detailed plan for integrating RelayCore's error detection with Auterity's Kiro error intelligence system. The integration will enable seamless error routing, logging, and management across both systems.

## 2. Error Types and Categories

### RelayCore Error Types
1. **Request Validation Errors**
   - Invalid request format
   - Missing required parameters
   - Schema validation failures

2. **Authentication/Authorization Errors**
   - Invalid API keys
   - Insufficient permissions
   - Rate limit exceeded

3. **Provider Errors**
   - Provider API failures
   - Model unavailability
   - Quota exceeded

4. **Routing Errors**
   - Rule evaluation failures
   - No matching rules
   - Conflicting rules

5. **System Errors**
   - Internal server errors
   - Database connection issues
   - Cache failures

### Auterity Error Categories
1. **Validation Errors**
   - Input validation failures
   - Schema violations
   - Format errors

2. **Runtime Errors**
   - Execution failures
   - Timeout errors
   - Resource exhaustion

3. **AI Service Errors**
   - Model failures
   - Unexpected responses
   - Content policy violations

4. **System Errors**
   - Infrastructure issues
   - Service unavailability
   - Critical failures

## 3. Error Mapping

| RelayCore Error Type | Auterity Error Category | Priority | Notification Level |
|----------------------|------------------------|----------|-------------------|
| Request Validation   | Validation             | Low      | UI Only           |
| Auth/Authorization   | Validation             | Medium   | UI + Log          |
| Provider Errors      | AI Service             | High     | UI + Log + Alert  |
| Routing Errors       | Runtime                | Medium   | UI + Log          |
| System Errors        | System                 | Critical | UI + Log + Slack  |

## 4. Integration Architecture

```
┌─────────────────────────┐                 ┌─────────────────────────┐
│      RelayCore          │                 │        Auterity         │
│                         │                 │                         │
│  ┌─────────────────┐    │                 │    ┌─────────────────┐  │
│  │  Error Handler  │    │                 │    │   Kiro Error    │  │
│  │                 │    │                 │    │  Intelligence   │  │
│  └────────┬────────┘    │                 │    └────────┬────────┘  │
│           │             │                 │             │           │
│  ┌────────▼────────┐    │                 │    ┌────────▼────────┐  │
│  │ Error Enricher  │    │                 │    │  Error Router   │  │
│  │                 │    │                 │    │                 │  │
│  └────────┬────────┘    │                 │    └────────┬────────┘  │
│           │             │                 │             │           │
│  ┌────────▼────────┐    │    REST API     │    ┌────────▼────────┐  │
│  │  Error Reporter ├────┼────────────────►│    │ Error Receiver  │  │
│  │                 │    │                 │    │                 │  │
│  └─────────────────┘    │                 │    └────────┬────────┘  │
│                         │                 │             │           │
│  ┌─────────────────┐    │                 │    ┌────────▼────────┐  │
│  │ Metrics Collector◄───┼─────────────────┤    │ Error Processor │  │
│  │                 │    │                 │    │                 │  │
│  └─────────────────┘    │                 │    └────────┬────────┘  │
│                         │                 │             │           │
└─────────────────────────┘                 │    ┌────────▼────────┐  │
                                           │    │  Notification    │  │
                                           │    │    System       │  │
                                           │    │                 │  │
                                           │    └─────────────────┘  │
                                           │                         │
                                           └─────────────────────────┘
```

## 5. Implementation Plan

### 5.1 RelayCore Components

#### Error Handler
- Intercept errors from all RelayCore components
- Standardize error format
- Add initial context (timestamp, component, request ID)

```typescript
// Error handler middleware
export const errorHandlerMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const standardError = standardizeError(err, req);
  
  // Enrich error with context
  const enrichedError = errorEnricher.enrich(standardError, req);
  
  // Report error to Auterity
  errorReporter.report(enrichedError);
  
  // Continue with normal error handling
  next(err);
};
```

#### Error Enricher
- Add context to errors (user info, request details)
- Classify errors by type and severity
- Add debugging information

```typescript
export class ErrorEnricher {
  public enrich(error: StandardError, req: Request): EnrichedError {
    return {
      ...error,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      requestPath: req.path,
      requestMethod: req.method,
      requestHeaders: this.sanitizeHeaders(req.headers),
      requestBody: this.sanitizeBody(req.body),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      severity: this.calculateSeverity(error),
      category: this.categorizeError(error),
    };
  }
  
  // Helper methods for sanitizing and categorizing
  private sanitizeHeaders(headers: any): any { /* ... */ }
  private sanitizeBody(body: any): any { /* ... */ }
  private calculateSeverity(error: StandardError): ErrorSeverity { /* ... */ }
  private categorizeError(error: StandardError): ErrorCategory { /* ... */ }
}
```

#### Error Reporter
- Send errors to Auterity via REST API
- Handle retry logic for failed reports
- Batch non-critical errors

```typescript
export class ErrorReporter {
  private auterityApiClient: AuterityApiClient;
  private errorQueue: EnrichedError[] = [];
  private isSending = false;
  
  constructor(auterityApiClient: AuterityApiClient) {
    this.auterityApiClient = auterityApiClient;
    this.startQueueProcessor();
  }
  
  public report(error: EnrichedError): void {
    // Critical errors are sent immediately
    if (error.severity === 'critical') {
      this.sendError(error);
    } else {
      // Non-critical errors are queued
      this.errorQueue.push(error);
    }
  }
  
  private async sendError(error: EnrichedError): Promise<void> {
    try {
      await this.auterityApiClient.reportError(error);
    } catch (err) {
      console.error('Failed to report error to Auterity:', err);
      // Add to queue for retry
      this.errorQueue.push(error);
    }
  }
  
  private startQueueProcessor(): void {
    // Process queue every 5 seconds
    setInterval(() => this.processQueue(), 5000);
  }
  
  private async processQueue(): Promise<void> {
    if (this.isSending || this.errorQueue.length === 0) return;
    
    this.isSending = true;
    
    try {
      // Batch send errors
      const batch = this.errorQueue.splice(0, 50);
      await this.auterityApiClient.reportErrors(batch);
    } catch (err) {
      console.error('Failed to process error queue:', err);
      // Put failed errors back in queue
      this.errorQueue.unshift(...this.errorQueue.splice(0, 50));
    } finally {
      this.isSending = false;
    }
  }
}
```

#### Metrics Collector
- Collect error metrics
- Track error rates and patterns
- Provide data for analytics

```typescript
export class ErrorMetricsCollector {
  private metrics: {
    errorCount: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    errorsByEndpoint: Record<string, number>;
  };
  
  constructor() {
    this.resetMetrics();
    this.startReporting();
  }
  
  public trackError(error: EnrichedError): void {
    this.metrics.errorCount++;
    this.metrics.errorsByType[error.type] = (this.metrics.errorsByType[error.type] || 0) + 1;
    this.metrics.errorsBySeverity[error.severity] = (this.metrics.errorsBySeverity[error.severity] || 0) + 1;
    this.metrics.errorsByEndpoint[error.requestPath] = (this.metrics.errorsByEndpoint[error.requestPath] || 0) + 1;
  }
  
  private resetMetrics(): void {
    this.metrics = {
      errorCount: 0,
      errorsByType: {},
      errorsBySeverity: {},
      errorsByEndpoint: {},
    };
  }
  
  private startReporting(): void {
    // Report metrics every minute
    setInterval(() => {
      // Send metrics to analytics system
      analyticsService.reportErrorMetrics(this.metrics);
      this.resetMetrics();
    }, 60000);
  }
}
```

### 5.2 Auterity Components

#### Error Receiver
- REST API endpoint to receive errors from RelayCore
- Validate incoming error format
- Queue errors for processing

```python
@router.post("/api/errors")
async def receive_error(error: ErrorModel, db: Session = Depends(get_db)):
    """Receive error from external systems like RelayCore"""
    try:
        # Validate error format
        if not validate_error_format(error):
            return JSONResponse(
                status_code=400,
                content={"message": "Invalid error format"}
            )
        
        # Queue error for processing
        await error_queue.put(error)
        
        return {"status": "received", "error_id": error.id}
    except Exception as e:
        logger.error(f"Error receiving error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": "Error processing received error"}
        )
```

#### Error Router
- Route errors to appropriate handlers
- Apply routing rules based on error type
- Prioritize critical errors

```python
class ErrorRouter:
    def __init__(self):
        self.handlers = {
            "validation": ValidationErrorHandler(),
            "runtime": RuntimeErrorHandler(),
            "ai_service": AIServiceErrorHandler(),
            "system": SystemErrorHandler(),
        }
    
    async def route_error(self, error: ErrorModel):
        """Route error to appropriate handler based on category"""
        category = error.category.lower()
        
        if category in self.handlers:
            await self.handlers[category].handle(error)
        else:
            # Default to system error handler for unknown categories
            await self.handlers["system"].handle(error)
```

#### Error Processor
- Process errors based on type and severity
- Store errors in database
- Generate error reports

```python
class ErrorProcessor:
    def __init__(self, db: Session):
        self.db = db
        self.router = ErrorRouter()
    
    async def process(self, error: ErrorModel):
        """Process an error"""
        try:
            # Store error in database
            db_error = self.store_error(error)
            
            # Route error to appropriate handler
            await self.router.route_error(error)
            
            # Update error status
            self.update_error_status(db_error.id, "processed")
            
            # Generate metrics
            self.generate_metrics(error)
        except Exception as e:
            logger.error(f"Error processing error: {str(e)}")
            # Store processing error
            self.store_processing_error(error.id, str(e))
    
    def store_error(self, error: ErrorModel) -> DbError:
        """Store error in database"""
        db_error = DbError(
            id=error.id,
            type=error.type,
            message=error.message,
            stack_trace=error.stack_trace,
            context=error.context,
            severity=error.severity,
            source="relaycore",
            status="received",
            created_at=datetime.utcnow()
        )
        self.db.add(db_error)
        self.db.commit()
        return db_error
    
    def update_error_status(self, error_id: str, status: str):
        """Update error status"""
        db_error = self.db.query(DbError).filter(DbError.id == error_id).first()
        if db_error:
            db_error.status = status
            db_error.updated_at = datetime.utcnow()
            self.db.commit()
    
    def store_processing_error(self, error_id: str, message: str):
        """Store error that occurred during processing"""
        processing_error = ProcessingError(
            error_id=error_id,
            message=message,
            created_at=datetime.utcnow()
        )
        self.db.add(processing_error)
        self.db.commit()
    
    def generate_metrics(self, error: ErrorModel):
        """Generate metrics for the error"""
        metrics_service.track_error(
            error_type=error.type,
            severity=error.severity,
            source="relaycore"
        )
```

#### Notification System
- Send notifications based on error severity
- Integrate with Slack for critical errors
- Update UI with real-time status

```python
class NotificationSystem:
    def __init__(self):
        self.slack_client = SlackClient(os.environ.get("SLACK_API_TOKEN"))
        self.websocket_manager = WebSocketManager()
    
    async def notify(self, error: ErrorModel):
        """Send notifications based on error severity"""
        # Always update UI
        await self.update_ui(error)
        
        # Log all errors
        self.log_error(error)
        
        # Send Slack notification for high severity errors
        if error.severity in ["high", "critical"]:
            await self.send_slack_notification(error)
    
    async def update_ui(self, error: ErrorModel):
        """Update UI with real-time error information"""
        await self.websocket_manager.broadcast(
            "errors",
            {
                "type": "new_error",
                "data": error.dict()
            }
        )
    
    def log_error(self, error: ErrorModel):
        """Log error to logging system"""
        log_level = {
            "low": logging.INFO,
            "medium": logging.WARNING,
            "high": logging.ERROR,
            "critical": logging.CRITICAL
        }.get(error.severity, logging.ERROR)
        
        logger.log(log_level, f"[{error.source}] {error.message}", extra={
            "error_id": error.id,
            "error_type": error.type,
            "source": error.source
        })
    
    async def send_slack_notification(self, error: ErrorModel):
        """Send Slack notification for critical errors"""
        try:
            await self.slack_client.chat_postMessage(
                channel="#system-alerts",
                text=f"*{error.severity.upper()} ERROR*: {error.message}",
                blocks=[
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": f"{error.severity.upper()} ERROR from {error.source}"
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Message:* {error.message}\n*Type:* {error.type}\n*Time:* {datetime.utcnow().isoformat()}"
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Stack Trace:*\n```{error.stack_trace[:1000]}```"
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "View Details"
                                },
                                "url": f"https://auterity.example.com/errors/{error.id}"
                            }
                        ]
                    }
                ]
            )
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {str(e)}")
```

## 6. API Contract

### Error Reporting API

#### POST /api/errors

Request:
```json
{
  "id": "uuid-string",
  "type": "request_validation",
  "message": "Invalid request format",
  "stack_trace": "Error stack trace...",
  "context": {
    "userId": "user-123",
    "organizationId": "org-456",
    "requestPath": "/v1/openai/chat/completions",
    "requestMethod": "POST",
    "requestHeaders": {
      "content-type": "application/json",
      "x-api-key": "[REDACTED]"
    },
    "requestBody": {
      "model": "gpt-4",
      "messages": [
        {
          "role": "system",
          "content": "You are a helpful assistant."
        }
      ]
    }
  },
  "severity": "medium",
  "category": "validation",
  "timestamp": "2025-08-02T20:36:27Z",
  "environment": "production",
  "source": "relaycore"
}
```

Response:
```json
{
  "status": "received",
  "error_id": "uuid-string"
}
```

#### POST /api/errors/batch

Request:
```json
{
  "errors": [
    {
      "id": "uuid-string-1",
      "type": "request_validation",
      "message": "Invalid request format",
      "severity": "low",
      "category": "validation",
      "timestamp": "2025-08-02T20:36:27Z",
      "source": "relaycore"
    },
    {
      "id": "uuid-string-2",
      "type": "provider_error",
      "message": "OpenAI API returned an error",
      "severity": "high",
      "category": "ai_service",
      "timestamp": "2025-08-02T20:36:28Z",
      "source": "relaycore"
    }
  ]
}
```

Response:
```json
{
  "status": "received",
  "received_count": 2,
  "error_ids": ["uuid-string-1", "uuid-string-2"]
}
```

#### GET /api/errors/status/{error_id}

Response:
```json
{
  "error_id": "uuid-string",
  "status": "processed",
  "processed_at": "2025-08-02T20:36:30Z",
  "notifications_sent": ["ui", "log", "slack"]
}
```

## 7. Implementation Roadmap

### Phase 1: Basic Integration (Week 1-2)
- Implement error standardization in RelayCore
- Create error reporting API in Auterity
- Implement basic error routing in Auterity
- Set up simple notification system

### Phase 2: Enhanced Features (Week 3-4)
- Add error enrichment in RelayCore
- Implement error categorization and severity calculation
- Create batch processing for non-critical errors
- Enhance notification system with Slack integration

### Phase 3: Analytics and Monitoring (Week 5-6)
- Implement error metrics collection in RelayCore
- Create error analytics dashboard in Auterity
- Set up alerting based on error patterns
- Implement error rate monitoring

### Phase 4: Testing and Optimization (Week 7-8)
- Conduct integration testing
- Perform load testing with high error volumes
- Optimize error processing pipeline
- Fine-tune notification rules