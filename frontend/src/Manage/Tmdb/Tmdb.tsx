import { useState, useContext, useCallback, useEffect } from 'react'
import {
  Box,
  FormControl,
  TextField,
  Button,
  CircularProgress,
  Card,
  CardActions,
  CardContent,
  Typography,
  Pagination,
  Chip,
  Link,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import StarIcon from '@mui/icons-material/Star'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { manageContext } from '../Manage'
import { LOGIN_PAGE, MANAGE_PAGE } from '../../constant'
import { DOWNLOAD_PAGE, searchWhere } from '../constant'
import { redirectToPage, hideKeyBoard } from '../../util'
import { PATTERN, PAGE } from './constant'

interface TmdbResultElement {
  tmdbId: number
  imdbId?: string
  title: string
  overview: string
  poster?: string
  rating?: number
  year?: number
  mediaType: string
}

interface TmdbSearchResult {
  data: TmdbResultElement[]
  meta: {
    totalPages: number
  }
}

interface TmdbPopularResult {
  data: {
    movies: TmdbResultElement[]
    tvs: TmdbResultElement[]
  }
}

const TmdbCard = ({ result }: { result: TmdbResultElement }) => {
  const { t } = useTranslation()
  const yearText = result.year ? `(${result.year})` : ''
  const ratingText =
    typeof result.rating === 'number' ? result.rating.toFixed(1) : '-'
  const mediaTypeLabels: Record<string, string> = {
    tv: t('TMDB_MEDIA_SERIES'),
    movie: t('TMDB_MEDIA_MOVIE'),
    person: t('TMDB_MEDIA_PERSON'),
  }
  const typeLabel = mediaTypeLabels[result.mediaType]

  return (
    <Card sx={{ minWidth: 275, textAlign: 'center' }} key={result.tmdbId}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1.5, color: 'text.primary' }}>
          <Link
            href={`https://www.imdb.com/title/${result.imdbId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {result.title} {yearText}
          </Link>
          <Chip
            label={typeLabel}
            size="small"
            sx={{ ml: 1, verticalAlign: 'middle' }}
          />
          <Chip
            icon={<StarIcon color="warning" />}
            label={ratingText}
            size="small"
            sx={{ ml: 1, verticalAlign: 'middle' }}
          />
        </Typography>
        <Box>
          {result.poster && (
            <img
              src={result.poster}
              alt={result.title}
              style={{ width: '80%' }}
            />
          )}
          <Typography sx={{ mb: 1.5, color: 'text.secondary', mt: 1 }}>
            {result.overview}
          </Typography>
        </Box>
      </CardContent>
      {result.imdbId && (
        <CardActions sx={{ justifyContent: 'center' }}>
          <Button
            onClick={() => {
              redirectToPage(
                `${MANAGE_PAGE}/${DOWNLOAD_PAGE}` +
                  `?pattern=${result.imdbId}&searchWhere=${searchWhere[1]}&searchCategory=all_own`
              )
            }}
          >
            <DownloadIcon color="warning" />
          </Button>
        </CardActions>
      )}
    </Card>
  )
}

export const Tmdb = () => {
  const { t, i18n } = useTranslation()
  const [isLoading, setLoading] = useState(false)
  const [pattern, setPattern] = useState('')
  const [page, setPage] = useState(1)
  const [searchResults, setSearchResults] = useState<TmdbSearchResult>({
    data: [],
    meta: { totalPages: 0 },
  })
  const [popularResults, setPopularResults] = useState<TmdbPopularResult>({
    data: { movies: [], tvs: [] },
  })
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const setHeaderTitle = context?.setHeaderTitle || (() => {})
  const [searchParams, setSearchParams] = useSearchParams()
  const language = i18n.language
  const isSearchActive =
    searchParams.has(PATTERN) && Boolean(searchParams.get(PATTERN))

  useEffect(() => {
    setHeaderTitle(t('HEADER_TMDB'))
  }, [setHeaderTitle, t])

  const search = useCallback(async () => {
    if (searchParams.has(PATTERN) && searchParams.get(PATTERN)) {
      const searchPattern = searchParams.get(PATTERN) || ''
      const searchPage = Number(searchParams.get(PAGE)) || 1
      setPattern(searchPattern)
      setPage(searchPage)
      setLoading(true)
      try {
        const resp = await fetch(
          `/api/tmdb/search/?pattern=${searchPattern}&page=${searchPage}&language=${language}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        if (resp.status === 200) {
          const data = await resp.json()
          setSearchResults(data)
          if (data.data.length === 0) {
            setToastData({ message: t('NO_RESULTS'), type: 'warning' })
          }
        } else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        } else {
          setToastData({ message: t('SEARCH_ERROR'), type: 'error' })
        }
      } catch (error) {
        setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
        console.log(error)
      }
      setLoading(false)
    }
  }, [language, searchParams, setToastData, t])

  const fetchPopular = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch(`/api/tmdb/popular/?language=${language}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (resp.status === 200) {
        const data = await resp.json()
        setPopularResults(data)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('SEARCH_ERROR'), type: 'error' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
      console.log(error)
    }
    setLoading(false)
  }, [language, setToastData, t])

  const submitSearch = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      hideKeyBoard()
      setSearchParams({ pattern })
    },
    [pattern, page, setSearchParams]
  )

  const submitPageChange = useCallback(
    (event: React.ChangeEvent<unknown>, value: number) => {
      setPage(value)
      setSearchParams({ pattern, page: value.toString() })
    },
    [pattern, setSearchParams]
  )

  useEffect(() => {
    if (searchParams.has(PATTERN) && searchParams.get(PATTERN)) {
      search()
    } else {
      setSearchResults({ data: [], meta: { totalPages: 0 } })
      fetchPopular()
    }
  }, [fetchPopular, search, searchParams])

  return (
    <Box>
      <Box
        component="form"
        onSubmit={submitSearch}
        sx={{
          marginBottom: 2,
          padding: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1,
          justifyContent: 'space-between',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          maxWidth: { sm: '1000px' },
          mx: 'auto',
        }}
      >
        <FormControl
          sx={{
            width: { xs: 'auto', sm: 'auto', md: '100%' },
          }}
        >
          <TextField
            placeholder={t('SEARCH_PLACEHOLDER')}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            required
            fullWidth
            focused
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 0, sm: 200 },
            }}
          />
        </FormControl>
        <Button variant="contained" type="submit" disabled={isLoading}>
          {isLoading ? <CircularProgress /> : t('SEARCH')}
        </Button>
      </Box>
      {isSearchActive ? (
        searchResults.data.length > 0 ? (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                borderRadius: 1,
                boxShadow: 1,
                padding: 1,
                marginBottom: 2,
                backgroundColor: 'background.paper',
                maxWidth: { sm: '1000px' },
                mx: 'auto',
              }}
            >
              <Pagination
                count={searchResults.meta.totalPages}
                page={page}
                onChange={submitPageChange}
                disabled={isLoading}
                hideNextButton
                hidePrevButton
              />
            </Box>
            <Box
              sx={{
                maxWidth: { sm: '1000px' },
                mx: 'auto',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              {searchResults.data.map(
                (result) =>
                  result.imdbId && (
                    <TmdbCard key={result.tmdbId} result={result} />
                  )
              )}
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                borderRadius: 1,
                boxShadow: 1,
                padding: 1,
                marginTop: 2,
                backgroundColor: 'background.paper',
                maxWidth: { sm: '1000px' },
                mx: 'auto',
              }}
            >
              <Pagination
                count={searchResults.meta.totalPages}
                page={page}
                onChange={submitPageChange}
                disabled={isLoading}
                hideNextButton
                hidePrevButton
              />
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              borderRadius: 1,
              boxShadow: 1,
              padding: 2,
              backgroundColor: 'background.paper',
              maxWidth: { sm: '1000px' },
              mx: 'auto',
            }}
          >
            <Typography sx={{ color: 'text.secondary' }}>
              {isLoading ? t('LOADING') : t('NO_RESULTS')}
            </Typography>
          </Box>
        )
      ) : (
        <>
          <Box
            sx={{
              maxWidth: { sm: '1000px' },
              mx: 'auto',
              display: 'grid',
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              {popularResults.data.movies.map((result) => (
                <TmdbCard key={result.tmdbId} result={result} />
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              maxWidth: { sm: '1000px' },
              mx: 'auto',
              display: 'grid',
              gap: 2,
              marginTop: 2,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              {popularResults.data.tvs.map((result) => (
                <TmdbCard key={result.tmdbId} result={result} />
              ))}
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}
