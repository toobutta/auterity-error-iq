# RelayCore LangChain Integration

The RelayCore LangChain integration allows you to use RelayCore's optimized AI routing, caching, and management capabilities with the popular LangChain framework for building AI applications.

## Features

- **Optimized Model Access**: Route requests to the most appropriate AI model based on your requirements
- **Semantic Caching**: Reduce costs and latency with intelligent caching of similar requests
- **Token Optimization**: Automatically optimize prompts to reduce token usage
- **Cost Management**: Track and manage AI usage costs across your LangChain applications
- **Context Management**: Efficiently handle context windows for complex chains
- **Streaming Support**: Stream responses for better user experience
- **Multi-Model Support**: Seamlessly use multiple AI models in your chains
- **Observability**: Monitor and debug your LangChain applications

## Installation

### Using pip

```bash
pip install relaycore-langchain
```

### Using conda

```bash
conda install -c relaycore relaycore-langchain
```

## Setup

After installation, you'll need to configure the integration with your RelayCore API key:

```python
import os
from relaycore.langchain import RelayCoreLLM

# Set your API key
os.environ["RELAYCORE_API_KEY"] = "your-api-key-here"

# Or pass it directly
llm = RelayCoreLLM(api_key="your-api-key-here")
```

If you're using a self-hosted RelayCore instance, you can configure the endpoint:

```python
llm = RelayCoreLLM(
    api_key="your-api-key-here",
    api_base="https://your-relaycore-instance.com/api"
)
```

## Usage

### Basic Usage

```python
from relaycore.langchain import RelayCoreLLM

# Initialize the LLM
llm = RelayCoreLLM(model="gpt-4")

# Generate text
response = llm.generate("Explain quantum computing in simple terms")
print(response)
```

### Using with LangChain

```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from relaycore.langchain import RelayCoreLLM

# Initialize the LLM
llm = RelayCoreLLM(model="gpt-4")

# Create a prompt template
prompt = PromptTemplate(
    input_variables=["topic"],
    template="Explain {topic} in simple terms a 10-year-old would understand."
)

# Create a chain
chain = LLMChain(llm=llm, prompt=prompt)

# Run the chain
response = chain.run(topic="quantum computing")
print(response)
```

### Chat Models

```python
from relaycore.langchain import RelayCoreChat
from langchain.schema import HumanMessage, SystemMessage

# Initialize the chat model
chat = RelayCoreChat(model="claude-2")

# Create messages
messages = [
    SystemMessage(content="You are a helpful assistant that explains complex topics simply."),
    HumanMessage(content="Explain quantum computing to me.")
]

# Generate response
response = chat(messages)
print(response.content)
```

### Streaming Responses

```python
from relaycore.langchain import RelayCoreLLM

# Initialize the LLM with streaming
llm = RelayCoreLLM(model="gpt-4", streaming=True)

# Generate with streaming
for chunk in llm.stream("Write a short poem about programming"):
    print(chunk, end="", flush=True)
```

### Model Selection

RelayCore can automatically select the most appropriate model based on your requirements:

```python
from relaycore.langchain import RelayCoreLLM

# Let RelayCore choose the best model based on the task
llm = RelayCoreLLM(auto_select_model=True)

# For complex reasoning
response = llm.generate("Explain the implications of the P vs NP problem in computer science")

# For simple tasks (RelayCore might use a faster, cheaper model)
response = llm.generate("What's the capital of France?")
```

### Semantic Caching

RelayCore provides semantic caching to avoid redundant API calls for similar queries:

```python
from relaycore.langchain import RelayCoreLLM

# Enable semantic caching
llm = RelayCoreLLM(
    model="gpt-4",
    cache=True,
    cache_similarity_threshold=0.85  # Customize similarity threshold
)

# First call will hit the API
response1 = llm.generate("What are the main features of Python?")

# This similar query will use the cached response
response2 = llm.generate("Tell me about the key features of Python")
```

### Token Optimization

RelayCore can automatically optimize your prompts to reduce token usage:

```python
from relaycore.langchain import RelayCoreLLM

# Enable token optimization
llm = RelayCoreLLM(
    model="gpt-4",
    optimize_tokens=True,
    optimization_level="high"  # Options: "low", "medium", "high"
)

# RelayCore will optimize the prompt before sending to the API
response = llm.generate("Summarize the following article: " + long_article)
```

## API Reference

### RelayCoreLLM

The main class for text generation models.

