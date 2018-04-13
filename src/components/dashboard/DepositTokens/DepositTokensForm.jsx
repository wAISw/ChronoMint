/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { Button, IPFSImage } from 'components'
import { Slider, TextField } from 'redux-form-material-ui'
import { isTestingNetwork } from '@chronobank/login/network/settings'
import { DUCK_NETWORK } from '@chronobank/login/redux/network/actions'
import { TOKEN_ICONS } from 'assets'
import BigNumber from 'bignumber.js'
import Preloader from 'components/common/Preloader/Preloader'
import TokenValue from 'components/common/TokenValue/TokenValue'
import Amount from 'models/Amount'
import AssetsCollection from 'models/assetHolder/AssetsCollection'
import TokenModel from 'models/tokens/TokenModel'
import TokensCollection from 'models/tokens/TokensCollection'
import MainWallet from 'models/wallet/MainWalletModel'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Translate } from 'react-redux-i18n'
import { change, Field, formPropTypes, formValueSelector, reduxForm } from 'redux-form/immutable'
import { DUCK_ASSETS_HOLDER } from 'redux/assetsHolder/actions'
import { DUCK_MAIN_WALLET, mainApprove, mainRevoke, requireTIME, TIME } from 'redux/mainWallet/actions'
import { DUCK_SESSION } from 'redux/session/actions'
import { DUCK_TOKENS, estimateGas } from 'redux/tokens/actions'
import AllowanceModel from 'models/wallet/AllowanceModel'
import classnames from 'classnames'
import { BLOCKCHAIN_ETHEREUM } from 'dao/EthereumDAO'
import { getGasPriceMultiplier } from 'redux/session/selectors'
import './DepositTokensForm.scss'
import validate from './validate'

const FORM_DEPOSIT_TOKENS = 'FormDepositTokens'

export const ACTION_APPROVE = 'deposit/approve'
export const ACTION_DEPOSIT = 'deposit/deposit'
export const ACTION_WITHDRAW = 'deposit/withdraw'

const FEE_RATE_MULTIPLIER = {
  min: 0.1,
  max: 1.9,
  step: 0.1,
}

function prefix (token) {
  return `components.dashboard.DepositTokens.${token}`
}

function mapStateToProps (state) {
  // form
  const selector = formValueSelector(FORM_DEPOSIT_TOKENS)
  const tokenId = selector(state, 'symbol')
  const amount = selector(state, 'amount')
  const feeMultiplier = selector(state, 'feeMultiplier')

  // state
  const wallet: MainWallet = state.get(DUCK_MAIN_WALLET)
  const assetHolder = state.get(DUCK_ASSETS_HOLDER)
  const tokens = state.get(DUCK_TOKENS)
  const { selectedNetworkId, selectedProviderId } = state.get(DUCK_NETWORK)

  const token = tokens.item(tokenId)
  const isTesting = isTestingNetwork(selectedNetworkId, selectedProviderId)
  const balance = wallet.balances().item(tokenId).amount()

  const assets = assetHolder.assets()
  const spender = assetHolder.wallet()

  return {
    balance,
    deposit: assets.item(token.address()).deposit(),
    allowance: wallet.allowances().item(spender, token.id()),
    spender,
    amount,
    token,
    feeMultiplier,
    tokens,
    assets,
    isShowTIMERequired: isTesting && !wallet.isTIMERequired() && balance.isZero() && token.symbol() === 'TIME',
    account: state.get(DUCK_SESSION).account,
    initialValues: {
      feeMultiplier: getGasPriceMultiplier(BLOCKCHAIN_ETHEREUM)(state),
    },
  }
}

function mapDispatchToProps (dispatch) {
  return {
    mainApprove: (token, amount, spender) => dispatch(mainApprove(token, amount, spender)),
    mainRevoke: (token, spender) => dispatch(mainRevoke(token, spender)),
    requireTIME: () => dispatch(requireTIME()),
  }
}

@connect(mapStateToProps, mapDispatchToProps)
@reduxForm({ form: FORM_DEPOSIT_TOKENS, validate })
export default class DepositTokensForm extends PureComponent {
  static propTypes = {
    deposit: PropTypes.instanceOf(Amount),
    allowance: PropTypes.instanceOf(AllowanceModel),
    balance: PropTypes.instanceOf(Amount),
    isShowTIMERequired: PropTypes.bool,
    token: PropTypes.instanceOf(TokenModel),
    account: PropTypes.string,
    wallet: PropTypes.instanceOf(MainWallet),
    tokens: PropTypes.instanceOf(TokensCollection),
    selectedToken: PropTypes.string,
    assets: PropTypes.instanceOf(AssetsCollection),
    requireTIME: PropTypes.func,
    mainApprove: PropTypes.func,
    mainRevoke: PropTypes.func,
    ...formPropTypes,
  }

