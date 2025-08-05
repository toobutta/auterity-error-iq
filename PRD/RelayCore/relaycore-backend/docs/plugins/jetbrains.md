# RelayCore JetBrains IDE Plugin

The RelayCore JetBrains IDE plugin brings the power of AI directly into your favorite JetBrains IDEs, including IntelliJ IDEA, PyCharm, WebStorm, and more. Enhance your development workflow with intelligent code assistance, generation, and optimization.

## Supported IDEs

- IntelliJ IDEA
- PyCharm
- WebStorm
- PhpStorm
- Rider
- CLion
- GoLand
- RubyMine
- AppCode
- DataGrip
- Android Studio

## Features

- **Code Explanation**: Get detailed explanations of selected code
- **Code Generation**: Generate code based on natural language descriptions
- **Code Completion**: Get intelligent code completions as you type
- **Code Optimization**: Optimize your code for performance, readability, or memory usage
- **Documentation Generation**: Automatically generate documentation for your code
- **Bug Detection**: Identify potential bugs and security issues in your code
- **Refactoring Assistance**: Get AI-powered suggestions for refactoring code
- **Test Generation**: Automatically generate unit tests for your code
- **Natural Language Queries**: Ask questions about your codebase in natural language
- **Contextual Assistance**: Get AI assistance that understands your project context
- **Custom Commands**: Create custom AI commands tailored to your workflow

## Installation

### From JetBrains Marketplace

1. Open your JetBrains IDE
2. Go to Settings/Preferences > Plugins
3. Click on "Marketplace" tab
4. Search for "RelayCore"
5. Click "Install"
6. Restart your IDE when prompted

### Manual Installation

1. Download the plugin ZIP file from the [releases page](https://github.com/relaycore/jetbrains-plugin/releases)
2. Open your JetBrains IDE
3. Go to Settings/Preferences > Plugins
4. Click the gear icon and select "Install Plugin from Disk..."
5. Choose the downloaded ZIP file
6. Restart your IDE when prompted

## Setup

After installation, you'll need to configure the plugin with your RelayCore API key:

1. Go to Settings/Preferences > Tools > RelayCore
2. Enter your API key in the "API Key" field
3. (Optional) Configure the RelayCore endpoint if you're using a self-hosted instance
4. Click "Apply" and then "OK"

## Usage

### Code Explanation

1. Select the code you want to explain
2. Right-click and select "RelayCore > Explain Code" or use the keyboard shortcut `Alt+Shift+E` (`Option+Shift+E` on macOS)
3. The explanation will appear in the RelayCore tool window

### Code Generation

1. Place your cursor where you want to insert code
2. Right-click and select "RelayCore > Generate Code" or use the keyboard shortcut `Alt+Shift+G` (`Option+Shift+G` on macOS)
3. Enter a description of the code you want to generate
4. The generated code will be inserted at the cursor position

### Code Completion

1. Start typing code as usual
2. The plugin will provide AI-powered completions in addition to the IDE's built-in completions
3. Press `Tab` to accept a completion

### Code Optimization

1. Select the code you want to optimize
2. Right-click and select "RelayCore > Optimize Code" or use the keyboard shortcut `Alt+Shift+O` (`Option+Shift+O` on macOS)
3. Choose the optimization target (performance, readability, or memory)
4. The optimized code will be shown in a diff view

### Documentation Generation

1. Select the code you want to document
2. Right-click and select "RelayCore > Generate Documentation" or use the keyboard shortcut `Alt+Shift+D` (`Option+Shift+D` on macOS)
3. Choose the documentation style (JavaDoc, DocString, etc.)
4. The documentation will be inserted above the selected code

### Test Generation

1. Select the code you want to test
2. Right-click and select "RelayCore > Generate Tests" or use the keyboard shortcut `Alt+Shift+T` (`Option+Shift+T` on macOS)
3. Choose the testing framework
4. The generated tests will be shown in a new file

### Natural Language Queries

1. Open the RelayCore tool window by clicking on the RelayCore icon in the toolbar or using the keyboard shortcut `Alt+Shift+R` (`Option+Shift+R` on macOS)
2. Enter your question in the input field
3. Press Enter to submit your question
4. The answer will appear in the tool window

## Tool Window

The RelayCore tool window provides a central interface for interacting with the plugin:

1. Open the tool window by clicking on the RelayCore icon in the toolbar or using the keyboard shortcut `Alt+Shift+R` (`Option+Shift+R` on macOS)
2. The tool window has several tabs:
   - **Chat**: Have a conversation with the AI about your code
   - **Explain**: Get explanations of selected code
   - **Generate**: Generate code from descriptions
   - **Optimize**: Optimize selected code
   - **Document**: Generate documentation for selected code
   - **Test**: Generate tests for selected code
   - **Settings**: Configure the plugin

## Custom Commands

You can create custom AI commands tailored to your workflow:

1. Go to Settings/Preferences > Tools > RelayCore > Custom Commands
2. Click "Add" to create a new command
3. Enter a name for your command
4. Define the prompt template
5. (Optional) Add parameters to your command
6. Click "OK" to save the command

Your custom command will now be available in the RelayCore menu and tool window.

## Configuration Options

The RelayCore JetBrains plugin offers several configuration options:

- **API Key**: Your RelayCore API key
- **Endpoint**: The RelayCore API endpoint (default: `https://api.relaycore.ai`)
- **Model**: The AI model to use (default: `gpt-4`)
- **Temperature**: The creativity level of the AI (0.0-1.0)
- **Max Tokens**: Maximum response length
- **Context Size**: How much project context to include in requests
- **Code Style**: Your preferred coding style for generated code
- **Documentation Style**: Your preferred documentation style
- **Auto-Completion**: Enable/disable AI-powered code completion
- **Inline Suggestions**: Enable/disable inline code suggestions
- **Keyboard Shortcuts**: Customize keyboard shortcuts for plugin actions

## Keyboard Shortcuts

| Feature | Windows/Linux | macOS |
|---------|--------------|-------|
| Open Tool Window | `Alt+Shift+R` | `Option+Shift+R` |
| Explain Code | `Alt+Shift+E` | `Option+Shift+E` |
| Generate Code | `Alt+Shift+G` | `Option+Shift+G` |
| Optimize Code | `Alt+Shift+O` | `Option+Shift+O` |
| Generate Documentation | `Alt+Shift+D` | `Option+Shift+D` |
| Generate Tests | `Alt+Shift+T` | `Option+Shift+T` |
| Accept Completion | `Tab` | `Tab` |

You can customize these shortcuts in Settings/Preferences > Keymap > RelayCore.

## Examples

### Code Explanation Example

Selected code:
```java
public class Singleton {
    private static Singleton instance;
    
    private Singleton() {}
    
    public static synchronized Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

Explanation:
```
This code implements the Singleton design pattern in Java, which ensures that a class has only one instance and provides a global point of access to it.

Key components:
1. Private static variable 'instance' that holds the single instance of the class
2. Private constructor to prevent instantiation from outside the class
3. Public static method 'getInstance()' that creates a new instance if one doesn't exist, or returns the existing instance

The 'synchronized' keyword ensures thread safety by preventing multiple threads from creating multiple instances simultaneously. However, this implementation has a performance overhead due to synchronization on every call to getInstance().

This is known as a "lazy initialization" Singleton because the instance is created only when first requested, rather than at class loading time.

Alternative implementations could use:
- Double-checked locking (for better performance)
- Initialization-on-demand holder idiom (for thread safety without synchronization)
- Enum-based Singleton (for serialization safety)
```

### Code Generation Example

Prompt:
```
Create a REST API endpoint in Spring Boot that retrieves a list of products with pagination and filtering by category
```

Generated code:
```java
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import java.util.Optional;

@Entity
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private Double price;
    private String category;
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}

interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("SELECT p FROM Product p WHERE (:category IS NULL OR p.category = :category)")
    Page<Product> findByCategory(@Param("category") Optional<String> category, Pageable pageable);
}

@RestController
@RequestMapping("/api/products")
public class ProductController {
    
    private final ProductRepository productRepository;
    
    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }
    
    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(required = false) Optional<String> category,
            Pageable pageable) {
        
        Page<Product> products = productRepository.findByCategory(category, pageable);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
```

## Troubleshooting

### Common Issues

- **Authentication Failed**: Verify your API key in the settings
- **Plugin Not Responding**: Try restarting your IDE
- **Request Timeout**: Try reducing the context size or splitting your request into smaller chunks
- **Rate Limiting**: You may have exceeded your API usage limits
- **IDE Performance Issues**: Try disabling auto-completion or inline suggestions

### Logs

To access the plugin logs:

1. Go to Help > Show Log in Explorer/Finder
2. Look for the `idea.log` file
3. Search for "RelayCore" to find relevant log entries

Alternatively, you can enable debug logging:

1. Go to Help > Diagnostic Tools > Debug Log Settings
2. Add `#com.relaycore.jetbrains` to the list
3. Click "OK"
4. Restart your IDE

## Support

If you encounter any issues or have questions about the RelayCore JetBrains plugin, please:

- Check the [FAQ](https://docs.relaycore.ai/plugins/jetbrains/faq)
- Join our [Discord community](https://discord.gg/relaycore)
- Open an issue on our [GitHub repository](https://github.com/relaycore/jetbrains-plugin/issues)
- Contact support at support@relaycore.ai

## Privacy and Security

The RelayCore JetBrains plugin sends code snippets and context to the RelayCore API for processing. We take privacy and security seriously:

- All data is encrypted in transit
- We do not store your code permanently
- You can configure how much context is sent with each request
- You can use a self-hosted RelayCore instance for complete data control

For more information, see our [Privacy Policy](https://relaycore.ai/privacy).