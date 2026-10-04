"""
Server-Sent Events (SSE) for real-time match updates.
The frontend can connect to /api/v1/events/live to receive real-time score updates.
"""
import asyncio
import json
import logging
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.database import async_session
from app.services.data_service import get_matches

logger = logging.getLogger(__name__)

router = APIRouter()

# Store connected clients
connected_clients: set = set()


async def event_generator(request: Request):
    """Generate SSE events for live match updates."""
    connected_clients.add(id(request))
    logger.info(f"SSE client connected. Total clients: {len(connected_clients)}")

    try:
        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                break

            # Fetch live matches
            async with async_session() as db:
                live_data = await get_matches(db, status="live", limit=50)

            # Send event
            event_data = json.dumps({
                "type": "live_update",
                "matches": live_data.get("matches", []),
                "count": live_data.get("total", 0),
            })

            yield f"data: {event_data}\n\n"

            # Wait before next update
            await asyncio.sleep(30)  # 30 second polling interval for SSE

    except asyncio.CancelledError:
        pass
    finally:
        connected_clients.discard(id(request))
        logger.info(f"SSE client disconnected. Total clients: {len(connected_clients)}")


@router.get("/events/live")
async def live_events(request: Request):
    """SSE endpoint for live match updates."""
    return StreamingResponse(
        event_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
