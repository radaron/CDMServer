from pydantic import BaseModel, EmailStr, ConfigDict
from pydantic.alias_generators import to_camel


class BaseData(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, model_dump_by_alias=True)

    def model_dump(self, **kwargs) -> dict:
        return super().model_dump(by_alias=True, **kwargs)


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
