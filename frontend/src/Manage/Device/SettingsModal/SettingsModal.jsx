import { Button, Modal, Form } from 'react-bootstrap'
import { useContext } from "react"
import { manageContext } from "../../Manage"
import { useTranslation } from "react-i18next"
import { LOGIN_PAGE, redirectToPage } from "../../../util"

export const SettingsModal = ({ data, setData }) => {
  const { t } = useTranslation()
  const handleClose = () => setData({})
  const { setToastData } = useContext(manageContext)

  const handleSave = async (event) => {
    event.preventDefault()
    try {
      const resp = await fetch(`/api/devices/${data.id}/`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              settings: data.settings,
          })
      })
      if (resp.status === 200) {
        setData({})
        setToastData({message: t('DEVICE_SETTINGS_UPDATE_SUCCESS'), type: "success"})
      }
      else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      }
      else {
        setToastData({message: t('DEVICE_SETTINGS_UPDATE_ERROR'), type: "danger"})
      }
    } catch (error) {
      setToastData({message: t('UNEXPECTED_ERROR'), type: "danger"})
      console.log(error)
    }
    setData({})
  }

  return (
    <Modal show={data?.settings && data.settings.length > 0} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{t('DEVICE_SETTINGS_TITLE')}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSave}>
        <Modal.Body>
            {data?.settings && data.settings.map((setting, index) => (
              <Form.Group key={setting.name} className="mb-3" controlId={setting.name}>
                <Form.Label>{setting.title}</Form.Label>
                <Form.Control
                  value={setting.value}
                  onChange={(event) => {
                    const newData = {...data}
                    newData.settings[index].value = event.target.value
                    setData(newData)
                  }}
                />
              </Form.Group>
            ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>{t('DEVICE_SETTINGS_CLOSE')}</Button>
          <Button variant="primary" type='submit'>{t('DEVICE_SETTINGS_SAVE')}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
