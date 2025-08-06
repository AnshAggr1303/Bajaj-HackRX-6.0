# app/document_processor.py
import logging
import pdfplumber
import os
import time
from typing import List, Dict, Any
import uuid
from .models import DocumentChunk, ProcessingResult

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self, embedding_service, vector_store):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        # BETTER CHUNKING: Larger chunks with smart overlap
        self.chunk_size = 1500  # Increased from 1000
        self.chunk_overlap = 300  # Increased from 200

    async def process_document(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Process a PDF document and store it in vector database"""
        try:
            logger.info(f"📄 Starting to process document: {filename}")
            
            # Extract text from PDF using pdfplumber
            text_content = self._extract_text_from_pdf(file_path)
            if not text_content.strip():
                raise ValueError("No text content found in PDF")
            
            logger.info(f"📝 Extracted {len(text_content)} characters from {filename}")
            
            # Split into chunks with better strategy
            logger.info("🔪 Starting to split text into chunks...")
            chunks = self._split_text_into_chunks(text_content)
            logger.info(f"✂️ Split into {len(chunks)} chunks")
            
            # Process chunks in batches for faster embedding
            logger.info("🚀 Starting chunk processing...")
            processed_chunks = await self._process_chunks_in_batches(chunks, filename, file_path)
            logger.info(f"✅ Finished processing {len(processed_chunks)} chunks")
            
            # Store in vector database
            storage_start = time.time()
            await self.vector_store.add_documents(processed_chunks)
            storage_time = time.time() - storage_start
            logger.info(f"⏱️ Vector storage took {storage_time:.2f}s")
            logger.info(f"💾 Stored {len(processed_chunks)} chunks in vector database")
            
            return ProcessingResult(
                chunks_processed=len(processed_chunks),
                document_name=filename,
                status="success",
                message=f"Successfully processed {len(processed_chunks)} chunks"
            ).dict()
            
        except Exception as e:
            logger.error(f"❌ Document processing failed for {filename}: {str(e)}")
            return ProcessingResult(
                chunks_processed=0,
                document_name=filename,
                status="failed",
                message=f"Processing failed: {str(e)}"
            ).dict()

    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text content from PDF file using pdfplumber"""
        try:
            text_content = ""
            
            with pdfplumber.open(file_path) as pdf:
                logger.info(f"📊 Processing {len(pdf.pages)} pages")
                
                for page_num, page in enumerate(pdf.pages):
                    if page_num % 10 == 0:  # Log every 10 pages
                        logger.info(f"📄 Processing page {page_num + 1}/{len(pdf.pages)}")
                    
                    # Extract regular text
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n"
            
            return text_content.strip()
            
        except Exception as e:
            logger.error(f"❌ Failed to extract text from PDF: {str(e)}")
            raise

    async def _process_chunks_in_batches(self, chunks: List[str], filename: str, file_path: str) -> List[DocumentChunk]:
        """Process chunks in batches for faster embedding generation"""
        start_time = time.time()
        processed_chunks = []
        
        logger.info(f"🔄 Processing {len(chunks)} chunks with smaller model...")
        
        # Process all chunks at once using batch embedding
        try:
            embedding_start = time.time()
            logger.info(f"⚡ Generating embeddings for all {len(chunks)} chunks...")
            
            # Use the sync batch method (it's faster than individual async calls)
            embeddings = await self.embedding_service.generate_batch_embeddings(chunks)
            
            embedding_time = time.time() - embedding_start
            logger.info(f"⏱️ Embedding took {embedding_time:.2f}s ({len(chunks)/embedding_time:.1f} chunks/sec)")
            
            # Create DocumentChunk objects
            chunk_creation_start = time.time()
            for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                chunk = DocumentChunk(
                    id=str(uuid.uuid4()),
                    text=chunk_text,
                    metadata={
                        "source": filename,
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        "file_path": file_path,
                        "chunk_size": len(chunk_text)
                    },
                    embedding=embedding
                )
                processed_chunks.append(chunk)
            
            chunk_creation_time = time.time() - chunk_creation_start
            logger.info(f"⏱️ Chunk creation took {chunk_creation_time:.2f}s")
            
            total_time = time.time() - start_time
            logger.info(f"✅ Total processing time: {total_time:.2f}s for {len(processed_chunks)} chunks")
            
        except Exception as e:
            logger.error(f"❌ Failed to process chunks: {str(e)}")
            return []
        
        return processed_chunks

    def _split_text_into_chunks(self, text: str) -> List[str]:
        """IMPROVED: Split text into chunks with better context preservation"""
        chunks = []
        chunk_size = self.chunk_size
        overlap = self.chunk_overlap
        
        logger.info(f"🔪 Smart chunking {len(text)} characters (chunk_size: {chunk_size}, overlap: {overlap})")
        
        # Try to split on sentence boundaries when possible
        sentences = text.split('. ')
        current_chunk = ""
        
        for sentence in sentences:
            # If adding this sentence would exceed chunk size
            if len(current_chunk + sentence) > chunk_size:
                if current_chunk:  # Save current chunk if it has content
                    chunks.append(current_chunk.strip())
                    
                    # Start next chunk with overlap
                    words = current_chunk.split()
                    if len(words) > 20:  # Keep last few words for context
                        overlap_text = ' '.join(words[-20:])
                        current_chunk = overlap_text + " " + sentence
                    else:
                        current_chunk = sentence
                else:
                    # Single sentence is too long, force split
                    current_chunk = sentence
            else:
                if current_chunk:
                    current_chunk += ". " + sentence
                else:
                    current_chunk = sentence
        
        # Add the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # Fallback to simple splitting if sentence-based splitting failed
        if not chunks:
            logger.warning("⚠️ Sentence-based chunking failed, using simple sliding window")
            for i in range(0, len(text), chunk_size - overlap):
                chunk = text[i:i + chunk_size].strip()
                if chunk:
                    chunks.append(chunk)
        
        logger.info(f"✂️ Created {len(chunks)} chunks with improved strategy")
        return chunks