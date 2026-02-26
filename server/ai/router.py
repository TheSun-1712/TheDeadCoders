from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, ChatSession, ChatMessage, ManualReview, AutoBlocked, TrafficLog
from .Rag.retriever import RAGSystem
from .Rag.prompt_template import build_prompt
from .llm.ollama_client import generate_response
import json

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])

# Initialize RAG (lazy load or global)
try:
    rag = RAGSystem([], None) 
except Exception as e:
    print(f"Warning: RAG System failed to initialize: {e}")
    rag = None

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[int] = None

class Message(BaseModel):
    role: str
    content: str
    timestamp: datetime

class SessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: List[Message]

def get_db_context(db: Session, query: str) -> str:
    """Generates dynamic context from the database based on the query."""
    context = "System Data Overview:\n"
    query_lower = query.lower()

    # 1. Total Counts
    total_logs = db.query(TrafficLog).count()
    pending_reviews = db.query(ManualReview).filter(ManualReview.status == "PENDING").count()
    auto_blocked = db.query(AutoBlocked).count()
    context += f"- Total Traffic Logs: {total_logs}\n"
    context += f"- Pending Incidents: {pending_reviews}\n"
    context += f"- Auto-Blocked IPs: {auto_blocked}\n"

    # 2. Country-Specific Queries (e.g., "logs from China")
    # Fetch all distinct countries appearing in logs to check against query
    active_countries = db.query(TrafficLog.country).distinct().all()
    active_countries = [c[0] for c in active_countries if c[0]]
    
    for country in active_countries:
        if country.lower() in query_lower:
            count = db.query(TrafficLog).filter(TrafficLog.country == country).count()
            context += f"\n[Specific Query Match]\n- Logs from {country}: {count}\n"
            
            # Add recent logs from this country
            recent = db.query(TrafficLog).filter(TrafficLog.country == country).order_by(TrafficLog.timestamp.desc()).limit(3).all()
            if recent:
                context += f"- Recent activity from {country}:\n"
                for r in recent:
                     context += f"  - {r.timestamp}: {r.type} (IP: {r.src_ip})\n"
            break

    # 3. Recent Activity (if no specific country found or general query)
    context += "\nRecent System Activity (Last 5):\n"
    recent_logs = db.query(TrafficLog).order_by(TrafficLog.timestamp.desc()).limit(5).all()
    for log in recent_logs:
        context += f"- {log.timestamp}: {log.type} from {log.country} (IP: {log.src_ip})\n"
        
    return context

@router.post("/chat")
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    # 1. Create or Get Session
    session_id = req.session_id
    if not session_id:
        new_session = ChatSession(title=req.query[:30] + "...")
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        session_id = new_session.id
    
    # 2. Save User Message
    user_msg = ChatMessage(session_id=session_id, role="user", content=req.query)
    db.add(user_msg)
    db.commit()

    # Generator function for streaming
    def stream_logic():
        full_response = ""
        
        # Simple Logic Keywords
        query_lower = req.query.lower()
        if "latest incidents" in query_lower or "recent attacks" in query_lower:
            incidents = db.query(ManualReview).order_by(ManualReview.timestamp.desc()).limit(5).all()
            if not incidents:
               chunk = "I couldn't find any recent incidents."
               full_response += chunk
               yield chunk
            else:
                chunk = "Here are the latest incidents:\n"
                full_response += chunk
                yield chunk
                for i in incidents:
                    line = f"- **{i.type}** from {i.country} (IP: {i.src_ip}) - Confidence: {int(i.confidence*100)}%\n"
                    full_response += line
                    yield line

        elif "block" in query_lower and "ip" in query_lower:
             chunk = "To block an IP, please use the 'Review Now' button on the dashboard. I can't execute blocks directly yet, but I can help you analyze the threat."
             full_response += chunk
             yield chunk

        else:
            # LLM Streaming
            try:
                db_context = get_db_context(db, req.query)
                full_prompt = f"""
                You are a Security Operations Center (SOC) Master AI Assistant.
                {db_context}
                User Query: {req.query}
                Instructions:
                - Analyze the provided System Data to answer the query.
                - If specific country data is shown, use it.
                - If the user asks about "logs from [Country]", look at the [Specific Query Match] section.
                - Be concise and professional.
                """
                
                for chunk in generate_response(full_prompt):
                    full_response += chunk
                    yield chunk
                    
            except Exception as e:
                err = f"Error: {str(e)}"
                full_response += err
                yield err

        # 4. Save AI Response (After stream completes)
        # We need a new DB session because the generator runs outside the request context scope optionally
        # But here we are yielding, so we can likely use the same DB if careful, or just create a new one.
        # For simplicity in this generator, we'll try to re-use or just accept we might need to fix DB closure.
        # Ideally, we save *after* the yield loop.
        
        try:
            # Re-acquire session for saving final message if needed, or use the existing one if still valid.
            # Ideally depends sets up session closing. 
            # We'll assume db is still open or we open a new one.
            from database import SessionLocal
            db_save = SessionLocal()
            ai_msg = ChatMessage(session_id=session_id, role="ai", content=full_response)
            db_save.add(ai_msg)
            db_save.commit()
            db_save.close()
        except Exception as e:
            print(f"Failed to save chat history: {e}")

        # Send Session ID as a final meta-event or just assume client has it?
        # A common customized SSE pattern is JSON chunks. 
        # But to keep it simple text stream, we won't send JSON unless we wrap everything.
        # Let's send a special delimiter or just rely on client knowing the session ID if it was passed.
        # If new session, we need to tell client.
        # Hack: Send session ID in a header? FastAPI StreamingResponse supports headers.

    return StreamingResponse(stream_logic(), media_type="text/plain", headers={"X-Session-Id": str(session_id)})

@router.get("/history", response_model=List[SessionResponse])
def get_history(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).order_by(ChatSession.created_at.desc()).limit(10).all()
    result = []
    for s in sessions:
        msgs = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).order_by(ChatMessage.timestamp).all()
        result.append({
            "id": s.id,
            "title": s.title,
            "created_at": s.created_at,
            "messages": [{"role": m.role, "content": m.content, "timestamp": m.timestamp} for m in msgs]
        })
    return result
