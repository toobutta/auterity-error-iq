# RelayCore LangChain Integration

This package provides integration between [RelayCore](https://relaycore.ai) and [LangChain](https://langchain.com), allowing you to use RelayCore as a provider for LangChain applications.

## Features

- **RelayCoreLLM**: Use RelayCore as a standard LangChain LLM
- **RelayCoreChat**: Use RelayCore as a LangChain Chat Model
- **Smart Routing**: Automatically routes to the best AI provider
- **Cost Optimization**: Reduces AI costs with intelligent caching and token optimization
- **Provider Flexibility**: Switch between different AI providers without changing your code

## Installation

```bash
pip install relaycore-langchain
```

## Usage

### LLM Example

```python
import os
from relaycore_langchain import RelayCoreLLM

# Initialize the LLM
llm = RelayCoreLLM(
    api_key=os.getenv("RELAYCORE_API_KEY"),  # Or pass directly
    model="gpt-4",                           # Default model
    provider="openai",                       # Optional: specify provider
    temperature=0.7,                         # Optional: set temperature
)

# Use it like any other LangChain LLM
response = llm("What is the capital of France?")
print(response)
```

### Chat Model Example

```python
import os
from relaycore_langchain import RelayCoreChat
from langchain.schema import HumanMessage, SystemMessage

# Initialize the Chat Model
chat = RelayCoreChat(
    api_key=os.getenv("RELAYCORE_API_KEY"),
    model="claude-3-opus",
    provider="anthropic",
    temperature=0.7,
)

# Create messages
messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="What is the capital of France?"),
]

# Get a response
response = chat(messages)
print(response.content)
```

### Using with LangChain Chains

```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from relaycore_langchain import RelayCoreLLM

llm = RelayCoreLLM(api_key="your-api-key")

prompt = PromptTemplate(
    input_variables=["product"],
    template="What are 5 cool names for a {product}?",
)

chain = LLMChain(llm=llm, prompt=prompt)

# Run the chain
result = chain.run(product="AI-powered toaster")
print(result)
```

### Using with Agents

```python
from langchain.agents import AgentType, initialize_agent, load_tools
from relaycore_langchain import RelayCoreLLM

llm = RelayCoreLLM(api_key="your-api-key")

# Load tools
tools = load_tools(["serpapi", "llm-math"], llm=llm)

# Initialize agent
agent = initialize_agent(
    tools, 
    llm, 
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

# Run the agent
agent.run("What was the high temperature in SF yesterday? What is that number raised to the 0.023 power?")
```

## Configuration Options

Both `RelayCoreLLM` and `RelayCoreChat` accept the following parameters:

- `api_key`: Your RelayCore API key
- `endpoint`: RelayCore API endpoint (default: "http://localhost:3000")
- `model`: The model to use (default: "gpt-4")
- `provider`: The provider to use (optional)
- `temperature`: Sampling temperature (default: 0.7)
- `max_tokens`: Maximum number of tokens to generate (optional)
- `top_p`: Nucleus sampling parameter (optional)
- `frequency_penalty`: Frequency penalty parameter (optional)
- `presence_penalty`: Presence penalty parameter (optional)

## Environment Variables

You can set the following environment variables:

- `RELAYCORE_API_KEY`: Your RelayCore API key

## Benefits of Using RelayCore with LangChain

- **Provider Flexibility**: Switch between different AI providers without changing your code
- **Cost Optimization**: Reduce costs through intelligent caching and token optimization
- **Smart Routing**: Automatically route to the best provider based on performance and availability
- **Unified Interface**: Consistent API across different AI models

## License

MIT