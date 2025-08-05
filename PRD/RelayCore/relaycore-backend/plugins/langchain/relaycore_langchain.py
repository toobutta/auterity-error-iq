"""
RelayCore integration for LangChain.

This module provides classes to integrate RelayCore with LangChain,
allowing you to use RelayCore as a provider for LangChain applications.
"""

import os
import json
from typing import Any, Dict, List, Mapping, Optional, Union

import requests
from langchain.callbacks.manager import CallbackManagerForLLMRun
from langchain.llms.base import LLM
from langchain.chat_models.base import BaseChatModel
from langchain.schema import ChatResult, AIMessage, HumanMessage, SystemMessage, ChatMessage, BaseMessage
from langchain.schema.messages import get_buffer_string
from langchain.schema.output import ChatGeneration


class RelayCoreError(Exception):
    """Exception raised for RelayCore API errors."""
    pass


class RelayCoreLLM(LLM):
    """LangChain LLM implementation for RelayCore."""
    
    api_key: Optional[str] = None
    endpoint: str = "http://localhost:3000"
    model: str = "gpt-4"
    provider: Optional[str] = None
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    frequency_penalty: Optional[float] = None
    presence_penalty: Optional[float] = None
    
    @property
    def _llm_type(self) -> str:
        return "relaycore"
    
    def _get_api_key(self) -> str:
        api_key = self.api_key or os.getenv("RELAYCORE_API_KEY")
        if not api_key:
            raise ValueError(
                "No API key provided. Either pass it when creating the RelayCoreLLM"
                " instance or set the RELAYCORE_API_KEY environment variable."
            )
        return api_key
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Call the RelayCore API and return the output."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._get_api_key()}",
        }
        
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.temperature,
        }
        
        if self.provider:
            data["provider"] = self.provider
        
        if self.max_tokens:
            data["max_tokens"] = self.max_tokens
        
        if self.top_p:
            data["top_p"] = self.top_p
        
        if self.frequency_penalty:
            data["frequency_penalty"] = self.frequency_penalty
        
        if self.presence_penalty:
            data["presence_penalty"] = self.presence_penalty
        
        if stop:
            data["stop"] = stop
        
        try:
            response = requests.post(
                f"{self.endpoint}/v1/chat/completions",
                headers=headers,
                json=data,
            )
            response.raise_for_status()
            response_data = response.json()
            return response_data["choices"][0]["message"]["content"]
        except requests.exceptions.RequestException as e:
            if hasattr(e, "response") and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_message = error_data.get("error", {}).get("message", str(e))
                    raise RelayCoreError(f"RelayCore API error: {error_message}")
                except json.JSONDecodeError:
                    raise RelayCoreError(f"RelayCore API error: {str(e)}")
            raise RelayCoreError(f"RelayCore API error: {str(e)}")
    
    @property
    def _identifying_params(self) -> Mapping[str, Any]:
        """Get the identifying parameters."""
        return {
            "model": self.model,
            "provider": self.provider,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "top_p": self.top_p,
            "frequency_penalty": self.frequency_penalty,
            "presence_penalty": self.presence_penalty,
        }


class RelayCoreChat(BaseChatModel):
    """LangChain Chat Model implementation for RelayCore."""
    
    api_key: Optional[str] = None
    endpoint: str = "http://localhost:3000"
    model: str = "gpt-4"
    provider: Optional[str] = None
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    frequency_penalty: Optional[float] = None
    presence_penalty: Optional[float] = None
    
    @property
    def _llm_type(self) -> str:
        return "relaycore_chat"
    
    def _get_api_key(self) -> str:
        api_key = self.api_key or os.getenv("RELAYCORE_API_KEY")
        if not api_key:
            raise ValueError(
                "No API key provided. Either pass it when creating the RelayCoreChat"
                " instance or set the RELAYCORE_API_KEY environment variable."
            )
        return api_key
    
    def _convert_messages_to_relaycore_format(self, messages: List[BaseMessage]) -> List[Dict[str, str]]:
        """Convert LangChain messages to RelayCore format."""
        relaycore_messages = []
        for message in messages:
            if isinstance(message, SystemMessage):
                relaycore_messages.append({"role": "system", "content": message.content})
            elif isinstance(message, HumanMessage):
                relaycore_messages.append({"role": "user", "content": message.content})
            elif isinstance(message, AIMessage):
                relaycore_messages.append({"role": "assistant", "content": message.content})
            elif isinstance(message, ChatMessage):
                role = message.role
                if role == "ai":
                    role = "assistant"
                relaycore_messages.append({"role": role, "content": message.content})
            else:
                raise ValueError(f"Unsupported message type: {type(message)}")
        return relaycore_messages
    
    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Generate a chat response from RelayCore."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._get_api_key()}",
        }
        
        relaycore_messages = self._convert_messages_to_relaycore_format(messages)
        
        data = {
            "model": self.model,
            "messages": relaycore_messages,
            "temperature": self.temperature,
        }
        
        if self.provider:
            data["provider"] = self.provider
        
        if self.max_tokens:
            data["max_tokens"] = self.max_tokens
        
        if self.top_p:
            data["top_p"] = self.top_p
        
        if self.frequency_penalty:
            data["frequency_penalty"] = self.frequency_penalty
        
        if self.presence_penalty:
            data["presence_penalty"] = self.presence_penalty
        
        if stop:
            data["stop"] = stop
        
        try:
            response = requests.post(
                f"{self.endpoint}/v1/chat/completions",
                headers=headers,
                json=data,
            )
            response.raise_for_status()
            response_data = response.json()
            
            message_content = response_data["choices"][0]["message"]["content"]
            message = AIMessage(content=message_content)
            
            generation = ChatGeneration(
                message=message,
                generation_info={
                    "finish_reason": response_data["choices"][0].get("finish_reason"),
                    "model": response_data.get("model"),
                    "usage": response_data.get("usage"),
                },
            )
            
            return ChatResult(generations=[generation])
        except requests.exceptions.RequestException as e:
            if hasattr(e, "response") and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_message = error_data.get("error", {}).get("message", str(e))
                    raise RelayCoreError(f"RelayCore API error: {error_message}")
                except json.JSONDecodeError:
                    raise RelayCoreError(f"RelayCore API error: {str(e)}")
            raise RelayCoreError(f"RelayCore API error: {str(e)}")
    
    @property
    def _identifying_params(self) -> Mapping[str, Any]:
        """Get the identifying parameters."""
        return {
            "model": self.model,
            "provider": self.provider,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "top_p": self.top_p,
            "frequency_penalty": self.frequency_penalty,
            "presence_penalty": self.presence_penalty,
        }


# Example usage
if __name__ == "__main__":
    # Example with LLM
    llm = RelayCoreLLM(
        api_key=os.getenv("RELAYCORE_API_KEY"),
        model="gpt-4",
        temperature=0.7,
    )
    
    print("LLM Example:")
    print(llm("What is the capital of France?"))
    print("\n" + "-" * 50 + "\n")
    
    # Example with Chat
    chat = RelayCoreChat(
        api_key=os.getenv("RELAYCORE_API_KEY"),
        model="gpt-4",
        temperature=0.7,
    )
    
    messages = [
        SystemMessage(content="You are a helpful assistant."),
        HumanMessage(content="What is the capital of France?"),
    ]
    
    print("Chat Example:")
    print(chat(messages).content)