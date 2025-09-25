import { Theme, alpha, Components } from '@mui/material/styles'
import { gray, orange } from './themePrimitives'

export const feedbackCustomizations: Components<Theme> = {
  MuiDialog: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiDialog-paper': {
          borderRadius: '10px',
          border: '1px solid',
          borderColor: (theme.vars || theme).palette.divider,
        },
      }),
    },
  },
}
