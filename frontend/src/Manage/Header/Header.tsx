import { useState, Children } from 'react'
import {
  AppBar,
  Box,
  CssBaseline,
  Typography,
  Divider,
  IconButton,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  ListItem,
  List,
  Toolbar,
  Avatar,
  Drawer,
} from '@mui/material'
import {
  DEVICE_PAGE,
  ADMIN_PAGE,
  DOWNLOAD_PAGE,
  STATUS_PAGE,
  SETTINGS_PAGE,
  IMDB_PAGE,
} from './../constant'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy'
import DevicesIcon from '@mui/icons-material/Devices'
import SettingsIcon from '@mui/icons-material/Settings'
import TimelineIcon from '@mui/icons-material/Timeline'
import DownloadIcon from '@mui/icons-material/Download'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import { getLanguage, toggleLanguage } from '../../util'
import { UserInfo } from '../types'
import { useTranslation } from 'react-i18next'
import HuFlag from '../../../hu_flag.png'
import EnFlag from '../../../en_flag.png'

const drawerWidth = 240

interface HeaderProps {
  userInfo: UserInfo
  logOut: () => void
  headerTitle: string
  children?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({
  children,
  userInfo,
  logOut,
  headerTitle,
}) => {
  const { t, i18n } = useTranslation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleDrawerClose = () => {
    setIsClosing(true)
    setMobileOpen(false)
  }

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false)
  }

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen)
    }
  }

  const menuElements = [
    { label: t('HEADER_STATUS'), icon: <TimelineIcon />, href: STATUS_PAGE },
    { label: t('HEADER_DOWNLOADS'), icon: <DownloadIcon />, href: DOWNLOAD_PAGE },
    { label: t('HEADER_IMDB'), icon: <TheaterComedyIcon />, href: IMDB_PAGE },
    { label: t('HEADER_DEVICES'), icon: <DevicesIcon />, href: DEVICE_PAGE },
    { label: t('HEADER_SETTINGS'), icon: <SettingsIcon />, href: SETTINGS_PAGE },
    {
      label: t('HEADER_ADMIN'),
      icon: <SupervisorAccountIcon />,
      href: ADMIN_PAGE,
      hidden: !userInfo.isAdmin,
    },
  ]

  const drawer = (
    <>
      <Toolbar />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 2,
        }}
      >
        <Avatar sx={{ width: 64, height: 64 }}>
          {userInfo.name ? userInfo.name[0].toUpperCase() : ''}
        </Avatar>
      </Box>
      <Divider />
      <List>
        {menuElements.map(
          ({ label, icon, href, hidden }) => {
            return hidden ? null: (
              <ListItem key={label}>
                <ListItemButton href={href}>
                  <ListItemIcon>{icon}</ListItemIcon>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            )
          }
        )}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <List>
        <ListItem key={t('HEADER_LANGUAGE')}>
          <ListItemButton
            onClick={() => {
              toggleLanguage()
              i18n.changeLanguage(getLanguage())
            }}
          >
            <ListItemIcon>
              <img
                src={getLanguage() === 'hu' ? HuFlag : EnFlag}
                alt="Language Flag"
                style={{ width: '24px', height: '24px', borderRadius: '50%' }}
              />
            </ListItemIcon>
            <ListItemText primary={t('HEADER_LANGUAGE')} />
          </ListItemButton>
        </ListItem>
        <ListItem key={t('HEADER_LOGOUT')}>
          <ListItemButton onClick={logOut}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary={t('HEADER_LOGOUT')} />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {headerTitle}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          slotProps={{
            root: {
              keepMounted: true,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      {Children.map(children, (child) => (
        <>{child}</>
      ))}
    </Box>
  )
}
