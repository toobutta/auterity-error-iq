# Claude Relay CLI

A command-line interface for interacting with Claude AI models through RelayCore.

## Features

- **Interactive Chat**: Have conversations with Claude in your terminal
- **Single Prompts**: Send one-off prompts and get quick responses
- **File Integration**: Include file contents in your prompts
- **Smart Routing**: Automatically routes to the best AI provider
- **Cost Optimization**: Reduces AI costs with intelligent caching and token optimization

## Installation

```bash
# Install globally
npm install -g claude-relay

# Or use with npx
npx claude-relay
```

## Configuration

Before using Claude Relay, you need to configure it with your RelayCore API key:

```bash
claude-relay configure
```

This will prompt you to enter:
- Your RelayCore API key
- RelayCore endpoint (default: http://localhost:3000)
- Default model (default: claude-3-opus)
- Default provider (default: anthropic)
- Maximum tokens for responses (default: 4000)

## Usage

### Interactive Chat

Start an interactive chat session with Claude:

```bash
claude-relay chat
```

Options:
- `-m, --model <model>`: Specify the model to use
- `-p, --provider <provider>`: Specify the provider to use
- `-s, --system <message>`: Set a custom system message

Example:
```bash
claude-relay chat --model claude-3-sonnet --system "You are a helpful coding assistant."
```

### Single Prompt

Send a single prompt to Claude:

```bash
claude-relay prompt "What is the capital of France?"
```

Options:
- `-m, --model <model>`: Specify the model to use
- `-p, --provider <provider>`: Specify the provider to use
- `-s, --system <message>`: Set a custom system message
- `-f, --file <file>`: Include file content in the prompt

Example with a file:
```bash
claude-relay prompt "Explain this code:" --file ./app.js
```

## Examples

### Code Explanation

```bash
claude-relay prompt "Explain this code:" --file ./app.js
```

### Writing Assistance

```bash
claude-relay chat --system "You are a helpful writing assistant."
```

### Data Analysis

```bash
claude-relay prompt "Analyze this data:" --file ./data.csv
```

## How It Works

Claude Relay connects to the RelayCore API, which acts as an intelligent middleware between your CLI and various AI model providers. Instead of integrating directly with each provider's API, you connect to RelayCore's unified API, which then handles the communication with the appropriate AI service.

## Benefits of Using RelayCore

- **Provider Flexibility**: Switch between different AI providers without changing your code
- **Cost Optimization**: Reduce costs through intelligent caching and token optimization
- **Smart Routing**: Automatically route to the best provider based on performance and availability
- **Unified Interface**: Consistent API across different AI models

## License

MIT