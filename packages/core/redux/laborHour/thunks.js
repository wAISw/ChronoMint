/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import BigNumber from 'bignumber.js'
import { LABOR_HOUR_NETWORK_CONFIG } from '@chronobank/login/network/settings'
import { getLaborHourWeb3, laborHourProvider } from '@chronobank/login/network/LaborHourProvider'
import { getCurrentNetworkSelector } from '@chronobank/login/redux/network/selectors'
import web3Factory from '../../web3'
import {
  daoByType,
  getLXToken,
  getLXTokenByAddress,
  web3Selector,
  getMainLaboborHourWallet,
} from './selectors/mainSelectors'
import { daoByType as daoByTypeMainnet } from '../daos/selectors'
import { ATOMIC_SWAP_ERC20, CHRONOBANK_PLATFORM_SIDECHAIN, MULTI_EVENTS_HISTORY } from './dao/ContractList'
import ContractDAOModel from '../../models/contracts/ContractDAOModel'
import { EVENT_CLOSE, EVENT_EXPIRE, EVENT_OPEN, EVENT_REVOKE } from './constants'
import { notify } from '../notifier/actions'
import SimpleNoticeModel from '../../models/notices/SimpleNoticeModel'
import SwapModel from '../../models/SwapModel'
import Amount from '../../models/Amount'
import ERC20TokenDAO from '../../dao/ERC20TokenDAO'
import web3Converter from '../../utils/Web3Converter'
import TokenModel from '../../models/tokens/TokenModel'
import ContractModel from '../../models/contracts/ContractModel'
import SidechainMiddlewareService from './SidechainMiddlewareService'
import { getEthereumSigner, getAddressCache } from '../persistAccount/selectors'
import { WALLETS_CACHE_ADDRESS } from '../persistAccount/constants'
import ErrorNoticeModel from '../../models/notices/ErrorNoticeModel'
import { getMainEthWallet } from '../wallets/selectors/models'
import * as LXSidechainActions from './actions'
import { executeTransaction } from '../ethereum/thunks'
import HolderModel from '../../models/HolderModel'
import laborHourDAO from '../../dao/LaborHourDAO'
import TransactionHandler from '../abstractEthereum/utils/TransactionHandler'
import { BLOCKCHAIN_LABOR_HOUR } from '../../dao/constants'
import { getEthereumDerivedPath } from '../ethereum/utils'
import { WalletModel } from '../../models/index'

//#region transaction send
class LaborHourTransactionHandler extends TransactionHandler {
  constructor () {
    super(BLOCKCHAIN_LABOR_HOUR)
    this.web3 = null
  }

  getDAO () {
    return laborHourDAO
  }

  getWeb3 (state) {
    if (this.web3 === null) {
      this.web3 = getLaborHourWeb3(web3Selector()(state))
    }

    return this.web3
  }
}

const transactionHandler = new LaborHourTransactionHandler()
export const estimateLaborHourGas = (tx, feeMultiplier = 1) => transactionHandler.estimateGas(tx, feeMultiplier)
export const executeLaborHourTransaction = ({ tx, options }) => transactionHandler.executeTransaction({ tx, options })
export const initLaborHour = ({ web3 }) => async (dispatch) => {
  await dispatch(LXSidechainActions.updateWeb3(new HolderModel({ value: web3 })))
  await dispatch(initContracts())
  await dispatch(initWalletFromKeys())
  await dispatch(initTokens())
  await dispatch(watch())
  await dispatch(obtainAllOpenSwaps())
}
//#endregion

//#region init
const initContracts = () => async (dispatch, getState) => {
  const web3 = getLaborHourWeb3(web3Selector()(getState()))
  const networkId = await web3.eth.net.getId()
  const contracts = [CHRONOBANK_PLATFORM_SIDECHAIN, ATOMIC_SWAP_ERC20]
  const historyAddress = MULTI_EVENTS_HISTORY.abi.networks[networkId].address

  const getDaoModel = async (contract) => {
    const contractAddress = contract.abi.networks[networkId].address
    const contractDAO = contract.create(contractAddress, historyAddress)
    await contractDAO.connect(web3)

    dispatch(
      LXSidechainActions.daosRegister(
        new ContractDAOModel({
          contract,
          address: contractDAO.address,
          dao: contractDAO,
        })
      )
    )
  }

  await Promise.all(
    contracts.map((contract) => {
      return getDaoModel(contract)
    })
  )
}

