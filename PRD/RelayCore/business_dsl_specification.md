# Business DSL Specification

## 1. Overview

The Business DSL (Domain Specific Language) is a high-level language designed to make the Lisp interpreter accessible to business users without requiring knowledge of Lisp syntax. It provides a simplified, intuitive syntax that compiles to Lisp code, enabling users to create complex agent behaviors, routing logic, and workflows without deep programming expertise.

## 2. Design Principles

1. **Readability**: Syntax should be clear and self-explanatory
2. **Simplicity**: Minimize special characters and complex constructs
3. **Familiarity**: Use patterns familiar to business users
4. **Safety**: Prevent common errors through syntax design
5. **Expressiveness**: Enable complex logic despite simplified syntax
6. **Extensibility**: Allow for growth and customization

## 3. Language Structure

### 3.1 Basic Syntax

```
// Comments start with double slash

// Block structure uses indentation and end keywords
when condition
  action1
  action2
end

// Variables don't require declaration
set variable_name = value

// Function calls use natural language style
call function_name with parameter1, parameter2

// Conditions use natural language comparisons
if value is greater than 10
  action
end
```

### 3.2 Data Types

| Type | Example | Description |
|------|---------|-------------|
| Text | "hello" | Text strings in double quotes |
| Number | 42, 3.14 | Integers and decimal numbers |
| Boolean | true, false | Boolean values |
| List | [1, 2, 3] | Ordered collections of items |
| Map | {key: value} | Key-value pairs |
| Null | null | Absence of a value |

### 3.3 Variables and Access Paths

```
// Variable assignment
set customer_name = "John"

// Object property access using dot notation
set email = customer.contact.email

// List access using brackets
set first_item = items[0]

// Nested access
set manager_email = employee.department.manager.email
```

### 3.4 Control Structures

#### Conditionals

```
if condition
  action1
  action2
else if another_condition
  action3
else
  action4
end
```

#### Loops

```
// For each item in a list
for each item in items
  process item
end

// While loop
while condition
  action
end

// Repeat fixed number of times
repeat 5 times
  action
end
```

#### Pattern Matching

```
match value
  case "option1"
    action1
  case "option2"
    action2
  default
    default_action
end
```

### 3.5 Functions

```
// Define a function
define function calculate_total with parameters price, quantity
  set subtotal = price * quantity
  set tax = subtotal * 0.08
  return subtotal + tax
end

// Call a function
set total = calculate_total with 10.99, 5
```

### 3.6 Error Handling

```
try
  risky_operation
catch error_type
  handle_error
finally
  cleanup
end
```

## 4. Domain-Specific Constructs

### 4.1 Request Handling

```
// Route based on content
when request contains "code" or request contains "programming"
  use model "gpt-4"
end

// Transform request
transform request
  add system_prompt = "You are a helpful assistant."
  set max_tokens = 1000
end

// Reject request
when request contains prohibited_words
  reject with message "Content not allowed" and status 403
end
```

### 4.2 Agent Coordination

```
// Define a workflow
workflow "research_and_summarize"
  // Define workflow steps
  step "research"
    // Specify agent to use
    agent "researcher"
    // Define input parameters
    input
      topic: request.topic
      depth: "comprehensive"
    end
    // Store output in memory
    output to memory "research_results"
  end
  
  step "summarize"
    agent "writer"
    input
      content: memory.research_results
      style: "concise"
      max_length: 500
    end
    output to response
  end
end

// Execute a workflow
execute workflow "research_and_summarize" with
  topic: "Artificial Intelligence trends"
end
```

### 4.3 Model Selection

```
// Dynamic model selection
select model
  when user.tier is "premium"
    use "gpt-4"
  when token_count > 2000
    use "claude-instant"
  otherwise
    use "gpt-3.5-turbo"
end

// Fallback strategy
fallback strategy
  try
    use model "gpt-4" with timeout 5 seconds
  catch "timeout"
    use model "claude-instant"
  catch "error"
    use model "gpt-3.5-turbo"
    if fails
      apologize to user
    end
  end
end
```

### 4.4 Memory Operations

```
// Store in memory
store in memory "key" value

// Retrieve from memory
set data = get from memory "key"

// Check if memory exists
if memory has "key"
  use memory "key"
end

// Remove from memory
remove from memory "key"
```

