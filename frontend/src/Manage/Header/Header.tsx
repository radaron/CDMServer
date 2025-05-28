import { useState } from 'react'
import { Outlet } from 'react-router'
import {
  DEVICE_PAGE,
  ADMIN_PAGE,
  DOWNLOAD_PAGE,
  STATUS_PAGE,
  SETTINGS_PAGE,
  IMDB_PAGE,
} from './../constant'
import { getLanguage, toggleLanguage } from '../../util'
import { UserInfo } from '../types'
import { useTranslation } from 'react-i18next'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy'
import DevicesIcon from '@mui/icons-material/Devices'
import SettingsIcon from '@mui/icons-material/Settings';
import TimelineIcon from '@mui/icons-material/Timeline'
import DownloadIcon from '@mui/icons-material/Download'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout';
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Avatar } from '@mui/material'
import HuFlag from '../../../hu_flag.png'
import EnFlag from '../../../en_flag.png'

const drawerWidth = 240;

interface HeaderProps {
  userInfo: UserInfo
  logOut: () => void
}

export const Header: React.FC<HeaderProps> = ({ userInfo, logOut }) => {
  const { t, i18n } = useTranslation()

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const drawer = (
    <>
      <Toolbar />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
        <Avatar sx={{ width: 64, height: 64 }}>
          {userInfo.name ? userInfo.name[0].toUpperCase() : ''}
        </Avatar>
      </Box>
      <Divider />
      <List>
        <ListItem key={t('HEADER_DOWNLOADS')} disablePadding>
          <ListItemButton href={DOWNLOAD_PAGE}>
            <ListItemIcon><DownloadIcon /></ListItemIcon>
            <ListItemText primary={t('HEADER_DOWNLOADS')} />
          </ListItemButton>
        </ListItem>
        <ListItem key={t('HEADER_IMDB')} disablePadding>
          <ListItemButton href={IMDB_PAGE}>
            <ListItemIcon><TheaterComedyIcon /></ListItemIcon>
            <ListItemText primary={t('HEADER_IMDB')} />
          </ListItemButton>
        </ListItem>
        <ListItem key={t('HEADER_STATUS')} disablePadding>
          <ListItemButton href={STATUS_PAGE}>
            <ListItemIcon><TimelineIcon /></ListItemIcon>
            <ListItemText primary={t('HEADER_STATUS')} />
          </ListItemButton>
        </ListItem>
        <ListItem key={t('HEADER_DEVICES')} disablePadding>
          <ListItemButton href={DEVICE_PAGE}>
            <ListItemIcon><DevicesIcon /></ListItemIcon>
            <ListItemText primary={t('HEADER_DEVICES')} />
          </ListItemButton>
        </ListItem>
        <ListItem key={t('HEADER_SETTINGS')} disablePadding>
          <ListItemButton href={SETTINGS_PAGE}>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary={t('HEADER_SETTINGS')} />
          </ListItemButton>
        </ListItem>
        <ListItem key={t('HEADER_LANGUAGE')} disablePadding>
          <ListItemButton onClick={() => {
            toggleLanguage()
            i18n.changeLanguage(getLanguage())
          }}>
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
        <Divider />
        <ListItem key={t('HEADER_ADMIN')} disablePadding hidden={!userInfo.isAdmin}>
          <ListItemButton href={ADMIN_PAGE}>
            <ListItemIcon><SupervisorAccountIcon /></ListItemIcon>
            <ListItemText primary={t('HEADER_ADMIN')} />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <List>
        <ListItem key={t('HEADER_LOGOUT')} disablePadding>
          <ListItemButton onClick={logOut}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          pt: { xs: 8, sm: 9 },
          maxWidth: '100vw',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
