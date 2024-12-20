import { NewUser } from "./NewUser"
import { DeleteUser } from "./DeleteUser"
import "./Admin.css"

export const Admin = () => {

  return (
    <div className="admin">
      <NewUser/>
      <DeleteUser/>
    </div>
  )
}
