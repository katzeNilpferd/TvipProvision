import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect

from infrastructure.websocket.connection_manager import connection_manager


class WebSocketService:
    """Service for handling WebSocket connections."""
    
    @staticmethod
    async def handle_connection(
        websocket: WebSocket,
        device_id: Optional[str] = None
    ) -> None:
        """
        Handle WebSocket connection lifecycle.
        
        Args:
            websocket: WebSocket connection
            device_id: Optional device ID to subscribe to
        """
        connection_id = str(uuid.uuid4())
        
        await connection_manager.connect(websocket, connection_id)
        
        await WebSocketService._send_connection_confirmation(
            websocket, connection_id
        )
        
        if device_id:
            await connection_manager.subscribe_to_device(connection_id, device_id)
        
        try:
            await WebSocketService._handle_client_messages(
                websocket, connection_id
            )
        except WebSocketDisconnect:
            pass
        finally:
            connection_manager.disconnect(connection_id)
    
    @staticmethod
    async def _send_connection_confirmation(
        websocket: WebSocket,
        connection_id: str
    ) -> None:
        """Send connection confirmation message."""

        await websocket.send_json({
            'type': 'connection',
            'message': 'Connected to statistics stream',
            'connection_id': connection_id,
            'timestamp': datetime.now(tz=timezone.utc).isoformat()
        })
    
    @staticmethod
    async def _handle_client_messages(
        websocket: WebSocket,
        connection_id: str
    ) -> None:
        """Handle incoming client messages."""
        while True:
            try:
                data = await websocket.receive_json()
                await WebSocketService._process_client_message(
                    data, connection_id, websocket
                )
            except WebSocketDisconnect:
                raise
            except Exception as e:
                await websocket.send_json({
                    'type': 'error',
                    'message': str(e),
                    'timestamp': datetime.now(tz=timezone.utc).isoformat()
                })
    
    @staticmethod
    async def _process_client_message(
        data: dict,
        connection_id: str,
        websocket: WebSocket
    ) -> None:
        """Process specific client commands."""
        action = data.get('action')
        
        if action == 'subscribe':
            device_id = data.get('device_id')
            if device_id:
                await connection_manager.subscribe_to_device(connection_id, device_id)
                await websocket.send_json({
                    'type': 'connection',
                    'message': f'Subscribed to device {device_id}',
                    'timestamp': datetime.now(tz=timezone.utc).isoformat()
                })
        
        elif action == 'unsubscribe':
            device_id = data.get('device_id')
            if device_id:
                await connection_manager.unsubscribe_from_device(connection_id, device_id)
                await websocket.send_json({
                    'type': 'connection',
                    'message': f'Unsubscribed from device {device_id}',
                    'timestamp': datetime.now(tz=timezone.utc).isoformat()
                })
        
        elif action == 'ping':
            await websocket.send_json({
                'type': 'pong',
                'timestamp': datetime.now(tz=timezone.utc).isoformat()
            })
        
        else:
            pass