import React, { useContext } from 'react'
import { Menu as UikitMenu} from '@xertra/uikit'
import { allLanguages } from '../../constants/localisation/languageCodes'
import { LanguageContext } from '../../hooks/LanguageContext'
import useGetPriceData from '../../hooks/useGetPriceData'
import links from './config'
import useWeb3Auth from '../../hooks/useWeb3Auth'

// No-op function for theme toggle (dark mode only)
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

const Menu: React.FC = (props) => {
  const { login, logout, account } = useWeb3Auth();
  const { selectedLanguage, setSelectedLanguage } = useContext(LanguageContext);
  const priceData = useGetPriceData();
  const cakePriceUsd = priceData ? Number(priceData.stratis?.usd) : undefined

  return (
    <UikitMenu
      links={links}
      account={account as string}
      login={login}
      logout={logout}
      isDark
      toggleTheme={noop}
      currentLang={selectedLanguage?.code || ''}
      langs={allLanguages}
      setLang={setSelectedLanguage}
      cakePriceUsd={cakePriceUsd}
      {...props}
    />
  )
}

export default Menu
