import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket


class ConnectionManager:
    """Manages active WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # connection_id -> WebSocket
        self.device_subscriptions: Dict[str, Set[str]] = {} # device_id -> set of connection_ids
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, connection_id: str) -> None:
        """Accept and register new connection."""
        await websocket.accept()
        async with self._lock:
            self.active_connections[connection_id] = websocket
    
    def disconnect(self, connection_id: str) -> None:
        """Disconnect and remove connection."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        # Remove from all subscriptions
        for device_ids in self.device_subscriptions.copy():
            self.device_subscriptions[device_ids].discard(connection_id)
            
            if not self.device_subscriptions[device_ids]:  # Clean up empty subscription sets
                del self.device_subscriptions[device_ids]
    
    async def subscribe_to_device(self, connection_id: str, device_id: str) -> None:
        """Subscribe connection to specific device updates."""
        async with self._lock:
            if device_id not in self.device_subscriptions:
                self.device_subscriptions[device_id] = set()
            self.device_subscriptions[device_id].add(connection_id)
    
    async def unsubscribe_from_device(self, connection_id: str, device_id: str) -> None:
        """Unsubscribe connection from device updates."""
        async with self._lock:
            if device_id in self.device_subscriptions:
                self.device_subscriptions[device_id].discard(connection_id)
    
    async def send_to_connection(self, connection_id: str, message: dict[str, Any]) -> bool:
        """Send message to specific connection."""
        if connection_id not in self.active_connections:
            return False
        
        try:
            await self.active_connections[connection_id].send_json(message)
            return True
        except Exception:
            # Connection might be closed
            self.disconnect(connection_id)
            return False
    
    async def broadcast_to_device(self, device_id: str, message: dict[str, Any]) -> int:
        """Broadcast message to all connections subscribed to device.
        
        Returns number of successful sends.
        """
        if device_id not in self.device_subscriptions:
            return 0
        
        success_count = 0
        for connection_id in self.device_subscriptions[device_id].copy():
            if await self.send_to_connection(connection_id, message):
                success_count += 1
        
        return success_count
    
    async def broadcast_all(self, message: dict[str, Any]) -> int:
        """Broadcast message to all connected clients.
        
        Returns number of successful sends.
        """
        success_count = 0
        for connection_id in self.active_connections.copy():
            if await self.send_to_connection(connection_id, message):
                success_count += 1
        
        return success_count
    
    async def get_subscribed_device_ids(self) -> Set[str]:
        """Get set of device IDs that have active subscriptions."""
        async with self._lock:
            return set(self.device_subscriptions.keys())
    
    def get_connection_count(self) -> int:
        """Get total number of active connections."""
        return len(self.active_connections)
    
    def get_subscriber_count(self, device_id: str) -> int:
        """Get number of subscribers for specific device."""
        if device_id not in self.device_subscriptions:
            return 0
        return len(self.device_subscriptions[device_id])


# Global connection manager instance
connection_manager = ConnectionManager()
