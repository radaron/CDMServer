import * as React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import type { ThemeOptions } from '@mui/material/styles'
import { inputsCustomizations } from './customizations/inputs'
import { dataDisplayCustomizations } from './customizations/dataDisplay'
import { feedbackCustomizations } from './customizations/feedback'
import { navigationCustomizations } from './customizations/navigation'
import { surfacesCustomizations } from './customizations/surfaces'
import {
  colorSchemes,
  typography,
  shadows,
  shape,
} from './customizations/themePrimitives'

interface AppThemeProps {
  children: React.ReactNode
  disableCustomTheme?: boolean
  themeComponents?: ThemeOptions['components']
}

export default function AppTheme(props: AppThemeProps) {
  const { children, disableCustomTheme, themeComponents } = props
  const theme = React.useMemo(() => {
    return disableCustomTheme
      ? {}
      : createTheme({
          typography,
          shadows,
          shape,
          components: {
            ...inputsCustomizations,
            ...dataDisplayCustomizations,
            ...feedbackCustomizations,
            ...navigationCustomizations,
            ...surfacesCustomizations,
            ...themeComponents,
          },
          palette: {
            mode: 'dark',
            ...(colorSchemes.dark?.palette || {}),
          },
        })
  }, [disableCustomTheme, themeComponents])
  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>
  }
  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
