import React from 'react'
import {
  Box,
  ListItem,
  ListItemText,
  Typography,
  LinearProgress,
  LinearProgressProps,
  IconButton,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import DeleteIcon from '@mui/icons-material/Delete'
import { Torrent } from './interfaces'
import { separateWords } from '../../util'
import { useTranslation } from 'react-i18next'


function LinearProgressWithLabel(
  props: LinearProgressProps & { value: number; color?: 'primary' | 'success' | 'error' | 'warning' }
) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" color={props.color || 'primary'} {...props} />
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
    return 'success'
  }

  if (statusLower.includes('error') || statusLower.includes('stopped')) {
    return 'error'
  }

  if (statusLower.includes('downloading') || statusLower.includes('active')) {
    return 'primary'
  }

  if (statusLower.includes('queued') || statusLower.includes('waiting')) {
    return 'warning'
  }

  return 'primary'
}

export const StatusItem = ({ torrent, selectedDeviceId }: { torrent: Torrent; selectedDeviceId: number }) => {
  const { t } = useTranslation()

  const sendInstruction = async (instruction: 'start' | 'stop' | 'delete') => {
    try {
      const resp = await fetch(`/api/status/${selectedDeviceId}/instructions/`, {
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
      })

      if (resp.status === 200) {
        console.log(`${instruction} instruction sent successfully for torrent:`, torrent.id)
      } else {
        console.error(`Failed to send ${instruction} instruction:`, resp.status)
      }
    } catch (error) {
      console.error(`Error sending ${instruction} instruction:`, error)
    }
  }

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
          primary={separateWords(torrent.name)}
          secondary={
            <LinearProgressWithLabel
              variant="determinate"
              value={torrent.progress}
              color={getProgressColor(torrent.status)}
              sx={{ width: '100%', mt: 1 }}
            />
          }
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        />
      <Box sx={{
        display: 'flex',
        gap: 0.5,
        alignSelf: { xs: 'flex-end', sm: 'auto' }
      }}>
        <IconButton
          size="small"
          onClick={handlePlayAction}
          aria-label="play"
          color="success"
        >
          <PlayArrowIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleStopAction}
          aria-label="stop"
          color="warning"
        >
          <StopIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleDeleteAction}
          aria-label="delete"
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </ListItem>
  )
}

export default StatusItem