# RelayCore AI Assistant for VS Code

Connect VS Code to AI models through RelayCore for code assistance, documentation generation, and more.

## Features

- **Explain Code**: Get clear explanations of selected code
- **Generate Documentation**: Automatically create documentation for your code
- **Optimize Code**: Improve your code's performance and readability
- **Ask Questions**: Ask specific questions about your code
- **Smart Routing**: Automatically routes to the best AI provider based on your needs
- **Cost Optimization**: Reduces AI costs with intelligent caching and token optimization

## Requirements

- A RelayCore account and API key
- VS Code version 1.60.0 or higher

## Getting Started

1. Install the RelayCore VS Code extension
2. Configure your RelayCore API key using the command `RelayCore: Configure API Key`
3. Select some code in your editor
4. Right-click and choose one of the RelayCore commands, or use the command palette

## Commands

- `RelayCore: Configure API Key` - Set up your RelayCore API key
- `RelayCore: Explain Selected Code` - Get an explanation of the selected code
- `RelayCore: Generate Documentation` - Generate documentation for the selected code
- `RelayCore: Optimize Code` - Optimize the selected code for better performance and readability
- `RelayCore: Ask Question About Code` - Ask a specific question about the selected code
- `RelayCore: Show Settings` - Configure RelayCore settings

## Extension Settings

This extension contributes the following settings:

- `relaycore.apiKey`: Your RelayCore API key
- `relaycore.endpoint`: The RelayCore API endpoint (default: http://localhost:3000)
- `relaycore.defaultModel`: The default AI model to use (default: gpt-4)
- `relaycore.defaultProvider`: The default AI provider to use (default: openai)

## Examples

### Explaining Code

1. Select a code snippet in your editor
2. Right-click and select `RelayCore: Explain Selected Code`
3. View the explanation in a new editor tab

### Generating Documentation

1. Select a function or class in your editor
2. Right-click and select `RelayCore: Generate Documentation`
3. View the generated documentation in a new editor tab

### Optimizing Code

1. Select a code snippet in your editor
2. Right-click and select `RelayCore: Optimize Code`
3. The selected code will be replaced with the optimized version

### Asking Questions

1. Select a code snippet in your editor
2. Right-click and select `RelayCore: Ask Question About Code`
3. Enter your question in the input box
4. View the answer in a new editor tab

## How It Works

The RelayCore VS Code extension connects to the RelayCore API, which acts as an intelligent middleware between your editor and various AI model providers. Instead of integrating directly with each provider's API, you connect to RelayCore's unified API, which then handles the communication with the appropriate AI service.

## Feedback and Support

- File issues on our [GitHub repository](https://github.com/relaycore/relaycore-vscode)
- Contact us at support@relaycore.ai

## License

This extension is licensed under the MIT License.