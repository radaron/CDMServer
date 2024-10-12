"""empty message

Revision ID: 795f68d7b7df
Revises: 34c06fdd2bad
Create Date: 2024-10-12 11:25:46.849980

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '795f68d7b7df'
down_revision: Union[str, None] = '34c06fdd2bad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
