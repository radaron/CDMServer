import { Button, Modal, Form } from 'react-bootstrap'
import { useContext } from "react"
import { manageContext } from "../../Manage"

export const SettingsModal = ({ data, setData }) => {
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
        setToastData({message: "Settings updated.", type: "success"})
      }
      else if (resp.status === 401) {
        window.location.href = "/login"
      }
      else {
        setToastData({message: "Failed to update device.", type: "danger"})
      }
    } catch (error) {
      setToastData({message: "Unexpected error occurred.", type: "danger"})
      console.log(error)
    }
    setData({})
  }

  return (
    <Modal show={data?.settings && data.settings.length > 0} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Settings</Modal.Title>
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
          <Button variant="secondary" onClick={handleClose}>Close</Button>
          <Button variant="primary" type='submit'>Save</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
