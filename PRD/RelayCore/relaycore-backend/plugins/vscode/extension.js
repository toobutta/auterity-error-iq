// RelayCore VS Code Plugin

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
  console.log('RelayCore extension is now active');
  
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
    vscode.commands.registerCommand('relaycore.showSettings', showSettings)
  ];
  
  commands.forEach(command => context.subscriptions.push(command));
  
  // Register status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(rocket) RelayCore";
  statusBarItem.tooltip = "RelayCore AI Assistant";
  statusBarItem.command = 'relaycore.showSettings';
  statusBarItem.show();
  
  context.subscriptions.push(statusBarItem);
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
  console.log('RelayCore extension is now deactivated');
}

module.exports = {
  activate,
  deactivate
};