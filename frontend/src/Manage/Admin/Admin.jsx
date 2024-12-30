import { NewUser } from "./NewUser"
import { useEffect, useState, useContext } from 'react'
import { manageContext } from '../Manage'
import { DeleteUser } from "./DeleteUser"
import "./Admin.css"

export const Admin = () => {

  const [users, setUsers] = useState([])
  const { setToastData } = useContext(manageContext)

  const getUsers = async () => {
    try {
      const resp = await fetch('/api/users/', {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
          },
      })
      const data = await resp.json()
      if (resp.status === 200) {
        setUsers(data.data.users)
      }
      else {
        setToastData({message: 'Could not fetch users.', type: 'danger'})
      }
    } catch (error) {
      setToastData({message: 'Unexpected error occurred.', type: 'danger'})
      console.log(error)
    }
  }

  useEffect(() => {
    getUsers()
  }, [])

  return (
    <div className="admin">
      <NewUser fetchUsers={getUsers}/>
      <DeleteUser fetchUsers={getUsers} users={users}/>
    </div>
  )
}