### 4.5 Cost Management

```
// Set budget constraints
set budget limit 10 dollars

// Check cost before operation
if estimated_cost of operation > 2 dollars
  use cheaper alternative
end

// Track costs
track cost of operation as "research_phase"
```

## 5. Integration with Lisp

### 5.1 Compilation Process

The Business DSL is compiled to Lisp code through a multi-stage process:

1. **Lexical Analysis**: Convert DSL text into tokens
2. **Parsing**: Build an abstract syntax tree (AST)
3. **Semantic Analysis**: Validate the AST
4. **Code Generation**: Convert the AST to Lisp code
5. **Optimization**: Optimize the generated Lisp code

### 5.2 Mapping Examples

#### Example 1: Conditional Logic

**Business DSL:**
```
if customer.tier is "premium" and customer.spending > 1000
  apply discount 15%
else if customer.tier is "standard"
  apply discount 5%
end
```

**Compiled Lisp:**
```lisp
(if (and (= customer.tier "premium")
         (> customer.spending 1000))
  (apply-discount 0.15)
  (if (= customer.tier "standard")
    (apply-discount 0.05)))
```

#### Example 2: Workflow Definition

**Business DSL:**
```
workflow "process_order"
  step "validate"
    agent "validator"
    input
      order: request.order
    end
    output to memory "validation_result"
    
    on success
      proceed to "process_payment"
    on failure
      proceed to "handle_error"
    end
  end
  
  step "process_payment"
    agent "payment_processor"
    input
      order: request.order
      validation: memory.validation_result
    end
    output to memory "payment_result"
  end
  
  step "handle_error"
    agent "customer_service"
    input
      error: memory.validation_result
      customer: request.order.customer
    end
    output to response
  end
end
```

**Compiled Lisp:**
```lisp
(define-workflow "process_order"
  (define-step "validate"
    (invoke-agent "validator"
      (hash-map "order" request.order))
    (store-memory "validation_result" result)
    
    (on-success
      (goto-step "process_payment"))
    (on-failure
      (goto-step "handle_error")))
  
  (define-step "process_payment"
    (invoke-agent "payment_processor"
      (hash-map 
        "order" request.order
        "validation" (get-memory "validation_result")))
    (store-memory "payment_result" result))
  
  (define-step "handle_error"
    (invoke-agent "customer_service"
      (hash-map
        "error" (get-memory "validation_result")
        "customer" request.order.customer))
    (set-response result)))
```

#### Example 3: Dynamic Routing

**Business DSL:**
```
when request.type is "image_generation"
  select model
    when request.style is "photorealistic"
      use "dall-e-3"
    when request.style is "artistic"
      use "midjourney"
    otherwise
      use "stable-diffusion"
  end
end
```

**Compiled Lisp:**
```lisp
(when (= request.type "image_generation")
  (cond
    ((= request.style "photorealistic")
     (set-model "dall-e-3"))
    ((= request.style "artistic")
     (set-model "midjourney"))
    (else
     (set-model "stable-diffusion"))))
```

## 6. Development Environment

### 6.1 DSL Editor

The Business DSL will be supported by a dedicated editor with the following features:

1. **Syntax Highlighting**: Color-coding for different language elements
2. **Auto-completion**: Suggestions for commands, variables, and functions
3. **Error Checking**: Real-time validation and error highlighting
4. **Code Snippets**: Pre-defined templates for common patterns
5. **Documentation**: Inline help and documentation
6. **Visual Mode**: Optional block-based visual programming interface

### 6.2 Testing Tools

1. **Interactive Console**: Test DSL code interactively
2. **Debugger**: Step through DSL code execution
3. **Visualizer**: Visualize DSL code execution flow
4. **Test Cases**: Define and run test cases for DSL code
5. **Performance Profiler**: Analyze DSL code performance

### 6.3 Integration Tools

1. **Version Control**: Integration with Git for DSL code versioning
2. **Deployment**: Tools for deploying DSL code to production
3. **Collaboration**: Shared editing and commenting
4. **Import/Export**: Tools for importing and exporting DSL code
5. **Migration**: Tools for migrating from other systems

## 7. Standard Library

### 7.1 Text Processing

