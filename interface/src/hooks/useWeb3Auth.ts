import { useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import { connectorLocalStorageKey, ConnectorNames } from '@xertra/uikit'
import useToast from 'hooks/useToast'
import { connectorsByName, web3authConnector } from 'connectors'

const useWeb3Auth = () => {
  const { activate, deactivate, account } = useWeb3React();
  const { toastError } = useToast()

  const login = useCallback(() => {
    const connector = connectorsByName[ConnectorNames.Web3Auth];
    
    activate(connector, async (error: Error) => {      
      window.localStorage.removeItem(connectorLocalStorageKey);      
      if (error) {
        toastError(error.message)
      };
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(() => {
    // Web3Auth needs its own logout before web3-react deactivate
    web3authConnector.deactivate();
    deactivate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { login, logout, account };
}

export default useWeb3Auth