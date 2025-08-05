/**
 * RelayCore integration for Amazon Kiro IDE
 * 
 * This plugin connects Amazon Kiro IDE to RelayCore, enabling AI-powered
 * code assistance, documentation generation, and more.
 */

const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
let relayCoreConfig = {
  apiKey: '',
  endpoint: 'http://localhost:3000',
  defaultModel: 'gpt-4',
  defaultProvider: 'openai'
};

// Load configuration from settings
function loadConfiguration() {
  const config = vscode.workspace.getConfiguration('relaycore');
  relayCoreConfig.apiKey = config.get('apiKey') || relayCoreConfig.apiKey;
  relayCoreConfig.endpoint = config.get('endpoint') || relayCoreConfig.endpoint;
  relayCoreConfig.defaultModel = config.get('defaultModel') || relayCoreConfig.defaultModel;
  relayCoreConfig.defaultProvider = config.get('defaultProvider') || relayCoreConfig.defaultProvider;
}

// Initialize the extension
function activate(context) {
  console.log('RelayCore extension for Amazon Kiro IDE is now active');
  
  // Load initial configuration
  loadConfiguration();
  
  // Register configuration change listener
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('relaycore')) {
        loadConfiguration();
      }
    })
  );
  
  // Register commands
  const commands = [
    vscode.commands.registerCommand('relaycore.configureApiKey', configureApiKey),
    vscode.commands.registerCommand('relaycore.explainCode', explainCode),
    vscode.commands.registerCommand('relaycore.generateDocumentation', generateDocumentation),
    vscode.commands.registerCommand('relaycore.optimizeCode', optimizeCode),
    vscode.commands.registerCommand('relaycore.askQuestion', askQuestion),
    vscode.commands.registerCommand('relaycore.showSettings', showSettings),
    vscode.commands.registerCommand('relaycore.generateTests', generateTests),
    vscode.commands.registerCommand('relaycore.findBugs', findBugs),
    vscode.commands.registerCommand('relaycore.suggestRefactoring', suggestRefactoring)
  ];
  
  commands.forEach(command => context.subscriptions.push(command));
  
  // Register status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(rocket) RelayCore";
  statusBarItem.tooltip = "RelayCore AI Assistant";
  statusBarItem.command = 'relaycore.showSettings';
  statusBarItem.show();
  
  context.subscriptions.push(statusBarItem);
  
  // Register Kiro-specific features
  registerKiroFeatures(context);
}

// Register Kiro-specific features
function registerKiroFeatures(context) {
  // Kiro code navigation integration
  context.subscriptions.push(
    vscode.commands.registerCommand('relaycore.kiro.navigateToImplementation', navigateToImplementation)
  );
  
  // Kiro AWS service integration
  context.subscriptions.push(
    vscode.commands.registerCommand('relaycore.kiro.explainAwsService', explainAwsService)
  );
  
  // Kiro CloudFormation template generation
  context.subscriptions.push(
    vscode.commands.registerCommand('relaycore.kiro.generateCloudFormation', generateCloudFormation)
  );
  
  // Kiro CDK code generation
  context.subscriptions.push(
    vscode.commands.registerCommand('relaycore.kiro.generateCdkCode', generateCdkCode)
  );
  
  // Kiro Lambda function generation
  context.subscriptions.push(
    vscode.commands.registerCommand('relaycore.kiro.generateLambdaFunction', generateLambdaFunction)
  );
}

// Configure API Key
async function configureApiKey() {
  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter your RelayCore API Key",
    password: true,
    ignoreFocusOut: true
  });
  
  if (apiKey) {
    // Update configuration
    await vscode.workspace.getConfiguration('relaycore').update('apiKey', apiKey, true);
    vscode.window.showInformationMessage('RelayCore API Key configured successfully');
  }
}

// Explain selected code
async function explainCode() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found');
    return;
  }
  
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  
  if (!selectedText) {
    vscode.window.showErrorMessage('No code selected');
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Explaining code...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are a helpful coding assistant. Explain the following code in a clear and concise manner." },
          { role: "user", content: selectedText }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Show results in a new editor
      const document = await vscode.workspace.openTextDocument({
        content: response.content,
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(document, { preview: true });
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error explaining code: ${error.message}`);
  }
}

// Generate documentation for selected code
async function generateDocumentation() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found');
    return;
  }
  
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  
  if (!selectedText) {
    vscode.window.showErrorMessage('No code selected');
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Generating documentation...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are a documentation expert. Generate comprehensive documentation for the following code." },
          { role: "user", content: selectedText }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Show results in a new editor
      const document = await vscode.workspace.openTextDocument({
        content: response.content,
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(document, { preview: true });
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error generating documentation: ${error.message}`);
  }
}