```
// String operations
set uppercase = convert text to uppercase
set lowercase = convert text to lowercase
set trimmed = trim whitespace from text
set contains_substring = text contains "substring"
set replaced = replace "old" with "new" in text
set extracted = extract pattern "[0-9]+" from text
```

### 7.2 List Operations

```
// List operations
set first_item = first item in list
set last_item = last item in list
set item_at_index = item at index 2 in list
set filtered = filter list where item > 10
set mapped = transform list with item * 2
set sorted = sort list in ascending order
set combined = combine list1 and list2
```

### 7.3 Math Operations

```
// Math operations
set sum = 10 + 5
set product = 10 * 5
set quotient = 10 / 5
set remainder = 10 % 3
set rounded = round 3.14159 to 2 decimal places
set random_number = random number between 1 and 10
```

### 7.4 Date and Time

```
// Date and time operations
set current_time = current time
set tomorrow = current date plus 1 day
set difference = time between date1 and date2
set formatted_date = format date as "YYYY-MM-DD"
set is_before = date1 is before date2
set day_of_week = get day of week from date
```

### 7.5 HTTP Operations

```
// HTTP operations
set response = http get from "https://api.example.com/data"
set post_result = http post to "https://api.example.com/data" with payload
set headers = get headers from response
set status = get status from response
set json_data = parse json from response
```

## 8. Extension Mechanisms

### 8.1 Custom Functions

```
// Define a custom function
define function calculate_discount with parameters price, tier
  if tier is "premium"
    return price * 0.15
  else if tier is "standard"
    return price * 0.05
  else
    return 0
  end
end

// Use the custom function
set discount = calculate_discount with 100, customer.tier
```

### 8.2 Custom Blocks

```
// Define a custom block
define block validate_customer
  if customer.email is empty
    add error "Email is required"
  end
  
  if customer.age < 18
    add error "Must be 18 or older"
  end
  
  return has no errors
end

// Use the custom block
if validate_customer
  proceed with order
else
  reject order
end
```

### 8.3 Libraries

```
// Import a library
import "payment_processing"

// Use functions from the library
set payment_result = payment_processing.process_payment with
  amount: order.total,
  card: customer.payment_method
end
```

### 8.4 Integration with External Systems

```
// Connect to external system
connect to "salesforce" as sf

// Use the connection
set customer_data = sf.query "SELECT * FROM Customer WHERE Id = {customer_id}"
```

## 9. Security and Sandboxing

### 9.1 Security Features

1. **Resource Limits**: Constraints on memory, CPU, and execution time
2. **Access Control**: Restrictions on accessible resources and operations
3. **Input Validation**: Validation of all inputs to prevent injection attacks
4. **Audit Logging**: Comprehensive logging of all operations
5. **Versioning**: Tracking of all changes to DSL code

### 9.2 Sandboxing

1. **Isolation**: Execution in isolated environments
2. **Resource Monitoring**: Real-time monitoring of resource usage
3. **Timeout Enforcement**: Automatic termination of long-running operations
4. **Error Containment**: Prevention of error propagation
5. **Rate Limiting**: Limits on operation frequency

## 10. Implementation Roadmap

### 10.1 Phase 1: Core Language (Weeks 17-18)
- Implement basic syntax and parsing
- Develop core language constructs
- Create Lisp code generator
- Implement basic standard library
- Develop simple editor

### 10.2 Phase 2: Domain-Specific Features (Weeks 19-20)
- Implement request handling constructs
- Develop agent coordination features
- Create model selection logic
- Implement memory operations
- Develop cost management features

### 10.3 Phase 3: Development Environment (Weeks 21-22)
- Enhance editor with advanced features
- Implement testing tools
- Develop debugging capabilities
- Create visualization tools
- Implement deployment tools

### 10.4 Phase 4: Integration and Security (Weeks 23-24)
- Implement security features
- Develop sandboxing capabilities
- Create integration with RelayCore and Auterity
- Implement audit logging
- Develop monitoring tools

## 11. Examples

### 11.1 Customer Support Workflow

