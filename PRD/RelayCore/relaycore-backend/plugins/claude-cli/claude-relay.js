#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');
const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const configStore = require('configstore');

// Create config store
const pkg = { name: 'claude-relay' };
const config = new configStore(pkg.name, {
  apiKey: '',
  endpoint: 'http://localhost:3000',
  defaultModel: 'claude-3-opus',
  defaultProvider: 'anthropic',
  maxTokens: 4000
});

// Configure CLI
program
  .name('claude-relay')
  .description('Claude CLI powered by RelayCore')
  .version('0.1.0');

// Configure command
program
  .command('configure')
  .description('Configure Claude Relay settings')
  .action(async () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    console.log(chalk.bold.blue('Claude Relay Configuration'));
    console.log(chalk.gray('Press Enter to keep current value\n'));

    const apiKey = await question(`RelayCore API Key (${config.get('apiKey') ? '********' : 'not set'}): `);
    if (apiKey) config.set('apiKey', apiKey);

    const endpoint = await question(`RelayCore Endpoint (${config.get('endpoint')}): `);
    if (endpoint) config.set('endpoint', endpoint);

    const defaultModel = await question(`Default Model (${config.get('defaultModel')}): `);
    if (defaultModel) config.set('defaultModel', defaultModel);

    const defaultProvider = await question(`Default Provider (${config.get('defaultProvider')}): `);
    if (defaultProvider) config.set('defaultProvider', defaultProvider);

    const maxTokens = await question(`Max Tokens (${config.get('maxTokens')}): `);
    if (maxTokens) config.set('maxTokens', parseInt(maxTokens, 10));

    rl.close();
    console.log(chalk.green('\nConfiguration saved successfully!'));
  });

// Chat command
program
  .command('chat')
  .description('Start an interactive chat session with Claude')
  .option('-m, --model <model>', 'Specify the model to use')
  .option('-p, --provider <provider>', 'Specify the provider to use')
  .option('-s, --system <message>', 'Set a system message')
  .action(async (options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('API Key not configured. Please run `claude-relay configure` first.'));
      process.exit(1);
    }

    const model = options.model || config.get('defaultModel');
    const provider = options.provider || config.get('defaultProvider');
    const systemMessage = options.system || 'You are Claude, a helpful AI assistant.';

    console.log(chalk.bold.blue('Claude Relay Chat'));
    console.log(chalk.gray(`Using model: ${model} (${provider})`));
    console.log(chalk.gray('Type "exit" or press Ctrl+C to end the conversation\n'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const messages = [
      { role: 'system', content: systemMessage }
    ];

    const chat = async () => {
      const userInput = await new Promise((resolve) => {
        rl.question(chalk.bold.green('You: '), resolve);
      });

      if (userInput.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      messages.push({ role: 'user', content: userInput });

      const spinner = ora('Claude is thinking...').start();

      try {
        const response = await makeRelayCoreRequest({
          messages,
          model,
          provider,
          max_tokens: config.get('maxTokens')
        });

        spinner.stop();
        
        const assistantMessage = response.content;
        messages.push({ role: 'assistant', content: assistantMessage });

        console.log(chalk.bold.blue('\nClaude: '));
        console.log(boxen(assistantMessage, {
          padding: 1,
          margin: { top: 0, bottom: 1 },
          borderColor: 'blue'
        }));

        // Continue the chat
        chat();
      } catch (error) {
        spinner.fail('Error getting response');
        console.error(chalk.red(`Error: ${error.message}`));
        chat();
      }
    };

    chat();
  });

// Prompt command
program
  .command('prompt <prompt>')
  .description('Send a single prompt to Claude')
  .option('-m, --model <model>', 'Specify the model to use')
  .option('-p, --provider <provider>', 'Specify the provider to use')
  .option('-s, --system <message>', 'Set a system message')
  .option('-f, --file <file>', 'Include file content in the prompt')
  .action(async (prompt, options) => {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.red('API Key not configured. Please run `claude-relay configure` first.'));
      process.exit(1);
    }

    const model = options.model || config.get('defaultModel');
    const provider = options.provider || config.get('defaultProvider');
    const systemMessage = options.system || 'You are Claude, a helpful AI assistant.';

    let fullPrompt = prompt;

    // If file is provided, read its content
    if (options.file) {
      try {
        const fileContent = fs.readFileSync(options.file, 'utf8');
        fullPrompt = `${prompt}\n\nFile content:\n\`\`\`\n${fileContent}\n\`\`\``;
      } catch (error) {
        console.error(chalk.red(`Error reading file: ${error.message}`));
        process.exit(1);
      }
    }

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: fullPrompt }
    ];

    const spinner = ora('Claude is thinking...').start();

    try {
      const response = await makeRelayCoreRequest({
        messages,
        model,
        provider,
        max_tokens: config.get('maxTokens')
      });

      spinner.stop();
      
      console.log(boxen(response.content, {
        padding: 1,
        borderColor: 'blue'
      }));
    } catch (error) {
      spinner.fail('Error getting response');
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Make API request to RelayCore
async function makeRelayCoreRequest(data) {
  const apiKey = config.get('apiKey');
  const endpoint = config.get('endpoint');
  
  try {
    const response = await axios.post(`${endpoint}/v1/chat/completions`, data, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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

// Parse command line arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}