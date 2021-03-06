/**
 * Copyright 2017–2019, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { ethereumProvider } from '@chronobank/login/network/EthereumProvider'
import { BLOCKCHAIN_ETHEREUM } from '@chronobank/login/network/constants'
import { getCurrentNetworkSelector } from '@chronobank/login/redux/network/selectors'
import { HolderModel, ContractDAOModel, ContractModel } from '../../models'
import { getAddressCache } from '../persistAccount/selectors'
import ethereumDAO from '../../dao/EthereumDAO'
import { WALLETS_CACHE_ADDRESS } from '../persistAccount/constants'
import * as ethActions from './actions'
import WalletModel from '../../models/wallet/WalletModel'
import { WALLETS_SET, WALLETS_UPDATE_BALANCE } from '../wallets/constants'
import { formatBalances, getWalletBalances, subscribeOnTokens } from '../tokens/utils'
import * as Utils from './utils'

import { DUCK_TOKENS } from '../tokens/constants'
import * as TokensActions from '../tokens/actions'
import tokenService from '../../services/TokenService'
import { DAOS_REGISTER } from '../daos/constants'
import ERC20ManagerDAO from '../../dao/ERC20ManagerDAO'
import TokenModel from '../../models/tokens/TokenModel'
import { EVENT_ERC20_TOKENS_COUNT, EVENT_NEW_ERC20_TOKEN } from '../../dao/constants/ERC20ManagerDAO'
import TransactionHandler from '../abstractEthereum/utils/TransactionHandler'
import { web3Selector, getEthereumSigner } from './selectors'
import { daoByAddress, daoByType } from '../daos/selectors'
import { LHT, EVENT_NEW_BLOCK } from '../../dao/constants'
import Amount from '../../models/Amount'

class EthereumTransactionHandler extends TransactionHandler {
  constructor () {
    super(BLOCKCHAIN_ETHEREUM)
  }

  getDAO (entry, state) {
    return daoByAddress(entry.tx.to)(state) || ethereumDAO
  }

  getEstimateGasRequestFieldSet (tx, gasPrice, nonce, chainId) {
    const fields = super.getEstimateGasRequestFieldSet(tx, gasPrice, nonce)
    fields.chainId = chainId
    return fields
  }

  getWeb3 (state) {
    return web3Selector()(state)
  }
}

const transactionHandler = new EthereumTransactionHandler()
export const estimateGas = (tx, feeMultiplier = 1) => transactionHandler.estimateGas(tx, feeMultiplier)
export const executeTransaction = ({ tx, options }) => transactionHandler.executeTransaction({ tx, options })

export const initEthereum = ({ web3 }) => (dispatch) => {
  dispatch(ethActions.ethWeb3Update(new HolderModel({ value: web3 })))
}

export const enableEthereum = () => async (dispatch) => {
  await dispatch(initTokens())
  await dispatch(initWallet())
  ethereumProvider.connectCurrentNode()
}

export const initTokens = () => async (dispatch, getState) => {
  let state = getState()
  if (state.get(DUCK_TOKENS).isInited()) {
    return
  }
  const web3 = web3Selector()(state)
  ethereumDAO.connect(web3)

  dispatch(TokensActions.tokensInit())
  dispatch(TokensActions.setTokensFetchingCount(0))
  const erc20: ERC20ManagerDAO = daoByType('ERC20Manager')(state)

  state = getState()
  erc20
    .on(EVENT_ERC20_TOKENS_COUNT, async (count) => {
      const currentCount = state.get(DUCK_TOKENS).leftToFetch()
      dispatch(TokensActions.setTokensFetchingCount(currentCount + count + 1 /*+eth+lht-lht(ERC20)*/))

      const ethToken: TokenModel = await ethereumDAO.getToken()
      if (ethToken) {
        dispatch(TokensActions.tokenFetched(ethToken))
        tokenService.registerDAO(ethToken, ethereumDAO)
      }
    })
    .on(EVENT_NEW_ERC20_TOKEN, (token: TokenModel) => {
      if (token.symbol() === LHT) {
        // eslint-disable-next-line no-console
        return console.warn(`Unsupported ERC20 token ${token.get('symbol')} received`)
      }

      dispatch(TokensActions.tokenFetched(token))
      const dao = tokenService.createDAO(token, web3)

      dispatch({
        type: DAOS_REGISTER,
        model: new ContractDAOModel({
          contract: new ContractModel({
            abi: dao.abi,
            type: token.symbol(),
          }),
          address: token.address(),
          dao,
        }),
      })
    })
    .fetchTokens()

  dispatch(watchLatestBlock())
}

export const watchLatestBlock = () => async (dispatch) => {
  ethereumDAO.on(EVENT_NEW_BLOCK, (block) => {
    dispatch(TokensActions.setLatestBlock(BLOCKCHAIN_ETHEREUM, block))
  })
  const block = await ethereumDAO.getBlockNumber()
  dispatch(TokensActions.setLatestBlock(BLOCKCHAIN_ETHEREUM, { blockNumber: block }))
}

const initWallet = () => async (dispatch, getState) => {
  const state = getState()
  var addressCache = { ...getAddressCache(state) }
  const { network } = getCurrentNetworkSelector(state)

  if (!addressCache[BLOCKCHAIN_ETHEREUM]) {
    const path = Utils.getEthereumDerivedPath(network[BLOCKCHAIN_ETHEREUM])
    const signer = getEthereumSigner(state)
    const address = await signer.getAddress(path)

    await dispatch({
      type: WALLETS_CACHE_ADDRESS,
      blockchain: BLOCKCHAIN_ETHEREUM,
      address,
      path,
    })
  }

  addressCache = { ...getAddressCache(getState()) }
  const { address, path } = addressCache[BLOCKCHAIN_ETHEREUM]

  const wallet = new WalletModel({
    address,
    blockchain: BLOCKCHAIN_ETHEREUM,
    isMain: true,
    walletDerivedPath: path,
  })

  ethereumProvider.subscribe(wallet.address)
  dispatch({ type: WALLETS_SET, wallet })

  dispatch(updateWalletBalance(wallet))
}

export const updateWalletBalanceMiddleware = (wallet) => (dispatch) => {

  getWalletBalances({ wallet })
    .then((balancesResult) => {
      try {
        dispatch({
          type: WALLETS_SET, wallet: new WalletModel({
            ...wallet,
            balances: {
              ...wallet.balances,
              ...formatBalances(wallet.blockchain, balancesResult),
            },
          }),
        })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e.message)
      }
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error('call balances from middleware is failed getWalletBalances', e)
      dispatch(updateWalletBalanceWeb3(wallet))
    })
}

export const updateWalletBalance = (wallet) => (dispatch /*, getState*/) => {
  dispatch(updateWalletBalanceMiddleware(wallet))
}

export const updateWalletBalanceWeb3 = (wallet) => (dispatch) => {
  try {
    const callback = (token) => async (dispatch) => {
      const dao = tokenService.getDAO(token)
      const balance = await dao.getAccountBalance(wallet.address)
      dispatch({ type: WALLETS_UPDATE_BALANCE, walletId: wallet.id, balance: new Amount(balance, token.symbol()) })
    }
    dispatch(subscribeOnTokens(callback))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('call balances from is failed: ', e)
  }
}
