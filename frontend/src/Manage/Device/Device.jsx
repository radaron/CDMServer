import { useEffect, useState } from "react"
import { DeviceElement } from "./DeviceElement"
import { AddDevice } from "./AddDevice"
import "./Device.css"

export const Device = () => {

  const [devices, setDevices] = useState([])

  const getDevices = async () => {
    try {
      const resp = await fetch("/api/devices/", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (resp.status === 200) {
        const data = await resp.json()
        setDevices(data.data.devices)
      }
      else if (resp.status === 401) {
        window.location.href = "/login"
      }
      else {
        console.log("Failed to get devices")
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getDevices()
    const intervalId = setInterval(getDevices, 5000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="device">
      {devices.map((device) => (
        <DeviceElement key={device.id} deviceData={device} refetch={getDevices}/>
      ))}
      <AddDevice refetch={getDevices}/>
    </div>
  )
}
