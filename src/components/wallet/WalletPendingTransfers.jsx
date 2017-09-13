import React from 'react'
import { Translate } from 'react-redux-i18n'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { RaisedButton } from 'material-ui'

import './WalletPendingTransfers.scss'

function mapDispatchToProps () {
  return {}
}

function mapStateToProps (state) {
  return {
    isMultisig: state.get('wallet').isMultisig,
    wallets: state.get('wallet').wallets
  }
}

@connect(mapStateToProps, mapDispatchToProps)
export default class WalletPendingTransfers extends React.Component {
  /** @namespace PropTypes.string */
  /** @namespace PropTypes.bool */
  /** @namespace PropTypes.array */
  /** @namespace PropTypes.func */
  static propTypes = {
    walletName: PropTypes.string,
    isMultisig: PropTypes.bool,
    wallets: PropTypes.array,
    owners: PropTypes.array,
    transfers: PropTypes.array,
    locale: PropTypes.string
  }

  //noinspection MagicNumberJS, SpellCheckingInspection
  static defaultProps = {
    walletName: '',
    wallets: [],
    owners: [1, 2, 3],
    transfers: [
      {to: '0x5679325a59d591eeb0edbc78dd7aa2232d214b3e', value: 94234, currency: 'ETH'},
      {to: '0xbe67596bf43620d821ea7c1f95ef38f71c9b043c', value: 3133, currency: 'ETH'},
      {to: '0x372b95fbb93c9f94f541a03db06b7129cf1207c4', value: 52424, currency: 'ETH'},
      {to: '0x69f46763d81139a045235a183dc82d322668f0b0', value: 45245, currency: 'ETH'},
      {to: '0x1526246db9de57fe6b9a45cc111b2fb9944869e8', value: 6356, currency: 'ETH'},
      {to: '0x6b90c75a63edd30f7d2a9a6eaf4251d0cc5f3c4d', value: 45242, currency: 'ETH'},
      {to: '0x17a18f9f28a0e8d0bde146ee5f30c1e764c96f6e', value: 65456, currency: 'ETH'},
      {to: '0x74afda0a5294128418b86a1b5baa7dabf78a0a49', value: 65, currency: 'ETH'},
      {to: '0xcf94a18ed9909cf821bd3f3224eb748aeeb5dbb0', value: 2, currency: 'ETH'},
      {to: '0x25fc72c8a2989406f06cb134de3016aa7262bb15', value: 56353456, currency: 'ETH'},
    ]
  }

  render () {

    return (
      <div>
        <div styleName='header'>
          <div styleName='title'><Translate value='wallet.pendingTransfers' /></div>
        </div>
        <div styleName='body'>
          <div styleName='tableHead'>
            <div styleName='left'>
              <div styleName='toAccount tableHeadElem'><Translate value='wallet.to' /></div>
              <div styleName='issue'>
                <div styleName='value tableHeadElem'><Translate value='wallet.value' /></div>
                <div styleName='currency invisible'>ETH</div>
              </div>
            </div>
            <div styleName='right invisible'>
              <div styleName='revoke'>
                <RaisedButton label={<Translate value='wallet.revoke' />} />
              </div>
              <div styleName='sign'>
                <RaisedButton label={<Translate value='wallet.sign' />} />
              </div>
            </div>
          </div>
          {this.props.transfers.map((transfer, idx) => <div styleName={idx % 2 ? 'transfer' : 'transfer evenRow'}
            key={idx}>
            <div styleName='left'>
              <div styleName='toAccount'>
                <div styleName='account'>{transfer.to}</div>
              </div>
              <div styleName='issue'>
                <div styleName='value'>{transfer.value}</div>
                <div styleName='currency'>{transfer.currency}</div>
              </div>
            </div>
            <div styleName='right'>
              <div styleName='revoke'>
                <RaisedButton label={<Translate value='wallet.revoke' />} />
              </div>
              <div styleName='sign'>
                <RaisedButton label={<Translate value='wallet.sign' />} primary disabled={false} />
              </div>
            </div>
          </div>)}
        </div>
      </div>
    )
  }
}