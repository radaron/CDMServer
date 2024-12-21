import { Form, Button, Alert } from "react-bootstrap"
import { useEffect, useState } from "react"
import "./DeleteUser.css"

export const DeleteUser = () => {

    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState("")
    const [alertMessage, setAlertMessage] = useState("")

    console.log(selectedUser)

    useEffect(() => {
      const getUsers = async () => {
        try {
          const resp = await fetch("/api/users/", {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
              },
          })
          const data = await resp.json()
          if (resp.status === 200) {
            setUsers(data.data.users)
            setSelectedUser(data.data.users[0].email)
          }
          else {
            setAlertMessage("Could not fetch users.")
          }
        } catch (error) {
          setAlertMessage("Unexpected error occurred.")
          console.log(error)
        }
      }
      getUsers()
  }, [])

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
        alert("Success")
      }
      else {
        setAlertMessage("Could not fetch users.")
      }
    } catch (error) {
      setAlertMessage("Unexpected error occurred.")
      console.log(error)
    }
  }

  return (
    <Form className="shadow p-4 bg-white rounded new-user__wrapper" onSubmit={handleDelete}>
      <div className="h4 mb-2 text-center">Delete user</div>
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
      <Form.Group className="mb-2">
        <Form.Select aria-label="Default select example" onChange={(e) => setSelectedUser(e.target.value)}>
          {users.map(user => <option key={user.email} value={user.email}>{user.email}</option>)}
        </Form.Select>
      </Form.Group>
      <Button className="w-100" variant="danger" type="submit">
        Delete user
      </Button>
    </Form>
)}