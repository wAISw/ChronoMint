/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { abstractFetchingCollection } from '../AbstractFetchingCollection'
import BalanceModel from '../tokens/BalanceModel'
import MultisigWalletModel from './MultisigWalletModel'
import type MultisigWalletPendingTxModel from './MultisigWalletPendingTxModel'

export default class MultisigWalletCollection extends abstractFetchingCollection({
  twoFAConfirmed: true,
}) {
  twoFAConfirmed (value) {
    return this._getSet('twoFAConfirmed', value)
  }

  balance (walletId, balance: BalanceModel) {
    const wallet: MultisigWalletModel = this.item(walletId)
    const balances = wallet.balances().itemFetched(balance)
    return this.update(wallet.balances(balances))
  }

  allPendingsCount () {
    return this.list().reduce((memo, item: MultisigWalletModel) => memo + item.pendingCount(), 0)
  }

  pending (walletId, pending: MultisigWalletPendingTxModel) {
    const wallet: MultisigWalletModel = this.item(walletId)
    const updatedPending = wallet.pendingTxList().itemFetched(pending)
    return this.update(wallet.pendingTxList(updatedPending))
  }

  activeWallets () {
    return this.filter((item) => !item.isTimeLocked()).toArray()
  }

  timeLockedWallets () {
    return this.filter((item) => item.isTimeLocked()).toArray()
  }
}
