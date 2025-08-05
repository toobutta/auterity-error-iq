# RelayCore Claude CLI Plugin

The RelayCore Claude CLI plugin brings the power of Claude AI directly to your terminal, allowing you to interact with Claude without leaving your command line environment.

## Features

- **Interactive Chat**: Have natural conversations with Claude directly in your terminal
- **File Processing**: Process and analyze files with Claude
- **Code Generation**: Generate code based on natural language descriptions
- **Text Transformation**: Summarize, translate, or rewrite text
- **Shell Command Generation**: Generate shell commands from natural language descriptions
- **Context Awareness**: Claude remembers your conversation history for contextual responses
- **Markdown Rendering**: Beautiful rendering of Claude's responses in your terminal
- **Syntax Highlighting**: Code snippets are properly highlighted
- **Streaming Responses**: See Claude's responses as they're generated
- **Configuration Options**: Customize Claude's behavior to suit your needs

## Installation

### Using npm

```bash
npm install -g @relaycore/claude-cli
```

### Using yarn

```bash
yarn global add @relaycore/claude-cli
```

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/relaycore/claude-cli.git
   ```

2. Navigate to the directory:
   ```bash
   cd claude-cli
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Link the package:
   ```bash
   npm link
   ```

## Setup

After installation, you'll need to configure the plugin with your RelayCore API key:

```bash
claude config set api_key YOUR_API_KEY
```

If you're using a self-hosted RelayCore instance, you can configure the endpoint:

```bash
claude config set api_endpoint https://your-relaycore-instance.com/api
```

## Usage

### Interactive Chat

Start an interactive chat session with Claude:

```bash
claude chat
```

This will open an interactive session where you can have a conversation with Claude.

### One-off Queries

Ask Claude a question directly:

```bash
claude ask "What is the capital of France?"
```

### Processing Files

Process a file with Claude:

```bash
claude process document.txt
```

You can also specify a task:

```bash
claude process document.txt --task "Summarize this document"
```

### Code Generation

Generate code based on a description:

```bash
claude code "Create a Python function that calculates the Fibonacci sequence"
```

You can specify the programming language:

```bash
claude code "Create a function that calculates the Fibonacci sequence" --language javascript
```

### Shell Command Generation

Generate shell commands from natural language:

```bash
claude shell "Find all Python files modified in the last 7 days"
```

This will generate and display the appropriate shell command. You can execute it directly:

```bash
claude shell "Find all Python files modified in the last 7 days" --exec
```

### Text Transformation

Transform text in various ways:

```bash
# Summarize text
claude transform summarize document.txt

# Translate text
claude transform translate document.txt --to french

# Rewrite text
claude transform rewrite document.txt --style "professional"
```

## Command Reference

### Global Options

These options can be used with any command:

- `--help, -h`: Show help information
- `--version, -v`: Show version information
- `--model, -m`: Specify the Claude model to use (default: claude-2)
- `--temperature, -t`: Set the temperature (0.0-1.0) for response generation
- `--max-tokens, -mt`: Set the maximum number of tokens in the response
- `--api-key, -k`: Override the API key for this command
- `--api-endpoint, -e`: Override the API endpoint for this command
- `--verbose`: Enable verbose output for debugging

### Commands

#### `claude chat`

Start an interactive chat session with Claude.

Options:
- `--system, -s`: Set a system prompt for the conversation
- `--file, -f`: Include a file in the conversation
- `--no-streaming`: Disable streaming responses
- `--output, -o`: Save the conversation to a file

#### `claude ask`

Ask Claude a one-off question.

Usage:
```bash
claude ask <question>
```

Options:
- `--system, -s`: Set a system prompt for the question
- `--file, -f`: Include a file with the question
- `--output, -o`: Save the response to a file

#### `claude process`

Process a file with Claude.

Usage:
```bash
claude process <file>
```

Options:
- `--task, -t`: Specify the task to perform on the file
- `--output, -o`: Save the result to a file

#### `claude code`

Generate code based on a description.

Usage:
```bash
claude code <description>
```

Options:
- `--language, -l`: Specify the programming language
- `--output, -o`: Save the generated code to a file
- `--comments`: Include detailed comments in the generated code
- `--tests`: Generate tests for the code

