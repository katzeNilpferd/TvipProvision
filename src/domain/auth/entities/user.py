from dataclasses import dataclass, field
from uuid import UUID, uuid4


@dataclass
class User():
    '''Domain entity representing a user.'''

    username: str
    hashed_password: str
    is_active: bool = True
    is_admin: bool = False
    id: UUID = field(default_factory=uuid4)
