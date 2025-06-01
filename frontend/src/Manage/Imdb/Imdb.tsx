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
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import VideocamIcon from '@mui/icons-material/Videocam'
import StarIcon from '@mui/icons-material/Star'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { manageContext } from '../Manage'
import { LOGIN_PAGE, MANAGE_PAGE } from '../../constant'
import { DOWNLOAD_PAGE, searchWhere } from '../constant'
import { redirectToPage, separateWords, hideKeyBoard } from '../../util'
import { PATTERN } from './constant'

interface ImdbSearchResult {
  imdbId: string
  title: string
  year: string
  plot: string
  poster: string
  director: string
  rating: string
}

interface IMDBCardProps {
  result: ImdbSearchResult
}

const IMDBCard = ({ result }: IMDBCardProps) => {
  const { t } = useTranslation()

  return (
    <Card sx={{ minWidth: 275, textAlign: 'center' }} key={result.imdbId}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1.5, color: 'text.primary' }}>
          <a
            href={`https://www.imdb.com/title/${result.imdbId}/`}
            target="_blank"
            rel="noreferrer"
          >
            {separateWords(result.title)} ({result.year})
          </a>
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <img
            src={result.poster}
            alt={result.title}
            style={{ width: '100%' }}
          />
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <VideocamIcon color="warning" />
              <Typography sx={{ color: 'text.secondary', alignContent: 'center' }}>
                {t('DIRECTOR')}: {result.director}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StarIcon color="warning" sx={{ mr: 0.5 }} />
              <Typography sx={{ color: 'text.secondary', alignContent: 'center' }}>
                {t('RATE')}: {result.rating}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Typography sx={{ mb: 1.5, color: 'text.secondary', mt: 1 }}>
          {result.plot}
        </Typography>
      </CardContent>
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
    </Card>
  )
}

export const Imdb = () => {
  const { t } = useTranslation()
  const [isLoading, setLoading] = useState(false)
  const [pattern, setPattern] = useState('')
  const [searchResults, setSearchResults] = useState<ImdbSearchResult[]>([])
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const setHeaderTitle = context?.setHeaderTitle || (() => {})
  setHeaderTitle(t('HEADER_IMDB'))
  const [searchParams, setSearchParams] = useSearchParams()

  const search = useCallback(async () => {
    if (searchParams.has(PATTERN)) {
      setPattern(searchParams.get(PATTERN) || '')
      setLoading(true)
      try {
        const resp = await fetch(
          `/api/omdb/search/?pattern=${searchParams.get(PATTERN)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        if (resp.status === 200) {
          const data = await resp.json()
          setSearchResults(data.data)
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
  }, [searchParams, setToastData, t])

  const submitSearch = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      hideKeyBoard()
      setSearchParams({ pattern })
    },
    [pattern, setSearchParams]
  )

  useEffect(() => {
    search()
  }, [search, searchParams])

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
        <Button
          variant="contained"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress /> : t('SEARCH')}
        </Button>
      </Box>
      {searchResults.length > 0 && (
        <Box
          sx={{
            maxWidth: { sm: '1000px' },
            mx: 'auto',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          {searchResults.map((result) => (
            <IMDBCard key={result.imdbId} result={result} />
          ))}
        </Box>
      )}
    </Box>
  )
}
