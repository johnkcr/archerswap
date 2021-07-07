import React, { useContext } from 'react';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { LedgerConnector } from '@web3-react/ledger-connector';
import { ledger } from '../../connectors'
import { TYPE } from '../../theme'
import { RowFixed } from '../Row'
import { ButtonLight, ButtonPrimary } from 'components/Button';
import  { ThemeContext } from 'styled-components'
import {
  SectionTitle, 
  LoadingMessage,
  LoadingWrapper,
  ErrorGroup,
  ErrorButton,
  StyledLoader
} from './styleds';

interface ChooseAccountProps  {
  readonly handleConfirm: () => void;
  readonly derivationPath: string;
}

const ChooseAccount = ({ handleConfirm, derivationPath }: ChooseAccountProps ) => {
  const theme = useContext(ThemeContext)

  const { connector, activate} = useWeb3React();
  const [loading, setLoading] = React.useState(true);
  const [error, setPendingError] = React.useState(false);
  const [accounts, setAccounts] = React.useState<string[]>([]);
  const [fetchingAccounts, setFetchingAccounts] = React.useState(false);
  const [pageNumber, setPageNumber] = React.useState(1);
 
  const tryActivation = React.useCallback(() => {
    setLoading(true);
    activate(ledger, undefined, true).then(() => {
      setLoading(false);
    }).catch(error => { 
      if(error instanceof UnsupportedChainIdError) {
        tryActivation();
      } else {
        setPendingError(true);
      }
    });
  }, [activate]);

  const fetchAccounts = React.useCallback(() => {
    setFetchingAccounts(true);
    (connector as LedgerConnector).getAccounts(pageNumber).then(res => {
      setAccounts([...accounts, ...res]);
      setFetchingAccounts(false);
    }).catch(err => {
      setPendingError(true);
      setFetchingAccounts(false);
    })
  }, [accounts, connector, pageNumber ]);

  const handleLoadMore = () => {
    setPageNumber(pageNumber + 1);
    setTimeout(() => {
      fetchAccounts();
    }, 0);
  }

  const handleConfirmAccount = () => {
    handleConfirm();
  }

  React.useEffect(() => {
    tryActivation();
    setAccounts([]);
    setPageNumber(0);
  }, [tryActivation]);


  React.useEffect(() => {
    if(!loading) {
      fetchAccounts();
    }
  }, [loading, fetchAccounts])

  if(error || loading) {
    return (
      <LoadingMessage error={error}>
        <LoadingWrapper>
          {error ? (
            <ErrorGroup>
              <div>Error connecting.</div>
              <ErrorButton
                onClick={() => {
                  setPendingError(false)
                  tryActivation();
                }}
              >
                Try Again
              </ErrorButton>
            </ErrorGroup>
          ) : (
            <>
              <StyledLoader />
              Connecting...
            </>
          )}
        </LoadingWrapper>
      </LoadingMessage>
    )
  }

  return (
    <div style={{textAlign: 'center'}}>
      <SectionTitle style={{marginBottom: '30px'}}>Available Ledger Accounts</SectionTitle>
      <div style={{ marginBottom: '30px' }}>
        {accounts.map((account, index) => (
          <RowFixed key={index}>
            <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
              {account}
            </TYPE.black>
          </RowFixed>
        ))}
      </div>
      {fetchingAccounts ? (
        <>
          <StyledLoader />
          Loading Accounts...
        </> 
      ): (
        <ButtonLight onClick={handleLoadMore} disabled={fetchingAccounts}>
          Load More...
        </ButtonLight>
      )}
      <ButtonPrimary onClick={handleConfirmAccount} style={{marginTop: '20px'}}>
        Confirm
      </ButtonPrimary>
    </div>
  )
}

export default ChooseAccount;