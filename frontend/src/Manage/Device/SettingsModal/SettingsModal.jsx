import { Button, Modal, Form, Container, Row, Col } from 'react-bootstrap'
import { PersonFillDash, PersonFillAdd } from 'react-bootstrap-icons';
import { useContext } from "react"
import { manageContext } from "../../Manage"
import { useTranslation } from "react-i18next"
import { LOGIN_PAGE, redirectToPage } from "../../../util"
import { DownloadFolders } from "../../constant"

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
              userEmails: data.userEmails,
          })
      })
      if (resp.status === 200) {
        setData({})
        setToastData({message: t('DEVICE_SETTINGS_UPDATE_SUCCESS'), type: "success"})
      }
      else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      }
      else if (resp.status === 400) {
        setToastData({message: t('DEVICE_MISSING_SHARING_EMAILS'), type: "danger"})
      }
      else {
        setToastData({message: t('DEVICE_SETTINGS_UPDATE_ERROR'), type: "danger"})
      }
    } catch (error) {
      setToastData({message: t('UNEXPECTED_ERROR'), type: "danger"})
    }
  }

  return (
    <Modal show={data.name} onHide={handleClose} size='xl'>
      <Modal.Header closeButton>
        <Modal.Title>{t('DEVICE_SETTINGS_TITLE')}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSave}>
        <Modal.Body>
          <Container>
            <Row>
              <Col>
                {data?.settings && Object.entries(data.settings).map(([key, value]) => (
                  <Form.Group key={key} className="mb-3" controlId={key}>
                    <Form.Label>{t(DownloadFolders[key])}</Form.Label>
                    <Form.Control
                      value={value}
                      onChange={(event) => {
                        const newData = {...data}
                        newData.settings[key] = event.target.value
                        setData(newData)
                      }}
                    />
                  </Form.Group>
                ))}
              </Col>
              <Col>
                <Row>
                  <Col xs={10}>
                    <Form.Label>{t('DEVICE_OWNERS_TITLE')}</Form.Label>
                  </Col>
                  <Col xs={2}>
                    <Button
                      variant="outline-success"
                      onClick={() => {
                        const newData = {...data}
                        newData.userEmails.push('')
                        setData(newData)
                      }}>
                      <PersonFillAdd/>
                    </Button>
                  </Col>
                </Row>
                {data?.userEmails && data.userEmails.map((mail, index) => (
                  <Row key={index} className="mt-3">
                    <Col xs={10}>
                      <Form.Group controlId={mail}>
                        <Form.Control
                          value={mail}
                          onChange={(event) => {
                            const newData = {...data}
                            newData.userEmails[index] = event.target.value
                            setData(newData)
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={2}>
                      <Button
                        variant="outline-danger"
                        onClick={() => {
                          const newData = {...data}
                          newData.userEmails.splice(index, 1)
                          setData(newData)
                        }}>
                        <PersonFillDash/>
                      </Button>
                    </Col>
                  </Row>
                ))}
              </Col>
            </Row>
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>{t('DEVICE_SETTINGS_CLOSE')}</Button>
          <Button variant="primary" type='submit'>{t('DEVICE_SETTINGS_SAVE')}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
