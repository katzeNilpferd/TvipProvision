"""Add default root user

Revision ID: 65a7c66eac3f
Revises: f627a9fbbb14
Create Date: 2026-02-02 23:30:59.056258

"""
from typing import Sequence, Union
import bcrypt
import uuid

from alembic import op
import sqlalchemy as sa

from config import settings

# revision identifiers, used by Alembic.
revision: str = '65a7c66eac3f'
down_revision: Union[str, Sequence[str], None] = 'f627a9fbbb14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

USERNAME = settings.default_username
PASSWORD = settings.default_password


def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')


def upgrade() -> None:
    """Upgrade schema."""

    users = sa.table(
        'users',
        sa.column('id', sa.UUID()),
        sa.column('username', sa.String()),
        sa.column('hashed_password', sa.String()),
        sa.column('is_active', sa.Boolean()),
        sa.column('is_admin', sa.Boolean()),
        sa.column('is_root', sa.Boolean())
    )

    op.execute("DELETE FROM users WHERE is_root = True")

    op.bulk_insert(
        users,
        [
            {
                'id': str(uuid.uuid4()),
                'username': USERNAME,
                'hashed_password': hash_password(PASSWORD),
                'is_active': True,
                'is_admin': True,
                'is_root': True
            }
        ]
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM users WHERE is_root = True")