// Optimize selected code
async function optimizeCode() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found');
    return;
  }
  
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  
  if (!selectedText) {
    vscode.window.showErrorMessage('No code selected');
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Optimizing code...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are a code optimization expert. Optimize the following code for better performance and readability. Return only the optimized code without explanations." },
          { role: "user", content: selectedText }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Replace selected text with optimized code
      await editor.edit(editBuilder => {
        editBuilder.replace(selection, response.content);
      });
      
      vscode.window.showInformationMessage('Code optimized successfully');
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error optimizing code: ${error.message}`);
  }
}

// Ask a question about the code
async function askQuestion() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found');
    return;
  }
  
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  
  // Get question from user
  const question = await vscode.window.showInputBox({
    prompt: "What would you like to ask about this code?",
    placeHolder: "E.g., How does this function work?",
    ignoreFocusOut: true
  });
  
  if (!question) {
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Getting answer...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are a helpful coding assistant. Answer questions about the provided code." },
          { role: "user", content: `Code:\n\`\`\`\n${selectedText}\n\`\`\`\n\nQuestion: ${question}` }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Show results in a new editor
      const document = await vscode.workspace.openTextDocument({
        content: `# Question\n\n${question}\n\n# Answer\n\n${response.content}`,
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(document, { preview: true });
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error getting answer: ${error.message}`);
  }
}

// Generate tests for selected code
async function generateTests() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found');
    return;
  }
  
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  
  if (!selectedText) {
    vscode.window.showErrorMessage('No code selected');
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Generating tests...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are a testing expert. Generate comprehensive unit tests for the following code." },
          { role: "user", content: selectedText }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Show results in a new editor
      const document = await vscode.workspace.openTextDocument({
        content: response.content,
        language: editor.document.languageId
      });
      
      await vscode.window.showTextDocument(document, { preview: true });
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error generating tests: ${error.message}`);
  }
}

// Find bugs in selected code
async function findBugs() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found');
    return;
  }
  
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  
  if (!selectedText) {
    vscode.window.showErrorMessage('No code selected');
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Finding bugs...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are a code review expert. Identify potential bugs, security issues, and performance problems in the following code." },
          { role: "user", content: selectedText }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Show results in a new editor
      const document = await vscode.workspace.openTextDocument({
        content: response.content,
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(document, { preview: true });
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error finding bugs: ${error.message}`);
  }
}

// Suggest refactoring for selected code
async function suggestRefactoring() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found');
    return;
  }
  
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  
  if (!selectedText) {
    vscode.window.showErrorMessage('No code selected');
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Suggesting refactoring...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are a code refactoring expert. Suggest ways to refactor the following code to improve readability, maintainability, and performance." },
          { role: "user", content: selectedText }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Show results in a new editor
      const document = await vscode.workspace.openTextDocument({
        content: response.content,
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(document, { preview: true });
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error suggesting refactoring: ${error.message}`);
  }
}

// Navigate to implementation (Kiro-specific)
async function navigateToImplementation() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found');
    return;
  }
  
  const position = editor.selection.active;
  const wordRange = editor.document.getWordRangeAtPosition(position);
  const word = editor.document.getText(wordRange);
  
  if (!word) {
    vscode.window.showErrorMessage('No symbol selected');
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Finding implementation...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are a code navigation assistant. Help find the implementation of the specified symbol in the codebase." },
          { role: "user", content: `Find the implementation of '${word}' in the current project.` }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Parse the response to find file paths and line numbers
      const regex = /`([^`]+)`\s*:\s*line\s*(\d+)/gi;
      const matches = [...response.content.matchAll(regex)];
      
      if (matches.length > 0) {
        const items = matches.map(match => ({
          label: `${match[1]}:${match[2]}`,
          description: `Implementation of '${word}'`,
          filePath: match[1],
          lineNumber: parseInt(match[2], 10)
        }));
        
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select implementation to navigate to'
        });
        
        if (selected) {
          const document = await vscode.workspace.openTextDocument(selected.filePath);
          const editor = await vscode.window.showTextDocument(document);
          const position = new vscode.Position(selected.lineNumber - 1, 0);
          editor.selection = new vscode.Selection(position, position);
          editor.revealRange(new vscode.Range(position, position));
        }
      } else {
        vscode.window.showInformationMessage(`No implementation found for '${word}'`);
      }
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error finding implementation: ${error.message}`);
  }
}

