"""add salt to user table

Revision ID: 34c06fdd2bad
Revises: 7515b9b6fe7a
Create Date: 2024-10-12 11:00:01.889441

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '34c06fdd2bad'
down_revision: Union[str, None] = '7515b9b6fe7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
