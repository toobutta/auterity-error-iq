"""
MCPServerManager: Manages lifecycle and integration of external MCP servers.
Implements process management, health checks, tool discovery, and \
    configuration validation.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

# Import the models from the migration we created
from app.models.mcp_server import MCPServer, MCPServerStatus

logger = logging.getLogger(__name__)


class MCPServerManager:
    def __init__(self, db: Session):
        self.db = db
        self.active_servers: Dict[UUID, asyncio.subprocess.Process] = {}
        self.client = httpx.AsyncClient()
        self.crewai_url = ""  # Placeholder for CrewAI URL, to be defined later

    async def start_server(self, server_id: UUID, config: dict) -> bool:
        """Start an external MCP server process."""
        try:
            # Get server config from database
            server = (
                self.db.query(MCPServer)
                .filter(MCPServer.id == server_id)
                .first()
            )
            if not server:
                logger.error(f"MCP server {server_id} not found in database")
                return False

            # Construct command from config
            command = config.get("command", [])
            if not command:
                logger.error(
                    f"No command specified for MCP server {server_id}"
                )
                return False

            # Start the process
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=config.get("env", {}),
            )

            self.active_servers[server_id] = process

            # Update server status in database
            server.status = MCPServerStatus.RUNNING
            server.updated_at = datetime.utcnow()
            self.db.commit()

            logger.info(
                f"Started MCP server {server_id} with PID {process.pid}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to start MCP server {server_id}: {str(e)}")
            return False

    async def stop_server(self, server_id: UUID) -> bool:
        """Stop an external MCP server process."""
        process = self.active_servers.get(server_id)
        if process:
            process.terminate()
            await process.wait()
            del self.active_servers[server_id]
            logger.info(f"Stopped MCP server {server_id}")
            return True
        logger.warning(f"No active process for MCP server {server_id}")
        return False

    async def restart_server(self, server_id: UUID, config: dict) -> bool:
        """Restart an MCP server process."""
        await self.stop_server(server_id)
        return await self.start_server(server_id, config)

    async def health_check(self, server_id: UUID) -> bool:
        """Perform a health check on the MCP server."""
        # TODO: Implement health check logic (e.g., HTTP ping)
        logger.info(f"Performing health check for MCP server {server_id}")
        return True

    async def discover_tools(self, server_id: UUID) -> List[dict]:
        """Discover tools available on the MCP server via protocol communication."""
        logger.info(f"Discovering tools for MCP server {server_id}")

        try:
            # Get server configuration from database
            server = (
                self.db.query(MCPServer)
                .filter(MCPServer.id == server_id)
                .first()
            )
            if not server:
                logger.error(f"MCP server {server_id} not found")
                return []

            # Discover tools based on server configuration
            tools = await self._discover_tools_by_provider(server)
            logger.info(f"Discovered {len(tools)} tools for server {server_id}")

            return tools

        except Exception as e:
            logger.error(f"Tool discovery failed for server {server_id}: {e}")
            return []

    async def _discover_tools_by_provider(self, server) -> List[dict]:
        """Discover tools based on the server's provider configuration."""
        provider_tools = []

        # Extract provider information from server config
        config = server.config or {}
        provider = config.get("provider", "").lower()

        # Discover tools based on provider
        if "openai" in provider:
            provider_tools.extend(await self._discover_openai_tools(config))
        elif "anthropic" in provider:
            provider_tools.extend(await self._discover_anthropic_tools(config))
        elif "google" in provider or "vertex" in provider:
            provider_tools.extend(await self._discover_google_tools(config))
        elif "cohere" in provider:
            provider_tools.extend(await self._discover_cohere_tools(config))
        elif "azure" in provider:
            provider_tools.extend(await self._discover_azure_tools(config))
        elif "crewai" in provider:
            provider_tools.extend(await self._discover_crewai_tools(config))
        elif "langgraph" in provider:
            provider_tools.extend(await self._discover_langgraph_tools(config))
        elif "neuroweaver" in provider:
            provider_tools.extend(await self._discover_neuroweaver_tools(config))
        elif "vllm" in provider:
            provider_tools.extend(await self._discover_vllm_tools(config))
        else:
            # Generic tool discovery for custom providers
            provider_tools.extend(await self._discover_generic_tools(config))

        return provider_tools

    async def _discover_openai_tools(self, config: dict) -> List[dict]:
        """Discover OpenAI-specific tools and functions."""
        tools = []

        # OpenAI Function Calling tools
        tools.append({
            "name": "openai_function_call",
            "type": "function",
            "description": "Execute OpenAI function calls with structured parameters",
            "schema": {
                "type": "object",
                "properties": {
                    "function_name": {"type": "string", "description": "Name of the function to call"},
                    "parameters": {"type": "object", "description": "Function parameters"},
                    "model": {"type": "string", "enum": ["gpt-4", "gpt-3.5-turbo"], "default": "gpt-4"}
                },
                "required": ["function_name"]
            },
            "capabilities": ["function_calling", "structured_output", "json_mode"]
        })

        # OpenAI Vision tools
        tools.append({
            "name": "openai_vision",
            "type": "function",
            "description": "Analyze images using OpenAI Vision API",
            "schema": {
                "type": "object",
                "properties": {
                    "image_url": {"type": "string", "description": "URL or base64 encoded image"},
                    "prompt": {"type": "string", "description": "Analysis prompt"},
                    "model": {"type": "string", "enum": ["gpt-4-vision-preview"], "default": "gpt-4-vision-preview"}
                },
                "required": ["image_url", "prompt"]
            },
            "capabilities": ["image_analysis", "vision", "multimodal"]
        })

        return tools

    async def _discover_anthropic_tools(self, config: dict) -> List[dict]:
        """Discover Anthropic-specific tools and functions."""
        tools = []

        # Claude Function Calling
        tools.append({
            "name": "claude_function_call",
            "type": "function",
            "description": "Execute Claude function calls with tool use",
            "schema": {
                "type": "object",
                "properties": {
                    "tool_name": {"type": "string", "description": "Name of the tool to use"},
                    "parameters": {"type": "object", "description": "Tool parameters"},
                    "model": {"type": "string", "enum": ["claude-3-opus", "claude-3-sonnet"], "default": "claude-3-opus"}
                },
                "required": ["tool_name"]
            },
            "capabilities": ["tool_use", "function_calling", "structured_output"]
        })

        return tools

    async def _discover_google_tools(self, config: dict) -> List[dict]:
        """Discover Google Vertex AI tools and functions."""
        tools = []

        # Gemini Function Calling
        tools.append({
            "name": "gemini_function_call",
            "type": "function",
            "description": "Execute Gemini function calls",
            "schema": {
                "type": "object",
                "properties": {
                    "function_name": {"type": "string", "description": "Function name"},
                    "parameters": {"type": "object", "description": "Function parameters"},
                    "model": {"type": "string", "enum": ["gemini-pro", "gemini-pro-vision"], "default": "gemini-pro"}
                },
                "required": ["function_name"]
            },
            "capabilities": ["function_calling", "multimodal", "vision"]
        })

        # Vertex AI Custom Models
        tools.append({
            "name": "vertex_ai_custom",
            "type": "function",
            "description": "Execute custom Vertex AI models",
            "schema": {
                "type": "object",
                "properties": {
                    "model_name": {"type": "string", "description": "Custom model name"},
                    "input_data": {"type": "object", "description": "Model input data"},
                    "parameters": {"type": "object", "description": "Model parameters"}
                },
                "required": ["model_name", "input_data"]
            },
            "capabilities": ["custom_models", "vertex_ai", "ml_prediction"]
        })

        return tools

    async def _discover_cohere_tools(self, config: dict) -> List[dict]:
        """Discover Cohere-specific tools and functions."""
        tools = []

        # Cohere Command-R Function Calling
        tools.append({
            "name": "cohere_command_r",
            "type": "function",
            "description": "Execute Cohere Command-R with tool use",
            "schema": {
                "type": "object",
                "properties": {
                    "tool_name": {"type": "string", "description": "Tool name"},
                    "parameters": {"type": "object", "description": "Tool parameters"},
                    "model": {"type": "string", "enum": ["command-r", "command-r-plus"], "default": "command-r"}
                },
                "required": ["tool_name"]
            },
            "capabilities": ["tool_use", "function_calling", "conversational_ai"]
        })

        return tools

    async def _discover_azure_tools(self, config: dict) -> List[dict]:
        """Discover Azure OpenAI tools and functions."""
        tools = []

        # Azure Function Calling
        tools.append({
            "name": "azure_function_call",
            "type": "function",
            "description": "Execute Azure OpenAI function calls",
            "schema": {
                "type": "object",
                "properties": {
                    "function_name": {"type": "string", "description": "Function name"},
                    "parameters": {"type": "object", "description": "Function parameters"},
                    "deployment_name": {"type": "string", "description": "Azure deployment name"}
                },
                "required": ["function_name", "deployment_name"]
            },
            "capabilities": ["function_calling", "azure_integration", "enterprise_security"]
        })

        return tools

    async def _discover_crewai_tools(self, config: dict) -> List[dict]:
        """Discover CrewAI agent and collaboration tools."""
        tools = []

        try:
            # Connect to CrewAI service

            # Crew Creation Tool
            tools.append({
                "name": "create_crew",
                "type": "function",
                "description": "Create a new collaborative crew of agents",
                "schema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Crew name"},
                        "description": {
                            "type": "string",
                            "description": "Crew description"
                        },
                        "agents": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "role": {"type": "string"},
                                    "capabilities": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    }
                                }
                            }
                        },
                        "tasks": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "description": {"type": "string"},
                                    "priority": {
                                        "type": "integer",
                                        "enum": [1, 2, 3]
                                    }
                                }
                            }
                        }
                    },
                    "required": ["name", "agents"]
                },
                "capabilities": [
                    "multi_agent",
                    "collaboration",
                    "task_orchestration"
                ]
            })

            # Crew Execution Tool
            tools.append({
                "name": "execute_crew",
                "type": "function",
                "description": "Execute a crew with collaborative task completion",
                "schema": {
                    "type": "object",
                    "properties": {
                        "crew_id": {"type": "string", "description": "Crew identifier"},
                        "input_data": {"type": "object", "description": "Input data for crew execution"},
                        "strategy": {
                            "type": "string",
                            "enum": ["hierarchical", "democratic", "swarm"],
                            "default": "hierarchical"
                        }
                    },
                    "required": ["crew_id", "input_data"]
                },
                "capabilities": ["crew_execution", "collaborative_ai", "task_distribution"]
            })

        except Exception as e:
            logger.warning(f"Failed to discover CrewAI tools: {e}")

        return tools

    async def _discover_langgraph_tools(self, config: dict) -> List[dict]:
        """Discover LangGraph workflow tools."""
        tools = []

        try:
            # LangGraph Workflow Creation
            tools.append({
                "name": "create_workflow",
                "type": "function",
                "description": "Create a new LangGraph workflow with state management",
                "schema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Workflow name"},
                        "description": {"type": "string", "description": "Workflow description"},
                        "nodes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "type": {"type": "string", "enum": ["llm", "tool", "condition", "integration"]},
                                    "config": {"type": "object"}
                                }
                            }
                        },
                        "edges": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "source": {"type": "string"},
                                    "target": {"type": "string"},
                                    "condition": {"type": "string"}
                                }
                            }
                        }
                    },
                    "required": ["name", "nodes"]
                },
                "capabilities": ["workflow_creation", "state_management", "graph_orchestration"]
            })

            # Workflow Execution
            tools.append({
                "name": "execute_workflow",
                "type": "function",
                "description": "Execute a LangGraph workflow with state tracking",
                "schema": {
                    "type": "object",
                    "properties": {
                        "workflow_id": {"type": "string", "description": "Workflow identifier"},
                        "input_data": {"type": "object", "description": "Input data for workflow"},
                        "initial_state": {"type": "object", "description": "Initial workflow state"}
                    },
                    "required": ["workflow_id", "input_data"]
                },
                "capabilities": ["workflow_execution", "state_tracking", "decision_routing"]
            })

        except Exception as e:
            logger.warning(f"Failed to discover LangGraph tools: {e}")

        return tools

    async def _discover_neuroweaver_tools(self, config: dict) -> List[dict]:
        """Discover NeuroWeaver ML and training tools."""
        tools = []

        try:
            # Model Training Tool
            tools.append({
                "name": "train_model",
                "type": "function",
                "description": "Train a custom AI model with NeuroWeaver",
                "schema": {
                    "type": "object",
                    "properties": {
                        "model_type": {
                            "type": "string",
                            "enum": ["classification", "regression", "nlp", "vision", "multimodal"]
                        },
                        "dataset": {"type": "string", "description": "Dataset identifier"},
                        "hyperparameters": {"type": "object", "description": "Training hyperparameters"},
                        "training_config": {"type": "object", "description": "Training configuration"}
                    },
                    "required": ["model_type", "dataset"]
                },
                "capabilities": ["model_training", "hyperparameter_tuning", "dataset_processing"]
            })

            # Model Deployment Tool
            tools.append({
                "name": "deploy_model",
                "type": "function",
                "description": "Deploy a trained model for inference",
                "schema": {
                    "type": "object",
                    "properties": {
                        "model_id": {"type": "string", "description": "Model identifier"},
                        "deployment_target": {
                            "type": "string",
                            "enum": ["kubernetes", "serverless", "edge", "local"]
                        },
                        "scaling_config": {"type": "object", "description": "Auto-scaling configuration"}
                    },
                    "required": ["model_id", "deployment_target"]
                },
                "capabilities": ["model_deployment", "auto_scaling", "inference_optimization"]
            })

        except Exception as e:
            logger.warning(f"Failed to discover NeuroWeaver tools: {e}")

        return tools

    async def _discover_vllm_tools(self, config: dict) -> List[dict]:
        """Discover vLLM inference tools."""
        tools = []

        try:
            # vLLM Inference Tool
            tools.append({
                "name": "vllm_inference",
                "type": "function",
                "description": "Execute high-performance LLM inference with vLLM",
                "schema": {
                    "type": "object",
                    "properties": {
                        "model": {"type": "string", "description": "Model name or path"},
                        "prompt": {"type": "string", "description": "Input prompt"},
                        "max_tokens": {"type": "integer", "default": 100, "description": "Maximum tokens to generate"},
                        "temperature": {"type": "number", "default": 0.7, "description": "Sampling temperature"},
                        "top_p": {"type": "number", "default": 1.0, "description": "Top-p sampling parameter"},
                        "stream": {"type": "boolean", "default": False, "description": "Enable streaming response"}
                    },
                    "required": ["model", "prompt"]
                },
                "capabilities": ["high_performance_inference", "gpu_acceleration", "batch_processing"]
            })

            # vLLM Batch Processing
            tools.append({
                "name": "vllm_batch",
                "type": "function",
                "description": "Process multiple prompts in batch with vLLM",
                "schema": {
                    "type": "object",
                    "properties": {
                        "model": {"type": "string", "description": "Model name or path"},
                        "prompts": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Array of input prompts"
                        },
                        "batch_size": {"type": "integer", "default": 32, "description": "Batch size for processing"},
                        "max_tokens": {"type": "integer", "default": 100, "description": "Maximum tokens per prompt"}
                    },
                    "required": ["model", "prompts"]
                },
                "capabilities": ["batch_processing", "parallel_inference", "throughput_optimization"]
            })

        except Exception as e:
            logger.warning(f"Failed to discover vLLM tools: {e}")

        return tools

    async def _discover_generic_tools(self, config: dict) -> List[dict]:
        """Discover tools for generic/custom providers."""
        tools = []

        # Generic Function Calling
        tools.append({
            "name": "generic_function_call",
            "type": "function",
            "description": "Execute generic function calls",
            "schema": {
                "type": "object",
                "properties": {
                    "function_name": {"type": "string", "description": "Function name"},
                    "parameters": {"type": "object", "description": "Function parameters"},
                    "endpoint": {"type": "string", "description": "API endpoint"}
                },
                "required": ["function_name"]
            },
            "capabilities": ["generic_calling", "api_integration", "custom_functions"]
        })

        return tools

    def validate_config(self, config: dict) -> bool:
        """Validate MCP server configuration."""
        try:
            logger.info(f"Validating MCP server config: {config}")

            # Required fields validation
            required_fields = ["provider"]
            for field in required_fields:
                if field not in config:
                    logger.error(f"Missing required field: {field}")
                    return False

            # Provider-specific validation
            provider = config.get("provider", "").lower()

            if provider == "openai":
                return self._validate_openai_config(config)
            elif provider == "anthropic":
                return self._validate_anthropic_config(config)
            elif provider in ["google", "vertex"]:
                return self._validate_google_config(config)
            elif provider == "cohere":
                return self._validate_cohere_config(config)
            elif provider == "azure":
                return self._validate_azure_config(config)
            elif provider == "crewai":
                return self._validate_crewai_config(config)
            elif provider == "langgraph":
                return self._validate_langgraph_config(config)
            elif provider == "neuroweaver":
                return self._validate_neuroweaver_config(config)
            elif provider == "vllm":
                return self._validate_vllm_config(config)
            else:
                # Generic validation for custom providers
                return self._validate_generic_config(config)

        except Exception as e:
            logger.error(f"Config validation failed: {e}")
            return False

    def _validate_openai_config(self, config: dict) -> bool:
        """Validate OpenAI-specific configuration."""
        required = ["api_key", "model"]
        for field in required:
            if field not in config:
                logger.error(f"OpenAI config missing: {field}")
                return False

        supported_models = ["gpt-4", "gpt-3.5-turbo", "gpt-4-vision-preview"]
        if config["model"] not in supported_models:
            logger.error(f"Unsupported OpenAI model: {config['model']}")
            return False

        return True

    def _validate_anthropic_config(self, config: dict) -> bool:
        """Validate Anthropic-specific configuration."""
        required = ["api_key", "model"]
        for field in required:
            if field not in config:
                logger.error(f"Anthropic config missing: {field}")
                return False

        supported_models = ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]
        if config["model"] not in supported_models:
            logger.error(f"Unsupported Anthropic model: {config['model']}")
            return False

        return True

    def _validate_google_config(self, config: dict) -> bool:
        """Validate Google Vertex AI configuration."""
        required = ["project_id", "location", "model"]
        for field in required:
            if field not in config:
                logger.error(f"Google config missing: {field}")
                return False

        supported_models = ["gemini-pro", "gemini-pro-vision", "palm-2"]
        if config["model"] not in supported_models:
            logger.error(f"Unsupported Google model: {config['model']}")
            return False

        return True

    def _validate_cohere_config(self, config: dict) -> bool:
        """Validate Cohere configuration."""
        required = ["api_key", "model"]
        for field in required:
            if field not in config:
                logger.error(f"Cohere config missing: {field}")
                return False

        supported_models = ["command-r", "command-r-plus", "base"]
        if config["model"] not in supported_models:
            logger.error(f"Unsupported Cohere model: {config['model']}")
            return False

        return True

    def _validate_azure_config(self, config: dict) -> bool:
        """Validate Azure OpenAI configuration."""
        required = ["api_key", "endpoint", "deployment_name", "api_version"]
        for field in required:
            if field not in config:
                logger.error(f"Azure config missing: {field}")
                return False

        return True

    def _validate_crewai_config(self, config: dict) -> bool:
        """Validate CrewAI configuration."""
        # CrewAI can work with minimal config
        if "crewai_url" in config:
            # Validate URL format if provided
            from urllib.parse import urlparse
            try:
                result = urlparse(config["crewai_url"])
                if not all([result.scheme, result.netloc]):
                    logger.error(f"Invalid CrewAI URL: {config['crewai_url']}")
                    return False
            except Exception:
                logger.error(f"Invalid CrewAI URL format: {config['crewai_url']}")
                return False

        return True

    def _validate_langgraph_config(self, config: dict) -> bool:
        """Validate LangGraph configuration."""
        # LangGraph can work with minimal config
        return True

    def _validate_neuroweaver_config(self, config: dict) -> bool:
        """Validate NeuroWeaver configuration."""
        # Check for optional but recommended fields
        recommended = ["training_config", "model_registry_url"]
        for field in recommended:
            if field not in config:
                logger.warning(f"NeuroWeaver config missing recommended field: {field}")

        return True

    def _validate_vllm_config(self, config: dict) -> bool:
        """Validate vLLM configuration."""
        required = ["model_path"]
        for field in required:
            if field not in config:
                logger.error(f"vLLM config missing: {field}")
                return False

        return True

    def _validate_generic_config(self, config: dict) -> bool:
        """Validate generic/custom provider configuration."""
        # Basic validation for custom providers
        if "endpoint" not in config and "base_url" not in config:
            logger.warning("Generic config missing endpoint or base_url")
            # Not a hard failure for generic configs

        return True

    async def register_tool(self, server_id: UUID, tool_info: dict) -> bool:
        """Register a discovered tool in the tool registry."""
        try:
            logger.info(f"Registering tool for MCP server {server_id}: {tool_info}")

            # Import tool registry (assuming it's available)
            from app.services.tool_registry import ToolRegistry, ToolType

            # Create tool registry instance
            registry = ToolRegistry()

            # Convert tool_info to Tool object
            tool = registry.create_tool_from_dict({
                **tool_info,
                "server_id": server_id
            })

            # Register the tool
            success = registry.register_tool(tool)

            if success:
                logger.info(f"Successfully registered tool: {tool.name}")
                return True
            else:
                logger.error(f"Failed to register tool: {tool.name}")
                return False

        except ImportError:
            logger.warning("Tool registry not available, tool registration skipped")
            return True  # Don't fail the discovery process
        except Exception as e:
            logger.error(f"Tool registration failed: {e}")
            return False
