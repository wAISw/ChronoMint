/**
 * Copyright 2017–2019, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import nem from 'nem-sdk'
import xor from 'buffer-xor'
import { MOCK_PRIVATE_KEY } from './BitcoinLedgerDeviceMock'

export default class NemTrezorMockDevice {
  constructor ({ network }) {
    this.privateKey = MOCK_PRIVATE_KEY
    this.network = network
    Object.freeze(this)
  }

  getPublicKey () {
    return this.getKeyPair().publicKey.toString()
  }

  getAddress () {
    return nem.model.address.toAddress(this.getPublicKey(), this.network.id)
  }

  signTransaction (unsignedTxData) {
    return this.getKeyPair().sign(unsignedTxData)
  }

  getKeyPair () {
    if (this.privateKey.length > 64) {
      const part1 = Buffer.from(this.privateKey.substr(0, 64), 'hex')
      const part2 = Buffer.from(this.privateKey.substr(64, 64), 'hex')
      const hex = xor(part1, part2).toString('hex')
      return nem.crypto.keyPair.create(hex)
    }

    return nem.crypto.keyPair.create(this.privateKey)
  }

}
