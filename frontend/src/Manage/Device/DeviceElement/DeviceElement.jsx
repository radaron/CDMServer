import { Button, Container, Row, Col, Badge } from "react-bootstrap";
import { GearFill } from 'react-bootstrap-icons';
import { useState, useContext } from "react"
import { manageContext } from "../../Manage"
import "./DeviceElement.css"
import { useTranslation } from "react-i18next";
import { LOGIN_PAGE, redirectToPage } from "../util"

export const DeviceElement = ({deviceData, refetch, setSelectedDeviceData}) => {

  const { t } = useTranslation()
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
        else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        }
        else {
          setToastData({message: t('DEVICE_DELETE_ERROR'), type: "danger"})
        }
      } catch (error) {
        setToastData({message: t('UNEXPECTED_ERROR'), type: "danger"})
        console.log(error)
      }
    }
  }

  return (
    <Container className="shadow p-3 bg-white rounded device__wrapper">
      <Row>
        <Col/>
        <Col>
          <div className="h4 mb-2 text-center">{deviceData.name}</div>
        </Col>
        <Col>
          <Button variant="outline-secondary" className="float-end" onClick={() => setSelectedDeviceData(deviceData)}>
            <GearFill/>
          </Button>
        </Col>
      </Row>
      <Row className="mb-2">
        <Col sm={3} className="fw-bold">Status</Col>
        <Col sm={true}>
        {deviceData.active ? (
          <Badge bg="success">{t('ACTIVE_BADGE')}</Badge>
        ) : (
          <Badge bg="danger">{t('INACTIVE_BADGE')}</Badge>
        )}
        </Col>
      </Row>
      <Row className="mb-2">
        <Col sm={3} className="fw-bold">{t('TOKEN_TITLE')}</Col>
        <Col sm={true}>
          <div onClick={toggleTokenVisibility}>
            {isTokenVisible ? deviceData.token : '••••••••••'}
          </div>
        </Col>
      </Row>
      <Button className="w-100" variant="danger" onClick={deleteDevice}>
        {t('DELETE_DEVICE_BUTTON')}
      </Button>
    </Container>
  );
};