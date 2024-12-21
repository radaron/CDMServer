import { Button, Alert } from "react-bootstrap";
import { useState } from "react"
import "./DeviceElement.css"

export const DeviceElement = ({deviceData, refetch}) => {

  const [alertMessage, setAlertMessage] = useState("")

  const status = deviceData.active ? "green" : "red";

  const deleteDevice = async () => {
    if (window.confirm("Are you sure you want to delete this device?")) {
      try {
        const resp = await fetch(`/api/devices/${deviceData.id}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (resp.status === 200) {
          refetch()
        }
        else {
          setAlertMessage("Failed to delete device.")
        }
      } catch (error) {
        setAlertMessage("Unexpected error occurred.")
        console.log(error)
      }
    }
  }

  return (
    <div className="shadow p-4 bg-white rounded device__wrapper">
      <div className="h4 mb-2 text-center">{deviceData.name}</div>
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
      <table className="table">
        <tbody>
          <tr>
            <th>Status</th>
            <td>
              <div className={`status-indicator ${status}`}></div>
            </td>
          </tr>
          <tr>
            <th>Token</th>
            <td>
              {deviceData.token}
            </td>
          </tr>
        </tbody>
      </table>
      <Button className="w-100" variant="danger" onClick={deleteDevice}>
        Delete Device
      </Button>
    </div>
  );
};