from ncoreparser import SearchParamType


MOVIES_PATH_NAME = "movies_path"
SERIES_PATH_NAME = "series_path"
MUSICS_PATH_NAME = "musics_path"
BOOKS_PATH_NAME = "books_path"
PROGRAMS_PATH_NAME = "programs_path"
GAMES_PATH_NAME = "games_path"
DEFAULT_PATH_NAME = "default_path"


DEFAULT_DEVICE_SETTINGS = {
    MOVIES_PATH_NAME: "/movies",
    SERIES_PATH_NAME: "/series",
    MUSICS_PATH_NAME: "/musics",
    BOOKS_PATH_NAME: "/books",
    PROGRAMS_PATH_NAME: "/programs",
    GAMES_PATH_NAME: "/games",
    DEFAULT_PATH_NAME: "/downloads",
}


def map_category_path(category: SearchParamType) -> str:
    category_map = {
        # Movies
        SearchParamType.SD_HUN: MOVIES_PATH_NAME,
        SearchParamType.SD: MOVIES_PATH_NAME,
        SearchParamType.DVD_HUN: MOVIES_PATH_NAME,
        SearchParamType.DVD: MOVIES_PATH_NAME,
        SearchParamType.DVD9_HUN: MOVIES_PATH_NAME,
        SearchParamType.DVD9: MOVIES_PATH_NAME,
        SearchParamType.HD_HUN: MOVIES_PATH_NAME,
        SearchParamType.HD: MOVIES_PATH_NAME,
        # Series
        SearchParamType.SDSER_HUN: SERIES_PATH_NAME,
        SearchParamType.SDSER: SERIES_PATH_NAME,
        SearchParamType.DVDSER_HUN: SERIES_PATH_NAME,
        SearchParamType.DVDSER: SERIES_PATH_NAME,
        SearchParamType.HDSER_HUN: SERIES_PATH_NAME,
        SearchParamType.HDSER: SERIES_PATH_NAME,
        # Music
        SearchParamType.MP3_HUN: MUSICS_PATH_NAME,
        SearchParamType.MP3: MUSICS_PATH_NAME,
        SearchParamType.LOSSLESS_HUN: MUSICS_PATH_NAME,
        SearchParamType.LOSSLESS: MUSICS_PATH_NAME,
        SearchParamType.CLIP: MUSICS_PATH_NAME,
        # Games
        SearchParamType.GAME_ISO: GAMES_PATH_NAME,
        SearchParamType.GAME_RIP: GAMES_PATH_NAME,
        SearchParamType.CONSOLE: GAMES_PATH_NAME,
        # Books
        SearchParamType.EBOOK_HUN: BOOKS_PATH_NAME,
        SearchParamType.EBOOK: BOOKS_PATH_NAME,
        # Programs
        SearchParamType.ISO: PROGRAMS_PATH_NAME,
        SearchParamType.MISC: PROGRAMS_PATH_NAME,
        SearchParamType.MOBIL: PROGRAMS_PATH_NAME,
        # XXX/Default
        SearchParamType.XXX_IMG: DEFAULT_PATH_NAME,
        SearchParamType.XXX_SD: DEFAULT_PATH_NAME,
        SearchParamType.XXX_DVD: DEFAULT_PATH_NAME,
        SearchParamType.XXX_HD: DEFAULT_PATH_NAME,
    }
    return category_map.get(category, DEFAULT_PATH_NAME)
