import { Form, Button } from 'react-bootstrap'
import { useState, useContext } from 'react'
import { manageContext } from '../../Manage'
import './DeleteUser.css'

export const DeleteUser = ({fetchUsers, users}) => {

    const [selectedUser, setSelectedUser] = useState(users[0]?.email)
    const { setToastData } = useContext(manageContext)

  const handleDelete = async (event) => {
    event.preventDefault()
    const id = users.filter(user => user.email===selectedUser)[0].id
    try {
      const resp = await fetch(`/api/users/${id}/`, {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json',
          }
      })
      if (resp.status === 200) {
        setToastData({message: 'User deleted.', type: 'success'})
      }
      else {
        setToastData({message: 'Could not delete user.', type: 'danger'})
      }
    } catch (error) {
      setToastData({message: 'Unexpected error occurred.', type: 'danger'})
      console.log(error)
    }
    fetchUsers()
  }

  return (
    <Form className='shadow p-4 bg-white rounded new-user__wrapper' onSubmit={handleDelete}>
      <div className='h4 mb-2 text-center'>Delete user</div>
      <Form.Group className='mb-2'>
        <Form.Select aria-label='Default select example' onChange={(e) => setSelectedUser(e.target.value)}>
          {users.map(user => <option key={user.email} value={user.email}>{user.email}</option>)}
        </Form.Select>
      </Form.Group>
      <Button className='w-100' variant='danger' type='submit'>
        Delete user
      </Button>
    </Form>
)}