const watch = () => (dispatch, getState) => {
  const ChronoBankPlatformSidechainDAO = daoByType('ChronoBankPlatformSidechain')(getState())

  ChronoBankPlatformSidechainDAO.watchEvent(EVENT_REVOKE, async (event) => {
    const { symbol, value } = event.returnValues
    const token = getLXToken(web3Converter.bytesToString(symbol))(getState())

    dispatch(
      notify(
        new SimpleNoticeModel({
          title: 'chronoBankPlatformSidechain.revoke.title',
          message: 'chronoBankPlatformSidechain.revoke.message',
          params: {
            amount: token.removeDecimals(new BigNumber(value)),
            symbol: token.symbol(),
          },
        })
      )
    )

    const mainEthWallet = getMainEthWallet(getState())
    const { data } = await SidechainMiddlewareService.getSwapListFromSidechainToMainnetByAddress(mainEthWallet.address)
    const swap = data[data.length - 1] // last swap.
    if (swap) {
      const { data } = await dispatch(obtainSwapByMiddlewareFromSidechainToMainnet(swap.swapId))
      if (data) {
        dispatch(unlockShares(swap.swapId, data))
      }
    }
  })

  const atomicSwapERC20DAO = daoByType('AtomicSwapERC20')(getState())
  atomicSwapERC20DAO.watchEvent(EVENT_OPEN, async (event) => {
    const swapId = web3Converter.bytesToString(event.returnValues._swapID)
    dispatch(
      notify(
        new SimpleNoticeModel({
          icon: 'lock',
          title: 'atomicSwapERC20.lock.title',
          message: 'atomicSwapERC20.lock.message',
          params: {
            id: swapId,
          },
        })
      )
    )
    const swapDetail = await atomicSwapERC20DAO.check(event.returnValues._swapID) // in bytes
    const token = getLXTokenByAddress(swapDetail.erc20ContractAddress)(getState())
    const swap = new SwapModel({
      id: swapId,
      value: new Amount(swapDetail.erc20Value, token.symbol()),
      contractAddress: swapDetail.erc20ContractAddress,
      withdrawTrader: swapDetail.withdrawTrader,
      secretLock: swapDetail.secretLock,
    })
    dispatch(LXSidechainActions.swapUpdate(swap))
    // obtain swap
    const { data } = await dispatch(obtainSwapByMiddlewareFromMainnetToSidechain(swapId))
    if (data) {
      dispatch(closeSwap(data, swapId))
    }
  })

  atomicSwapERC20DAO.watchEvent(EVENT_CLOSE, (event) => {
    const { _swapID: swapId } = event.returnValues
    dispatch(
      notify(
        new SimpleNoticeModel({
          title: 'atomicSwapERC20.close.title',
          message: 'atomicSwapERC20.close.message',
          params: {
            id: web3Converter.bytesToString(swapId),
          },
        })
      )
    )
    // TODO @Abdulov update balance
  })

  atomicSwapERC20DAO.watchEvent(EVENT_EXPIRE, (event) => {
    const { _swapID: swapId } = event.returnValues
    dispatch(
      notify(
        new SimpleNoticeModel({
          title: 'atomicSwapERC20.expire.title',
          message: 'atomicSwapERC20.expire.message',
          params: {
            id: web3Converter.bytesToString(swapId),
          },
        })
      )
    )
  })
}

const initTokens = () => async (dispatch, getState) => {
  dispatch(loadLHTToken())
  const platformDao = daoByType('ChronoBankPlatformSidechain')(getState())
  const symbolsCount = await platformDao.symbolsCount()
  dispatch(LXSidechainActions.setTokensFetchingCount(symbolsCount))
  const promises = []
  for (let i = 0; i < symbolsCount; i++) {
    promises.push(dispatch(loadTokenByIndex(i)))
  }
  await Promise.all(promises)
}