#### `claude shell`

Generate shell commands from natural language.

Usage:
```bash
claude shell <description>
```

Options:
- `--exec, -x`: Execute the generated command
- `--confirm, -c`: Confirm before executing the command
- `--output, -o`: Save the command to a file

#### `claude transform`

Transform text in various ways.

Usage:
```bash
claude transform <type> <file>
```

Types:
- `summarize`: Create a summary of the text
- `translate`: Translate the text to another language
- `rewrite`: Rewrite the text in a different style
- `extract`: Extract specific information from the text
- `format`: Format the text (e.g., as JSON, CSV, etc.)

Options:
- `--to, -t`: Target language for translation
- `--style, -s`: Style for rewriting
- `--format, -f`: Format for extraction or formatting
- `--output, -o`: Save the transformed text to a file

#### `claude config`

Configure the Claude CLI.

Usage:
```bash
claude config <action> <key> [value]
```

Actions:
- `set`: Set a configuration value
- `get`: Get a configuration value
- `list`: List all configuration values
- `reset`: Reset a configuration value to default

Keys:
- `api_key`: Your RelayCore API key
- `api_endpoint`: The RelayCore API endpoint
- `model`: Default Claude model to use
- `temperature`: Default temperature setting
- `max_tokens`: Default maximum tokens setting

## Configuration

The Claude CLI stores its configuration in a JSON file at `~/.claude-cli/config.json`. You can edit this file directly or use the `claude config` command.

Default configuration:

```json
{
  "api_key": "",
  "api_endpoint": "https://api.relaycore.ai",
  "model": "claude-2",
  "temperature": 0.7,
  "max_tokens": 1000,
  "streaming": true,
  "history_size": 10
}
```

## Examples

### Interactive Chat Example

```
$ claude chat
🧠 Claude is ready. Type your message (or 'exit' to quit).

You: What are the main features of Python?
Claude: # Main Features of Python

Python is known for several key features that make it popular among developers:

1. **Readability and Simplicity**
   - Clean, readable syntax with significant whitespace
   - Minimalist design philosophy ("There should be one-- and preferably only one --obvious way to do it")

2. **Interpreted Language**
   - No compilation step required
   - Code executes line by line, making debugging easier

3. **Dynamically Typed**
   - No need to declare variable types
   - Types are determined at runtime

4. **Extensive Standard Library**
   - "Batteries included" philosophy
   - Libraries for file I/O, system calls, networking, etc.

5. **Rich Ecosystem of Third-Party Packages**
   - Over 300,000 packages on PyPI
   - Libraries for data science, web development, machine learning, etc.

6. **Cross-Platform**
   - Runs on Windows, macOS, Linux, and many other platforms
   - Write once, run anywhere capability

7. **Object-Oriented**
   - Everything is an object
   - Supports inheritance, encapsulation, and polymorphism

8. **Functional Programming Features**
   - First-class functions
   - Lambda expressions
   - List comprehensions
   - Map, filter, and reduce functions

9. **Extensibility**
   - Can be extended with C/C++ code for performance-critical sections
   - Supports embedding within applications

10. **Great for Beginners and Experts**
    - Low barrier to entry
    - Scales well to complex applications

Would you like me to elaborate on any of these features?

You: Tell me more about list comprehensions
Claude: # Python List Comprehensions

List comprehensions are one of Python's most distinctive and powerful features. They provide a concise way to create lists based on existing iterables (like lists, tuples, or strings).

## Basic Syntax

The basic syntax of a list comprehension is:

```python
[expression for item in iterable]
```

This creates a new list by evaluating the expression for each item in the iterable.

## Examples

### Simple list comprehension

```python
# Create a list of squares from 0 to 9
squares = [x**2 for x in range(10)]
# Result: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

### With conditional filtering

You can add an if clause to filter items:

```python
# Get only even squares
even_squares = [x**2 for x in range(10) if x % 2 == 0]
# Result: [0, 4, 16, 36, 64]
```

### With multiple conditions

```python
# Numbers divisible by 2 and 3
numbers = [x for x in range(30) if x % 2 == 0 if x % 3 == 0]
# Result: [0, 6, 12, 18, 24]
```

