"""Add default config

Revision ID: f627a9fbbb14
Revises: deca2ebbf069
Create Date: 2026-02-02 23:13:23.169207

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f627a9fbbb14'
down_revision: Union[str, Sequence[str], None] = 'deca2ebbf069'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    provision_configs = sa.table(
        'provision_configs',
        sa.column('id', sa.UUID()),
        sa.column('config_json', sa.Text()),
        sa.column('config_type', sa.String()),
        sa.column('description', sa.Text())
    )

    op.execute("DELETE FROM provision_configs WHERE config_type IN ('default')")
    
    op.bulk_insert(
        provision_configs,
        [
            {
                'id': str(uuid.uuid4()),
                'config_json': '{"provision": {"@reload": "3600", "provision_server": {"@name": ""}, "operator": {"@name": ""}, "syslog_host": {"@name": ""}}}',
                'config_type': 'default',
                'description': 'Default configuration for all devices'
            }
        ]
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM provision_configs WHERE config_type IN ('default')")

