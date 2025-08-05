# RelayCore VS Code Plugin

The RelayCore VS Code plugin brings the power of AI directly into your code editor, helping you write, understand, and optimize code more efficiently.

## Features

- **Code Explanation**: Get detailed explanations of selected code
- **Code Generation**: Generate code based on natural language descriptions
- **Code Optimization**: Optimize your code for performance, readability, or memory usage
- **Documentation Generation**: Automatically generate documentation for your code
- **Bug Detection**: Identify potential bugs and security issues in your code
- **Contextual Assistance**: Get AI assistance that understands your project context
- **Custom Commands**: Create custom AI commands tailored to your workflow

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar
3. Search for "RelayCore"
4. Click "Install"

### Manual Installation

1. Download the VSIX file from the [releases page](https://github.com/relaycore/vscode-plugin/releases)
2. Open VS Code
3. Go to the Extensions view
4. Click on the "..." menu in the top-right corner
5. Select "Install from VSIX..."
6. Choose the downloaded VSIX file

## Setup

After installation, you'll need to configure the plugin with your RelayCore API key:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "RelayCore"
3. Enter your API key in the "API Key" field
4. (Optional) Configure the RelayCore endpoint if you're using a self-hosted instance

## Usage

### Code Explanation

1. Select the code you want to explain
2. Right-click and select "RelayCore: Explain Code" or use the keyboard shortcut `Ctrl+Shift+E` (`Cmd+Shift+E` on macOS)
3. The explanation will appear in a new panel

### Code Generation

1. Open or create a file
2. Right-click and select "RelayCore: Generate Code" or use the keyboard shortcut `Ctrl+Shift+G` (`Cmd+Shift+G` on macOS)
3. Enter a description of the code you want to generate
4. The generated code will be inserted at the cursor position

### Code Optimization

1. Select the code you want to optimize
2. Right-click and select "RelayCore: Optimize Code" or use the keyboard shortcut `Ctrl+Shift+O` (`Cmd+Shift+O` on macOS)
3. Choose the optimization target (performance, readability, or memory)
4. The optimized code will be shown in a diff view

### Documentation Generation

1. Select the code you want to document
2. Right-click and select "RelayCore: Generate Documentation" or use the keyboard shortcut `Ctrl+Shift+D` (`Cmd+Shift+D` on macOS)
3. Choose the documentation style (JSDoc, DocString, etc.)
4. The documentation will be inserted above the selected code

## Command Palette

All RelayCore features are available through the VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS):

- `RelayCore: Explain Code`
- `RelayCore: Generate Code`
- `RelayCore: Optimize Code`
- `RelayCore: Generate Documentation`
- `RelayCore: Detect Bugs`
- `RelayCore: Create Custom Command`
- `RelayCore: Configure Settings`

## Custom Commands

You can create custom AI commands tailored to your workflow:

1. Open the Command Palette and select `RelayCore: Create Custom Command`
2. Enter a name for your command
3. Define the prompt template
4. (Optional) Add parameters to your command
5. Save the command

Your custom command will now be available in the Command Palette and context menu.

## Configuration Options

The RelayCore VS Code plugin offers several configuration options:

- **API Key**: Your RelayCore API key
- **Endpoint**: The RelayCore API endpoint (default: `https://api.relaycore.ai`)
- **Model**: The AI model to use (default: `gpt-4`)
- **Temperature**: The creativity level of the AI (0.0-1.0)
- **Max Tokens**: Maximum response length
- **Context Size**: How much project context to include in requests
- **Code Style**: Your preferred coding style for generated code
- **Documentation Style**: Your preferred documentation style

## Keyboard Shortcuts

| Feature | Windows/Linux | macOS |
|---------|--------------|-------|
| Explain Code | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| Generate Code | `Ctrl+Shift+G` | `Cmd+Shift+G` |
| Optimize Code | `Ctrl+Shift+O` | `Cmd+Shift+O` |
| Generate Documentation | `Ctrl+Shift+D` | `Cmd+Shift+D` |
| Detect Bugs | `Ctrl+Shift+B` | `Cmd+Shift+B` |

## Examples

### Code Explanation Example

```javascript
// Selected code
function memoize(fn) {
  const cache = {};
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache[key]) {
      return cache[key];
    }
    const result = fn.apply(this, args);
    cache[key] = result;
    return result;
  };
}
```

Explanation:
```
This function implements memoization, a performance optimization technique. It works by:

1. Creating a cache object to store previous function results
2. Returning a new function that wraps the original function
3. Converting the arguments to a string to use as a cache key
4. Checking if the result is already in the cache
5. If found, returning the cached result
6. If not found, calling the original function and storing the result in the cache

Memoization improves performance by avoiding redundant calculations for the same inputs.
```

### Code Generation Example

Prompt:
```
Create a React component that fetches data from an API and displays it in a list. Include loading and error states.
```

Generated code:
```jsx
import React, { useState, useEffect } from 'react';

const DataList = ({ apiUrl }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(`Error fetching data: ${err.message}`);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  if (loading) {
    return <div>Loading data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="data-list">
      <h2>Data List</h2>
      {data.length === 0 ? (
        <p>No data available</p>
      ) : (
        <ul>
          {data.map((item, index) => (
            <li key={item.id || index}>{item.name || JSON.stringify(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DataList;
```

## Troubleshooting

### Common Issues

- **Authentication Failed**: Verify your API key in the settings
- **Request Timeout**: Try reducing the context size or splitting your request into smaller chunks
- **Rate Limiting**: You may have exceeded your API usage limits
- **Plugin Not Responding**: Try reloading VS Code with `Developer: Reload Window`

### Logs

To access the plugin logs:

1. Open the Command Palette
2. Select `Developer: Open Logs Folder`
3. Look for the `relaycore` log file

## Support

If you encounter any issues or have questions about the RelayCore VS Code plugin, please:

- Check the [FAQ](https://docs.relaycore.ai/plugins/vscode/faq)
- Join our [Discord community](https://discord.gg/relaycore)
- Open an issue on our [GitHub repository](https://github.com/relaycore/vscode-plugin/issues)
- Contact support at support@relaycore.ai

## Privacy and Security

The RelayCore VS Code plugin sends code snippets and context to the RelayCore API for processing. We take privacy and security seriously:

- All data is encrypted in transit
- We do not store your code permanently
- You can configure how much context is sent with each request
- You can use a self-hosted RelayCore instance for complete data control

For more information, see our [Privacy Policy](https://relaycore.ai/privacy).