```python
RelayCoreLLM(
    model: str = "gpt-4",                  # Model to use
    api_key: Optional[str] = None,         # RelayCore API key
    api_base: str = "https://api.relaycore.ai",  # API endpoint
    temperature: float = 0.7,              # Temperature for generation
    max_tokens: Optional[int] = None,      # Maximum tokens to generate
    streaming: bool = False,               # Whether to stream responses
    cache: bool = True,                    # Whether to use caching
    cache_similarity_threshold: float = 0.85,  # Similarity threshold for cache hits
    optimize_tokens: bool = False,         # Whether to optimize tokens
    optimization_level: str = "medium",    # Token optimization level
    auto_select_model: bool = False,       # Whether to auto-select model
    track_costs: bool = True,              # Whether to track costs
    timeout: Optional[float] = None,       # Request timeout in seconds
    **kwargs                               # Additional parameters
)
```

#### Methods

- `generate(prompt: str) -> str`: Generate text from a prompt
- `stream(prompt: str) -> Iterator[str]`: Stream text generation
- `get_num_tokens(text: str) -> int`: Get the number of tokens in text
- `get_usage_stats() -> dict`: Get usage statistics

### RelayCoreChat

Class for chat-based models.

```python
RelayCoreChat(
    model: str = "claude-2",               # Model to use
    api_key: Optional[str] = None,         # RelayCore API key
    api_base: str = "https://api.relaycore.ai",  # API endpoint
    temperature: float = 0.7,              # Temperature for generation
    max_tokens: Optional[int] = None,      # Maximum tokens to generate
    streaming: bool = False,               # Whether to stream responses
    cache: bool = True,                    # Whether to use caching
    cache_similarity_threshold: float = 0.85,  # Similarity threshold for cache hits
    optimize_tokens: bool = False,         # Whether to optimize tokens
    optimization_level: str = "medium",    # Token optimization level
    auto_select_model: bool = False,       # Whether to auto-select model
    track_costs: bool = True,              # Whether to track costs
    timeout: Optional[float] = None,       # Request timeout in seconds
    **kwargs                               # Additional parameters
)
```

#### Methods

- `__call__(messages: List[BaseMessage]) -> BaseMessage`: Generate a response from messages
- `stream(messages: List[BaseMessage]) -> Iterator[BaseMessage]`: Stream chat responses
- `get_num_tokens_from_messages(messages: List[BaseMessage]) -> int`: Get token count from messages
- `get_usage_stats() -> dict`: Get usage statistics

### RelayCoreChatMemory

Enhanced memory class for efficient context management.

```python
RelayCoreChatMemory(
    memory_key: str = "chat_history",      # Key to store memory
    return_messages: bool = False,         # Whether to return messages or a string
    output_key: Optional[str] = None,      # Key for output
    input_key: Optional[str] = None,       # Key for input
    human_prefix: str = "Human",           # Prefix for human messages
    ai_prefix: str = "AI",                 # Prefix for AI messages
    optimize_context: bool = False,        # Whether to optimize context
    max_token_limit: Optional[int] = None, # Maximum token limit
    **kwargs                               # Additional parameters
)
```

## Advanced Usage

### Custom Routing Rules

You can define custom routing rules for different types of queries:

```python
from relaycore.langchain import RelayCoreLLM, RoutingRule

# Define routing rules
rules = [
    RoutingRule(
        pattern="summarize|summary|summarization",
        model="claude-instant",
        temperature=0.3
    ),
    RoutingRule(
        pattern="creative|story|poem|imagine",
        model="gpt-4",
        temperature=0.9
    ),
    RoutingRule(
        pattern="code|function|algorithm|program",
        model="gpt-4",
        temperature=0.2
    )
]

# Initialize with routing rules
llm = RelayCoreLLM(routing_rules=rules, default_model="gpt-3.5-turbo")

# This will use claude-instant
response1 = llm.generate("Summarize this article for me...")

# This will use gpt-4 with high temperature
response2 = llm.generate("Write a creative story about a robot...")

# This will use gpt-4 with low temperature
response3 = llm.generate("Write a function to calculate prime numbers...")

# This will use the default model (gpt-3.5-turbo)
response4 = llm.generate("What's the weather like today?")
```

### Cost Management

Track and manage costs across your application:

```python
from relaycore.langchain import RelayCoreLLM, cost_manager

# Initialize the LLM with cost tracking
llm = RelayCoreLLM(model="gpt-4", track_costs=True)

# Generate some responses
llm.generate("Tell me about quantum computing")
llm.generate("Write a short story about robots")

# Get cost statistics
stats = cost_manager.get_stats()
print(f"Total cost: ${stats['total_cost']:.4f}")
print(f"Total tokens: {stats['total_tokens']}")
print(f"Requests: {stats['total_requests']}")

# Get detailed breakdown
breakdown = cost_manager.get_model_breakdown()
for model, data in breakdown.items():
    print(f"{model}: ${data['cost']:.4f} ({data['requests']} requests)")

# Reset statistics
cost_manager.reset_stats()
```

### Hybrid Chains

