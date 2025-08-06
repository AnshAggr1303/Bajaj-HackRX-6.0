from pydantic import BaseModel
from typing import List, Optional, Any

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    response: str
    decision: str
    amount: Optional[str] = None  # Changed from float to str
    confidence: Optional[float] = None
    justification: Optional[str] = None
    referenced_clauses: Optional[List[str]] = None

class DocumentChunk(BaseModel):
    id: str
    text: str
    metadata: dict
    embedding: Optional[List[float]] = None

class ProcessingResult(BaseModel):
    chunks_processed: int
    document_name: str
    status: str
    message: str