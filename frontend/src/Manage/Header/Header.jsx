import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap'
import { DEVICE, ADMIN, DOWNLOAD, STATUS, SETTINGS, IMDB } from './../constant'
import { getLanguageFromUrl, toggleLanguage } from '../../util'
import { CloudArrowDownFill } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'

export const Header = ({ userInfo, setSelectedTab, logOut }) => {
  const { t } = useTranslation()
  return (
    <Navbar bg='dark' data-bs-theme='dark' className='mb-4' expand='lg'>
      <Container>
        <Navbar.Brand href={`/${getLanguageFromUrl()}/manage`}>
          <CloudArrowDownFill size={30} className="mx-2" />
          CDM
        </Navbar.Brand>
        <Nav className='justify-content-space-between'>
          <Nav.Link onClick={() => setSelectedTab(DEVICE)}>{t('HEADER_DEVICES')}</Nav.Link>
          <Nav.Link disabled={true} onClick={() => setSelectedTab(IMDB)}>{t('HEADER_IMDB')}</Nav.Link>
          <Nav.Link onClick={() => setSelectedTab(DOWNLOAD)}>{t('HEADER_DOWNLOADS')}</Nav.Link>
          <Nav.Link onClick={() => setSelectedTab(STATUS)}>{t('HEADER_STATUS')}</Nav.Link>
          <Nav.Link onClick={() => setSelectedTab(ADMIN)} disabled={!userInfo.isAdmin}>{t('HEADER_ADMIN')}</Nav.Link>
        </Nav>
        <Nav>
          <NavDropdown title={userInfo.name} className='text-white'>
            <NavDropdown.Item onClick={() => setSelectedTab(SETTINGS)}>{t('HEADER_SETTINGS')}</NavDropdown.Item>
            <NavDropdown.Item onClick={() => toggleLanguage()}>
                {`${t('HEADER_LANGUAGE')} -> ${getLanguageFromUrl() === 'en' ? 'hu' : 'en'}`}
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => logOut()}>{t('HEADER_LOGOUT')}</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  )
}
