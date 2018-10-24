/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import {
  BLOCKCHAIN_BITCOIN,
  BLOCKCHAIN_BITCOIN_CASH,
  BLOCKCHAIN_DASH,
  BLOCKCHAIN_LITECOIN,
  BLOCKCHAIN_NEM,
  BLOCKCHAIN_WAVES,
} from '@chronobank/login/network/constants'

export const DUCK_PERSIST_ACCOUNT = 'persistAccount'

export const CUSTOM_NETWORKS_LIST_ADD = 'persistAccount/CUSTOM_NETWORKS_LIST_ADD'
export const CUSTOM_NETWORKS_LIST_RESET = 'persistAccount/CUSTOM_NETWORKS_LIST_RESET'
export const CUSTOM_NETWORKS_LIST_UPDATE = 'persistAccount/CUSTOM_NETWORKS_LIST_UPDATE'
export const WALLETS_ADD = 'persistAccount/WALLETS_ADD'
export const WALLETS_DESELECT = 'persistAccount/WALLETS_DESELECT'
export const WALLETS_LOAD = 'persistAccount/WALLETS_LOAD'
export const WALLETS_SELECT = 'persistAccount/WALLETS_SELECT'
export const WALLETS_UPDATE_LIST = 'persistAccount/WALLETS_UPDATE_LIST'
export const WALLETS_CACHE_ADDRESS = 'persistAccount/WALLETS_CACHE_ADDRESS'
export const BLOCKCHAIN_LIST_UPDATE = 'persistAccount/BLOCKCHAIN_LIST_UPDATE'

export const DEFAULT_ACTIVE_BLOCKCHAINS = [
  BLOCKCHAIN_BITCOIN,
  BLOCKCHAIN_BITCOIN_CASH,
  BLOCKCHAIN_LITECOIN,
  BLOCKCHAIN_DASH,
  BLOCKCHAIN_NEM,
  BLOCKCHAIN_WAVES,
]

export const FORM_BLOCKCHAIN_ACTIVATE = 'FormBlockchainActivate'
