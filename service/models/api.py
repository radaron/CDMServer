from pydantic import BaseModel, EmailStr, ConfigDict
from pydantic.alias_generators import to_camel


class BaseData(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, model_dump_by_alias=True)

    def model_dump(self, **kwargs):
        return super().model_dump(by_alias=True, **kwargs)


class NewUserData(BaseData):
    email: EmailStr
    password: str
    is_admin: bool
    name: str = ""


class LoginData(BaseData):
    email: EmailStr
    password: str


class MeData(BaseData):
    email: EmailStr
    is_admin: bool
    name: str


class NewDeviceData(BaseData):
    name: str