Combine multiple models in a single chain for cost efficiency:

```python
from langchain.chains import SequentialChain
from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from relaycore.langchain import RelayCoreLLM

# Create a chain with a cheaper model for initial processing
summarizer = RelayCoreLLM(model="gpt-3.5-turbo")
summarize_prompt = PromptTemplate(
    input_variables=["text"],
    template="Summarize the main points from this text:\n\n{text}"
)
summarize_chain = LLMChain(
    llm=summarizer,
    prompt=summarize_prompt,
    output_key="summary"
)

# Use a more powerful model for analysis
analyzer = RelayCoreLLM(model="gpt-4")
analyze_prompt = PromptTemplate(
    input_variables=["summary"],
    template="Provide a detailed analysis of these points:\n\n{summary}"
)
analyze_chain = LLMChain(
    llm=analyzer,
    prompt=analyze_prompt,
    output_key="analysis"
)

# Combine the chains
hybrid_chain = SequentialChain(
    chains=[summarize_chain, analyze_chain],
    input_variables=["text"],
    output_variables=["summary", "analysis"]
)

# Run the hybrid chain
result = hybrid_chain.run(text=long_article)
print("Summary:", result["summary"])
print("Analysis:", result["analysis"])
```

### Observability and Debugging

Monitor and debug your LangChain applications:

```python
from relaycore.langchain import RelayCoreLLM, enable_tracing

# Enable tracing
enable_tracing()

# Initialize the LLM
llm = RelayCoreLLM(model="gpt-4", verbose=True)

# Generate text
response = llm.generate("Explain quantum computing")

# Access the trace
from relaycore.langchain import get_last_trace
trace = get_last_trace()

# Print trace information
print(f"Request ID: {trace.request_id}")
print(f"Model used: {trace.model}")
print(f"Tokens used: {trace.usage.total_tokens}")
print(f"Request time: {trace.timing.total_ms}ms")
print(f"Prompt tokens: {trace.usage.prompt_tokens}")
print(f"Completion tokens: {trace.usage.completion_tokens}")
print(f"Cost: ${trace.cost:.6f}")
```

## Examples

### Question Answering with Documents

```python
from langchain.chains.question_answering import load_qa_chain
from langchain.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from relaycore.langchain import RelayCoreLLM

# Load document
loader = TextLoader("document.txt")
documents = loader.load()

# Split text into chunks
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
chunks = text_splitter.split_documents(documents)

# Create vector store
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_documents(chunks, embeddings)

# Create QA chain
llm = RelayCoreLLM(model="gpt-4")
qa_chain = load_qa_chain(llm, chain_type="stuff")

# Query the chain
query = "What are the main points in this document?"
relevant_docs = vectorstore.similarity_search(query)
response = qa_chain.run(input_documents=relevant_docs, question=query)
print(response)
```

### Conversational Agent

```python
from langchain.agents import initialize_agent, Tool
from langchain.agents import AgentType
from langchain.tools import DuckDuckGoSearchRun
from relaycore.langchain import RelayCoreChat

# Initialize the chat model
chat = RelayCoreChat(model="claude-2")

# Create tools
search = DuckDuckGoSearchRun()
tools = [
    Tool(
        name="Search",
        func=search.run,
        description="Useful for searching the internet for information."
    )
]

# Create agent
agent = initialize_agent(
    tools,
    chat,
    agent=AgentType.CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

# Run agent
response = agent.run("What were the major tech announcements this week?")
print(response)
```

## Troubleshooting

### Common Issues

- **Authentication Failed**: Verify your API key is set correctly
- **Model Not Available**: Check that you're requesting a model supported by RelayCore
- **Request Timeout**: Try reducing the complexity of your request or increasing the timeout
- **High Token Usage**: Enable token optimization or review your prompts for verbosity

### Debug Mode

Enable debug mode for detailed logging:

```python
import logging
from relaycore.langchain import RelayCoreLLM

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Initialize with debug mode
llm = RelayCoreLLM(model="gpt-4", debug=True)

# Generate text
response = llm.generate("Test prompt")
```

## Support

If you encounter any issues or have questions about the RelayCore LangChain integration, please:

- Check the [FAQ](https://docs.relaycore.ai/plugins/langchain/faq)
- Join our [Discord community](https://discord.gg/relaycore)
- Open an issue on our [GitHub repository](https://github.com/relaycore/langchain/issues)
- Contact support at support@relaycore.ai

## Privacy and Security

The RelayCore LangChain integration sends your prompts and context to the RelayCore API for processing. We take privacy and security seriously:

- All data is encrypted in transit
- We do not store your prompts or responses permanently
- You can use a self-hosted RelayCore instance for complete data control

For more information, see our [Privacy Policy](https://relaycore.ai/privacy).