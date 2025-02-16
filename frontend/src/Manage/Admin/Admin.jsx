import { NewUser } from "./NewUser"
import { useEffect, useState, useContext } from 'react'
import { manageContext } from '../Manage'
import { DeleteUser } from "./DeleteUser"
import "./Admin.css"
import { useTranslation } from "react-i18next"
import { LOGIN_PAGE, redirectToPage } from "../../util"

export const Admin = () => {

  const { t } = useTranslation()
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
      else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      }
      else {
        setToastData({message: t('USER_FETCH_ERROR'), type: 'danger'})
      }
    } catch (error) {
      setToastData({message: t('UNEXPECTED_ERROR'), type: 'danger'})
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
