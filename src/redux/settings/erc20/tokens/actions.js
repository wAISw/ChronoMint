import { change } from 'redux-form'
import { I18n } from 'react-redux-i18n'
import type AbstractFetchingModel from 'models/AbstractFetchingModel'
import type TokenModel from 'models/TokenModel'
import contractsManagerDAO from 'dao/ContractsManagerDAO'
import { showSettingsTokenModal } from 'redux/ui/modal'

export const TOKENS_LIST = 'settings/TOKENS_LIST'
export const TOKENS_SET = 'settings/TOKENS_SET'
export const TOKENS_REMOVE = 'settings/TOKENS_REMOVE'
export const TOKENS_FORM = 'settings/TOKENS_FORM'
export const TOKENS_FORM_FETCH = 'settings/TOKENS_FORM_FETCH'

export const setToken = (token: TokenModel) => ({type: TOKENS_SET, token})
export const removeToken = (token: TokenModel) => ({type: TOKENS_REMOVE, token})

export const listTokens = () => async (dispatch) => {
  const dao = await contractsManagerDAO.getERC20ManagerDAO()
  const list = await dao.getTokens()
  dispatch({type: TOKENS_LIST, list})
}

export const formToken = (token: TokenModel) => dispatch => {
  dispatch({type: TOKENS_FORM, token})
  dispatch(showSettingsTokenModal())
}

export const formTokenLoadMetaData = async (token: TokenModel, dispatch, formName) => {
  dispatch({type: TOKENS_FORM_FETCH})

  const managerDAO = await contractsManagerDAO.getERC20ManagerDAO()

  if (await managerDAO.isTokenExists(token.address())) {
    dispatch({type: TOKENS_FORM_FETCH, end: true})
    throw {address: I18n.t('settings.erc20.tokens.errors.alreadyAdded')}
  }

  let dao
  try {
    dao = await contractsManagerDAO.getERC20DAO(token.address(), true)
  } catch (e) {
    dispatch({type: TOKENS_FORM_FETCH, end: true})
    throw {address: I18n.t('settings.erc20.tokens.errors.invalidAddress')}
  }

  try {
    if (!token.decimals()) {
      dispatch(change(formName, 'decimals', dao.getDecimals()))
    }
    if (!token.symbol()) {
      dispatch(change(formName, 'symbol', dao.getSymbol()))
      token = token.setSymbol(dao.getSymbol())
    }
  } catch (e) {
    // eslint-disable-next-line
    console.error('Load meta data error', e)
  }

  const symbolAddress = await managerDAO.getTokenAddressBySymbol(token.symbol())

  dispatch({type: TOKENS_FORM_FETCH, end: true})

  if ((symbolAddress !== null && token.address() !== symbolAddress) || token.symbol().toUpperCase() === 'ETH') {
    throw {symbol: I18n.t('settings.erc20.tokens.errors.symbolInUse')}
  }
}

export const addToken = (token: TokenModel | AbstractFetchingModel) => async (dispatch) => {
  dispatch(setToken(token.fetching()))
  const dao = await contractsManagerDAO.getERC20ManagerDAO()
  try {
    await dao.addToken(token)
    dispatch(setToken(token.notFetching()))
  } catch (e) {
    dispatch(removeToken(token))
  }
}

export const modifyToken = (oldToken: TokenModel | AbstractFetchingModel, newToken: TokenModel) => async (dispatch) => {
  dispatch(setToken(oldToken.fetching()))
  const dao = await contractsManagerDAO.getERC20ManagerDAO()
  try {
    await dao.modifyToken(oldToken, newToken)
    dispatch(removeToken(oldToken))
    dispatch(setToken(newToken))
  } catch (e) {
    dispatch(setToken(oldToken.notFetching()))
  }
}

export const revokeToken = (token: TokenModel | AbstractFetchingModel) => async (dispatch) => {
  dispatch(setToken(token.fetching()))
  const dao = await contractsManagerDAO.getERC20ManagerDAO()
  try {
    await dao.removeToken(token)
    dispatch(removeToken(token))
  } catch (e) {
    dispatch(setToken(token.notFetching()))
  }
}