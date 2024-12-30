import { Form, Button } from 'react-bootstrap'
import { useState, useContext } from 'react'
import { manageContext } from '../../Manage'
import './NewUser.css'

export const NewUser = ({ fetchUsers }) => {

    const [inputEmail, setInputEmail] = useState('')
    const [inputPassword, setInputPassword] = useState('')
    const [inputName, setInputName] = useState('')
    const [inputIsAdmin, setInputIsAdmin] = useState(false)
    const { setToastData } = useContext(manageContext)

    const handleSubmit = async (event) => {
      event.preventDefault()
      try {
        const resp = await fetch('/api/users/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: inputEmail,
                isAdmin: inputIsAdmin,
                name: inputName,
                password: inputPassword,
            })
        })
        if (resp.status === 200) {
          setToastData({message: 'User addedd successfully.', type: 'success'})
          fetchUsers()
        }
        else {
          setToastData({message: 'Could not add user.', type: 'danger'})
        }
      } catch (error) {
        setToastData({message: 'Unexpected error occurred.', type: 'danger'})
        console.log(error)
      }
    }

  return (
    <Form className='shadow p-4 bg-white rounded new-user__wrapper' onSubmit={handleSubmit}>
      <div className='h4 mb-2 text-center'>Add new user</div>
      <Form.Group className='mb-2'>
        <Form.Control
          type='text'
          value={inputEmail}
          placeholder='Email'
          onChange={(e) => setInputEmail(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className='mb-2'>
        <Form.Control
          type='password'
          value={inputPassword}
          placeholder='Password'
          onChange={(e) => setInputPassword(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className='mb-2'>
        <Form.Control
          type='text'
          value={inputName}
          placeholder='Name'
          onChange={(e) => setInputName(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className='mb-3'>
        <Form.Check
          type='switch'
          label='Is admin'
          onChange={(e) => setInputIsAdmin(e.target.checked)}
        />
      </Form.Group>
      <Button className='w-100' variant='primary' type='submit'>
        Create user
      </Button>
    </Form>
)}