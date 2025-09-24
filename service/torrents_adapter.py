from enum import Enum
from pydantic import BaseModel
import redis.asyncio as redis
from service.util.configuration import REDIS_HOST, REDIS_PORT


EXPIRATION_TIME = 60  # 60 seconds


class TorrentStatus(BaseModel):
    id: int
    name: str
    status: str
    progress: int
    download_dir: str
    added_date: int
    total_size: int
    eta: int | None


class SortOrder(Enum):
    ASC = "asc"
    DESC = "desc"


class TorrentsAdapter:
    def __init__(self):
        self.redis_url = f"redis://{REDIS_HOST}:{REDIS_PORT}"

    async def set_torrent(self, device_id: int, torrent: TorrentStatus) -> None:
        """
        Stores torrent data in a hash and its ID in a sorted set for ordering.
        """
        async with redis.from_url(self.redis_url) as redis_client:
            hash_key = f"client:{device_id}:torrents:{torrent.id}"
            sorted_set_key = f"client:{device_id}:torrent_order"

            await redis_client.set(hash_key, torrent.model_dump_json(), ex=EXPIRATION_TIME)
            await redis_client.zadd(sorted_set_key, {torrent.id: torrent.added_date})

            await redis_client.expire(sorted_set_key, EXPIRATION_TIME)

    async def get_torrents(self, device_id: int, order: SortOrder = SortOrder.ASC) -> list[TorrentStatus]:
        """
        Retrieves torrents in the specified order using a sorted set and hash.
        """
        async with redis.from_url(self.redis_url) as redis_client:
            sorted_set_key = f"client:{device_id}:torrent_order"

            order_map = {
                SortOrder.ASC: redis_client.zrange,
                SortOrder.DESC: redis_client.zrevrange,
            }
            torrent_ids = await order_map[order](sorted_set_key, 0, -1)

            torrents = []
            for torrent_id in torrent_ids:
                hash_key = f"client:{device_id}:torrents:{torrent_id.decode()}"
                torrent_data = await redis_client.get(hash_key)
                if torrent_data:
                    torrents.append(TorrentStatus.model_validate_json(torrent_data))

            return torrents
