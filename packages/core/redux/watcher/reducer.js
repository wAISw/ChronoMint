/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import Immutable from 'immutable'

import TxExecModel from '../../models/TxExecModel'
import * as a from './actions'

export const initialState = {
  pendingTxs: new Immutable.Map(),
  confirmTx: new TxExecModel(),
}

export default (state = initialState, action) => {
  switch (action.type) {
    case a.WATCHER_TX_SET:
      return {
        ...state,
        pendingTxs: state.pendingTxs.set(action.tx.id(), action.tx),
        confirmTx: action.tx,
      }
    case a.WATCHER_TX_END:
      return {
        ...state,
        pendingTxs: state.pendingTxs.remove(action.tx.id()),
      }
    default:
      return state
  }
}
