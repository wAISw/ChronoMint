import contractsManagerDAO from 'dao/ContractsManagerDAO'
import type MultisigWalletDAO from 'dao/MultisigWalletDAO'
import { EVENT_MS_WALLETS_COUNT, EVENT_NEW_MS_WALLET } from 'dao/MultisigWalletsManagerDAO'
import Amount from 'models/Amount'
import WalletNoticeModel, { statuses } from 'models/notices/WalletNoticeModel'
import BalanceModel from 'models/tokens/BalanceModel'
import TokenModel from 'models/tokens/TokenModel'
import type MultisigWalletModel from 'models/wallet/MultisigWalletModel'
import type MultisigWalletPendingTxModel from 'models/wallet/MultisigWalletPendingTxModel'
import { notify } from 'redux/notifier/actions'
import { DUCK_SESSION } from 'redux/session/actions'
import { DUCK_TOKENS } from 'redux/tokens/actions'
import multisigWalletService, { EVENT_CONFIRMATION, EVENT_CONFIRMATION_NEEDED, EVENT_DEPOSIT, EVENT_MULTI_TRANSACTION, EVENT_OWNER_ADDED, EVENT_OWNER_REMOVED, EVENT_REVOKE, } from 'services/MultisigWalletService'
import tokenService, { EVENT_NEW_TOKEN } from 'services/TokenService'

export const DUCK_MULTISIG_WALLET = 'multisigWallet'

export const MULTISIG_INIT = 'multisig/INIT'
export const MULTISIG_FETCHING = 'multisig/FETCHING'
export const MULTISIG_FETCHED = 'multisig/FETCHED'

export const MULTISIG_UPDATE = 'multisigWallet/UPDATE'
export const MULTISIG_BALANCE = 'multisigWallet/BALANCE'
export const MULTISIG_SELECT = 'multisigWallet/SELECT'
export const MULTISIG_REMOVE = 'multisigWallet/REMOVE'

let walletsManagerDAO

const updateWallet = (wallet: MultisigWalletModel) => (dispatch) => dispatch({ type: MULTISIG_UPDATE, wallet })

export const watchMultisigWallet = (wallet: MultisigWalletModel): Promise => () => {
  try {
    return multisigWalletService.subscribeToWalletDAO(wallet)
  } catch (e) {
    // eslint-disable-next-line
    console.error('watch error', e.message)
  }
}

export const initWalletManager = () => async (dispatch, getState) => {
  if (getState().get(DUCK_MULTISIG_WALLET).isInited()) {
    return
  }
  dispatch({ type: MULTISIG_INIT, isInited: true })

  walletsManagerDAO = await contractsManagerDAO.getWalletsManagerDAO()

  walletsManagerDAO.on(EVENT_NEW_MS_WALLET, (oldWallet: MultisigWalletModel) => {
    const fetchBalanceForToken = async (token) => {
      const tokenDao = tokenService.getDAO(token)
      const balance = await tokenDao.getAccountBalance(wallet.address(), token)
      const symbol = token.symbol()
      dispatch({
        type: MULTISIG_BALANCE,
        walletId: wallet.id(),
        balance: new BalanceModel({
          id: token.id(),
          amount: new Amount(balance, symbol, true),
        }),
      })
    }

    let wallet = oldWallet
    if (wallet.transactionHash()) {
      // created via event
      // address arrived, delete temporary hash
      dispatch({ type: MULTISIG_REMOVE, id: wallet.id() })
      dispatch(notify(new WalletNoticeModel({
        address: wallet.address(),
        action: statuses.CREATED,
      })))
      wallet = oldWallet.transactionHash(null).isPending(false)
    }

    watchMultisigWallet(wallet)

    // subcscribe
    tokenService.on(EVENT_NEW_TOKEN, fetchBalanceForToken)
    // fetch for existing tokens
    const tokens = getState().get(DUCK_TOKENS)
    tokens.list().forEach(fetchBalanceForToken)

    // push to state
    dispatch({ type: MULTISIG_FETCHED, wallet })
    // select first one
    const wallets = getState().get(DUCK_MULTISIG_WALLET)
    if (wallets.size() === 1) {
      dispatch(selectMultisigWallet(wallet))
    }
  })

  walletsManagerDAO.on(EVENT_MS_WALLETS_COUNT, (count) => {
    dispatch({ type: MULTISIG_FETCHING, count })
  })

  // multisig wallet events
  multisigWalletService.on(EVENT_OWNER_ADDED, (walletId, ownerAddress) => {
    const wallet = getState().get(DUCK_MULTISIG_WALLET).item(walletId)
    const owners = wallet.owners().push(ownerAddress)
    dispatch(updateWallet(wallet.owners(owners)))
  })

  multisigWalletService.on(EVENT_OWNER_REMOVED, (walletId, ownerAddress) => {
    const wallet = getState().get(DUCK_MULTISIG_WALLET).item(walletId)
    const owners = wallet.owners().remove(ownerAddress)
    dispatch(updateWallet(wallet.owners(owners)))
  })

  multisigWalletService.on(EVENT_MULTI_TRANSACTION, (walletId, multisigTransactionModel) => {
    let wallet = getState().get(DUCK_MULTISIG_WALLET).item(walletId)
    const pendingTxList = wallet.pendingTxList().remove(multisigTransactionModel)
    const tokens = wallet.tokens()
    let token: TokenModel = tokens.get(multisigTransactionModel.symbol())
    if (!token) {
      // eslint-disable-next-line
      console.error('token not found', multisigTransactionModel.symbol())
      return
    }
    token = token.updateBalance(false, multisigTransactionModel.value())

    dispatch(updateWallet(wallet.pendingTxList(pendingTxList).tokens(tokens.set(token.id(), token))))
  })

  multisigWalletService.on('SingleTransact', (walletId, result) => {
    // eslint-disable-next-line
    console.log('--actions#', result)
  })

  multisigWalletService.on(EVENT_REVOKE, (walletId, id) => {
    const wallet: MultisigWalletModel = getState().get(DUCK_MULTISIG_WALLET).item(walletId)
    const pendingTxList = wallet.pendingTxList()
    const pendingTx = pendingTxList.item(id).isConfirmed(false)
    dispatch(updateWallet(wallet.pendingTxList(pendingTxList.list(pendingTxList.list().set(id, pendingTx)))))
  })

  multisigWalletService.on(EVENT_CONFIRMATION, (walletId, id, owner) => {
    if (owner !== getState().get(DUCK_SESSION).account) {
      return
    }

    const wallet: MultisigWalletModel = getState().get(DUCK_MULTISIG_WALLET).item(walletId)
    const pendingTxList = wallet.pendingTxList()
    let pendingTx = pendingTxList.item(id)
    if (!pendingTx) {
      return
    }
    pendingTx = pendingTx.isConfirmed(true)
    dispatch(updateWallet(wallet.pendingTxList(pendingTxList.list(pendingTxList.list().set(id, pendingTx)))))
  })

  multisigWalletService.on(EVENT_CONFIRMATION_NEEDED, (walletId, pendingTxModel: MultisigWalletPendingTxModel) => {
    const wallet: MultisigWalletModel = getState().get(DUCK_MULTISIG_WALLET).item(walletId)
    const pendingTxList = wallet.pendingTxList()
    dispatch(updateWallet(wallet.pendingTxList(pendingTxList.update(pendingTxModel))))
  })

  multisigWalletService.on(EVENT_DEPOSIT, (walletId, tokenId, amount) => {
    const wallet: MultisigWalletModel = getState().get(DUCK_MULTISIG_WALLET).item(walletId)
    const token: TokenModel = wallet.tokens().get(tokenId)
    dispatch(updateWallet(wallet.tokens(wallet.tokens().set(token.id(), token.updateBalance(true, amount)))))
  })

  // all ready, start fetching
  walletsManagerDAO.fetchWallets()
}

export const selectMultisigWallet = (wallet: MultisigWalletModel) => (dispatch) => {
  dispatch({ type: MULTISIG_SELECT, wallet })
}

export const createWallet = (wallet: MultisigWalletModel) => async (dispatch) => {
  try {
    const txHash = await walletsManagerDAO.createWallet(wallet)
    dispatch(updateWallet(wallet.isPending(true).transactionHash(txHash)))
    return txHash
  } catch (e) {
    // eslint-disable-next-line
    console.error('create wallet error', e.message)
  }
}

export const removeWallet = (wallet: MultisigWalletModel) => async (dispatch, getState) => {
  try {
    const { account } = getState().get(DUCK_SESSION)
    dispatch(updateWallet(wallet.isPending(true)))
    const dao: MultisigWalletDAO = multisigWalletService.getWalletDAO(wallet.address())
    await dao.removeWallet(wallet, account)
  } catch (e) {
    // eslint-disable-next-line
    console.error('delete error', e.message)
  }
}

export const addOwner = (wallet: MultisigWalletModel, ownerAddress: string) => async (dispatch) => {
  dispatch(updateWallet(wallet.isPending(true)))
  try {
    const dao: MultisigWalletDAO = multisigWalletService.getWalletDAO(wallet.address())
    await dao.addOwner(wallet, ownerAddress)
  } catch (e) {
    // eslint-disable-next-line
    console.error('add owner error', e.message)
  }
}

export const removeOwner = (wallet, ownerAddress) => async (dispatch) => {
  dispatch(updateWallet(wallet.isPending(true)))
  try {
    const dao: MultisigWalletDAO = multisigWalletService.getWalletDAO(wallet.address())
    await dao.removeOwner(wallet, ownerAddress)
  } catch (e) {
    // eslint-disable-next-line
    console.error('remove owner error', e.message)
  }
}

export const multisigTransfer = (wallet, token, amount, recipient) => async (dispatch, getState) => {
  try {
    const dao: MultisigWalletDAO = multisigWalletService.getWalletDAO(wallet.address())
    await dao.transfer(wallet, token, amount, recipient)
  } catch (e) {
    // eslint-disable-next-line
    console.error('ms transfer error', e.message)
  }
}

export const confirmMultisigTx = (wallet, tx: MultisigWalletPendingTxModel) => async (dispatch) => {
  try {
    const dao: MultisigWalletDAO = multisigWalletService.getWalletDAO(wallet.address())
    await dao.confirmPendingTx(tx)
  } catch (e) {
    // eslint-disable-next-line
    console.error('confirm ms tx error', e.message)
  }
}

export const revokeMultisigTx = (wallet: MultisigWalletModel, tx: MultisigWalletPendingTxModel) => async (dispatch) => {
  try {
    const dao: MultisigWalletDAO = multisigWalletService.getWalletDAO(wallet.address())
    await dao.revokePendingTx(tx)
  } catch (e) {
    // eslint-disable-next-line
    console.error('revoke ms tx error', e.message)
  }
}
