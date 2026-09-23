import { OverridableStringUnion } from '@mui/types'
import { AlertColor } from '@mui/material/Alert'
import { AlertPropsColorOverrides } from '@mui/material/Alert'

export interface UserInfo {
  email: string
  isAdmin: boolean
  name: string
  ncoreUser: string
  isNcoreCredentialSet: boolean
}

export interface ToastData {
  message: string
  type: OverridableStringUnion<AlertColor, AlertPropsColorOverrides>
}

export interface Settings {
  movies_path: string
  series_path: string
  musics_path: string
  books_path: string
  programs_path: string
  games_path: string
  default_path: string
}

export interface DeviceModel {
  id: number
  token: string
  active: boolean
  name: string
  settings: Settings
  userEmails: string[]
}
