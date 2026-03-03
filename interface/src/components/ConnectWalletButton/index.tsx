import React from 'react'
import { Button, ButtonProps } from '@xertra/uikit'
import useI18n from 'hooks/useI18n'
import useWeb3Auth from '../../hooks/useWeb3Auth'

const UnlockButton: React.FC<ButtonProps> = (props) => {
  const TranslateString = useI18n()
  const { login } = useWeb3Auth();

  return (
    <Button onClick={login} {...props}>
      {TranslateString(292, 'Unlock Wallet')}
    </Button>
  )
}

export default UnlockButton
