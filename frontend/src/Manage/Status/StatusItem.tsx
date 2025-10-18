import React, { useEffect, useState } from 'react'
import {
  Box,
  ListItem,
  ListItemText,
  Typography,
  LinearProgress,
  LinearProgressProps,
  IconButton,
  Link,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'

import { Torrent } from './interfaces'
import { separateWords } from '../../util'
import { useTranslation } from 'react-i18next'

const COLORS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
} as const

function LinearProgressWithLabel(
  props: LinearProgressProps & {
    value: number
    color?: 'primary' | 'secondary' | 'error' | 'success' | 'warning'
  }
) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  )
}

const getProgressColor = (status: string) => {
  const statusLower = status.toLowerCase()

  if (statusLower.includes('seeding') || statusLower.includes('complete')) {
    return COLORS.SUCCESS
  }

  if (statusLower.includes('error')) {
    return COLORS.ERROR
  }

  if (statusLower.includes('stopped')) {
    return COLORS.SECONDARY
  }

  if (statusLower.includes('downloading') || statusLower.includes('active')) {
    return COLORS.PRIMARY
  }

  if (statusLower.includes('queued') || statusLower.includes('waiting')) {
    return COLORS.WARNING
  }

  return COLORS.PRIMARY
}

export const StatusItem = ({
  torrent,
  selectedDeviceId,
}: {
  torrent: Torrent
  selectedDeviceId: number
}) => {
  const { t } = useTranslation()
  const [instructionSent, setInstructionSent] = useState<
    'start' | 'stop' | 'delete' | null
  >(null)

  const sendInstruction = async (instruction: 'start' | 'stop' | 'delete') => {
    try {
      const resp = await fetch(
        `/api/status/${selectedDeviceId}/instructions/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instructions: {
              [instruction]: {
                torrent_id: torrent.id,
              },
            },
          }),
        }
      )

      if (resp.status === 200) {
        setInstructionSent(instruction)
      } else {
        console.error(`Failed to send ${instruction} instruction:`, resp.status)
      }
    } catch (error) {
      console.error(`Error sending ${instruction} instruction:`, error)
    }
  }

  useEffect(() => {
    if (instructionSent) {
      const timer = setTimeout(() => {
        setInstructionSent(null)
      }, 3000) // Clear after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [instructionSent])

  const handlePlayAction = async () => {
    await sendInstruction('start')
  }

  const handleStopAction = async () => {
    await sendInstruction('stop')
  }

  const handleDeleteAction = async () => {
    if (window.confirm(t('DELETE_TORRENT_CONFIRM'))) {
      await sendInstruction('delete')
    }
  }

  return (
    <ListItem
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 1,
      }}
    >
      <ListItemText
        primary={
          <Link
            href={torrent.detailsUrl}
            underline="hover"
            color="inherit"
            sx={{
              display: 'block',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            {separateWords(torrent.name)}
          </Link>
        }
        secondary={
          <LinearProgressWithLabel
            variant="determinate"
            value={torrent.progress}
            color={getProgressColor(torrent.status)}
            sx={{ width: '100%', mt: 1 }}
          />
        }
        disableTypography={true}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      />
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          alignSelf: { xs: 'flex-end', sm: 'auto' },
        }}
      >
        <IconButton
          size="small"
          onClick={handlePlayAction}
          aria-label="play"
          color="success"
          disabled={instructionSent === 'start'}
        >
          {instructionSent === 'start' ? <CheckIcon /> : <PlayArrowIcon />}
        </IconButton>
        <IconButton
          size="small"
          onClick={handleStopAction}
          aria-label="stop"
          color="warning"
          disabled={instructionSent === 'stop'}
        >
          {instructionSent === 'stop' ? <CheckIcon /> : <PauseIcon />}
        </IconButton>
        <IconButton
          size="small"
          onClick={handleDeleteAction}
          aria-label="delete"
          color="error"
          disabled={instructionSent === 'delete'}
        >
          {instructionSent === 'delete' ? <CheckIcon /> : <DeleteIcon />}
        </IconButton>
      </Box>
    </ListItem>
  )
}

export default StatusItem
