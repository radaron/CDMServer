import { useState, useContext } from "react"
import { manageContext } from "../../Manage"
import { Form, Button } from "react-bootstrap"
import "./AddDevice.css"
import { useTranslation } from "react-i18next"

export const AddDevice = ({refetch}) => {

  const { t } = useTranslation()
  const [deviceName, setDeviceName] = useState("")
  const { setToastData } = useContext(manageContext)

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const resp = await fetch("/api/devices/", {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              name: deviceName,
          })
      })
      if (resp.status === 200) {
        setDeviceName("")
        refetch()
      }
      else {
        setToastData({message: t('ADD_DEVICE_FAILED'), type: 'danger'})
      }
    } catch (error) {
      setToastData({message: t('UNEXPECTED_ERROR'), type: 'danger'})
      console.log(error)
    }
  }

  return (
    <Form className="shadow p-4 bg-white rounded add-device__wrapper" onSubmit={handleSubmit}>
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