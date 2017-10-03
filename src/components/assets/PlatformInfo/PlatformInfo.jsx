import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form/immutable'
import { Translate } from 'react-redux-i18n'
import { TextField } from 'redux-form-material-ui'
import { IPFSImage, TokenValue } from 'components'
import Avatar from 'material-ui/Avatar'
import { RaisedButton, FlatButton } from 'material-ui'
import BigNumber from 'bignumber.js'

import './PlatformInfo.scss'

const ICON_OVERRIDES = {
  LHAU: require('assets/img/icn-lhau.svg'),
  LHEU: require('assets/img/icn-lheu.svg'),
  LHUS: require('assets/img/icn-lhus.png'),
}

function prefix (token) {
  return 'Assets.PlatformInfo.' + token
}

@reduxForm({form: 'REISSUE_FORM'})
export class PlatformInfo extends Component {

  static propTypes = {}

  handleSubmit () {

  }

  render () {
    return (
      <div styleName='root'>
        <div styleName='content'>
          <div styleName='balanceRow'>
            <div styleName='status'>
              <Translate value={prefix('onCrowdsale')} />
            </div>
            <IPFSImage styleName='tokenIcon' fallback={ICON_OVERRIDES.LHAU} />
            <div styleName='title'>LHUS</div>
            <div styleName='balanceWrap'>
              <div styleName='balance'>
                <div styleName='title'><Translate value={prefix('issuedAmount')} />:</div>
                <TokenValue
                  style={{fontSize: '24px', lineHeight: '24px'}}
                  value={new BigNumber(1324123)}
                  symbol={'usd'}
                />
              </div>
              <div styleName='fee'>
                <div styleName='title'><Translate value={prefix('fee')} />:</div>
                <div styleName='value'>
                  1.5<span>%</span>
                </div>
              </div>
            </div>
          </div>

          <div styleName='reissueRow'>
            <form onSubmit={this.handleSubmit}>
              <div styleName='input'>
                <Field
                  component={TextField}
                  fullWidth
                  name='reissue'
                  style={{width: '100%'}}
                  floatingLabelText={<Translate value={prefix('reissueAmount')} />}
                />
              </div>
              <RaisedButton
                primary
                label={<Translate value={prefix('reissue')} />}
                styleName='action'
              />
            </form>
          </div>

          <div styleName='managersRow'>
            <div styleName='title'>
              5&nbsp;<Translate value={prefix('managers')} />
              <div styleName='avatarsRow'>
                <Avatar
                  src={require('assets/img/icn-eth.png')}
                  size={24}
                />
                <Avatar
                  src={require('assets/img/icn-eth.png')}
                  size={24}
                />
                <Avatar
                  src={require('assets/img/icn-eth.png')}
                  size={24}
                />
                <Avatar
                  src={require('assets/img/icn-eth.png')}
                  size={24}
                />
              </div>
              <div styleName='addManager'>
                <i className='material-icons'>add_circle</i>
                Add/edit manager
              </div>
            </div>
          </div>

          <div styleName='actions'>
            <FlatButton
              styleName='action'
              label={<Translate value={prefix('send')} />}
            />

            <FlatButton
              styleName='action'
              label={<Translate value={prefix('crowdsaleInfo')} />}
            />

            <RaisedButton
              label={<Translate value={prefix('revoke')} />}
              styleName='action'
            />
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps (/*state*/) {
  return {}
}

function mapDispatchToProps (/*dispatch*/) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(PlatformInfo)