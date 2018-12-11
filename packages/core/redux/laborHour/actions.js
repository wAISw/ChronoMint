/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import {
  LABOR_HOUR_DAOS_REGISTER,
  LABOR_HOUR_SWAP_UPDATE,
  LABOR_HOUR_TX_CREATE,
  LABOR_HOUR_TX_REMOVE,
  LABOR_HOUR_TX_UPDATE,
  LABOR_HOUR_TOKENS_FETCHING,
  LABOR_HOUR_TOKENS_FETCHED,
  LABOR_HOUR_TOKENS_FAILED,
  LABOR_HOUR_UPDATE_WALLET,
  LABOR_HOUR_WEB3_UPDATE,
  LABOR_HOUR_DEPOSIT_PARAMS_UPDATE,
  LABOR_HOUR_UPDATE_MINING_NODE_TYPE,
  LABOR_HOUR_UPDATE_DEPOSIT,
  LABOR_HOUR_UPDATE_LOCKED_DEPOSIT,
  LABOR_HOUR_UPDATE_FEE_MULTIPLIER,
  LABOR_HOUR_SWAP_LIST_UPDATE, LABOR_HOUR_UPDATE_PROCESSING_STATUS, LABOR_HOUR_TOKENS_UPDATE_LATEST_BLOCK, LABOR_HOUR_UPDATE_MIDDLEWARE_CONNECTING_STATUS,
} from './constants'

export const updateWeb3 = (web3) =>
  ({
    type: LABOR_HOUR_WEB3_UPDATE,
    web3,
  })

export const updateWallet = (wallet) =>
  ({
    type: LABOR_HOUR_UPDATE_WALLET,
    wallet,
  })

export const txCreate = (entry) =>
  ({
    type: LABOR_HOUR_TX_CREATE,
    entry,
  })

export const txUpdate = (key, address, tx) =>
  ({
    type: LABOR_HOUR_TX_UPDATE,
    address,
    key,
    tx,
  })

export const txRemove = (key, address) =>
  ({
    type: LABOR_HOUR_TX_REMOVE,
    address,
    key,
  })

export const daosRegister = (model) =>
  ({
    type: LABOR_HOUR_DAOS_REGISTER,
    model,
  })

export const swapUpdate = (swap) =>
  ({
    type: LABOR_HOUR_SWAP_UPDATE,
    swap,
  })

export const swapListUpdate = (swaps) =>
  ({
    type: LABOR_HOUR_SWAP_LIST_UPDATE,
    swaps,
  })

export const setTokensFetchingCount = (count) =>
  ({
    type: LABOR_HOUR_TOKENS_FETCHING,
    count,
  })

export const tokenFetched = (token) =>
  ({
    type: LABOR_HOUR_TOKENS_FETCHED,
    token,
  })

export const tokensLoadingFailed = () =>
  ({
    type: LABOR_HOUR_TOKENS_FAILED,
  })

export const updateMiningParams = (minDepositLimit, rewardsCoefficient) =>
  ({
    type: LABOR_HOUR_DEPOSIT_PARAMS_UPDATE,
    minDepositLimit,
    rewardsCoefficient,
  })

/**
 *
 * @param miningParams { isCustomNode, delegateAddress }
 * @returns {{type: string, isCustomNode: *, delegateAddress: *}}
 */
export const updateMiningNodeType = (miningParams) =>
  ({
    type: LABOR_HOUR_UPDATE_MINING_NODE_TYPE,
    miningParams,
  })

export const updateDeposit = (address, amount) =>
  ({
    type: LABOR_HOUR_UPDATE_DEPOSIT,
    address,
    amount,
  })

export const updateLockedDeposit = (address, amount) =>
  ({
    type: LABOR_HOUR_UPDATE_LOCKED_DEPOSIT,
    address,
    amount,
  })

export const updateMiningFeeMultiplier = (feeMultiplier) =>
  ({
    type: LABOR_HOUR_UPDATE_FEE_MULTIPLIER,
    feeMultiplier,
  })

export const updateProcessingStatus = (status) =>
  ({
    type: LABOR_HOUR_UPDATE_PROCESSING_STATUS,
    status,
  })

export const setLatestBlock = (blockchain, block) =>
  ({
    type: LABOR_HOUR_TOKENS_UPDATE_LATEST_BLOCK,
    blockchain,
    block,
  })

export const setMiddlewareConnectionStatus = (status) =>
  ({
    type: LABOR_HOUR_UPDATE_MIDDLEWARE_CONNECTING_STATUS,
    status,
  })

export const setNodeConnectionStatus = (status) =>
  ({
    type: LABOR_HOUR_UPDATE_MIDDLEWARE_CONNECTING_STATUS,
    status,
  })
