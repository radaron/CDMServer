import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap"
import { DEVICE, ADMIN, DOWNLOAD, STATUS } from "./../constant"

export const Header = ({ userInfo, setSelectedTab, logOut }) => {
  return (
    <Navbar bg="dark" data-bs-theme="dark" className="mb-4" expand="lg">
      <Container>
        <Navbar.Brand href="/manage">Centralized Download Manager</Navbar.Brand>
        <Nav
            className="me-auto my-2 my-lg-0"
            style={{ maxHeight: '100px' }}
            navbarScroll
          >
          <Nav.Link onClick={() => setSelectedTab(DEVICE)}>Device</Nav.Link>
          <Nav.Link onClick={() => setSelectedTab(DOWNLOAD)}>Download</Nav.Link>
          <Nav.Link onClick={() => setSelectedTab(STATUS)}>Status</Nav.Link>
          {userInfo.isAdmin && <Nav.Link onClick={() => setSelectedTab(ADMIN)}>Admin</Nav.Link>}
        </Nav>
        <Navbar.Collapse className="justify-content-end">
          <NavDropdown title={userInfo.name} className="text-white">
            <NavDropdown.Item onClick={() => logOut()}>Logout</NavDropdown.Item>
          </NavDropdown>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
