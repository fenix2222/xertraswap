import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import styled, { ThemeContext } from 'styled-components'
import { CurrencyAmount, JSBI, TokenAmount, Trade } from '@xertra/sdk'
import { Button, Text, Heading, CardBody, IconButton, ArrowDownIcon } from '@xertra/uikit'
import { ArrowDown } from 'react-feather'
import { useAllPools, useUserPairPosition, PairState } from 'hooks/usePools'
import useI18n from 'hooks/useI18n'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from 'components/swap/styleds'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { AutoRow, RowBetween } from 'components/Row'
import Card, { GreyCard } from 'components/Card'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import ConfirmSwapModal from 'components/swap/ConfirmSwapModal'
import TradePrice from 'components/swap/TradePrice'
import AdvancedSwapDetailsDropdown from 'components/swap/AdvancedSwapDetailsDropdown'
import confirmPriceImpactWithoutFee from 'components/swap/confirmPriceImpactWithoutFee'
import ProgressSteps from 'components/ProgressSteps'
import Loader from 'components/Loader'
import ConnectWalletButton from 'components/ConnectWalletButton'
import AddressInputPanel from 'components/AddressInputPanel'
import { LinkStyledButton } from 'components/Shared'
import { INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { Field, replaceSwapState } from 'state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'state'
import { useExpertModeManager, useUserDeadline, useUserSlippageTolerance } from 'state/user/hooks'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { computeTradePriceBreakdown, warningSeverity } from 'utils/prices'

const BodyWrapper = styled(Card)`
  position: relative;
  max-width: 800px;
  width: 100%;
  z-index: 5;
  padding: 24px;
`

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};

  &:last-child {
    border-bottom: none;
  }
`

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  margin-bottom: 16px;

  &:hover {
    text-decoration: underline;
  }
`

