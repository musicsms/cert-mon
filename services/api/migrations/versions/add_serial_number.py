"""add serial number column

Revision ID: add_serial_number
Revises: initial_migration
Create Date: 2024-12-11 11:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_serial_number'
down_revision = 'initial_migration'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('certificates', sa.Column('serial_number', sa.String(255), nullable=True))


def downgrade():
    op.drop_column('certificates', 'serial_number')
