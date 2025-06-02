import { useState, useContext, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router'
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
  Menu,
  MenuItem,
  Select,
} from '@mui/material'
import { manageContext } from '../Manage'
import { DeviceModel } from '../types'
import { searchWhere, searchCategory } from '../constant'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../constant'
import { redirectToPage, separateWords, hideKeyBoard } from '../../util'
import { PATTERN, SEARCH_WHERE, SEARCH_CATEGORY } from './constant'

interface TorrentSearchResult {
  id: number
  title: string
  category: string
  size: string
  seeders: number
  leechers: number
  url: string
}

interface DownloadDropDownButtonProps {
  result: TorrentSearchResult
  devices: DeviceModel[]
  addToDownloadQueue: (torrentId: number, deviceId: number) => void
}

interface TorrentCardProps {
  result: TorrentSearchResult
  devices: DeviceModel[]
  addToDownloadQueue: (torrentId: number, deviceId: number) => void
}

const DownloadDropDownButton = ({
  result,
  devices,
  addToDownloadQueue,
}: DownloadDropDownButtonProps) => {
  const { t } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (deviceId: number) => {
    addToDownloadQueue(result.id, deviceId)
    handleClose()
  }

  return (
    <div>
      <Button
        variant="contained"
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        {t('DOWNLOAD')}
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {devices.map((device) => (
          <MenuItem key={device.id} onClick={() => handleSelect(device.id)}>
            {device.name}
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}

const TorrentCard = ({
  result,
  devices,
  addToDownloadQueue,
}: TorrentCardProps) => {
  const { t } = useTranslation()

  return (
    <Card sx={{ minWidth: 275 }} key={result.id}>
      <CardContent>
        <Typography variant="h6" component="div">
          <a href={result.url} target="_blank" rel="noreferrer">
            {separateWords(result.title)}
          </a>
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
            {t('CATEGORY')}: {result.category}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
            {t('SIZE')}: {result.size}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
            {t('SEEDERS')}: {result.seeders}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
            {t('LEECHERS')}: {result.leechers}
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center' }}>
        {devices.length > 1 ? (
          <DownloadDropDownButton
            result={result}
            devices={devices}
            addToDownloadQueue={addToDownloadQueue}
          />
        ) : (
          <Button
            variant="contained"
            disabled={devices.length === 0}
            onClick={() => addToDownloadQueue(result.id, devices[0]?.id)}
          >
            {t('DOWNLOAD_BUTTON')}
          </Button>
        )}
      </CardActions>
    </Card>
  )
}

export const Download = () => {
  const { t } = useTranslation()
  const [pattern, setPattern] = useState('')
  const [selectedSearchType, setSelectedSearchType] = useState(
    searchCategory[0]
  )
  const [selectedSearchWhere, setSelectedSearchWhere] = useState(searchWhere[0])
  const [devices, setDevices] = useState<DeviceModel[]>([])
  const [isLoading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<TorrentSearchResult[]>([])
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})
  const setHeaderTitle = context?.setHeaderTitle || (() => {})
  setHeaderTitle(t('HEADER_DOWNLOADS'))
  const [searchParams, setSearchParams] = useSearchParams()

  const search = useCallback(async () => {
    if (
      searchParams.has(PATTERN) &&
      searchParams.has(SEARCH_CATEGORY) &&
      searchParams.has(SEARCH_WHERE)
    ) {
      setPattern(searchParams.get(PATTERN) || '')
      setSelectedSearchWhere(searchParams.get(SEARCH_WHERE) || '')
      setSelectedSearchType(searchParams.get(SEARCH_CATEGORY) || '')
      setLoading(true)
      try {
        const resp = await fetch(
          `/api/download/search/?pattern=${searchParams.get(PATTERN)}` +
            `&where=${searchParams.get(SEARCH_WHERE)}` +
            `&category=${searchParams.get(SEARCH_CATEGORY)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        if (resp.status === 200) {
          const data = await resp.json()
          setSearchResults(data.data.torrents)
          if (data.data.torrents.length === 0) {
            setToastData({ message: t('NO_RESULTS'), type: 'info' })
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
  }, [searchParams, setToastData, setSearchResults, t])

  const submitSearch = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      hideKeyBoard()
      setSearchParams({
        pattern,
        searchWhere: selectedSearchWhere,
        searchCategory: selectedSearchType,
      })
    },
    [pattern, selectedSearchType, selectedSearchWhere, setSearchParams]
  )

  const getDevices = useCallback(async () => {
    try {
      const resp = await fetch('/api/devices/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (resp.status === 200) {
        const data = await resp.json()
        setDevices(data.data.devices)
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('GET_DEVICES_ERROR'), type: 'error' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    }
  }, [setToastData, t])

  const addToDownloadQueue = async (torrentId: number, deviceId: number) => {
    try {
      const resp = await fetch('/api/download/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          torrentId,
          deviceId,
        }),
      })
      if (resp.status === 200) {
        await resp.json()
        setToastData({ message: t('DOWNLOAD_ADDED'), type: 'success' })
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('DOWNLOAD_FAILED'), type: 'error' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'error' })
    }
  }

  useEffect(() => {
    search()
  }, [search, searchParams])
  useEffect(() => {
    getDevices()
  }, [getDevices])

  return (
    <Box>
      <Box
        component="form"
        onSubmit={submitSearch}
        noValidate
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
            width: { xs: 'auto', sm: 'auto', md: '80%' },
          }}
        >
          <TextField
            placeholder={t('SEARCH_PLACEHOLDER')}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            fullWidth
            focused
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 0, sm: 200 },
            }}
          />
        </FormControl>
        <FormControl>
          <Select
            onChange={(e) => setSelectedSearchType(e.target.value)}
            value={selectedSearchType}
          >
            {searchCategory.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <Select
            onChange={(e) => setSelectedSearchWhere(e.target.value)}
            value={selectedSearchWhere}
          >
            {searchWhere.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" type="submit" disabled={isLoading}>
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
            <TorrentCard
              key={result.id}
              result={result}
              devices={devices}
              addToDownloadQueue={addToDownloadQueue}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
