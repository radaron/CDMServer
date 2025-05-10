import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap'
import { DEVICE_PAGE, ADMIN_PAGE, DOWNLOAD_PAGE, STATUS_PAGE, SETTINGS_PAGE, IMDB_PAGE } from './../constant'
import { getLanguage, toggleLanguage } from '../../util'
import { UserInfo } from '../types'
import { CloudArrowDownFill } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'

interface HeaderProps {
  userInfo: UserInfo
  logOut: () => void
}

export const Header: React.FC<HeaderProps> = ({ userInfo, logOut }) => {
  const { t, i18n } = useTranslation()
  return (
    <Navbar bg='dark' data-bs-theme='dark' className='mb-4' expand='lg'>
      <Container>
        <Navbar.Brand href={`/manage/${STATUS_PAGE}`}>
          <CloudArrowDownFill size={30} className="mx-2" />
          CDM
        </Navbar.Brand>
        <Nav className='justify-content-space-between'>
          <Nav.Link href={DOWNLOAD_PAGE}>{t('HEADER_DOWNLOADS')}</Nav.Link>
          <Nav.Link href={IMDB_PAGE}>{t('HEADER_IMDB')}</Nav.Link>
          <Nav.Link href={STATUS_PAGE}>{t('HEADER_STATUS')}</Nav.Link>
          <Nav.Link href={DEVICE_PAGE}>{t('HEADER_DEVICES')}</Nav.Link>
          <Nav.Link href={ADMIN_PAGE} disabled={!userInfo.isAdmin}>{t('HEADER_ADMIN')}</Nav.Link>
        </Nav>
        <Nav>
          <NavDropdown title={userInfo.name} className='text-white'>
            <NavDropdown.Item href={SETTINGS_PAGE}>{t('HEADER_SETTINGS')}</NavDropdown.Item>
            <NavDropdown.Item onClick={() => {
              toggleLanguage()
              i18n.changeLanguage(getLanguage())
            }}>
                {`${t('HEADER_LANGUAGE')} -> ${getLanguage() === 'en' ? 'hu' : 'en'}`}
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => logOut()}>{t('HEADER_LOGOUT')}</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  )
}
