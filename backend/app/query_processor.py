# app/query_processor.py
import os
import logging
import google.generativeai as genai
from typing import Dict, Any, List
import json
import re

# ✅ Configure Gemini authentication here
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

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
            
            # Search for MORE relevant documents (increased from 5 to 12)
            relevant_docs = await self.vector_store.search_similar(
                query_embedding, 
                top_k=12  # More context for better decisions
            )
            
            logger.info(f"📄 Found {len(relevant_docs)} relevant documents")
            
            # Generate decision using LLM
            decision_result = await self._generate_decision(query, relevant_docs)
            
            logger.info(f"✅ Generated decision: {decision_result['decision']}")
            return decision_result
            
        except Exception as e:
            logger.error(f"❌ Query processing failed: {str(e)}")
            raise

    async def _generate_decision(self, query: str, relevant_docs: List[Dict]) -> Dict[str, Any]:
        """Generate insurance claim decision using Gemini"""
        try:
            # Prepare context from relevant documents
            context = self._prepare_context(relevant_docs)
            
            # Create prompt
            prompt = self._create_decision_prompt(query, context)
            
            # Generate response using Gemini
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            
            # Parse the response
            result = self._parse_llm_response(response.text, relevant_docs)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Decision generation failed: {str(e)}")
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
        """Create LESS CONSERVATIVE decision prompt for the LLM"""
        return f"""
You are an expert insurance claim processor. Analyze the following insurance claim and make a practical decision based on the provided policy documents.

CLAIM QUERY: {query}

RELEVANT POLICY DOCUMENTS:
{context}

IMPORTANT INSTRUCTIONS:
- Make decisions based on the available information in the documents
- If coverage is mentioned for the type of treatment, assume it's COVERED unless explicitly excluded
- For waiting periods: If not specifically mentioned for the condition, assume standard waiting periods apply
- For amounts: If no specific sub-limits are mentioned, assume treatment is covered up to policy limits
- Only mark as "Undecided" if there are clear contradictions or major missing information

Your task is to:
1. Decide whether to APPROVE, REJECT, or mark as UNDECIDED (prefer approval if coverage exists)
2. If approved, provide a reasonable estimate based on typical costs (mention this is an estimate)
3. Provide clear justification referencing specific policy sections
4. List the referenced clauses
5. Provide a confidence score (0.0 to 1.0)

Please respond in the following JSON format:
{{
    "decision": "Approved/Rejected/Undecided",
    "amount": null or estimated_amount_in_INR,
    "justification": "Clear explanation with policy references and reasoning",
    "referenced_clauses": ["clause 1", "clause 2"],
    "confidence_score": 0.0_to_1.0
}}

Decision Logic:
- APPROVE: If treatment type is covered and no explicit exclusions apply
- REJECT: If explicitly excluded or contraindicated
- UNDECIDED: Only if major policy information is missing or contradictory

Be practical and helpful - insurance should cover legitimate medical needs unless clearly excluded.
"""

    def _parse_llm_response(self, response_text: str, relevant_docs: List[Dict]) -> Dict[str, Any]:
        """Parse LLM response into structured format"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            
            if json_match:
                json_str = json_match.group()
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
            "justification": response_text[:500] + "..." if len(response_text) > 500 else response_text,
            "referenced_clauses": [],
            "confidence_score": 0.3,
            "additional_info": {
                "documents_consulted": len(relevant_docs),
                "parsing_method": "fallback",
                "sources": list(set([doc.get('metadata', {}).get('source', 'Unknown') 
                               for doc in relevant_docs]))
            }
        }