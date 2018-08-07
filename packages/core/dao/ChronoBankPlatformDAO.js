/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import web3Converter from '../utils/Web3Converter'
import AbstractContractDAO from './AbstractContract3DAO'
import { ChronoBankPlatformABI } from './abi'

//#region CONSTANTS

import {
  TX_ADD_ASSET_PART_OWNER,
  TX_IS_REISSUABLE,
  TX_ISSUE,
  TX_OWNERSHIP_CHANGE,
  TX_REISSUE_ASSET,
  TX_REMOVE_ASSET_PART_OWNER,
  TX_REVOKE_ASSET,
  TX_REVOKE,
} from './constants/ChronoBankPlatformDAO'

//#endregion CONSTANTS

export default class ChronoBankPlatformDAO extends AbstractContractDAO {

  constructor (address, history) {
    super({ address, history, abi: ChronoBankPlatformABI })
  }

  connect (web3, options) {
    super.connect(web3, options)

    this.allEventsEmitter = this.history.events.allEvents({})
      .on('data', this.handleEventsData)
  }

  disconnect () {
    if (this.isConnected) {
      this.allEventsEmitter.removeAllListeners()
      this.contract = null
      this.history = null
      this.web3 = null
    }
  }

  handleEventsData (data) {
    if (!data.event) {
      return
    }

    console.log('ChronoBankPlatformDAO handleEventsData: ', data.event, this, data)
    this.emit(data.event, data)
  }

  handleEventsChanged (data) {
    console.log('ChronoBankPlatformDAO handleEventsChanged: ', data.event, data)
  }

  handleEventsError (data) {
    console.log('ChronoBankPlatformDAO handleEventsError: ', data.event, data)
    this.emit(data.event + '_error', data)
  }

  reissueAsset (token, value) {
    const amount = token.addDecimals(value, token)
    return this._tx(TX_REISSUE_ASSET, [web3Converter.stringToBytes(token.symbol()), amount])
  }

  revokeAsset (token, value) {
    const amount = token.addDecimals(value, token)
    return this._tx(TX_REVOKE_ASSET, [web3Converter.stringToBytes(token.symbol()), amount])
  }

  isReissuable (symbol) {
    return this.contract.methods[TX_IS_REISSUABLE](web3Converter.stringToBytes(symbol)).call()
  }

  addAssetPartOwner (symbol, address) {
    return this._tx(TX_ADD_ASSET_PART_OWNER, [web3Converter.stringToBytes(symbol), address])
  }

  removeAssetPartOwner (symbol, address) {
    return this._tx(TX_REMOVE_ASSET_PART_OWNER, [web3Converter.stringToBytes(symbol), address])
  }

  watchIssue (callback) {
    return this.on(TX_ISSUE, (data) => callback(data))
  }

  watchRevoke (callback) {
    return this.on(TX_REVOKE, (data) => callback(data))
  }

  watchManagers (callback) {
    return this.on(TX_OWNERSHIP_CHANGE, callback)
  }
}
