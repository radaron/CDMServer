import { useState, useContext } from 'react'
import { manageContext } from '../../Manage'
import { Form, Button } from 'react-bootstrap'
import styles from './AddDevice.module.css'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE } from '../../../constant'
import { redirectToPage } from '../../../util'

interface AddDeviceProps {
  refetch: () => void
}

export const AddDevice: React.FC<AddDeviceProps> = ({ refetch }) => {
  const { t } = useTranslation()
  const [deviceName, setDeviceName] = useState('')
  const context = useContext(manageContext)
  const setToastData = context?.setToastData || (() => {})

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const resp = await fetch('/api/devices/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: deviceName,
        }),
      })
      if (resp.status === 200) {
        setDeviceName('')
        refetch()
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else if (resp.status === 409) {
        setToastData({ message: t('DEVICE_NAME_EXISTS'), type: 'danger' })
      } else {
        setToastData({ message: t('ADD_DEVICE_FAILED'), type: 'danger' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'danger' })
    }
  }

  return (
    <Form
      className={`shadow p-4 bg-white rounded ${styles.container}`}
      onSubmit={handleSubmit}
    >
      <div className="h4 mb-2 text-center">{t('ADD_DEVICE_TITLE')}</div>
      <Form.Group className="mb-2">
        <Form.Control
          type="text"
          value={deviceName}
          placeholder={t('DEVICE_NAME_PLACEHOLDER')}
          onChange={(e) => setDeviceName(e.target.value)}
          required
        />
      </Form.Group>
      <Button className="w-100" variant="primary" type="submit">
        {t('ADD_DEVICE_BUTTON')}
      </Button>
    </Form>
  )
}