const loadTokenByIndex = (symbolIndex) => async (dispatch, getState) => {
  try {
    const state = getState()
    const web3 = getLaborHourWeb3(web3Selector()(getState()))
    const platformDao = daoByType('ChronoBankPlatformSidechain')(state)
    const symbol = await platformDao.symbols(symbolIndex) // bytes32
    const address = await platformDao.proxies(symbol)
    let token = new TokenModel({
      address: address.toLowerCase(),
      symbol: web3Converter.bytesToString(symbol),
      isFetched: true,
      isERC20: true,
    })
    const tokenDao = new ERC20TokenDAO(token)
    tokenDao.connect(web3)
    const decimals = await tokenDao.getDecimals()
    token = token.set('decimals', decimals)
    tokenDao.token = token

    dispatch(LXSidechainActions.tokenFetched(token))
    dispatch(
      LXSidechainActions.daosRegister(
        new ContractDAOModel({
          contract: new ContractModel({
            abi: tokenDao.abi,
            type: token.symbol(),
          }),
          address: token.address(),
          dao: tokenDao,
        })
      )
    )
    dispatch(getTokenBalance(tokenDao))
    return Promise.resolve({ e: null, res: true })
  } catch (e) {
    return Promise.resolve({ e })
  }
}

const loadLHTToken = () => async (dispatch, getState) => {
  const web3 = getLaborHourWeb3(web3Selector()(getState()))
  laborHourDAO.connect(web3)
  const token = await laborHourDAO.getToken()

  if (token) {
    dispatch(LXSidechainActions.tokenFetched(token))
    dispatch(
      LXSidechainActions.daosRegister(
        new ContractDAOModel({
          contract: new ContractModel({
            abi: laborHourDAO.abi,
            type: token.symbol(),
          }),
          address: token.address(),
          dao: laborHourDAO,
        })
      )
    )
    dispatch(getTokenBalance(laborHourDAO))
  }
}
//#endregion

const obtainSwapByMiddlewareFromMainnetToSidechain = (swapId) => async (dispatch, getState) => {
  try {
    const signer = getEthereumSigner(getState())
    const { data } = await SidechainMiddlewareService.obtainSwapFromMainnetToSidechain(swapId, signer.getPublicKey())
    return Promise.resolve({ e: null, data, swapId })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    dispatch(notifyUnknownError())
    return Promise.resolve({ e, swapId })
  }
}

const obtainSwapByMiddlewareFromSidechainToMainnet = (swapId) => async (dispatch, getState) => {
  try {
    const signer = getEthereumSigner(getState())
    const { data } = await SidechainMiddlewareService.obtainSwapFromSidechainToMainnet(swapId, signer.getPublicKey())
    return Promise.resolve({ e: null, data, swapId })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    dispatch(notifyUnknownError())
    return Promise.resolve({ e, swapId })
  }
}

const closeSwap = (encodedKey, swapId, index) => async (dispatch, getState) => {
  const dao = daoByType('AtomicSwapERC20')(getState())
  const web3 = web3Factory(LABOR_HOUR_NETWORK_CONFIG)
  const mainEthWallet = getMainEthWallet(getState())
  const signer = getEthereumSigner(getState())

  const promises = [
    web3.eth.net.getId(),
    web3.eth.getTransactionCount(mainEthWallet.address, 'pending'),
    signer.decryptWithPrivateKey(encodedKey),
  ]
  const [chainId, nonce, key] = await Promise.all(promises)

  const tx = {
    ...dao.close(web3Converter.stringToBytes(swapId), web3Converter.stringToBytes(key)),
    gas: 5700000, // TODO @Abdulov remove hard code and do something
    gasPrice: 80000000000,
    nonce: nonce + (index || 0), // increase nonce because transactions send at the same time
    chainId: chainId,
  }

  dispatch(executeLaborHourTransaction({ tx }))
}

