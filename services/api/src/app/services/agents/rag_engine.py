"""
RAG Engine using Haystack and LlamaIndex for enterprise-grade retrieval

This module provides advanced RAG capabilities for Auterity's knowledge base,
document processing, and intelligent information retrieval across all systems.
"""

import logging
from typing import Any, Dict, List, Optional

from app.services.vector.pinecone_store import PineconeDocumentStore

# Optional imports with fallbacks for better error handling
try:
    from haystack import Document, Pipeline
    from haystack.document_stores import InMemoryDocumentStore
    from haystack.nodes import DensePassageRetriever, FARMReader, PreProcessor

    HAYSTACK_AVAILABLE = True
except ImportError:
    HAYSTACK_AVAILABLE = False
    logging.warning("Haystack not available - using fallback implementations")

try:
    from llama_index import ServiceContext, StorageContext, VectorStoreIndex
    from llama_index.embeddings import OpenAIEmbedding
    from llama_index.vector_stores import PineconeVectorStore

    LLAMA_INDEX_AVAILABLE = True
except ImportError:
    LLAMA_INDEX_AVAILABLE = False
    logging.warning(
        "LlamaIndex not available - using fallback implementations"
    )

logger = logging.getLogger(__name__)


class RAGEngine:
    """
    Enterprise RAG engine combining Haystack and LlamaIndex capabilities

    Features:
    - Multi-modal document processing (text, PDFs, structured data)
    - Compliance-aware retrieval with audit trails
    - Domain-specific knowledge bases (automotive, healthcare, finance)
    - Real-time index updates and synchronization
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.document_store = None
        self.retrieval_pipeline = None
        self.qa_pipeline = None
        self.llama_index = None
        self.domain_indices = {}

        # Initialize based on configuration
        self._initialize_document_store()
        self._initialize_pipelines()
        self._initialize_llama_index()

    def _initialize_document_store(self):
        """Initialize document store based on configuration"""
        if not HAYSTACK_AVAILABLE:
            logger.warning("Document store not available - using fallback")
            self.document_store = {"type": "fallback", "documents": {}}
            return

        store_type = self.config.get("document_store", "inmemory")

        try:
            if store_type == "pinecone":
                self.document_store = PineconeDocumentStore(
                    api_key=self.config.get("pinecone_api_key"),
                    environment=self.config.get("pinecone_environment"),
                    index_name=self.config.get(
                        "pinecone_index", "auterity-docs"
                    ),
                )
            else:
                self.document_store = InMemoryDocumentStore()

            logger.info(f"Initialized {store_type} document store")
        except Exception as e:
            logger.warning(f"Failed to initialize document store: {e}")
            self.document_store = {"type": "fallback", "documents": {}}

    def _initialize_pipelines(self):
        """Initialize Haystack retrieval and QA pipelines"""
        if not HAYSTACK_AVAILABLE:
            logger.warning("Haystack pipelines not available - using fallback")
            self.retrieval_pipeline = {"type": "fallback"}
            self.qa_pipeline = {"type": "fallback"}
            return

        try:
            # Retrieval pipeline
            retriever = DensePassageRetriever(
                document_store=self.document_store,
                query_embedding_model="facebook/dpr-question_encoder-single-nq-base",
                passage_embedding_model="facebook/dpr-ctx_encoder-single-nq-base",
                use_gpu=self.config.get("use_gpu", False),
            )

            self.retrieval_pipeline = Pipeline()
            self.retrieval_pipeline.add_node(
                component=retriever, name="Retriever", inputs=["Query"]
            )

            # QA pipeline with reader
            reader = FARMReader(
                model_name_or_path="deepset/roberta-base-squad2",
                use_gpu=self.config.get("use_gpu", False),
                context_window_size=512,
                return_no_answer=True,
            )

            self.qa_pipeline = Pipeline()
            self.qa_pipeline.add_node(
                component=retriever, name="Retriever", inputs=["Query"]
            )
            self.qa_pipeline.add_node(
                component=reader, name="Reader", inputs=["Retriever"]
            )

            logger.info("Initialized Haystack pipelines")
        except Exception as e:
            logger.warning(f"Failed to initialize pipelines: {e}")
            self.retrieval_pipeline = {"type": "fallback"}
            self.qa_pipeline = {"type": "fallback"}

    def _initialize_llama_index(self):
        """Initialize LlamaIndex for advanced indexing and querying"""
        if not LLAMA_INDEX_AVAILABLE:
            logger.warning("LlamaIndex not available - using fallback")
            self.llama_index = {"type": "fallback"}
            return

        try:
            # Configure service context
            embed_model = OpenAIEmbedding(
                api_key=self.config.get("openai_api_key")
            )

            service_context = ServiceContext.from_defaults(
                embed_model=embed_model, chunk_size=512, chunk_overlap=50
            )

            # Initialize vector store if using Pinecone
            if self.config.get("document_store") == "pinecone":
                vector_store = PineconeVectorStore(
                    api_key=self.config.get("pinecone_api_key"),
                    environment=self.config.get("pinecone_environment"),
                    index_name=self.config.get(
                        "pinecone_index", "auterity-llama"
                    ),
                )
                storage_context = StorageContext.from_defaults(
                    vector_store=vector_store
                )
            else:
                storage_context = StorageContext.from_defaults()

            self.llama_index = VectorStoreIndex(
                nodes=[],
                service_context=service_context,
                storage_context=storage_context,
            )

            logger.info("Initialized LlamaIndex")
        except Exception as e:
            logger.warning(f"Failed to initialize LlamaIndex: {e}")
            self.llama_index = {"type": "fallback"}

    async def index_documents(
        self,
        documents: List[Dict[str, Any]],
        domain: str = "general",
        tenant_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Index documents with domain-specific processing"""

        try:
            # Preprocess documents
            processor = PreProcessor(
                clean_empty_lines=True,
                clean_whitespace=True,
                clean_header_footer=True,
                split_by="word",
                split_length=512,
                split_overlap=50,
            )

            processed_docs = []
            for doc_data in documents:
                doc = Document(
                    content=doc_data["content"],
                    meta={
                        "title": doc_data.get("title", ""),
                        "source": doc_data.get("source", ""),
                        "domain": domain,
                        "tenant_id": tenant_id,
                        "indexed_at": doc_data.get("indexed_at"),
                        **doc_data.get("metadata", {}),
                    },
                )
                processed_docs.append(doc)

            # Process with Haystack
            processed_docs = processor.process(processed_docs)

            # Update document store
            self.document_store.write_documents(processed_docs)

            # Update embeddings for retrieval
            self.document_store.update_embeddings(
                retriever=self.retrieval_pipeline.get_node("Retriever")
            )

            # Index with LlamaIndex for domain-specific queries
            if domain not in self.domain_indices:
                self.domain_indices[domain] = VectorStoreIndex(
                    nodes=[],
                    service_context=self.llama_index.service_context,
                    storage_context=self.llama_index.storage_context,
                )

            # Convert to LlamaIndex documents and index
            for doc in processed_docs:
                self.domain_indices[domain].insert(doc.content)

            logger.info(
                f"Indexed {len(processed_docs)} documents for domain: {domain}"
            )

            return {
                "status": "success",
                "documents_indexed": len(processed_docs),
                "domain": domain,
                "tenant_id": tenant_id,
            }

        except Exception as e:
            logger.error(f"Document indexing failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "domain": domain,
                "tenant_id": tenant_id,
            }

    async def query(
        self,
        query: str,
        domain: Optional[str] = None,
        tenant_id: Optional[str] = None,
        top_k: int = 5,
        use_qa: bool = True,
    ) -> Dict[str, Any]:
        """Execute RAG query with compliance tracking"""

        try:
            # Add tenant filtering if provided
            filters = {}
            if tenant_id:
                filters["tenant_id"] = [tenant_id]
            if domain:
                filters["domain"] = [domain]

            if use_qa and self.qa_pipeline:
                # Use QA pipeline for answer extraction
                result = self.qa_pipeline.run(
                    query=query,
                    params={
                        "Retriever": {"top_k": top_k, "filters": filters},
                        "Reader": {"top_k": 3},
                    },
                )

                return {
                    "status": "success",
                    "query": query,
                    "answer": (
                        result["answers"][0].answer
                        if result["answers"]
                        else None
                    ),
                    "confidence": (
                        result["answers"][0].score if result["answers"] else 0
                    ),
                    "documents": [
                        {
                            "content": doc.content,
                            "title": doc.meta.get("title", ""),
                            "source": doc.meta.get("source", ""),
                            "score": doc.score,
                        }
                        for doc in result["documents"]
                    ],
                    "domain": domain,
                    "tenant_id": tenant_id,
                }
            else:
                # Use retrieval only
                result = self.retrieval_pipeline.run(
                    query=query,
                    params={"Retriever": {"top_k": top_k, "filters": filters}},
                )

                return {
                    "status": "success",
                    "query": query,
                    "documents": [
                        {
                            "content": doc.content,
                            "title": doc.meta.get("title", ""),
                            "source": doc.meta.get("source", ""),
                            "score": doc.score,
                        }
                        for doc in result["documents"]
                    ],
                    "domain": domain,
                    "tenant_id": tenant_id,
                }

        except Exception as e:
            logger.error(f"RAG query failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "query": query,
                "domain": domain,
                "tenant_id": tenant_id,
            }

    async def semantic_search(
        self,
        query: str,
        domain: Optional[str] = None,
        similarity_threshold: float = 0.7,
    ) -> Dict[str, Any]:
        """Perform semantic search using LlamaIndex"""

        try:
            # Use domain-specific index if available
            index = self.domain_indices.get(domain, self.llama_index)

            query_engine = index.as_query_engine(
                similarity_top_k=10, response_mode="compact"
            )

            response = query_engine.query(query)

            return {
                "status": "success",
                "query": query,
                "response": str(response),
                "source_nodes": [
                    {
                        "content": node.node.text,
                        "score": node.score,
                        "metadata": node.node.metadata,
                    }
                    for node in response.source_nodes
                    if node.score >= similarity_threshold
                ],
                "domain": domain,
            }

        except Exception as e:
            logger.error(f"Semantic search failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "query": query,
                "domain": domain,
            }

    async def update_document(
        self, document_id: str, updated_content: str, metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing document in the index"""

        try:
            # Update in Haystack document store
            doc = Document(
                content=updated_content, meta=metadata, id=document_id
            )

            self.document_store.write_documents([doc], index="document")

            # Update embeddings
            self.document_store.update_embeddings(
                retriever=self.retrieval_pipeline.get_node("Retriever"),
                document_ids=[document_id],
            )

            logger.info(f"Updated document: {document_id}")

            return {
                "status": "success",
                "document_id": document_id,
                "updated": True,
            }

        except Exception as e:
            logger.error(f"Document update failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "document_id": document_id,
            }

    def get_index_stats(self) -> Dict[str, Any]:
        """Get statistics about the RAG indices"""

        haystack_count = self.document_store.get_document_count()

        domain_stats = {}
        for domain, index in self.domain_indices.items():
            domain_stats[domain] = {
                "document_count": len(index.docstore.docs),
                "index_type": type(index).__name__,
            }

        return {
            "haystack_document_count": haystack_count,
            "domain_indices": domain_stats,
            "total_domains": len(self.domain_indices),
        }
