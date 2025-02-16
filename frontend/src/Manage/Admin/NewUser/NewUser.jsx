import { Form, Button } from 'react-bootstrap'
import { useState, useContext } from 'react'
import { manageContext } from '../../Manage'
import './NewUser.css'
import { useTranslation } from 'react-i18next'
import { LOGIN_PAGE, redirectToPage } from "../util"

export const NewUser = ({ fetchUsers }) => {

    const { t } = useTranslation()
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
          setToastData({message: t('USER_ADD_SUCCESS'), type: 'success'})
          fetchUsers()
        }
        else if (resp.status === 401) {
          redirectToPage(LOGIN_PAGE)
        }
        else {
          setToastData({message: t('USER_ADD_ERROR'), type: 'danger'})
        }
      } catch (error) {
        setToastData({message: t('UNEXPECTED_ERROR'), type: 'danger'})
      }
    }

  return (
    <Form className='shadow p-4 bg-white rounded new-user__wrapper' onSubmit={handleSubmit}>
      <div className='h4 mb-2 text-center'>{t('ADD_NEW_USER_TITLE')}</div>
      <Form.Group className='mb-2'>
        <Form.Control
          type='text'
          value={inputEmail}
          placeholder={t('EMAIL_PLACEHOLDER')}
          onChange={(e) => setInputEmail(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className='mb-2'>
        <Form.Control
          type='password'
          value={inputPassword}
          placeholder={t('PASSWORD_PLACEHOLDER')}
          onChange={(e) => setInputPassword(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className='mb-2'>
        <Form.Control
          type='text'
          value={inputName}
          placeholder={t('NAME_PLACEHOLDER')}
          onChange={(e) => setInputName(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className='mb-3'>
        <Form.Check
          type='switch'
          label={t('IS_ADMIN_CHECKBOX')}
          onChange={(e) => setInputIsAdmin(e.target.checked)}
        />
      </Form.Group>
      <Button className='w-100' variant='primary' type='submit'>
        {t('CREATE_USER_BUTTON')}
      </Button>
    </Form>
)}