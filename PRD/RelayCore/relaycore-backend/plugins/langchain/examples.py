"""
Examples of using RelayCore with LangChain.
"""

import os
from relaycore_langchain import RelayCoreLLM, RelayCoreChat
from langchain.chains import LLMChain, ConversationChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, SystemMessage

# Set your API key
# os.environ["RELAYCORE_API_KEY"] = "your-api-key"

def llm_example():
    """Example using RelayCoreLLM."""
    print("\n=== RelayCoreLLM Example ===\n")
    
    # Initialize the LLM
    llm = RelayCoreLLM(
        api_key=os.getenv("RELAYCORE_API_KEY"),
        model="gpt-4",
        temperature=0.7,
    )
    
    # Simple query
    print("Simple query:")
    response = llm("What is the capital of France?")
    print(response)
    print("\n---\n")
    
    # Using with a prompt template
    print("Using with a prompt template:")
    prompt = PromptTemplate(
        input_variables=["product"],
        template="What are 5 cool names for a {product}?",
    )
    
    chain = LLMChain(llm=llm, prompt=prompt)
    result = chain.run(product="AI-powered coffee maker")
    print(result)


def chat_example():
    """Example using RelayCoreChat."""
    print("\n=== RelayCoreChat Example ===\n")
    
    # Initialize the Chat Model
    chat = RelayCoreChat(
        api_key=os.getenv("RELAYCORE_API_KEY"),
        model="claude-3-opus",
        provider="anthropic",
        temperature=0.7,
    )
    
    # Simple chat
    print("Simple chat:")
    messages = [
        SystemMessage(content="You are a helpful assistant."),
        HumanMessage(content="What is the capital of France?"),
    ]
    
    response = chat(messages)
    print(response.content)
    print("\n---\n")
    
    # Multi-turn conversation
    print("Multi-turn conversation:")
    messages = [
        SystemMessage(content="You are a helpful assistant who speaks like a pirate."),
        HumanMessage(content="Tell me about the ocean."),
    ]
    
    response = chat(messages)
    print("Assistant:", response.content)
    
    messages.append(response.message)
    messages.append(HumanMessage(content="What creatures live there?"))
    
    response = chat(messages)
    print("Assistant:", response.content)


def conversation_chain_example():
    """Example using ConversationChain with RelayCoreLLM."""
    print("\n=== ConversationChain Example ===\n")
    
    # Initialize the LLM
    llm = RelayCoreLLM(
        api_key=os.getenv("RELAYCORE_API_KEY"),
        model="gpt-4",
        temperature=0.7,
    )
    
    # Create a conversation chain with memory
    conversation = ConversationChain(
        llm=llm,
        memory=ConversationBufferMemory(),
        verbose=True
    )
    
    # First turn
    response = conversation.predict(input="Hi, my name is Alice.")
    print("Response:", response)
    
    # Second turn
    response = conversation.predict(input="What's my name?")
    print("Response:", response)
    
    # Third turn
    response = conversation.predict(input="What's the capital of France?")
    print("Response:", response)
    
    # Fourth turn
    response = conversation.predict(input="And what's its most famous landmark?")
    print("Response:", response)


def provider_comparison_example():
    """Example comparing different providers through RelayCore."""
    print("\n=== Provider Comparison Example ===\n")
    
    # Define a complex question
    question = "Explain the concept of quantum entanglement in simple terms."
    
    # Try with different providers
    providers = ["openai", "anthropic", "mistral"]
    models = ["gpt-4", "claude-3-opus", "mistral-large"]
    
    for provider, model in zip(providers, models):
        print(f"\nProvider: {provider}, Model: {model}")
        
        llm = RelayCoreLLM(
            api_key=os.getenv("RELAYCORE_API_KEY"),
            model=model,
            provider=provider,
            temperature=0.7,
        )
        
        try:
            response = llm(question)
            print(response[:300] + "..." if len(response) > 300 else response)
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    print("RelayCore LangChain Integration Examples")
    print("---------------------------------------")
    print("Make sure to set your RELAYCORE_API_KEY environment variable.")
    
    # Run examples
    llm_example()
    chat_example()
    conversation_chain_example()
    provider_comparison_example()