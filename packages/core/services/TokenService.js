/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import EventEmitter from 'events'
import ERC20DAO from '../dao/ERC20DAO'
import TokenModel from '../models/tokens/TokenModel'

export const EVENT_NEW_TOKEN = 'newToken'
export const EVENT_TOKENS_FETCHED = 'tokensFetched'

class TokenService extends EventEmitter {
  constructor () {
    super(...arguments)
    this._cache = {}
  }

  getDAO (token: TokenModel | string) {
    return this._cache[token instanceof TokenModel ? token.id() : token]
  }

  createDAO (token, web3) {
    // TODO @dkchv: unsubscribe if exists
    if (!token.isERC20()) {
      return
    }
    const dao = new ERC20DAO(token)
    dao.connect(web3)
    this._cache [token.id()] = dao
    this.emit(EVENT_NEW_TOKEN, token, dao)
  }

  // TODO @ipavlenko: TokenService should not handle state, redux should. Move DAOs collection to redux
  registerDAO (token, dao) {
    this._cache [token.id()] = dao
    this.emit(EVENT_NEW_TOKEN, token, dao)
  }
}

export default new TokenService()
