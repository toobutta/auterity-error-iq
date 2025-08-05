# RelayCore for Amazon Kiro IDE

Connect Amazon Kiro IDE to AI models through RelayCore for code assistance, documentation generation, and AWS-specific features.

## Features

### General Features
- **Explain Code**: Get clear explanations of selected code
- **Generate Documentation**: Automatically create documentation for your code
- **Optimize Code**: Improve your code's performance and readability
- **Ask Questions**: Ask specific questions about your code
- **Generate Tests**: Create unit tests for your code
- **Find Bugs**: Identify potential issues in your code
- **Suggest Refactoring**: Get suggestions for code improvements

### AWS-Specific Features
- **Navigate to Implementation**: Find implementations of symbols in your codebase
- **Explain AWS Service**: Get detailed information about AWS services
- **Generate CloudFormation Template**: Create CloudFormation templates based on your requirements
- **Generate CDK Code**: Create AWS CDK code in your preferred language
- **Generate Lambda Function**: Create Lambda functions with proper AWS SDK integration

## Requirements

- A RelayCore account and API key
- Amazon Kiro IDE

## Installation

### From Marketplace

1. Open Amazon Kiro IDE
2. Go to Extensions
3. Search for "RelayCore for Amazon Kiro IDE"
4. Click "Install"

### Manual Installation

1. Download the latest plugin release from [GitHub Releases](https://github.com/relaycore/relaycore-kiro/releases)
2. Open Amazon Kiro IDE
3. Go to Extensions
4. Click on "Install from VSIX..."
5. Select the downloaded .vsix file

## Getting Started

1. Install the RelayCore for Amazon Kiro IDE extension
2. Configure your RelayCore API key using the command `RelayCore: Configure API Key`
3. Select some code in your editor
4. Right-click and choose one of the RelayCore commands from the context menu

## Commands

### General Commands
- `RelayCore: Configure API Key` - Set up your RelayCore API key
- `RelayCore: Explain Selected Code` - Get an explanation of the selected code
- `RelayCore: Generate Documentation` - Generate documentation for the selected code
- `RelayCore: Optimize Code` - Optimize the selected code for better performance and readability
- `RelayCore: Ask Question About Code` - Ask a specific question about the selected code
- `RelayCore: Generate Tests` - Create unit tests for the selected code
- `RelayCore: Find Bugs` - Identify potential issues in the selected code
- `RelayCore: Suggest Refactoring` - Get suggestions for improving the selected code

### AWS-Specific Commands
- `RelayCore: Navigate to Implementation` - Find implementations of symbols in your codebase
- `RelayCore: Explain AWS Service` - Get detailed information about AWS services
- `RelayCore: Generate CloudFormation Template` - Create CloudFormation templates based on your requirements
- `RelayCore: Generate CDK Code` - Create AWS CDK code in your preferred language
- `RelayCore: Generate Lambda Function` - Create Lambda functions with proper AWS SDK integration

## Configuration

To configure the plugin:

1. Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "RelayCore: Show Settings" and select it
3. Configure the following settings:
   - API Key: Your RelayCore API key
   - Endpoint: The RelayCore API endpoint (default: http://localhost:3000)
   - Default Model: The default AI model to use (default: gpt-4)
   - Default Provider: The default AI provider to use (default: openai)

Alternatively, you can edit the settings directly in the settings.json file:

```json
{
  "relaycore.apiKey": "your-api-key",
  "relaycore.endpoint": "http://localhost:3000",
  "relaycore.defaultModel": "gpt-4",
  "relaycore.defaultProvider": "openai"
}
```

## Examples

### Explaining AWS Services

1. Right-click in your editor
2. Select "RelayCore: Explain AWS Service"
3. Enter the name of the AWS service you want to learn about (e.g., "Lambda", "S3", "DynamoDB")
4. View the explanation in a new editor tab

### Generating CloudFormation Templates

1. Right-click in your editor
2. Select "RelayCore: Generate CloudFormation Template"
3. Enter the resources you want to include (e.g., "Lambda function, S3 bucket, DynamoDB table")
4. View the generated CloudFormation template in a new editor tab

### Generating CDK Code

1. Right-click in your editor
2. Select "RelayCore: Generate CDK Code"
3. Enter the resources you want to include (e.g., "Lambda function, S3 bucket, DynamoDB table")
4. Select the programming language (TypeScript, Python, Java, C#)
5. View the generated CDK code in a new editor tab

### Generating Lambda Functions

1. Right-click in your editor
2. Select "RelayCore: Generate Lambda Function"
3. Enter a description of what the Lambda function should do
4. Select the programming language
5. The Lambda function will be created in your workspace

## How It Works

The RelayCore for Amazon Kiro IDE plugin connects to the RelayCore API, which acts as an intelligent middleware between your IDE and various AI model providers. Instead of integrating directly with each provider's API, you connect to RelayCore's unified API, which then handles the communication with the appropriate AI service.

## Benefits of Using RelayCore with Amazon Kiro IDE

- **AWS Expertise**: Get AI assistance specifically tailored for AWS development
- **Provider Flexibility**: Switch between different AI providers without changing your code
- **Cost Optimization**: Reduce costs through intelligent caching and token optimization
- **Smart Routing**: Automatically route to the best provider based on performance and availability
- **Unified Interface**: Consistent API across different AI models

## Feedback and Support

- File issues on our [GitHub repository](https://github.com/relaycore/relaycore-kiro)
- Contact us at support@relaycore.ai

## License

This plugin is licensed under the MIT License.