# RelayCore Client Integration Examples

This document provides examples of how to integrate with the RelayCore API from different client environments.

## Basic HTTP Request Examples

### cURL

#### Simple Chat Completion Request

```bash
curl -X POST "http://localhost:3000/v1/openai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }'
```

#### Request with Caching Enabled

```bash
curl -X POST "http://localhost:3000/v1/openai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -H "X-AIHub-Cache: use" \
  -H "X-AIHub-Cache-TTL: 3600" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }'
```

#### Request with Optimization

```bash
curl -X POST "http://localhost:3000/v1/openai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -H "X-AIHub-Optimize: aggressive" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }'
```

#### Batch Processing Request

```bash
curl -X POST "http://localhost:3000/v1/batch" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "requests": [
      {
        "id": "request1",
        "messages": [
          {"role": "user", "content": "What is the capital of France?"}
        ],
        "parameters": {
          "temperature": 0.7,
          "max_tokens": 100
        }
      },
      {
        "id": "request2",
        "messages": [
          {"role": "user", "content": "What is the capital of Germany?"}
        ],
        "parameters": {
          "temperature": 0.7,
          "max_tokens": 100
        }
      }
    ],
    "options": {
      "priority": "normal"
    }
  }'
```

#### Check Batch Status

```bash
curl -X GET "http://localhost:3000/v1/batch/batch_123456" \
  -H "X-API-Key: your_api_key_here"
```

### Python

#### Simple Request

```python
import requests

api_key = "your_api_key_here"
base_url = "http://localhost:3000"

response = requests.post(
    f"{base_url}/v1/openai/chat/completions",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": api_key
    },
    json={
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is the capital of France?"}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }
)

print(response.json())
```

#### Request with Caching and Optimization

```python
import requests

api_key = "your_api_key_here"
base_url = "http://localhost:3000"

response = requests.post(
    f"{base_url}/v1/openai/chat/completions",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": api_key,
        "X-AIHub-Cache": "use",
        "X-AIHub-Cache-TTL": "3600",
        "X-AIHub-Optimize": "moderate"
    },
    json={
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is the capital of France?"}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }
)

print(response.json())
print(f"Cache Status: {response.headers.get('X-AIHub-Cache-Status')}")
print(f"Optimizations Applied: {response.headers.get('X-AIHub-Optimizations-Applied')}")
print(f"Estimated Cost: {response.headers.get('X-AIHub-Cost')}")
```

#### Batch Processing

```python
import requests
import time

api_key = "your_api_key_here"
base_url = "http://localhost:3000"

# Submit batch request
batch_response = requests.post(
    f"{base_url}/v1/batch",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": api_key
    },
    json={
        "provider": "openai",
        "model": "gpt-3.5-turbo",
        "requests": [
            {
                "id": "request1",
                "messages": [
                    {"role": "user", "content": "What is the capital of France?"}
                ],
                "parameters": {
                    "temperature": 0.7,
                    "max_tokens": 100
                }
            },
            {
                "id": "request2",
                "messages": [
                    {"role": "user", "content": "What is the capital of Germany?"}
                ],
                "parameters": {
                    "temperature": 0.7,
                    "max_tokens": 100
                }
            }
        ],
        "options": {
            "priority": "normal"
        }
    }
)

batch_id = batch_response.json()["batch_id"]
print(f"Batch submitted with ID: {batch_id}")

# Poll for batch completion
while True:
    status_response = requests.get(
        f"{base_url}/v1/batch/{batch_id}",
        headers={"X-API-Key": api_key}
    )
    
    status_data = status_response.json()
    print(f"Batch status: {status_data['status']}, Progress: {status_data.get('progress', 0)}%")
    
    if status_data["status"] in ["completed", "failed"]:
        print("Batch processing finished")
        print(status_data["result"])
        break
    
    time.sleep(2)  # Poll every 2 seconds
```

### JavaScript/TypeScript

#### Simple Request

```javascript
async function makeRequest() {
  const apiKey = "your_api_key_here";
  const baseUrl = "http://localhost:3000";
  
  const response = await fetch(`${baseUrl}/v1/openai/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {role: 'system', content: 'You are a helpful assistant.'},
        {role: 'user', content: 'What is the capital of France?'}
      ],
      temperature: 0.7,
      max_tokens: 150
    })
  });
  
  const data = await response.json();
  console.log(data);
}

