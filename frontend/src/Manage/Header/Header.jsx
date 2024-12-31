import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap"
import { DEVICE, ADMIN, DOWNLOAD, STATUS, SETTINGS, IMDB } from "./../constant"
import Logo from "../../logo.png";

export const Header = ({ userInfo, setSelectedTab, logOut }) => {
  return (
    <Navbar bg="dark" data-bs-theme="dark" className="mb-4" expand="lg">
      <Container>
        <Navbar.Brand href="/manage">
          <img
              src={Logo}
              width="30"
              height="30"
              className="d-inline-block align-top"
              alt="logo"
          />
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
            {/* <NavDropdown.Item onClick={() => setSelectedTab(SETTINGS)}>Settings</NavDropdown.Item> */}
            <NavDropdown.Item onClick={() => logOut()}>Logout</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  )
}
