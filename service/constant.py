from ncoreparser import SearchParamType


MOVIES_PATH_NAME = "movies_path"
SERIES_PATH_NAME = "series_path"
MUSICS_PATH_NAME = "musics_path"
BOOKS_PATH_NAME = "books_path"
PROGRAMS_PATH_NAME = "programs_path"
GAMES_PATH_NAME = "games_path"
DEFAULT_PATH_NAME = "default_path"


DEFAULT_DEVICE_SETTINGS = [
    {"title": "Movies path", "value": "/movies", "name": MOVIES_PATH_NAME},
    {"title": "Series path", "value": "/series", "name": SERIES_PATH_NAME},
    {"title": "Musics path", "value": "/musics", "name": MUSICS_PATH_NAME},
    {"title": "Books path", "value": "/books", "name": BOOKS_PATH_NAME},
    {"title": "Programs path", "value": "/programs", "name": PROGRAMS_PATH_NAME},
    {"title": "Games path", "value": "/games", "name": GAMES_PATH_NAME},
    {"title": "Default path", "value": "/downloads", "name": DEFAULT_PATH_NAME},
]


def map_category_path(category: SearchParamType) -> str:
    path = None
    match category:
        case SearchParamType.SD_HUN:
            path = MOVIES_PATH_NAME
        case SearchParamType.SD:
            path = MOVIES_PATH_NAME
        case SearchParamType.DVD_HUN:
            path = MOVIES_PATH_NAME
        case SearchParamType.DVD:
            path = MOVIES_PATH_NAME
        case SearchParamType.DVD9_HUN:
            path = MOVIES_PATH_NAME
        case SearchParamType.DVD9:
            path = MOVIES_PATH_NAME
        case SearchParamType.HD_HUN:
            path = MOVIES_PATH_NAME
        case SearchParamType.HD:
            path = MOVIES_PATH_NAME
        case SearchParamType.SDSER_HUN:
            path = SERIES_PATH_NAME
        case SearchParamType.SDSER:
            path = SERIES_PATH_NAME
        case SearchParamType.DVDSER_HUN:
            path = SERIES_PATH_NAME
        case SearchParamType.DVDSER:
            path = SERIES_PATH_NAME
        case SearchParamType.HDSER_HUN:
            path = SERIES_PATH_NAME
        case SearchParamType.HDSER:
            path = SERIES_PATH_NAME
        case SearchParamType.MP3_HUN:
            path = MUSICS_PATH_NAME
        case SearchParamType.MP3:
            path = MUSICS_PATH_NAME
        case SearchParamType.LOSSLESS_HUN:
            path = MUSICS_PATH_NAME
        case SearchParamType.LOSSLESS:
            path = MUSICS_PATH_NAME
        case SearchParamType.CLIP:
            path = MUSICS_PATH_NAME
        case SearchParamType.GAME_ISO:
            path = GAMES_PATH_NAME
        case SearchParamType.GAME_RIP:
            path = GAMES_PATH_NAME
        case SearchParamType.CONSOLE:
            path = GAMES_PATH_NAME
        case SearchParamType.EBOOK_HUN:
            path = BOOKS_PATH_NAME
        case SearchParamType.EBOOK:
            path = BOOKS_PATH_NAME
        case SearchParamType.ISO:
            path = PROGRAMS_PATH_NAME
        case SearchParamType.MISC:
            path = PROGRAMS_PATH_NAME
        case SearchParamType.MOBIL:
            path = PROGRAMS_PATH_NAME
        case SearchParamType.XXX_IMG:
            path = DEFAULT_PATH_NAME
        case SearchParamType.XXX_SD:
            path = DEFAULT_PATH_NAME
        case SearchParamType.XXX_DVD:
            path = DEFAULT_PATH_NAME
        case SearchParamType.XXX_HD:
            path = DEFAULT_PATH_NAME
        case _:
            path = DEFAULT_PATH_NAME
    return path