const obtainAllOpenSwaps = () => async (dispatch, getState) => {
  const mainEthWallet = getMainEthWallet(getState())
  const { data } = await SidechainMiddlewareService.getSwapListFromMainnetToSidechainByAddress(mainEthWallet.address)
  const promises = []
  // promises.push(dispatch(obtainSwapByMiddlewareFromMainnetToSidechain(data[0].swapId)))
  data.forEach((swap) => {
    if (swap.isActive) {
      promises.push(dispatch(obtainSwapByMiddlewareFromMainnetToSidechain(swap.swapId)))
    }
  })
  const results = await Promise.all(promises)

  results.forEach(async ({ data, swapId }, i) => {
    if (data) {
      dispatch(closeSwap(data, swapId, i))
    }
  })
}

export const sidechainWithdraw = (amount: Amount, token: TokenModel) => async (dispatch, getState) => {
  try {
    const platformDao = daoByType('ChronoBankPlatformSidechain')(getState())
    const web3 = web3Factory(LABOR_HOUR_NETWORK_CONFIG)
    const mainEthWallet = getMainEthWallet(getState())

    const promises = [web3.eth.net.getId(), web3.eth.getTransactionCount(mainEthWallet.address, 'pending')]
    const [chainId, nonce] = await Promise.all(promises)

    const tx = {
      ...platformDao.revokeAsset(web3Converter.stringToBytes(token.symbol()), amount),
      gas: 5700000, // TODO @Abdulov remove hard code and do something
      gasPrice: 80000000000,
      nonce: nonce,
      chainId: chainId,
    }
    dispatch(executeLaborHourTransaction({ tx }))
  } catch (e) {
    // eslint-disable-next-line
    console.error('deposit error', e)
  }
}

const unlockShares = (swapId, encodedKey) => async (dispatch, getState) => {
  try {
    const timeHolderDAO = daoByTypeMainnet('TimeHolder')(getState())
    const signer = getEthereumSigner(getState())
    const key = await signer.decryptWithPrivateKey(encodedKey)
    const tx = timeHolderDAO.unlockShares(web3Converter.stringToBytes(swapId), web3Converter.stringToBytes(key))
    dispatch(executeTransaction({ tx }))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    dispatch(notifyUnknownError())
  }
}

export const notifyUnknownError = () => {
  notify(
    new ErrorNoticeModel({
      title: 'errors.labotHour.unknown.title',
      message: 'errors.labotHour.unknown.message',
    })
  )
}

const initWalletFromKeys = () => async (dispatch, getState) => {
  const state = getState()
  const { network } = getCurrentNetworkSelector(state)
  const addressCache = { ...getAddressCache(state) }

  const blockchain = BLOCKCHAIN_LABOR_HOUR
  const signer = getEthereumSigner(state)

  if (!addressCache[blockchain]) {
    const path = getEthereumDerivedPath(network[blockchain])
    if (signer) {
      const address = await signer.getAddress(path).toLowerCase()
      addressCache[blockchain] = {
        address,
        path,
      }

      dispatch({
        type: WALLETS_CACHE_ADDRESS,
        blockchain: blockchain,
        address,
        path,
      })
    }
  }

  const { address, path } = addressCache[blockchain]
  const wallet = new WalletModel({
    address: address.toLowerCase(),
    blockchain: blockchain,
    isMain: true,
    walletDerivedPath: path,
  })

  laborHourProvider.subscribe(wallet.address)
  // TODO @abdulov remove console.log
  console.log('%c wallet', 'background: #222; color: #fff', wallet)
  dispatch(LXSidechainActions.updateWallet(wallet))
}

const getTokenBalance = (tokenDao) => async (dispatch, getState) => {
  const wallet = getMainLaboborHourWallet(getState())
  const balance = await tokenDao.getAccountBalance(wallet.address)
  const token = tokenDao.token

  // TODO @abdulov remove console.log
  console.log(
    '%c balance',
    'background: #222; color: #fff',
    wallet.address,
    token.removeDecimals(balance).toString(),
    token.symbol()
  )
  dispatch(
    LXSidechainActions.updateWallet(
      new WalletModel({
        ...wallet,
        balances: {
          ...wallet.balances,
          [token.symbol()]: new Amount(balance, token.symbol()),
        },
      })
    )
  )
}
