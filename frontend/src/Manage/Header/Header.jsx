import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap"
import { DEVICE, ADMIN, DOWNLOAD, STATUS, SETTINGS, IMDB } from "./../constant"
import { CloudArrowDownFill } from "react-bootstrap-icons"

export const Header = ({ userInfo, setSelectedTab, logOut }) => {
  return (
    <Navbar bg="dark" data-bs-theme="dark" className="mb-4" expand="lg">
      <Container>
        <Navbar.Brand href="/manage">
          <CloudArrowDownFill size={30} className="mx-2"/>
          CDM
        </Navbar.Brand>
        <Nav className="justify-content-space-between">
          <Nav.Link onClick={() => setSelectedTab(DEVICE)}>Device</Nav.Link>
          <Nav.Link onClick={() => setSelectedTab(IMDB)}>IMDb</Nav.Link>
          <Nav.Link onClick={() => setSelectedTab(DOWNLOAD)}>Download</Nav.Link>
          <Nav.Link onClick={() => setSelectedTab(STATUS)}>Status</Nav.Link>
          <Nav.Link onClick={() => setSelectedTab(ADMIN)} disabled={!userInfo.isAdmin}>Admin</Nav.Link>
        </Nav>
        <Nav>
          <NavDropdown title={userInfo.name} className="text-white">
            <NavDropdown.Item onClick={() => setSelectedTab(SETTINGS)}>Settings</NavDropdown.Item>
            <NavDropdown.Item onClick={() => logOut()}>Logout</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  )
}