```
workflow "handle_customer_inquiry"
  step "classify_inquiry"
    agent "classifier"
    input
      message: request.message
    end
    output to memory "classification"
  end
  
  step "route_inquiry"
    when memory.classification.type is "billing"
      proceed to "handle_billing"
    when memory.classification.type is "technical"
      proceed to "handle_technical"
    when memory.classification.type is "general"
      proceed to "handle_general"
    otherwise
      proceed to "handle_unknown"
    end
  end
  
  step "handle_billing"
    agent "billing_specialist"
    input
      inquiry: request.message
      customer: request.customer
      account: get_customer_account(request.customer.id)
    end
    output to response
  end
  
  step "handle_technical"
    agent "technical_support"
    input
      inquiry: request.message
      customer: request.customer
      product: get_customer_products(request.customer.id)
    end
    output to response
  end
  
  step "handle_general"
    agent "general_support"
    input
      inquiry: request.message
      customer: request.customer
    end
    output to response
  end
  
  step "handle_unknown"
    agent "customer_service_manager"
    input
      inquiry: request.message
      customer: request.customer
      classification: memory.classification
    end
    output to response
  end
end
```

### 11.2 Dynamic Content Generation

```
workflow "generate_personalized_content"
  step "analyze_user"
    agent "user_analyzer"
    input
      user_profile: request.user
      interaction_history: get_user_interactions(request.user.id)
    end
    output to memory "user_analysis"
  end
  
  step "select_content_strategy"
    select model
      when memory.user_analysis.engagement_level is "high"
        use "gpt-4"
      otherwise
        use "gpt-3.5-turbo"
    end
    
    agent "content_strategist"
    input
      user_analysis: memory.user_analysis
      content_type: request.content_type
    end
    output to memory "content_strategy"
  end
  
  step "generate_content"
    agent "content_generator"
    input
      strategy: memory.content_strategy
      user_preferences: memory.user_analysis.preferences
      topic: request.topic
    end
    output to memory "content"
  end
  
  step "review_content"
    agent "content_reviewer"
    input
      content: memory.content
      brand_guidelines: get_brand_guidelines()
      compliance_rules: get_compliance_rules()
    end
    
    when result.approved is true
      proceed to "deliver_content"
    otherwise
      proceed to "revise_content"
    end
  end
  
  step "revise_content"
    agent "content_reviser"
    input
      original_content: memory.content
      review_feedback: result
      strategy: memory.content_strategy
    end
    output to memory "revised_content"
    proceed to "deliver_content"
  end
  
  step "deliver_content"
    set final_content = memory has "revised_content" ? memory.revised_content : memory.content
    
    format content
      when request.format is "html"
        format as html
      when request.format is "markdown"
        format as markdown
      when request.format is "plain"
        format as plain text
    end
    
    output to response
  end
end
```

### 11.3 Advanced Routing Logic

```
// Define routing strategy
define function select_optimal_model with parameters request, user
  // Check for premium tier
  if user.tier is "premium"
    // For premium users, use high-quality models
    when request contains code_patterns
      return "gpt-4"
    when request.token_count > 2000
      return "claude-3-opus"
    otherwise
      return "gpt-4-turbo"
    end
  end
  
  // Check for standard tier
  if user.tier is "standard"
    // For standard users, balance quality and cost
    when request contains code_patterns
      return "gpt-4-turbo"
    when request.token_count > 2000
      return "claude-instant"
    otherwise
      return "gpt-3.5-turbo"
    end
  end
  
  // For free tier, optimize for cost
  when request.token_count > 1000
    return "gpt-3.5-turbo"
  otherwise
    return "llama-3"
  end
end

// Use the routing strategy
set selected_model = select_optimal_model with request, user

// Apply the model with appropriate parameters
use model selected_model with
  temperature: 0.7,
  max_tokens: calculate_max_tokens(request, selected_model)
end
```

## 12. Conclusion

The Business DSL provides a powerful yet accessible way for business users to define complex agent behaviors, routing logic, and workflows without requiring deep programming expertise. By compiling to Lisp code, it combines the simplicity of a high-level language with the power and flexibility of Lisp, enabling users to create sophisticated AI orchestration logic while maintaining readability and maintainability.

The DSL is designed to be extensible, allowing for the addition of new constructs and features as requirements evolve. It also integrates seamlessly with the other components of the RelayCore and Auterity integration, providing a unified approach to AI orchestration that meets the needs of users with varying technical expertise.