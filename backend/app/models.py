from pydantic import BaseModel
from typing import List, Optional, Any

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    decision: str  # "Approved", "Rejected", "Undecided"
    amount: Optional[float] = None
    justification: str
    referenced_clauses: List[str]
    confidence_score: Optional[float] = None
    additional_info: Optional[dict] = None

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