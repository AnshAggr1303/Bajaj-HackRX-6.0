import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import uvicorn

from .models import QueryRequest, QueryResponse
from .document_processor import DocumentProcessor
from .query_processor import QueryProcessor
from .vector_store import VectorStore
from .embedding_service import EmbeddingService

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Global variables for services
vector_store = None
embedding_service = None
document_processor = None
query_processor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    global vector_store, embedding_service, document_processor, query_processor
    
    try:
        logger.info("🚀 Starting Insurance Claim System...")
        
        # Initialize services
        embedding_service = EmbeddingService()
        vector_store = VectorStore()
        document_processor = DocumentProcessor(embedding_service, vector_store)
        query_processor = QueryProcessor(embedding_service, vector_store)
        
        # Process documents on startup
        await initialize_documents()
        
        logger.info("✅ System initialized successfully!")
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize system: {str(e)}")
        raise
    finally:
        logger.info("🛑 Shutting down system...")

async def initialize_documents():
    """Process and store documents on startup"""
    documents_dir = "documents"
    
    if not os.path.exists(documents_dir):
        logger.warning(f"📁 Documents directory not found: {documents_dir}")
        return
    
    pdf_files = [f for f in os.listdir(documents_dir) if f.endswith('.pdf')]
    
    if not pdf_files:
        logger.warning("📄 No PDF files found in documents directory")
        return
    
    logger.info(f"📚 Found {len(pdf_files)} PDF files: {pdf_files}")
    
    for pdf_file in pdf_files:
        try:
            file_path = os.path.join(documents_dir, pdf_file)
            logger.info(f"🔄 Processing {pdf_file}...")
            
            result = await document_processor.process_document(file_path, pdf_file)
            logger.info(f"✅ Processed {pdf_file}: {result['chunks_processed']} chunks")
            
        except Exception as e:
            logger.error(f"❌ Failed to process {pdf_file}: {str(e)}")

# Create FastAPI app
app = FastAPI(
    title="Insurance Claim Processing System",
    description="LLM-powered document processing for insurance claims",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Insurance Claim System is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Check if services are initialized
        services_status = {
            "embedding_service": embedding_service is not None,
            "vector_store": vector_store is not None,
            "document_processor": document_processor is not None,
            "query_processor": query_processor is not None
        }
        
        # Check document count in vector store
        doc_count = await vector_store.get_document_count() if vector_store else 0
        
        return {
            "status": "healthy",
            "services": services_status,
            "documents_processed": doc_count,
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="System unhealthy")

@app.post("/process-query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """Main endpoint to process insurance claim queries"""
    try:
        logger.info(f"🔍 Processing query: {request.query}")
        
        if not query_processor:
            raise HTTPException(status_code=500, detail="Query processor not initialized")
        
        # Process the query
        result = await query_processor.process_query(request.query)
        
        logger.info(f"✅ Query processed successfully. Decision: {result['decision']}")
        return QueryResponse(**result)
        
    except Exception as e:
        logger.error(f"❌ Query processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """Upload a new document for processing"""
    try:
        logger.info(f"📤 Uploading document: {file.filename}")
        
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Save uploaded file
        file_path = f"documents/{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process the document
        result = await document_processor.process_document(file_path, file.filename)
        
        logger.info(f"✅ Document uploaded and processed: {result['chunks_processed']} chunks")
        return {"message": "Document processed successfully", "chunks": result['chunks_processed']}
        
    except Exception as e:
        logger.error(f"❌ Document upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document upload failed: {str(e)}")

@app.get("/documents/status")
async def get_documents_status():
    """Get status of all processed documents"""
    try:
        if not vector_store:
            raise HTTPException(status_code=500, detail="Vector store not initialized")
        
        status = await vector_store.get_collection_info()
        logger.info("📊 Retrieved document status")
        return status
        
    except Exception as e:
        logger.error(f"❌ Failed to get document status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

if __name__ == "__main__":
    # Create necessary directories
    os.makedirs("logs", exist_ok=True)
    os.makedirs("documents", exist_ok=True)
    os.makedirs("chroma_db", exist_ok=True)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )