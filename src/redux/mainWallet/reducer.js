import MainWalletModel from 'models/wallet/MainWalletModel'
import * as a from './actions'

const initialState = new MainWalletModel()

export default (state = initialState, action) => {
  switch (action.type) {
    case a.WALLET_INIT:
      return state.isInited(action.isInited)
    case a.WALLET_BALANCE:
      return state.balances(state.balances().update(
        state.balances().item(action.token.id()).updateBalance(action.isCredited, action.amount),
      ))
    case a.WALLET_BALANCE_SET:
      return state.tokens(state.tokens().set(
        action.token.id(),
        state.tokens().get(action.token.id()).setBalance(action.amount),
      ))
    case a.WALLET_ALLOWANCE:
      return state.allowances(state.allowances().update(action.allowance))
      // return state.setAllowance(action.token.id(), action.spender, action.value)
    case a.WALLET_BTC_ADDRESS:
      return state.btcAddress(action.address)
    case a.WALLET_BCC_ADDRESS:
      return state.bccAddress(action.address)
    case a.WALLET_BTG_ADDRESS:
      return state.btgAddress(action.address)
    case a.WALLET_LTC_ADDRESS:
      return state.ltcAddress(action.address)
    case a.WALLET_NEM_ADDRESS:
      return state.nemAddress(action.address)
    case a.WALLET_TRANSACTIONS_FETCH:
      return state.transactions(state.transactions().isFetching(true))
    case a.WALLET_TRANSACTION:
      return state.transactions(state.transactions().update(action.tx))
    case a.WALLET_TRANSACTIONS:
      return state.transactions(state.transactions()
        .merge(action.map)
        .isFetching(false)
        .endOfList(action.map.size),
      )
    case a.WALLET_IS_TIME_REQUIRED:
      return state.isTIMERequired(action.value)
    case a.WALLET_TOKEN_BALANCE:
      return state.balance(action.balance)
    default:
      return state
  }
}
