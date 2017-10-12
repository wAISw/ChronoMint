import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { CSSTransitionGroup } from 'react-transition-group'
import ModalDialog from 'components/dialogs/ModalDialog'
import { modalsClose } from 'redux/modals/actions'
import AddTokenForm from './AddTokenForm'

const TRANSITION_TIMEOUT = 250

function mapStateToProps (/*state*/) {
  return {}
}

function mapDispatchToProps (dispatch) {
  return {
    onClose: () => dispatch(modalsClose()),
    onSubmit: () => {
      dispatch(modalsClose())
    },
    closeModal: () => dispatch(modalsClose())
  }
}

@connect(mapStateToProps, mapDispatchToProps)
export default class AddPlatformDialog extends React.Component {
  static propTypes = {
    handleSubmit: PropTypes.func,
    onClose: PropTypes.func,
    submitting: PropTypes.bool,
    closeModal: PropTypes.func,
  }


  handleSubmitSuccess = (values) => {
    this.props.closeModal()
    // eslint-disable-next-line
    console.log('onSubmit', values)
  }

  render () {
    return (
      <CSSTransitionGroup
        transitionName='transition-opacity'
        transitionAppear
        transitionAppearTimeout={TRANSITION_TIMEOUT}
        transitionEnterTimeout={TRANSITION_TIMEOUT}
        transitionLeaveTimeout={TRANSITION_TIMEOUT}>
        <ModalDialog onClose={() => this.props.onClose()}>
          <AddTokenForm
            handleSubmit={this.handleSubmitSuccess}
          />
        </ModalDialog>
      </CSSTransitionGroup>
    )
  }
}