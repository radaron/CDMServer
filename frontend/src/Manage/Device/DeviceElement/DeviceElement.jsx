import { Button, Container, Row, Col, Badge } from "react-bootstrap";
import { useState, useContext } from "react"
import { manageContext } from "../../Manage"
import "./DeviceElement.css"

export const DeviceElement = ({deviceData, refetch}) => {

  const [isTokenVisible, setIsTokenVisible] = useState(false)
  const { setToastData } = useContext(manageContext)

  const toggleTokenVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
  };

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
          setToastData({message: "Failed to delete device.", type: "danger"})
        }
      } catch (error) {
        setToastData({message: "Unexpected error occurred.", type: "danger"})
        console.log(error)
      }
    }
  }

  return (
    <Container className="shadow p-3 bg-white rounded device__wrapper">
      <Row>
        <Col>
          <div className="h4 mb-2 text-center">{deviceData.name}</div>
        </Col>
      </Row>
      <Row className="mb-2">
        <Col sm={3} className="fw-bold">Status</Col>
        <Col sm={true}>
        {deviceData.active ? (
          <Badge bg="success">Active</Badge>
        ) : (
          <Badge bg="danger">Inactive</Badge>
        )}
        </Col>
      </Row>
      <Row className="mb-2">
        <Col sm={3} className="fw-bold">Token</Col>
        <Col sm={true}>
          <div onClick={toggleTokenVisibility}>
            {isTokenVisible ? deviceData.token : '••••••••••'}
          </div>
        </Col>
      </Row>
      <Button className="w-100" variant="danger" onClick={deleteDevice}>
        Delete Device
      </Button>
    </Container>
  );
};