from ncoreparser import SearchParamType


MOVIES_PATH_NAME = "movies_path"
SERIES_PATH_NAME = "series_path"
MUSICS_PATH_NAME = "musics_path"
BOOKS_PATH_NAME = "books_path"
PROGRAMS_PATH_NAME = "programs_path"
GAMES_PATH_NAME = "games_path"
DEFAULT_PATH_NAME = "default_path"


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
    {
        "title": "Books path",
        "value": "/books",
        "name": BOOKS_PATH_NAME
    },
    {
        "title": "Programs path",
        "value": "/programs",
        "name": PROGRAMS_PATH_NAME
    },
    {
        "title": "Games path",
        "value": "/games",
        "name": GAMES_PATH_NAME
    },
    {
        "title": "Default path",
        "value": "/downloads",
        "name": DEFAULT_PATH_NAME
    }
]


def map_category_path(category: SearchParamType) -> str:
    match category:
        case SearchParamType.SD_HUN:
            return MOVIES_PATH_NAME
        case SearchParamType.SD:
            return MOVIES_PATH_NAME
        case SearchParamType.DVD_HUN:
            return MOVIES_PATH_NAME
        case SearchParamType.DVD:
            return MOVIES_PATH_NAME
        case SearchParamType.DVD9_HUN:
            return MOVIES_PATH_NAME
        case SearchParamType.DVD9:
            return MOVIES_PATH_NAME
        case SearchParamType.HD_HUN:
            return MOVIES_PATH_NAME
        case SearchParamType.HD:
            return MOVIES_PATH_NAME
        case SearchParamType.SDSER_HUN:
            return SERIES_PATH_NAME
        case SearchParamType.SDSER:
            return SERIES_PATH_NAME
        case SearchParamType.DVDSER_HUN:
            return SERIES_PATH_NAME
        case SearchParamType.DVDSER:
            return SERIES_PATH_NAME
        case SearchParamType.HDSER_HUN:
            return SERIES_PATH_NAME
        case SearchParamType.HDSER:
            return SERIES_PATH_NAME
        case SearchParamType.MP3_HUN:
            return MUSICS_PATH_NAME
        case SearchParamType.MP3:
            return MUSICS_PATH_NAME
        case SearchParamType.LOSSLESS_HUN:
            return MUSICS_PATH_NAME
        case SearchParamType.LOSSLESS:
            return MUSICS_PATH_NAME
        case SearchParamType.CLIP:
            return MUSICS_PATH_NAME
        case SearchParamType.GAME_ISO:
            return GAMES_PATH_NAME
        case SearchParamType.GAME_RIP:
            return GAMES_PATH_NAME
        case SearchParamType.CONSOLE:
            return GAMES_PATH_NAME
        case SearchParamType.EBOOK_HUN:
            return BOOKS_PATH_NAME
        case SearchParamType.EBOOK:
            return BOOKS_PATH_NAME
        case SearchParamType.ISO:
            return PROGRAMS_PATH_NAME
        case SearchParamType.MISC:
            return PROGRAMS_PATH_NAME
        case SearchParamType.MOBIL:
            return PROGRAMS_PATH_NAME
        case SearchParamType.XXX_IMG:
            return DEFAULT_PATH_NAME
        case SearchParamType.XXX_SD:
            return DEFAULT_PATH_NAME
        case SearchParamType.XXX_DVD:
            return DEFAULT_PATH_NAME
        case SearchParamType.XXX_HD:
            return DEFAULT_PATH_NAME
        case _:
            return DEFAULT_PATH_NAME
    return None
