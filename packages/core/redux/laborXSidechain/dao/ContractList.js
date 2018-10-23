/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { AtomicSwapERC20ABI, ChronoBankPlatformABI, MultiEventsHistoryABI } from './abi'
import AtomicSwapERC20DAO from './AtomicSwapERC20DAO'
import ContractModel from '../../../models/contracts/ContractModel'
import ChronoBankPlatformDAO from './ChronoBankPlatformDAO'
import MultiEventsHistoryDAO from './MultiEventsHistoryDAO'

export const ATOMIC_SWAP_ERC20 = new ContractModel({
  type: 'AtomicSwapERC20',
  abi: AtomicSwapERC20ABI,
  DAOClass: AtomicSwapERC20DAO,
})

export const CHRONOBANK_PLATFORM_SIDECHAIN = new ContractModel({
  type: 'ChronoBankPlatformSidechain',
  abi: ChronoBankPlatformABI,
  DAOClass: ChronoBankPlatformDAO,
})

export const MULTI_EVENTS_HISTORY = new ContractModel({
  type: 'MultiEventsHistory',
  abi: MultiEventsHistoryABI,
  DAOClass: MultiEventsHistoryDAO,
})
