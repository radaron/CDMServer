from ncoreparser import SearchParamType


MOVIES_PATH_NAME = "movies_path"
SERIES_PATH_NAME = "series_path"
MUSICS_PATH_NAME = "musics_path"


DEFAULT_DEVICE_SETTINGS = [
    {
        "title": "Movies path",
        "value": "/movies",
        "name": MOVIES_PATH_NAME
    },
    {
        "title": "Series path",
        "value": "/series",
        "name": SERIES_PATH_NAME
    },
    {
        "title": "Musics path",
        "value": "/musics",
        "name": MOVIES_PATH_NAME
    },
]


def map_category_path(category: SearchParamType) -> str:
    if category in [SearchParamType.SD_HUN, SearchParamType.SD]:
        return MOVIES_PATH_NAME
    return None
