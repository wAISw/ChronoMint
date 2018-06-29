/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import Markup from 'layouts/Markup'
import { Provider } from 'react-redux'
import React from 'react'
import { Route, Router, IndexRoute, Redirect } from 'react-router'
import {
  NotFoundPage,
  LoginForm,
  CreateAccount,
  AccountSelector,
  RecoverAccount,
  ResetPassword,
  LoginWithOptions,
  ConfirmMnemonic,
  GenerateMnemonic,
  GenerateWallet,
  LoginWithWallet,
  LoginWithMnemonic,
  LoginWithPrivateKey,
} from '@chronobank/login-ui/components'
import Splash from 'layouts/Splash/Splash'
import {
  AssetsPage,
  ExchangePage,
  LOCPage,
  OperationsPage,
  RewardsPage,
  SettingsPage,
  VotingPage,
  PollPage,
  WalletsPage,
  WalletPage,
  DepositsPage,
  DepositPage,
  AddWalletPage,
  TwoFAPage,
  NewPollPage,
} from 'pages/lib'
import { store, history } from './redux/configureStore'
import ls from './platform/utils/LocalStorage'
import './styles/themes/default.scss'

const requireAuth = (nextState, replace) => {
  if (!ls.isSession()) {
    // pass here only for Test RPC session.
    // Others through handle clicks on loginPage
    return replace({
      pathname: '/',
      state: { nextPathname: nextState.location.pathname },
    })
  }
}

function hashLinkScroll () {
  const { hash } = window.location
  if (hash !== '') {
    setTimeout(() => {
      const id = hash.replace('#', '')
      const element = document.getElementById(id)
      if (element) element.scrollIntoView()
    }, 0)
  }
}

const router = (
  <Provider store={store}>
    <Router history={history} onUpdate={hashLinkScroll}>
      <Redirect from='/' to='/login' />
      <Route component={Markup} onEnter={requireAuth}>
        <Route path='2fa' component={TwoFAPage} />
        <Route path='wallets' component={WalletsPage} />
        <Route path='wallet' component={WalletPage} />
        <Route path='add-wallet' component={AddWalletPage} />
        <Route path='deposits' component={DepositsPage} />
        <Route path='deposit' component={DepositPage} />
        <Route path='exchange' component={ExchangePage} />
        <Route path='rewards' component={RewardsPage} />
        <Route path='voting' component={VotingPage} />
        <Route path='poll' component={PollPage} />
        <Route path='new-poll' component={NewPollPage} />
        <Route path='assets' component={AssetsPage} />
        <Route path='cbe'>
          <Route path='locs' component={LOCPage} />
          <Route path='operations' component={OperationsPage} />
          <Route path='settings' component={SettingsPage} />
        </Route>
      </Route>

      <Route path='/login' component={Splash}>
        <IndexRoute component={LoginForm} />
        <Route path='/login/create-account' component={CreateAccount} />
        <Route path='/login/select-account' component={AccountSelector} />
        <Route path='/login/recover-account' component={RecoverAccount} />
        <Route path='/login/reset-password' component={ResetPassword} />
        <Route path='/login/import-methods' component={LoginWithOptions} />
        <Route path='/login/confirm-mnemonic' component={ConfirmMnemonic} />
        <Route path='/login/mnemonic' component={GenerateMnemonic} />
        <Route path='/login/download-wallet' component={GenerateWallet} />
        <Route path='/login/upload-wallet' component={LoginWithWallet} />
        <Route path='/login/mnemonic-login' component={LoginWithMnemonic} />
        <Route path='/login/private-key-login' component={LoginWithPrivateKey} />
        <Route path='*' component={NotFoundPage} />
      </Route>
    </Router>
  </Provider>
)

export default router