// Explain AWS service (Kiro-specific)
async function explainAwsService() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found');
    return;
  }
  
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection) || '';
  
  // Get AWS service from user if not selected
  let awsService = selectedText.trim();
  if (!awsService) {
    awsService = await vscode.window.showInputBox({
      prompt: "Which AWS service would you like to learn about?",
      placeHolder: "E.g., Lambda, S3, DynamoDB",
      ignoreFocusOut: true
    });
  }
  
  if (!awsService) {
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Getting information about AWS ${awsService}...`,
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are an AWS expert. Provide detailed information about AWS services, including use cases, best practices, and code examples." },
          { role: "user", content: `Explain the AWS ${awsService} service. Include what it is, when to use it, key features, pricing considerations, and a simple code example.` }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Show results in a new editor
      const document = await vscode.workspace.openTextDocument({
        content: `# AWS ${awsService}\n\n${response.content}`,
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(document, { preview: true });
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error getting AWS service information: ${error.message}`);
  }
}

// Generate CloudFormation template (Kiro-specific)
async function generateCloudFormation() {
  // Get resources from user
  const resources = await vscode.window.showInputBox({
    prompt: "What AWS resources would you like to include in the CloudFormation template?",
    placeHolder: "E.g., Lambda function, S3 bucket, DynamoDB table",
    ignoreFocusOut: true
  });
  
  if (!resources) {
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Generating CloudFormation template...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are a CloudFormation expert. Generate CloudFormation templates based on user requirements." },
          { role: "user", content: `Generate a CloudFormation template that includes the following resources: ${resources}. Include appropriate IAM roles and permissions. Use YAML format.` }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Extract YAML from response
      const yamlRegex = /```(?:yaml|yml)\n([\s\S]*?)```/i;
      const match = response.content.match(yamlRegex);
      const yamlContent = match ? match[1] : response.content;
      
      // Show results in a new editor
      const document = await vscode.workspace.openTextDocument({
        content: yamlContent,
        language: 'yaml'
      });
      
      await vscode.window.showTextDocument(document, { preview: true });
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error generating CloudFormation template: ${error.message}`);
  }
}

