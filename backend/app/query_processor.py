# app/query_processor.py
import os
import logging
import google.generativeai as genai
from typing import Dict, Any, List
import json
import re
from dotenv import load_dotenv
from .models import QueryResponse

# Load environment variables
load_dotenv()

# Configure API
api_key = None
possible_keys = ['GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_AI_KEY']

for key_name in possible_keys:
    api_key = os.getenv(key_name)
    if api_key:
        print(f"✅ Found API key in environment variable: {key_name}")
        break

if api_key:
    try:
        genai.configure(api_key=api_key)
        print("✅ Gemini API configured successfully")
    except Exception as e:
        print(f"❌ Failed to configure Gemini API: {str(e)}")
else:
    print("❌ Cannot configure Gemini API - no valid API key found")

logger = logging.getLogger(__name__)

class QueryProcessor:
    def __init__(self, embedding_service, vector_store):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.model_name = "gemini-2.0-flash"

    async def process_query(self, query: str) -> Dict[str, Any]:
        """Process insurance claim query and return decision"""
        try:
            logger.info(f"🔍 Processing query: {query}")
            
            # Generate query embedding
            query_embedding = await self.embedding_service.generate_query_embedding(query)
            
            # Search for relevant documents
            relevant_docs = await self.vector_store.search_similar(
                query_embedding, 
                top_k=15)
            
            logger.info(f"📄 Found {len(relevant_docs)} relevant documents")

            # Debug: Log first few retrieved documents
            for i, doc in enumerate(relevant_docs[:3]):
                logger.info(f"📄 Doc {i+1} (similarity: {doc.get('similarity', 0):.3f}): {doc.get('text', '')[:200]}...")
            
            # Filter out very low similarity results
            filtered_docs = [doc for doc in relevant_docs if doc.get('similarity', 0) > 0.4]
            logger.info(f"📄 Filtered to {len(filtered_docs)} docs with similarity > 0.4")
            
            if not filtered_docs:
                logger.warning("⚠️ No high-similarity documents found, using all results")
                filtered_docs = relevant_docs

            # Use filtered_docs instead of relevant_docs for context
            result = await self._generate_decision(query, filtered_docs)
            
            clean_result = self._create_clean_response(result)
            logger.info(f"✅ Decision: {result['decision']}, Confidence: {result.get('confidence_score', 0)}")
            logger.info(f"📄 Referenced sources: {result.get('referenced_clauses', [])}")
            return clean_result
            
        except Exception as e:
            logger.error(f"❌ Query processing failed: {str(e)}")
            raise

    async def _generate_decision(self, query: str, relevant_docs: List[Dict]) -> Dict[str, Any]:
        """Generate insurance claim decision using Gemini"""
        try:
            # Check if we have API key configured
            if not api_key:
                logger.error("❌ No API key available for Gemini")
                return {
                    "decision": "Undecided",
                    "amount": None,
                    "justification": "API key not configured for LLM processing",
                    "referenced_clauses": [],
                    "confidence_score": 0.0
                }
            
            # Prepare context from relevant documents
            context = self._prepare_context(relevant_docs)
            
            # Create prompt
            prompt = self._create_decision_prompt(query, context)
            
            print(f"🚀 Attempting to call Gemini API with model: {self.model_name}")
            
            # Generate response using Gemini
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)

            # Add debug prints for the raw Gemini response and the context
            print(f"🔍 Raw Gemini response: {response.text}")
            print(f"📄 Context sent to Gemini (first 500 chars): {context[:500]}")
            
            print("✅ Successfully received response from Gemini")
            
            # Parse the response
            result = self._parse_llm_response(response.text, relevant_docs)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Decision generation failed: {str(e)}")
            print(f"❌ Full error details: {str(e)}")
            return {
                "decision": "Undecided",
                "amount": None,
                "justification": f"Error processing claim: {str(e)}",
                "referenced_clauses": [],
                "confidence_score": 0.0
            }

    def _prepare_context(self, relevant_docs: List[Dict]) -> str:
        """Prepare context from relevant documents"""
        context_parts = []
        
        for i, doc in enumerate(relevant_docs):
            similarity_score = doc.get('similarity', 0)
            source = doc.get('metadata', {}).get('source', 'Unknown')
            text = doc.get('text', '')
            
            context_parts.append(
                f"Document {i+1} (Similarity: {similarity_score:.2f}, Source: {source}):\n{text}\n"
            )
        
        return "\n".join(context_parts)

    def _create_decision_prompt(self, query: str, context: str) -> str:
        return f"""Answer this insurance query using the provided policy documents.
QUERY: {query}
POLICY DOCUMENTS:
{context}
Provide a direct, specific answer to the question asked.Respond in JSON format:
{{
    "decision": "Approved/Rejected/Undecided",
    "amount": null,
    "justification": "Direct answer with specific details from documents",
    "referenced_clauses": ["relevant sections"],
    "confidence_score": 0.9
}}
For waiting period questions, include the exact time period.
Never use 'undefined' - always provide the specific answer found in documents."""

    def _parse_llm_response(self, response_text: str, relevant_docs: List[Dict]) -> Dict[str, Any]:
        """Parse LLM response into structured format"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            
            if json_match:
                json_str = json_match.group()
                print(f"🔍 Extracted JSON string: {json_str}")
                result = json.loads(json_str)
                
                # Validate and clean the result
                cleaned_result = {
                    "decision": result.get("decision", "Undecided"),
                    "amount": result.get("amount"),
                    "justification": result.get("justification", "No justification provided"),
                    "referenced_clauses": result.get("referenced_clauses", []),
                    "confidence_score": result.get("confidence_score", 0.5)
                }
                
                # Add additional info
                cleaned_result["additional_info"] = {
                    "documents_consulted": len(relevant_docs),
                    "sources": list(set([doc.get('metadata', {}).get('source', 'Unknown') 
                                       for doc in relevant_docs]))
                }
                
                return cleaned_result
            
            else:
                # Fallback parsing if JSON not found
                logger.warning("⚠️ Could not extract JSON from LLM response, using fallback parsing")
                return self._fallback_parsing(response_text, relevant_docs)
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing failed: {str(e)}")
            return self._fallback_parsing(response_text, relevant_docs)
        except Exception as e:
            logger.error(f"❌ Response parsing failed: {str(e)}")
            return self._fallback_parsing(response_text, relevant_docs)

    def _fallback_parsing(self, response_text: str, relevant_docs: List[Dict]) -> Dict[str, Any]:
        """Fallback parsing when JSON extraction fails"""
        decision = "Undecided"
        
        # Simple keyword matching for decision
        response_lower = response_text.lower()
        if "approved" in response_lower or "approve" in response_lower:
            decision = "Approved"
        elif "rejected" in response_lower or "reject" in response_lower:
            decision = "Rejected"
        
        return {
            "decision": decision,
            "amount": None,
            "justification": f"FALLBACK PARSING - Raw response: {response_text[:300]}...",
            "referenced_clauses": [],
            "confidence_score": 0.3,
            "additional_info": {
                "documents_consulted": len(relevant_docs),
                "parsing_method": "fallback",
                "sources": list(set([doc.get('metadata', {}).get('source', 'Unknown') 
                               for doc in relevant_docs]))
            }
        }

    def _create_clean_response(self, llm_result: Dict) -> Dict:
        """Return clean response without extra formatting"""
        justification = llm_result.get("justification", "No response available")
        
        response = justification if justification != "undefined" else "LLM returned undefined"
        
        return {
            "response": response,
            "decision": llm_result.get("decision", "Undecided"),
            "amount": llm_result.get("amount"),
            "confidence": llm_result.get("confidence_score", 0.0),
            "justification": justification,
            "referenced_clauses": llm_result.get("referenced_clauses", [])
        }