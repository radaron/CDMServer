from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel

from service.constant import Instruction


class BaseData(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        model_dump_by_alias=True,
        use_enum_values=True,
    )

    def model_dump(self, **kwargs) -> dict:
        return super().model_dump(by_alias=True, **kwargs)

    def model_dump_snake_case(self, **kwargs) -> dict:
        return super().model_dump(by_alias=False, **kwargs)


class NewUserData(BaseData):
    email: EmailStr
    password: str
    is_admin: bool
    name: str


class ModifyMyData(BaseData):
    password: str | None = None
    name: str | None = None
    ncore_user: str | None = None
    ncore_pass: str | None = None


class LoginData(BaseData):
    email: EmailStr
    password: str
    keep_logged_in: bool = False


class MeData(BaseData):
    email: EmailStr
    is_admin: bool
    name: str
    ncore_user: str | None = None
    is_ncore_credential_set: bool


class UserData(BaseData):
    id: int
    email: EmailStr
    name: str


class NewDeviceData(BaseData):
    name: str


class EditDeviceData(BaseData):
    settings: dict[str, str]
    user_emails: list[str]


class DeviceData(BaseData):
    id: int
    name: str
    active: bool
    updated: int
    token: str
    settings: dict
    userEmails: list


class AddDownloadData(BaseData):
    torrent_id: int
    device_id: int


class TorrentData(BaseData):
    id: int
    title: str
    size: str
    seeders: str
    leechers: str
    category: str
    url: str
    available: list[int]


class TorrentStatusData(BaseData):
    id: int
    name: str
    status: str
    progress: int
    eta: int | None
    downloadDir: str
    totalSize: int
    detailsUrl: str | None = None


class StatusDataItem(BaseData):
    id: int
    name: str
    status: str
    progress: int
    download_dir: str
    added_date: int
    total_size: int
    eta: int | None
    is_deleted: bool = False
    tracker_id: int | None = None


class StatusData(BaseData):
    data: list[StatusDataItem]


class InstructionItemData(BaseData):
    torrent_id: int


class InstructionsData(BaseData):
    instructions: dict[Instruction, InstructionItemData]


class SearchResponseMeta(BaseData):
    total_pages: int = 0


class SearchResponseData(BaseData):
    torrents: list[dict] = []


class SearchResponse(BaseData):
    data: SearchResponseData
    meta: SearchResponseMeta


class TmdbMediaData(BaseData):
    tmdb_id: int
    imdb_id: str | None = None
    title: str
    overview: str = ""
    poster: str | None = None
    rating: float | None = None
    year: int | None = None
    media_type: str


class TmdbSearchResponseMeta(BaseData):
    total_pages: int = 0


class TmdbSearchResponse(BaseData):
    data: list[TmdbMediaData]
    meta: TmdbSearchResponseMeta


class TmdbPopularData(BaseData):
    movies: list[TmdbMediaData]
    tvs: list[TmdbMediaData]


class TmdbPopularResponse(BaseData):
    data: TmdbPopularData


class TmdbImdbResponse(BaseData):
    imdb_id: str | None = None