export default function PoolDetails() {
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string }>()
  const pools = useAllPools()
  const userPoolData = useUserPairPosition(pools.map(p => p.pair))
  const TranslateString = useI18n()
  const { account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const dispatch = useDispatch<AppDispatch>()

  const poolIndex = pools.findIndex(p => {
    if (!p.pair) return false
    const token0Addr = p.pair.token0.address.toLowerCase()
    const token1Addr = p.pair.token1.address.toLowerCase()
    const addrA = currencyIdA.toLowerCase()
    const addrB = currencyIdB.toLowerCase()
    return (token0Addr === addrA && token1Addr === addrB) || (token0Addr === addrB && token1Addr === addrA)
  })
  const pool = pools[poolIndex]
  const userData = userPoolData[poolIndex]

  // Swap state
  const [isExpertMode] = useExpertModeManager()
  const [deadline] = useUserDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()
  const { independentField, typedValue, recipient } = useSwapState()
  const { v2Trade, currencyBalances, parsedAmount, currencies, inputError: swapInputError } = useDerivedSwapInfo()
  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue
  )
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const route = trade?.route
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )
  const noRoute = !route

  const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage)
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))

  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    deadline,
    recipient
  )

  const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade)

  const handleSwap = useCallback(() => {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return
    }
    if (!swapCallback) {
      return
    }
    setSwapState((prevState) => ({ ...prevState, attemptingTxn: true, swapErrorMessage: undefined, txHash: undefined }))
    swapCallback()
      .then((hash) => {
        setSwapState((prevState) => ({
          ...prevState,
          attemptingTxn: false,
          swapErrorMessage: undefined,
          txHash: hash,
        }))
      })
      .catch((error) => {
        setSwapState((prevState) => ({
          ...prevState,
          attemptingTxn: false,
          swapErrorMessage: error.message,
          txHash: undefined,
        }))
      })
  }, [priceImpactWithoutFee, swapCallback, setSwapState])

  const [showInverted, setShowInverted] = useState<boolean>(false)
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode)

  const handleConfirmDismiss = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, showConfirm: false }))
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [onUserInput, txHash, setSwapState])

  const handleAcceptChanges = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, tradeToConfirm: trade }))
  }, [trade])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false)
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection, setApprovalSubmitted]
  )

  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      onUserInput(Field.INPUT, maxAmountInput.toExact())
    }
  }, [maxAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection]
  )

  // Initialize currencies with pool tokens when pool data is available
  useEffect(() => {
    if (pool && pool.pair) {
      dispatch(replaceSwapState({
        field: Field.INPUT,
        typedValue: '',
        inputCurrencyId: pool.pair.token0.address,
        outputCurrencyId: pool.pair.token1.address,
        recipient: null
      }))
    }
  }, [dispatch, pool])

  useEffect(() => {
    if (pool && pool.pair) {
      document.title = `${pool.info.lpSymbol} Pool | Xertra Swap`
    }
  }, [pool])

  if (!pool || pool.state !== PairState.EXISTS || !pool.pair) {
    return (
      <BodyWrapper>
        <Wrapper>
          <BackLink to="/pools">← Back to Pools</BackLink>
          <Text>Pool not found or loading...</Text>
        </Wrapper>
      </BodyWrapper>
    )
  }

  const { pair, info } = pool

  return (
    <>
      <ConfirmSwapModal
        isOpen={showConfirm}
        trade={trade}
        originalTrade={tradeToConfirm}
        onAcceptChanges={handleAcceptChanges}
        attemptingTxn={attemptingTxn}
        txHash={txHash}
        recipient={recipient}
        allowedSlippage={allowedSlippage}
        onConfirm={handleSwap}
        swapErrorMessage={swapErrorMessage}
        onDismiss={handleConfirmDismiss}
      />
      <BodyWrapper>
        <Wrapper>
          <BackLink to="/pools">← Back to Pools</BackLink>

          <AutoColumn gap="lg">
            <RowBetween>
              <AutoColumn gap="sm">
                <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={40} margin />
                <Heading size="xl">{info.lpSymbol}</Heading>
              </AutoColumn>
            </RowBetween>

            <StatCard>
              <Text fontSize="18px" bold mb="16px">Swap</Text>
              <CardBody style={{ padding: '16px' }}>
                <AutoColumn gap="md">
                  <CurrencyInputPanel
                    label={
                      independentField === Field.OUTPUT && !showWrap && trade
                        ? TranslateString(194, 'From (estimated)')
                        : TranslateString(76, 'From')
                    }
                    value={formattedAmounts[Field.INPUT]}
                    showMaxButton={!atMaxAmountInput}
                    currency={currencies[Field.INPUT]}
                    onUserInput={handleTypeInput}
                    onMax={handleMaxInput}
                    onCurrencySelect={handleInputSelect}
                    otherCurrency={currencies[Field.OUTPUT]}
                    disableCurrencySelect
                    id="swap-currency-input"
                  />
                  <AutoColumn justify="space-between">
                    <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                      <ArrowWrapper clickable>
                        <IconButton
                          variant="tertiary"
                          onClick={() => {
                            setApprovalSubmitted(false)
                            onSwitchTokens()
                          }}
                          style={{ borderRadius: '50%' }}
                          scale="sm"
                        >
                          <ArrowDownIcon color="primary" width="24px" />
                        </IconButton>
                      </ArrowWrapper>
                      {recipient === null && !showWrap && isExpertMode ? (
                        <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                          + Add a send (optional)
                        </LinkStyledButton>
                      ) : null}
                    </AutoRow>
                  </AutoColumn>
                  <CurrencyInputPanel
                    value={formattedAmounts[Field.OUTPUT]}
                    onUserInput={handleTypeOutput}
                    label={
                      independentField === Field.INPUT && !showWrap && trade
                        ? TranslateString(196, 'To (estimated)')
                        : TranslateString(80, 'To')
                    }
                    showMaxButton={false}
                    currency={currencies[Field.OUTPUT]}
                    onCurrencySelect={handleOutputSelect}
                    otherCurrency={currencies[Field.INPUT]}
                    disableCurrencySelect
                    id="swap-currency-output"
                  />

                  {recipient !== null && !showWrap ? (
                    <>
                      <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                        <ArrowWrapper clickable={false}>
                          <ArrowDown size="16" color={theme.colors.textSubtle} />
                        </ArrowWrapper>
                        <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                          - Remove send
                        </LinkStyledButton>
                      </AutoRow>
                      <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                    </>
                  ) : null}

                  {showWrap ? null : (
                    <Card padding=".25rem .75rem 0 .75rem" borderRadius="8px">
                      <AutoColumn gap="4px">
                        {Boolean(trade) && (
                          <RowBetween align="center">
                            <Text fontSize="14px">{TranslateString(1182, 'Price')}</Text>
                            <TradePrice
                              price={trade?.executionPrice}
                              showInverted={showInverted}
                              setShowInverted={setShowInverted}
                            />
                          </RowBetween>
                        )}
                        {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
                          <RowBetween align="center">
                            <Text fontSize="14px">{TranslateString(88, 'Slippage Tolerance')}</Text>
                            <Text fontSize="14px">{allowedSlippage / 100}%</Text>
                          </RowBetween>
                        )}
                      </AutoColumn>
                    </Card>
                  )}
                </AutoColumn>
                <BottomGrouping>
                  {!account ? (
                    <ConnectWalletButton width="100%" />
                  ) : showWrap ? (
                    <Button disabled={Boolean(wrapInputError)} onClick={onWrap} width="100%">
                      {wrapInputError ??
                        (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
                    </Button>
                  ) : noRoute && userHasSpecifiedInputOutput ? (
                    <GreyCard style={{ textAlign: 'center' }}>
                      <Text mb="4px">{TranslateString(1194, 'Insufficient liquidity for this trade.')}</Text>
                    </GreyCard>
                  ) : showApproveFlow ? (
                    <RowBetween>
                      <Button
                        onClick={approveCallback}
                        disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                        style={{ width: '48%' }}
                        variant={approval === ApprovalState.APPROVED ? 'success' : 'primary'}
                      >
                        {approval === ApprovalState.PENDING ? (
                          <AutoRow gap="6px" justify="center">
                            Approving <Loader stroke="white" />
                          </AutoRow>
                        ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                          'Approved'
                        ) : (
                          `Approve ${currencies[Field.INPUT]?.symbol}`
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          if (isExpertMode) {
                            handleSwap()
                          } else {
                            setSwapState({
                              tradeToConfirm: trade,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: true,
                              txHash: undefined,
                            })
                          }
                        }}
                        style={{ width: '48%' }}
                        id="swap-button"
                        disabled={
                          !isValid || approval !== ApprovalState.APPROVED || (priceImpactSeverity > 3 && !isExpertMode)
                        }
                        variant={isValid && priceImpactSeverity > 2 ? 'danger' : 'primary'}
                      >
                        {priceImpactSeverity > 3 && !isExpertMode
                          ? `Price Impact High`
                          : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                      </Button>
                    </RowBetween>
                  ) : (
                    <Button
                      onClick={() => {
                        if (isExpertMode) {
                          handleSwap()
                        } else {
                          setSwapState({
                            tradeToConfirm: trade,
                            attemptingTxn: false,
                            swapErrorMessage: undefined,
                            showConfirm: true,
                            txHash: undefined,
                          })
                        }
                      }}
                      id="swap-button"
                      disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError}
                      variant={isValid && priceImpactSeverity > 2 && !swapCallbackError ? 'danger' : 'primary'}
                      width="100%"
                    >
                      {swapInputError ||
                        (priceImpactSeverity > 3 && !isExpertMode
                          ? `Price Impact Too High`
                          : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`)}
                    </Button>
                  )}
                  {showApproveFlow && <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />}
                  {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                </BottomGrouping>
              </CardBody>
            </StatCard>

            <StatCard>
              <Text fontSize="18px" bold mb="16px">Liquidity</Text>
              <StatRow>
                <Text>{pair.token0.symbol}</Text>
                <Text bold>{pair.reserve0.toSignificant(6)}</Text>
              </StatRow>
              <StatRow>
                <Text>{pair.token1.symbol}</Text>
                <Text bold>{pair.reserve1.toSignificant(6)}</Text>
              </StatRow>
              <StatRow>
                <Text>LP Address</Text>
                <Text fontSize="12px" style={{ wordBreak: 'break-all' }}>{info.lpAddress}</Text>
              </StatRow>
            </StatCard>

            <StatCard>
              <Text fontSize="18px" bold mb="16px">Price</Text>
              <StatRow>
                <Text>1 {pair.token0.symbol}</Text>
                <Text bold>{pair.token0Price.toSignificant(6)} {pair.token1.symbol}</Text>
              </StatRow>
              <StatRow>
                <Text>1 {pair.token1.symbol}</Text>
                <Text bold>{pair.token1Price.toSignificant(6)} {pair.token0.symbol}</Text>
              </StatRow>
            </StatCard>

            {userData && userData.poolBalance && !userData.poolBalance.equalTo(new TokenAmount(pair.liquidityToken, '0')) && (
              <StatCard>
                <Text fontSize="18px" bold mb="16px">Your Position</Text>
                <StatRow>
                  <Text>{pair.token0.symbol}</Text>
                  <Text bold>{userData.token0Deposited?.toSignificant(6) ?? '---'}</Text>
                </StatRow>
                <StatRow>
                  <Text>{pair.token1.symbol}</Text>
                  <Text bold>{userData.token1Deposited?.toSignificant(6) ?? '---'}</Text>
                </StatRow>
                <StatRow>
                  <Text>LP Tokens</Text>
                  <Text bold>{userData.poolBalance?.toSignificant(4) ?? '---'}</Text>
                </StatRow>
                <StatRow>
                  <Text>Share of Pool</Text>
                  <Text bold>{userData.poolPercentage ? `${userData.poolPercentage?.toFixed(2)}%` : '---'}</Text>
                </StatRow>
              </StatCard>
            )}

            <AutoColumn gap="sm">
              <Button as={Link} to={`/add/${pair.token0.address}/${pair.token1.address}`} style={{ width: '100%' }}>
                {TranslateString(168, 'Add Liquidity')}
              </Button>
              {userData?.poolBalance && !userData.poolBalance.equalTo(new TokenAmount(pair.liquidityToken, '0')) && (
                <Button
                  variant="secondary"
                  as={Link}
                  to={`/remove/${pair.token0.address}/${pair.token1.address}`}
                  style={{ width: '100%' }}
                >
                  {TranslateString(168, 'Remove Liquidity')}
                </Button>
              )}
            </AutoColumn>
          </AutoColumn>
        </Wrapper>
      </BodyWrapper>
      <AdvancedSwapDetailsDropdown trade={trade} />
    </>
  )
}
