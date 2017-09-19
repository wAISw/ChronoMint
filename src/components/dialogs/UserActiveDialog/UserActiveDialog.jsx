import React from 'react'
import PropTypes from 'prop-types'
import UserMonitorService from 'user/monitorService'

import { connect } from 'react-redux'
import { CSSTransitionGroup } from 'react-transition-group'
import { logout } from 'redux/session/actions'
import ModalDialog from 'components/dialogs/ModalDialog'
import { modalsClose } from 'redux/modals/actions'
import { Translate } from 'react-redux-i18n'
import { RaisedButton } from "material-ui"
import './UserActiveDialog.scss'
import Timer from 'components/common/Timer/Timer'

const TRANSITION_TIMEOUT = 250

function mapDispatchToProps (dispatch) {
  return {
    handleLogout: () => dispatch(logout()),
    closeModal: () => {
      UserMonitorService.start()
      dispatch(modalsClose())
    },
  }
}

@connect(null, mapDispatchToProps)
export default class UserActiveDialog extends React.Component {
  static propTypes = {
    handleLogout: PropTypes.func,
    closeModal: PropTypes.func,
  }

  componentDidMount () {
    UserMonitorService.stop()
  }

  handleTimeEnd () {
    this.props.closeModal()
    this.props.handleLogout()
  }

  render () {
    return (
      <CSSTransitionGroup
        transitionName='transition-opacity'
        transitionAppear
        transitionAppearTimeout={TRANSITION_TIMEOUT}
        transitionEnterTimeout={TRANSITION_TIMEOUT}
        transitionLeaveTimeout={TRANSITION_TIMEOUT}>
        <ModalDialog onClose={() => this.props.closeModal()}>
          <div styleName='content'>
            <div styleName='dialogHeader'>
              <div styleName='dialogHeaderStuff'>
                <div styleName='dialogHeaderTitle'>
                  <Translate value='UserActiveDialog.title'/>
                </div>
              </div>
            </div>
            <div styleName='dialogBody'>
              <Translate value='UserActiveDialog.text'/>
              <Timer time={30} onEndTimeAction={() => this.handleTimeEnd()}/>
            </div>
            <div
              styleName='dialogFooter'>
              <RaisedButton
                styleName='action'
                label={<Translate value='UserActiveDialog.here'/>}
                type='submit'
                primary
                onClick={() => this.props.closeModal()}
              />
            </div>
          </div>
        </ModalDialog>
      </CSSTransitionGroup>
    )
  }
}