  constructor (props) {
    super(props)

    let step = 1
    if (this.props.allowance.amount().gt(0)) {
      step = 2
    }

    this.state = { step }
    this.timeout = null
  }

  componentWillReceiveProps (newProps) {
    const firstAsset = newProps.assets.first()
    if (!newProps.token.isFetched() && firstAsset) {
      this.props.dispatch(change(FORM_DEPOSIT_TOKENS, 'symbol', firstAsset.symbol()))
    }

    if (newProps.amount > 0 && newProps.feeMultiplier > 0 && (newProps.amount !== this.props.amount || newProps.feeMultiplier !== this.props.feeMultiplier)) {
      this.handleGetGasPrice(newProps.amount, newProps.feeMultiplier, this.props.spender)
    }
  }

  handleGetGasPrice = (amount, feeMultiplier, spender) => {
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      estimateGas(
        TIME,
        [ 'approve', [ spender, new BigNumber(amount) ] ],
        (error, { gasFee, gasPrice }) => {
          if (!error) {
            this.setState({ gasFee, gasPrice })
          }
        },
        feeMultiplier,
      )
    }, 1000)
  }

  handleApproveAsset = (values) => {
    this.props.onSubmit(values
      .set('action', ACTION_APPROVE)
      .set('token', this.props.token)
      .set('spender', this.props.spender),
    )
  }

  handleRevokeAsset = () => {
    const { spender } = this.props
    this.props.mainRevoke(this.props.token, spender)
  }

  handleDepositAsset = (values) => {
    this.props.onSubmit(values
      .set('action', ACTION_DEPOSIT)
      .set('token', this.props.token),
    )
  }

  handleWithdrawAsset = (values) => {
    this.props.onSubmit(values
      .set('action', ACTION_WITHDRAW)
      .set('token', this.props.token),
    )
  }

  handleRequireTime = () => {
    this.props.requireTIME()
  }

  getIsLockValid (amount) {
    const { balance, allowance } = this.props
    const limit = BigNumber.min(balance, allowance.amount())
    return limit.gte(amount)
  }

  handleChangeAmount = (e, value) => {
    // eslint-disable-next-line
    // console.log('handleChangeAmount', e, value)

  }

  renderHead () {
    const { deposit, allowance, token, balance, assets } = this.props
    const symbol = token.symbol()
    return (
      <div styleName='head'>
        <div styleName='mainTitle'><Translate value={prefix('depositTime')} /></div>
        <div styleName='icon'>
          <div styleName='imgWrapper'>
            <IPFSImage
              styleName='iconImg'
              multihash={token.icon()}
              fallback={TOKEN_ICONS[ symbol ]}
            />
          </div>
        </div>
        <div styleName='headContent'>
          {token.isFetched()
            ? (
              <div>
                <div styleName='headItem'>
                  <div styleName='balance'>{symbol}&nbsp;<TokenValue isInvert noRenderPrice noRenderSymbol value={balance} /></div>
                  <div styleName='balanceFiat'><TokenValue isInvert renderOnlyPrice value={balance} /></div>
                </div>

                {/*<div styleName='headItem'>
                  <div styleName='title'><Translate value={prefix('yourDeposit')} /></div>
                  <div styleName='balance'>{symbol}&nbsp;<TokenValue isInvert noRenderPrice noRenderSymbol value={deposit} /></div>
                  <div styleName='balanceFiat'><TokenValue isInvert renderOnlyPrice value={deposit} /></div>
                </div>

                {
                  allowance.amount().gt(0) &&
                  <div styleName='headItem'>
                    <div styleName='title'><Translate value={prefix('holderAllowance')} /></div>
                    <div styleName='balance'>{symbol}&nbsp;<TokenValue isInvert noRenderPrice noRenderSymbol value={allowance.amount()} /></div>
                    <div styleName='balanceFiat'><TokenValue isInvert renderOnlyPrice value={allowance.amount()} /></div>
                  </div>
                }*/}
              </div>
            )
            : (
              <div styleName='preloader'><Preloader /></div>
            )}
          <div styleName='stepsWrapper'>
            <div styleName={classnames('step', { 'active': this.state.step === 1 })}>
              <Translate value={prefix('firstStep')} />
            </div>
            <div styleName={classnames('step', { 'active': this.state.step === 2 })}>
              <Translate value={prefix('secondStep')} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderBody () {
    const { amount, token } = this.props
    return (
      <div>
        <div styleName='fieldWrapper'>
          <Field
            component={TextField}
            fullWidth
            hintText='0.00'
            floatingLabelText={<Translate value={prefix('amount')} symbol='TIME' />}
            onChange={this.handleChangeAmount}
            name='amount'
          />
          <div styleName='amountInFiat'><TokenValue renderOnlyPrice value={new Amount(token.addDecimals(amount || 0), token.symbol())} /></div>
        </div>
        {(
          <div>
            <div styleName='feeRate'>
              <div styleName='tagsWrap'>
                <div><Translate value={prefix('slow')} /></div>
                <div styleName='tagDefault' />
                <div><Translate value={prefix('fast')} /></div>
              </div>

              <Field
                component={Slider}
                sliderStyle={{ marginBottom: 0, marginTop: 5 }}
                name='feeMultiplier'
                {...FEE_RATE_MULTIPLIER}
              />

              <div>
                {/*<Translate*/}
                {/*value={`${prefix}.${this.getFeeTitle()}`}*/}
                {/*multiplier={feeMultiplier.toFixed(1)}*/}
                {/*total={Number((feeMultiplier * token.feeRate()).toFixed(1))}*/}
                {/*/>*/}
              </div>

            </div>
          </div>
        )}
        <div styleName='transactionsInfo'>
          <div>
            <b><Translate value={prefix('transactionFee')} />:</b>
            {
              this.state.gasFee
                ? <TokenValue value={this.state.gasFee} />
                : <span>Enter Amount</span>
            }
          </div>
          <div><b><Translate value={prefix('transactionWillBeDoneIn')} />:</b> <Translate value={prefix('sec')} /></div>
        </div>
      </div>
    )
  }

  renderFoot () {
    const { isShowTIMERequired, amount, balance, deposit, token, allowance, pristine, invalid, handleSubmit } = this.props
    const isInvalid = pristine || invalid
    const isRevoke = !allowance.amount().isZero()
    const amountWithDecimals = isInvalid
      ? new BigNumber(0)
      : token.addDecimals(amount || 0)

    const isRevokeDisabled = allowance.isFetching() || !allowance.isFetched()
    const isApproveDisabled = isInvalid || balance.lt(amountWithDecimals) || allowance.isFetching() || !allowance.isFetched()
    const isLockDisabled = isInvalid || !this.getIsLockValid(amountWithDecimals) || allowance.isFetching() || !allowance.isFetched()
    const isWithdrawDisabled = isInvalid || deposit.lt(amountWithDecimals)
    return (
      <div styleName='actions'>
        <span styleName='action'>
          {isShowTIMERequired
            ? (
              <Button
                flat
                styleName='actionButton'
                label={<Translate value={prefix('requireTime')} />}
                onTouchTap={this.handleRequireTime}
              />
            ) : (
              <Button
                styleName='actionButton'
                label={isRevoke ? 'Revoke' : 'Approve'}
                onTouchTap={isRevoke ? this.handleRevokeAsset : handleSubmit(this.handleApproveAsset)}
                disabled={isRevoke ? isRevokeDisabled : isApproveDisabled}
              />
            )
          }
        </span>

        {!isShowTIMERequired && (
          <span styleName='action'>
            <Button
              styleName='actionButton'
              label='Lock'
              onTouchTap={handleSubmit(this.handleDepositAsset)}
              disabled={isLockDisabled}
            />
          </span>
        )}
        <span styleName='action'>
          <Button
            styleName='actionButton'
            label={<Translate value={prefix('withdraw')} />}
            onTouchTap={handleSubmit(this.handleWithdrawAsset)}
            disabled={isWithdrawDisabled}
          />
        </span>
      </div>
    )
  }

  /*render () {
    return (
      <Paper>
        <form onSubmit={this.props.handleSubmit}>
          <ColoredSection
            head={this.renderHead()}
            body={this.renderBody()}
            foot={this.renderFoot()}
          />
        </form>
      </Paper>
    )
  }*/
  render () {
    return (
      <div styleName='root'>
        <form onSubmit={this.props.handleSubmit}>
          {this.renderHead()}
          <div styleName='body'>
            {this.renderBody()}
            {this.renderFoot()}
          </div>
        </form>
      </div>
    )
  }
}
