import './Settings.css'
import { useTranslation } from "react-i18next"

export const Settings = () => {
  const { t } = useTranslation()
  return (
    <div className="title">
      <h1>{t('SOON')}...</h1>
    </div>
  )
}