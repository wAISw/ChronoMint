import { connect } from "react-redux"
import PropTypes from "prop-types"
import React, { PureComponent } from 'react'
import { Drawer } from 'material-ui'
import { sidesPush } from 'redux/sides/actions'

function mapStateToProps () {
  return {}
}

function mapDispatchToProps (dispatch) {
  return {
    handlePanelClose: (component, panelKey: string, direction: string) => {
      dispatch(sidesPush({
        component: component,
        panelKey: panelKey,
        isOpened: false,
        direction: direction,
      }))
    },
  }
}

@connect(mapStateToProps, mapDispatchToProps)
class SidePanel extends PureComponent {

  static propTypes = {
    isOpened: PropTypes.bool,
    direction: PropTypes.oneOf(['left', 'right']),
    handlePanelClose: PropTypes.func,
    panelKey: PropTypes.string,
    component: PropTypes.func,
    componentProps: PropTypes.object,
  }

  static defaultProps = {
    isOpened: false,
    handlePanelClose: () => {},
  }

  constructor (props) {
    super(props)

    this.state = { isReadyToClose: true }
  }

  // Due to material-ui bug. Immediate close on mobile devices.
  // @see https://github.com/mui-org/material-ui/issues/6634
  // Going to be fixed in 1.00 version.
  componentWillReceiveProps = (nextProps) => {
    if (nextProps.isOpened && !this.props.isOpened) {
      this.setState({ isReadyToClose: false }, () => {
        setTimeout(() => {
          this.setState({ isReadyToClose: true })
        }, 300)
      })
    }
  }

  handleProfileClose = () => {
    if (!this.state.isReadyToClose) {
      return
    }
    this.props.handlePanelClose(this.props.component, this.props.panelKey, this.props.direction)
  }

  render () {
    const Component = this.props.component
    return (
      <Drawer
        openSecondary={this.props.direction === 'right'}
        open={this.props.isOpened}
        overlayStyle={{ opacity: 0 }}
        onRequestChange={this.handleProfileClose}
        containerStyle={{ opacity: 1, width: '300px', marginLeft: '300px' }}
        disableSwipeToOpen
        width={300}
        docked={false}
      >
        <Component onProfileClose={this.handleProfileClose} {...this.props.componentProps} />
      </Drawer>
    )
  }
}

export default SidePanel
