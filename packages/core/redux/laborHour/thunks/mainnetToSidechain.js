/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import {
  daoByType,
  getMainLaborHourWallet,
  getLXSwaps,
  getMiningFeeMultiplier,
} from '../selectors/mainSelectors'
import web3Converter from '../../../utils/Web3Converter'
import SidechainMiddlewareService from '../SidechainMiddlewareService'
import { getEthereumSigner } from '../../persistAccount/selectors'
import { notifyUnknownError } from './utilsThunks'
import { executeLaborHourTransaction } from './transactions'
import * as LXSidechainActions from '../actions'

export const obtainSwapByMiddlewareFromMainnetToSidechain = (swapId) => async (
  dispatch,
  getState,
) => {
  try {
    const signer = getEthereumSigner(getState())
    const {
      data,
    } = await SidechainMiddlewareService.obtainSwapFromMainnetToSidechain(
      swapId,
      signer.getPublicKey(),
    )
    return Promise.resolve({ e: null, data, swapId })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    dispatch(notifyUnknownError())
    return Promise.resolve({ e, swapId })
  }
}

export const closeSwap = (encodedKey, swapId) => async (dispatch, getState) => {
  const dao = daoByType('AtomicSwapERC20')(getState())
  const signer = getEthereumSigner(getState())
  const feeMultiplier = getMiningFeeMultiplier(getState())

  const key = await signer.decryptWithPrivateKey(encodedKey)

  const tx = {
    ...dao.close(
      web3Converter.stringToBytes(swapId),
      web3Converter.stringToBytes(key),
    ),
  }

  dispatch(executeLaborHourTransaction({ tx, options: { feeMultiplier } }))
}

export const getSwapList = () => async (dispatch, getState) => {
  const wallet = getMainLaborHourWallet(getState())
  const [{ data: MtS }, { data: StM }] = await Promise.all([
    SidechainMiddlewareService.getSwapListFromMainnetToSidechainByAddress(wallet.address),
    SidechainMiddlewareService.getSwapListFromSidechainToMainnetByAddress(wallet.address),
  ])
  const filter = (type) => (accumulator, swap) => {
    return swap.isActive
      ? {
        ...accumulator,
        [swap.swapId]: {
          type,
          ...swap,
        },
      }
      : accumulator
  }

  const swapList = {
    ...MtS.reduce(filter(1), {}), // 1 for swaps from mainnet to sidecain
    ...StM.reduce(filter(2), {}), // 2 for swaps from sidechain to mainnet
  }

  dispatch(LXSidechainActions.swapListUpdate(swapList))
  return swapList
}

export const obtainAllOpenSwaps = () => async (dispatch, getState) => {
  const swaps = getLXSwaps(getState())
  const promises = []
  Object.values(swaps).forEach((swap) => {
    if (swap.isActive) {
      swap.isActive = false
      dispatch(LXSidechainActions.swapUpdate(swap))
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