makeRequest();
```

#### Request with Streaming

```javascript
async function makeStreamingRequest() {
  const apiKey = "your_api_key_here";
  const baseUrl = "http://localhost:3000";
  
  const response = await fetch(`${baseUrl}/v1/openai/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {role: 'system', content: 'You are a helpful assistant.'},
        {role: 'user', content: 'What is the capital of France?'}
      ],
      temperature: 0.7,
      max_tokens: 150,
      stream: true
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim() !== '');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          console.log('Stream completed');
        } else {
          try {
            const parsedData = JSON.parse(data);
            const content = parsedData.choices[0]?.delta?.content || '';
            if (content) {
              process.stdout.write(content);
            }
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }
    }
  }
}

makeStreamingRequest();
```

## Integration with Popular Frameworks

### LangChain (Python)

```python
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

# Configure LangChain to use RelayCore
import os
os.environ["OPENAI_API_BASE"] = "http://localhost:3000/v1/openai"
os.environ["OPENAI_API_KEY"] = "your_api_key_here"

# Create a chat model instance
chat = ChatOpenAI(model_name="gpt-4", temperature=0.7)

# Send a message
messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="What is the capital of France?")
]

response = chat(messages)
print(response.content)
```

### VS Code Extension Integration

```typescript
// Example of how a VS Code extension would integrate with RelayCore
import * as vscode from 'vscode';
import axios from 'axios';

export async function activate(context: vscode.ExtensionContext) {
  // Register a command to send selected text to RelayCore
  let disposable = vscode.commands.registerCommand('extension.sendToRelayCore', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor!');
      return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);
    
    if (!text) {
      vscode.window.showErrorMessage('No text selected!');
      return;
    }
    
    // Show progress indicator
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Processing with AI...",
      cancellable: true
    }, async (progress, token) => {
      try {
        // Get configuration
        const config = vscode.workspace.getConfiguration('relayCore');
        const apiKey = config.get('apiKey') as string;
        const baseUrl = config.get('baseUrl') as string || 'http://localhost:3000';
        const model = config.get('model') as string || 'gpt-4';
        
        // Send request to RelayCore
        const response = await axios.post(`${baseUrl}/v1/vscode/completions`, {
          model: model,
          messages: [
            { role: "system", content: "You are a helpful coding assistant." },
            { role: "user", content: text }
          ],
          temperature: 0.3,
          max_tokens: 1000
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          }
        });
        
        // Get the response content
        const responseContent = response.data.choices[0].message.content;
        
        // Insert the response after the selection
        editor.edit(editBuilder => {
          editBuilder.insert(selection.end, '\n\n' + responseContent);
        });
        
        // Show success message
        vscode.window.showInformationMessage('AI response inserted!');
      } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
      
      return Promise.resolve();
    });
  });

  context.subscriptions.push(disposable);
}
```

### React Application Integration

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const RelayCoreChat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const apiKey = process.env.REACT_APP_RELAYCORE_API_KEY;
  const baseUrl = process.env.REACT_APP_RELAYCORE_URL || 'http://localhost:3000';
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await axios.post(`${baseUrl}/v1/openai/chat/completions`, {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          ...messages,
          userMessage
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-AIHub-Cache': 'use',
          'X-AIHub-Optimize': 'moderate'
        }
      });
      
      // Add assistant response to chat
      const assistantMessage = response.data.choices[0].message;
      setMessages(prev => [...prev, assistantMessage]);
      
      // Log optimization info
      console.log('Cache Status:', response.headers['x-aihub-cache-status']);
      console.log('Optimizations Applied:', response.headers['x-aihub-optimizations-applied']);
      console.log('Estimated Cost:', response.headers['x-aihub-cost']);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && <div className="loading">AI is thinking...</div>}
      </div>
      
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} disabled={loading}>Send</button>
      </div>
    </div>
  );
};

export default RelayCoreChat;
```

## Advanced Usage Examples

### Custom Provider Routing

```python
import requests

api_key = "your_api_key_here"
base_url = "http://localhost:3000"

# Function to determine the best provider based on the query
def get_best_provider(query):
    if "code" in query.lower() or "function" in query.lower():
        return "openai", "gpt-4"
    elif "creative" in query.lower() or "story" in query.lower():
        return "anthropic", "claude-3-opus"
    else:
        return "mistral", "mistral-small-latest"

# User query
user_query = "Write a function to calculate the Fibonacci sequence"

# Determine provider
provider, model = get_best_provider(user_query)

