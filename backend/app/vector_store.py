# app/vector_store.py
import logging
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import os
from .models import DocumentChunk

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self):
        self.chroma_db_path = os.getenv("CHROMA_DB_PATH", "./chroma_db")
        self.collection_name = "insurance_documents"
        self.client = None
        self.collection = None
        self._initialize_chroma()

    def _initialize_chroma(self):
        """Initialize ChromaDB client and collection"""
        try:
            logger.info(f"🔧 Initializing ChromaDB at: {self.chroma_db_path}")
            
            # Create ChromaDB client
            self.client = chromadb.PersistentClient(
                path=self.chroma_db_path,
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "Insurance policy documents"}
            )
            
            logger.info(f"✅ ChromaDB initialized. Collection: {self.collection_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize ChromaDB: {str(e)}")
            raise

    async def add_documents(self, chunks: List[DocumentChunk]):
        """Add document chunks to vector store"""
        try:
            if not chunks:
                logger.warning("⚠️ No chunks to add")
                return
            
            logger.info(f"💾 Adding {len(chunks)} chunks to vector store")
            
            # Prepare data for ChromaDB
            ids = [chunk.id for chunk in chunks]
            embeddings = [chunk.embedding for chunk in chunks]
            documents = [chunk.text for chunk in chunks]
            metadatas = [chunk.metadata for chunk in chunks]
            
            # Add to collection
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            
            logger.info(f"✅ Successfully added {len(chunks)} chunks to vector store")
            
        except Exception as e:
            logger.error(f"❌ Failed to add documents to vector store: {str(e)}")
            raise

    async def search_similar(self, query_embedding: List[float], top_k: int = 5) -> List[Dict]:
        """Search for similar documents using embedding"""
        try:
            logger.debug(f"🔍 Searching for {top_k} similar documents")
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=['documents', 'metadatas', 'distances']
            )
            
            # Format results
            formatted_results = []
            if results['documents'] and results['documents'][0]:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        'text': results['documents'][0][i],
                        'metadata': results['metadatas'][0][i],
                        'similarity': 1 - results['distances'][0][i]  # Convert distance to similarity
                    })
            
            logger.debug(f"✅ Found {len(formatted_results)} similar documents")
            return formatted_results
            
        except Exception as e:
            logger.error(f"❌ Vector search failed: {str(e)}")
            raise

    async def get_document_count(self) -> int:
        """Get total number of documents in collection"""
        try:
            count = self.collection.count()
            return count
        except Exception as e:
            logger.error(f"❌ Failed to get document count: {str(e)}")
            return 0

    async def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection"""
        try:
            count = await self.get_document_count()
            return {
                "collection_name": self.collection_name,
                "document_count": count,
                "status": "active"
            }
        except Exception as e:
            logger.error(f"❌ Failed to get collection info: {str(e)}")
            return {"status": "error", "message": str(e)}