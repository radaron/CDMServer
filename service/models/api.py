from typing import Any
from pydantic import BaseModel, EmailStr, ConfigDict, model_validator
from pydantic.alias_generators import to_camel, to_pascal


class BaseData(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, model_dump_by_alias=True)

    def model_dump(self, **kwargs) -> dict:
        return super().model_dump(by_alias=True, **kwargs)


class OmdbBaseData(BaseModel):
    model_config = ConfigDict(alias_generator=to_pascal, populate_by_name=True, model_dump_by_alias=True)

    def model_dump(self, **kwargs) -> dict:
        return super().model_dump(by_alias=True, **kwargs)

    @model_validator(mode="before")
    @classmethod
    def remapping_invalid_case(cls, data: Any) -> Any:
        new_data = {}
        if isinstance(data, dict):
            for key, value in data.items():
                match key:
                    case "imdbID":
                        new_data["imdb_id"] = value
                    case "imdbRating":
                        new_data["imdb_rating"] = value
                    case "imdbVotes":
                        new_data["imdb_votes"] = value
                    case "DVD":
                        new_data["dvd"] = value
                    case "totalResults":
                        new_data["total_results"] = value
                    case _:
                        new_data[key] = value
        return new_data


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


class TorrentStatusData(BaseData):
    id: int
    name: str
    status: str
    progress: int
    eta: int | None
    downloadDir: str
    totalSize: int


class StatusDataItem(BaseData):
    id: int
    name: str
    status: str
    progress: int
    download_dir: str
    added_date: int
    total_size: int
    eta: int | None


class StatusData(BaseData):
    data: list[StatusDataItem]


class OmdbRatingData(OmdbBaseData):
    source: str
    value: str


class OmdbMovieData(OmdbBaseData):
    title: str
    year: str
    rated: str
    released: str
    runtime: str
    genre: str
    director: str
    writer: str
    actors: str
    plot: str
    language: str
    country: str
    awards: str
    poster: str
    ratings: list[OmdbRatingData]
    metascore: str
    imdb_rating: str
    imdb_votes: str
    imdb_id: str
    type: str
    dvd: str | None = None
    box_office: str | None = None
    production: str | None = None
    website: str | None = None
    response: str


class OmdbSearchEntityData(OmdbBaseData):
    title: str
    year: str
    imdb_id: str
    type: str
    poster: str


class OmdbSearchData(OmdbBaseData):
    search: list[OmdbSearchEntityData] = []
    total_results: int = 0
    response: str


class OmdbSearchEntityResponse(BaseData):
    director: str
    imdb_id: str
    plot: str
    poster: str
    rating: str
    title: str
    year: str


class OmdbSearchResponseMeta(BaseData):
    total_pages: int = 0


class OmdbSearchResponse(BaseData):
    data: list[OmdbSearchEntityResponse]
    meta: OmdbSearchResponseMeta
