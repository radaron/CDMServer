import { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap"
import "./AddDevice.css";

export const AddDevice = ({refetch}) => {

  const [deviceName, setDeviceName] = useState("")
  const [alertMessage, setAlertMessage] = useState("")

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
        refetch()
      }
      else {
        setAlertMessage("Email or password format is incorrect.")
      }
    } catch (error) {
      setAlertMessage("Unexpected error occurred.")
      console.log(error)
    }
  }

  return (
    <Form className="shadow p-4 bg-white rounded add-device__wrapper" onSubmit={handleSubmit}>
      <div className="h4 mb-2 text-center">Add new Device</div>
      {alertMessage && (
        <Alert
          className="mb-2"
          variant="danger"
          onClose={() => setAlertMessage("")}
          dismissible
        >
          {alertMessage}
        </Alert>
      )}
      <Form.Group className="mb-2">
        <Form.Control
          type="text"
          value={deviceName}
          placeholder="Device Name"
          onChange={(e) => setDeviceName(e.target.value)}
          required
        />
      </Form.Group>
      <Button className="w-100" variant="primary" type="submit">
        Add device
      </Button>
    </Form>
  )
}