# Send request to the appropriate provider
response = requests.post(
    f"{base_url}/v1/{provider}/chat/completions",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": api_key,
        "X-AIHub-Cache": "use"
    },
    json={
        "model": model,
        "messages": [
            {"role": "user", "content": user_query}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
)

print(f"Using provider: {provider}, model: {model}")
print(response.json())
```

### Fallback Chain Implementation

```javascript
async function sendRequestWithFallback() {
  const apiKey = "your_api_key_here";
  const baseUrl = "http://localhost:3000";
  const providers = ["openai", "anthropic", "mistral"];
  const models = {
    "openai": "gpt-4",
    "anthropic": "claude-3-sonnet",
    "mistral": "mistral-large-latest"
  };
  
  const userQuery = "Explain quantum computing in simple terms";
  
  // Try each provider in sequence until one succeeds
  for (const provider of providers) {
    try {
      console.log(`Trying provider: ${provider}, model: ${models[provider]}`);
      
      const response = await fetch(`${baseUrl}/v1/${provider}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          model: models[provider],
          messages: [
            {role: 'user', content: userQuery}
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Success with provider: ${provider}`);
      return data;
    } catch (error) {
      console.error(`Error with provider ${provider}:`, error);
      // Continue to next provider
    }
  }
  
  throw new Error("All providers failed");
}

sendRequestWithFallback()
  .then(data => console.log("Response:", data))
  .catch(error => console.error("Final error:", error));
```

### Cost Optimization Example

```python
import requests
import json

api_key = "your_api_key_here"
base_url = "http://localhost:3000"

# Function to estimate token count
def estimate_tokens(text):
    # Rough estimate: 1 token ≈ 4 characters
    return len(text) // 4

# Function to select the most cost-effective model based on input complexity
def select_cost_effective_model(input_text):
    token_estimate = estimate_tokens(input_text)
    
    if token_estimate < 100:
        return "mistral", "mistral-small-latest"  # Cheapest for small queries
    elif "code" in input_text.lower() or token_estimate > 1000:
        return "openai", "gpt-4"  # Best for complex tasks despite cost
    else:
        return "anthropic", "claude-3-sonnet"  # Good balance for medium complexity

# User query
user_query = "Explain the concept of recursion in programming with a simple example"

# Select model based on cost-effectiveness
provider, model = select_cost_effective_model(user_query)

# Send request
response = requests.post(
    f"{base_url}/v1/{provider}/chat/completions",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": api_key,
        "X-AIHub-Optimize": "aggressive",  # Request aggressive optimization
        "X-AIHub-Cache": "use"  # Use cache if available
    },
    json={
        "model": model,
        "messages": [
            {"role": "user", "content": user_query}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
)

# Extract cost information
cost = response.headers.get('X-AIHub-Cost', '0')
optimizations = response.headers.get('X-AIHub-Optimizations-Applied', '{}')

print(f"Provider: {provider}, Model: {model}")
print(f"Estimated cost: ${cost}")
print(f"Optimizations applied: {optimizations}")
print(json.dumps(response.json(), indent=2))
```

## Plugin Development Example

This example shows how to create a custom plugin for RelayCore:

```typescript
// plugins/custom-plugin/index.ts
import express from 'express';
import { Request, Response } from 'express';

// Define the plugin interface
const CustomPlugin = {
  name: 'custom-plugin',
  version: '1.0.0',
  
  initialize: (app: express.Application) => {
    // Register custom routes
    app.post('/v1/custom-plugin/analyze', async (req: Request, res: Response) => {
      try {
        const { text } = req.body;
        
        if (!text) {
          return res.status(400).json({ error: 'Text is required' });
        }
        
        // Perform custom preprocessing
        const processedText = preprocessText(text);
        
        // Forward to appropriate AI provider
        // This is a simplified example - in a real plugin you would use the
        // RelayCore API client to forward the request
        const aiResponse = await forwardToAI(processedText, req.headers['x-api-key'] as string);
        
        // Perform custom postprocessing
        const result = postprocessResponse(aiResponse);
        
        // Return the result
        res.status(200).json(result);
      } catch (error) {
        console.error('Error in custom plugin:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    // Register plugin settings endpoint
    app.get('/v1/custom-plugin/settings', (req: Request, res: Response) => {
      res.status(200).json({
        name: 'Custom Plugin',
        version: '1.0.0',
        settings: {
          // Plugin settings
        }
      });
    });
  },
  
  shutdown: async () => {
    // Cleanup resources
    console.log('Custom plugin shutting down');
  }
};

// Helper functions
function preprocessText(text: string): string {
  // Custom preprocessing logic
  return text.trim();
}

async function forwardToAI(text: string, apiKey: string): Promise<any> {
  // Forward to AI provider
  // This is a simplified example
  return { result: 'AI response' };
}

function postprocessResponse(response: any): any {
  // Custom postprocessing logic
  return response;
}

export default CustomPlugin;
```

## Configuration Management Example

This example shows how to programmatically update the RelayCore configuration:

```python
import requests
import json

api_key = "your_admin_api_key_here"
base_url = "http://localhost:3000"

# Get current configuration
response = requests.get(
    f"{base_url}/v1/config",
    headers={
        "X-API-Key": api_key
    }
)

config = response.json()

# Update configuration
config["optimization"]["tokenOptimization"]["level"] = "aggressive"
config["cache"]["ttl"] = 7200  # Increase cache TTL to 2 hours

# Add a new provider
config["providers"]["cohere"] = {
    "enabled": True,
    "apiKey": "${COHERE_API_KEY}",
    "baseUrl": "https://api.cohere.ai",
    "models": {
        "command": {
            "enabled": True,
            "maxTokens": 4096,
            "costPerInputToken": 0.000002,
            "costPerOutputToken": 0.000010
        }
    },
    "endpoints": {
        "generate": {
            "method": "POST",
            "requestTransform": "standardToCohere",
            "responseTransform": "cohereToStandard",
            "supportsBatching": False,
            "supportsStreaming": True
        }
    }
}

# Update configuration
response = requests.put(
    f"{base_url}/v1/config",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": api_key
    },
    json=config
)

print(f"Configuration update status: {response.status_code}")
print(json.dumps(response.json(), indent=2))
```

These examples demonstrate the flexibility and power of the RelayCore API for integrating with various client environments and use cases.