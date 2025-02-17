import { Form, Button } from 'react-bootstrap'
import { useState, useContext } from 'react'
import { manageContext } from '../../Manage'
import './DeleteUser.css'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE, redirectToPage } from '../../../util'

export const DeleteUser = ({ fetchUsers, users }) => {
  const { t } = useTranslation()
  const [selectedUser, setSelectedUser] = useState(users[0]?.email)
  const { setToastData } = useContext(manageContext)

  const handleDelete = async (event) => {
    event.preventDefault()
    const id = users.filter(user => user.email === selectedUser)[0].id
    try {
      const resp = await fetch(`/api/users/${id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (resp.status === 200) {
        setToastData({ message: t('USER_DELETE_SUCCESS'), type: 'success' })
      } else if (resp.status === 401) {
        redirectToPage(LOGIN_PAGE)
      } else {
        setToastData({ message: t('USER_DELETE_ERROR'), type: 'danger' })
      }
    } catch (error) {
      setToastData({ message: t('UNEXPECTED_ERROR'), type: 'danger' })
    }
    fetchUsers()
  }

  return (
    <Form className='shadow p-4 bg-white rounded new-user__wrapper' onSubmit={handleDelete}>
      <div className='h4 mb-2 text-center'>{t('DELETE_USER_TITLE')}</div>
      <Form.Group className='mb-2'>
        <Form.Select aria-label='Default select example' onChange={(e) => setSelectedUser(e.target.value)}>
          {users.map(user => <option key={user.email} value={user.email}>{user.email}</option>)}
        </Form.Select>
      </Form.Group>
      <Button className='w-100' variant='danger' type='submit'>
        {t('DELETE_USER_BUTTON')}
      </Button>
    </Form>
  )
}