// Generate CDK code (Kiro-specific)
async function generateCdkCode() {
  // Get resources from user
  const resources = await vscode.window.showInputBox({
    prompt: "What AWS resources would you like to include in the CDK code?",
    placeHolder: "E.g., Lambda function, S3 bucket, DynamoDB table",
    ignoreFocusOut: true
  });
  
  if (!resources) {
    return;
  }
  
  // Get language from user
  const language = await vscode.window.showQuickPick(
    ['TypeScript', 'Python', 'Java', 'C#'],
    {
      placeHolder: 'Select the programming language for CDK code'
    }
  );
  
  if (!language) {
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Generating CDK code...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are an AWS CDK expert. Generate CDK code based on user requirements." },
          { role: "user", content: `Generate AWS CDK code in ${language} that includes the following resources: ${resources}. Include appropriate IAM roles and permissions.` }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Determine language ID for the editor
      const languageIdMap = {
        'TypeScript': 'typescript',
        'Python': 'python',
        'Java': 'java',
        'C#': 'csharp'
      };
      
      const languageId = languageIdMap[language] || 'typescript';
      
      // Show results in a new editor
      const document = await vscode.workspace.openTextDocument({
        content: response.content,
        language: languageId
      });
      
      await vscode.window.showTextDocument(document, { preview: true });
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error generating CDK code: ${error.message}`);
  }
}

// Generate Lambda function (Kiro-specific)
async function generateLambdaFunction() {
  // Get function description from user
  const description = await vscode.window.showInputBox({
    prompt: "Describe what the Lambda function should do",
    placeHolder: "E.g., Process S3 events and store metadata in DynamoDB",
    ignoreFocusOut: true
  });
  
  if (!description) {
    return;
  }
  
  // Get language from user
  const language = await vscode.window.showQuickPick(
    ['Node.js', 'Python', 'Java', 'Go', 'Ruby', 'C#'],
    {
      placeHolder: 'Select the programming language for the Lambda function'
    }
  );
  
  if (!language) {
    return;
  }
  
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Generating Lambda function...",
      cancellable: false
    }, async (progress) => {
      // Make API request to RelayCore
      const response = await makeRelayCoreRequest({
        messages: [
          { role: "system", content: "You are an AWS Lambda expert. Generate Lambda function code based on user requirements." },
          { role: "user", content: `Generate an AWS Lambda function in ${language} that does the following: ${description}. Include error handling, logging, and any necessary AWS SDK calls.` }
        ],
        model: relayCoreConfig.defaultModel,
        provider: relayCoreConfig.defaultProvider
      });
      
      // Determine language ID and file extension for the editor
      const languageMap = {
        'Node.js': { id: 'javascript', ext: 'js' },
        'Python': { id: 'python', ext: 'py' },
        'Java': { id: 'java', ext: 'java' },
        'Go': { id: 'go', ext: 'go' },
        'Ruby': { id: 'ruby', ext: 'rb' },
        'C#': { id: 'csharp', ext: 'cs' }
      };
      
      const { id: languageId, ext } = languageMap[language] || { id: 'javascript', ext: 'js' };
      
      // Extract code from response
      const codeRegex = new RegExp(`\`\`\`(?:${languageId})?\n([\\s\\S]*?)\`\`\``, 'i');
      const match = response.content.match(codeRegex);
      const code = match ? match[1] : response.content;
      
      // Create a new file with the Lambda function
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        const fileName = `lambda_function.${ext}`;
        const filePath = path.join(workspaceFolders[0].uri.fsPath, fileName);
        
        fs.writeFileSync(filePath, code);
        
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        
        vscode.window.showInformationMessage(`Lambda function created: ${fileName}`);
      } else {
        // If no workspace is open, show in a new editor
        const document = await vscode.workspace.openTextDocument({
          content: code,
          language: languageId
        });
        
        await vscode.window.showTextDocument(document);
      }
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error generating Lambda function: ${error.message}`);
  }
}

// Show settings
async function showSettings() {
  const items = [
    'Configure API Key',
    'Set Default Model',
    'Set Default Provider',
    'Set RelayCore Endpoint'
  ];
  
  const selection = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a setting to configure'
  });
  
  if (!selection) {
    return;
  }
  
  switch (selection) {
    case 'Configure API Key':
      await configureApiKey();
      break;
    case 'Set Default Model':
      const model = await vscode.window.showInputBox({
        prompt: "Enter default model",
        value: relayCoreConfig.defaultModel,
        ignoreFocusOut: true
      });
      if (model) {
        await vscode.workspace.getConfiguration('relaycore').update('defaultModel', model, true);
      }
      break;
    case 'Set Default Provider':
      const provider = await vscode.window.showQuickPick(['openai', 'anthropic', 'mistral'], {
        placeHolder: 'Select default provider'
      });
      if (provider) {
        await vscode.workspace.getConfiguration('relaycore').update('defaultProvider', provider, true);
      }
      break;
    case 'Set RelayCore Endpoint':
      const endpoint = await vscode.window.showInputBox({
        prompt: "Enter RelayCore endpoint URL",
        value: relayCoreConfig.endpoint,
        ignoreFocusOut: true
      });
      if (endpoint) {
        await vscode.workspace.getConfiguration('relaycore').update('endpoint', endpoint, true);
      }
      break;
  }
}

// Make API request to RelayCore
async function makeRelayCoreRequest(data) {
  if (!relayCoreConfig.apiKey) {
    throw new Error('API Key not configured. Please configure your RelayCore API Key first.');
  }
  
  try {
    const response = await axios.post(`${relayCoreConfig.endpoint}/v1/chat/completions`, data, {
      headers: {
        'Authorization': `Bearer ${relayCoreConfig.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      content: response.data.choices[0].message.content,
      model: response.data.model,
      usage: response.data.usage
    };
  } catch (error) {
    console.error('RelayCore API Error:', error);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

// Deactivate extension
function deactivate() {
  console.log('RelayCore extension for Amazon Kiro IDE is now deactivated');
}

module.exports = {
  activate,
  deactivate
};