# RelayCore Plugin Ecosystem

RelayCore offers a comprehensive plugin ecosystem that allows you to integrate AI capabilities into your favorite tools and workflows. This documentation provides detailed information about each plugin, including installation instructions, usage guides, and examples.

## Available Plugins

RelayCore currently offers the following plugins:

1. [VS Code Plugin](#vs-code-plugin) - Integrate AI assistance directly into your VS Code editor
2. [Claude CLI Plugin](#claude-cli-plugin) - Access Claude AI from your terminal
3. [LangChain Integration](#langchain-integration) - Use RelayCore with the LangChain framework
4. [JetBrains IDE Plugin](#jetbrains-ide-plugin) - AI assistance for IntelliJ IDEA, PyCharm, and other JetBrains IDEs
5. [Amazon Kiro IDE Plugin](#amazon-kiro-ide-plugin) - AI assistance for Amazon's Kiro IDE

## Plugin Architecture

RelayCore plugins follow a consistent architecture that enables:

- Secure communication with the RelayCore API
- Efficient token usage through caching and optimization
- Context-aware AI interactions
- Customizable behaviors through configuration

Each plugin connects to your RelayCore instance, which handles authentication, routing, caching, and optimization. This architecture ensures consistent behavior across all tools while allowing for tool-specific features and optimizations.

## Getting Started

To use any RelayCore plugin, you'll need:

1. A RelayCore instance running (self-hosted or cloud)
2. An API key for authentication
3. The specific plugin installed in your tool of choice

Follow the installation and setup instructions for each plugin to get started.

## Contributing

We welcome contributions to our plugin ecosystem! If you'd like to contribute, please check our [contribution guidelines](../contributing.md) for more information.