### With if-else conditions

```python
# Replace odd numbers with their negatives
numbers = [x if x % 2 == 0 else -x for x in range(10)]
# Result: [0, -1, 2, -3, 4, -5, 6, -7, 8, -9]
```

### Nested list comprehensions

```python
# Create a 3x3 matrix
matrix = [[i * 3 + j for j in range(3)] for i in range(3)]
# Result: [[0, 1, 2], [3, 4, 5], [6, 7, 8]]
```

## Advantages

1. **Conciseness**: Replaces multi-line for loops with a single line
2. **Readability**: Often more readable than equivalent loops (for simple cases)
3. **Performance**: Generally faster than building lists with for loops
4. **Expressiveness**: Communicates intent clearly

## When to Use

List comprehensions are ideal when:
- Creating a new list based on an existing iterable
- The operation is simple enough to express clearly in one line
- You need to apply a transformation and/or filter to each element

## When to Avoid

Consider using regular for loops when:
- The operation is complex
- The line would be very long
- Multiple operations need to be performed
- Readability would suffer

List comprehensions are a hallmark of Pythonic code when used appropriately!

You: exit
👋 Goodbye!
```

### Code Generation Example

```
$ claude code "Create a function to check if a string is a palindrome"
```

Response:
```python
def is_palindrome(string):
    """
    Check if a string is a palindrome.
    
    A palindrome is a string that reads the same forward and backward,
    ignoring case, punctuation, and spacing.
    
    Args:
        string (str): The string to check.
        
    Returns:
        bool: True if the string is a palindrome, False otherwise.
    """
    # Convert to lowercase and remove non-alphanumeric characters
    cleaned_string = ''.join(char.lower() for char in string if char.isalnum())
    
    # Check if the cleaned string equals its reverse
    return cleaned_string == cleaned_string[::-1]


# Example usage
if __name__ == "__main__":
    test_strings = [
        "racecar",
        "A man, a plan, a canal: Panama",
        "No 'x' in Nixon",
        "Not a palindrome",
        "12321",
        ""  # Edge case: empty string
    ]
    
    for s in test_strings:
        result = "is" if is_palindrome(s) else "is not"
        print(f'"{s}" {result} a palindrome')
```

### Shell Command Generation Example

```
$ claude shell "Find all Python files modified in the last week and count the lines of code"
```

Response:
```
Command:
find . -name "*.py" -type f -mtime -7 -exec wc -l {} \; | awk '{total += $1} END {print "Total lines:", total}'

Explanation:
- find . -name "*.py": Find all Python files in the current directory and subdirectories
- -type f: Only match files, not directories
- -mtime -7: Files modified in the last 7 days
- -exec wc -l {} \;: Execute the 'wc -l' command on each file to count lines
- awk '{total += $1} END {print "Total lines:", total}': Sum up all the line counts and print the total

To execute this command, run:
claude shell "Find all Python files modified in the last week and count the lines of code" --exec
```

## Troubleshooting

### Common Issues

- **Authentication Failed**: Verify your API key with `claude config get api_key`
- **Request Timeout**: Try reducing the complexity of your request
- **Rate Limiting**: You may have exceeded your API usage limits
- **Command Not Found**: Ensure the package is properly installed and in your PATH

### Debug Mode

Run any command with the `--verbose` flag to see detailed debug information:

```bash
claude ask "What is the capital of France?" --verbose
```

## Support

If you encounter any issues or have questions about the RelayCore Claude CLI plugin, please:

- Check the [FAQ](https://docs.relaycore.ai/plugins/claude-cli/faq)
- Join our [Discord community](https://discord.gg/relaycore)
- Open an issue on our [GitHub repository](https://github.com/relaycore/claude-cli/issues)
- Contact support at support@relaycore.ai

## Privacy and Security

The RelayCore Claude CLI plugin sends your queries and context to the RelayCore API for processing. We take privacy and security seriously:

- All data is encrypted in transit
- We do not store your conversations permanently
- You can use a self-hosted RelayCore instance for complete data control

For more information, see our [Privacy Policy](https://relaycore.ai/privacy).