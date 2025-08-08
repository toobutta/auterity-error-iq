# [CLINE-TASK] WebSocket Real-time Monitoring Implementation

## Task Overview
Implement WebSocket-based real-time monitoring for workflow executions to complete the MVP feature set.

## Current State Analysis
From CURRENT_PROJECT_STATUS.md:
- WebSocket monitoring is listed as missing MVP feature
- Existing files: `frontend/src/api/websocket.ts`, `backend/app/api/websockets.py`
- Need to connect frontend WebSocket client to backend WebSocket server

## Implementation Requirements

### Backend WebSocket Enhancement
**File**: `backend/app/api/websockets.py`

Add these WebSocket endpoints:
```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, workflow_id: str):
        await websocket.accept()
        if workflow_id not in self.active_connections:
            self.active_connections[workflow_id] = []
        self.active_connections[workflow_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, workflow_id: str):
        if workflow_id in self.active_connections:
            self.active_connections[workflow_id].remove(websocket)
    
    async def send_execution_update(self, workflow_id: str, data: dict):
        if workflow_id in self.active_connections:
            for connection in self.active_connections[workflow_id]:
                await connection.send_text(json.dumps(data))

manager = ConnectionManager()

@app.websocket("/ws/workflow/{workflow_id}")
async def websocket_endpoint(websocket: WebSocket, workflow_id: str):
    await manager.connect(websocket, workflow_id)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, workflow_id)
```

### Frontend WebSocket Client Enhancement
**File**: `frontend/src/api/websocket.ts`

Implement WebSocket client with reconnection:
```typescript
export interface WorkflowExecutionUpdate {
  type: 'status' | 'log' | 'progress' | 'error' | 'complete';
  timestamp: string;
  data: {
    status?: 'running' | 'completed' | 'failed' | 'cancelled';
    message?: string;
    progress?: number;
    step?: string;
    error?: string;
  };
}

export class WorkflowWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private workflowId: string,
    private onUpdate: (update: WorkflowExecutionUpdate) => void,
    private onError: (error: Error) => void
  ) {}

  connect(): void {
    const wsUrl = `ws://localhost:8000/ws/workflow/${this.workflowId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log(`WebSocket connected for workflow ${this.workflowId}`);
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const update: WorkflowExecutionUpdate = JSON.parse(event.data);
        this.onUpdate(update);
      } catch (error) {
        this.onError(new Error('Failed to parse WebSocket message'));
      }
    };

    this.ws.onclose = () => {
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      this.onError(new Error('WebSocket connection error'));
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### Real-time Monitoring Component
**File**: `frontend/src/components/WorkflowExecutionMonitor.tsx`

Create new component for real-time monitoring:
```typescript
import React, { useState, useEffect } from 'react';
import { WorkflowWebSocketClient, WorkflowExecutionUpdate } from '../api/websocket';

interface Props {
  workflowId: string;
  onExecutionComplete: (result: any) => void;
}

export const WorkflowExecutionMonitor: React.FC<Props> = ({ 
  workflowId, 
  onExecutionComplete 
}) => {
  const [updates, setUpdates] = useState<WorkflowExecutionUpdate[]>([]);
  const [status, setStatus] = useState<string>('connecting');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const client = new WorkflowWebSocketClient(
      workflowId,
      (update) => {
        setUpdates(prev => [...prev, update]);
        
        if (update.data.status) {
          setStatus(update.data.status);
        }
        
        if (update.data.progress !== undefined) {
          setProgress(update.data.progress);
        }
        
        if (update.type === 'complete') {
          onExecutionComplete(update.data);
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
        setStatus('error');
      }
    );

    client.connect();

    return () => {
      client.disconnect();
    };
  }, [workflowId, onExecutionComplete]);

  return (
    <div className="workflow-execution-monitor">
      <div className="status-header">
        <h3>Workflow Execution: {workflowId}</h3>
        <div className={`status-badge status-${status}`}>
          {status.toUpperCase()}
        </div>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
        <span className="progress-text">{progress}%</span>
      </div>
      
      <div className="execution-log">
        {updates.map((update, index) => (
          <div key={index} className={`log-entry log-${update.type}`}>
            <span className="timestamp">{update.timestamp}</span>
            <span className="message">{update.data.message || update.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Integration with Workflow Execution Engine
**File**: `backend/app/services/workflow_execution_engine.py`

Add WebSocket notifications to existing execution engine:
```python
# Add this import at the top
from app.api.websockets import manager

# Add WebSocket notifications in execute_workflow method
async def execute_workflow(self, workflow_id: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
    try:
        # Send start notification
        await manager.send_execution_update(workflow_id, {
            "type": "status",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {"status": "running", "message": "Workflow execution started"}
        })
        
        # Existing execution logic...
        
        # Send progress updates during execution
        for i, step in enumerate(execution_steps):
            progress = (i / len(execution_steps)) * 100
            await manager.send_execution_update(workflow_id, {
                "type": "progress",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {"progress": progress, "step": step.name}
            })
            
            # Execute step...
        
        # Send completion notification
        await manager.send_execution_update(workflow_id, {
            "type": "complete",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {"status": "completed", "message": "Workflow execution completed"}
        })
        
    except Exception as e:
        # Send error notification
        await manager.send_execution_update(workflow_id, {
            "type": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {"status": "failed", "error": str(e)}
        })
        raise
```

## Integration Points

### Update Workflow Execution Interface
**File**: `frontend/src/components/WorkflowExecutionInterface.tsx`

Add the monitoring component:
```typescript
import { WorkflowExecutionMonitor } from './WorkflowExecutionMonitor';

// Add to the component JSX
{executingWorkflowId && (
  <WorkflowExecutionMonitor
    workflowId={executingWorkflowId}
    onExecutionComplete={(result) => {
      setExecutionResult(result);
      setExecutingWorkflowId(null);
    }}
  />
)}
```

## Success Criteria
- [ ] WebSocket connection established between frontend and backend
- [ ] Real-time status updates displayed during workflow execution
- [ ] Progress bar shows execution progress
- [ ] Live log streaming shows execution steps
- [ ] Automatic reconnection on connection loss
- [ ] Error handling for WebSocket failures
- [ ] Integration with existing workflow execution interface
- [ ] No performance impact on workflow execution

## Testing Requirements
```bash
# Frontend testing
cd frontend
npm run test -- WorkflowExecutionMonitor
npm run test -- websocket

# Backend testing  
cd backend
python -m pytest tests/test_websockets.py -v
```

## Context Files to Reference
- `frontend/src/api/websocket.ts` - Existing WebSocket client stub
- `backend/app/api/websockets.py` - Existing WebSocket server stub
- `backend/app/services/workflow_execution_engine.py` - Execution engine to integrate with
- `frontend/src/components/WorkflowExecutionInterface.tsx` - Main execution interface

## Expected Timeline
- Backend WebSocket enhancement: 2 hours
- Frontend WebSocket client: 2 hours
- Monitoring component creation: 2 hours
- Integration and testing: 2 hours
- Total: 8 hours

## Handoff Notes
After completion, document WebSocket architecture for future MCP orchestration integration where multiple agents may need real-time coordination.