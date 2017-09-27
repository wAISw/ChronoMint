import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { I18n } from 'react-redux-i18n'
import { OPEN_BRAND_PARTIAL } from 'redux/ui/reducer'
import { MuiThemeProvider, IconButton, FontIcon } from 'material-ui'
import BrandLogo from './BrandLogo'
import menu from 'menu'
import LocaleDropDown from 'layouts/partials/LocaleDropDown'

import inversedTheme from 'styles/themes/inversed'
import styles from './styles'
import './BrandPartial.scss'
import Rates from 'components/common/Rates/index'

@connect(mapStateToProps, mapDispatchToProps)
export default class BrandPartial extends React.Component {

  static propTypes = {
    locale: PropTypes.string,
    handleChangeLocale: PropTypes.func,
    toggleBrandPartial: PropTypes.func,
    open: PropTypes.bool
  }

  render () {
    const {locale, open} = this.props

    return (
      <div styleName='root' className='BrandPartial__root'>
        <div styleName='row'>
          <div styleName='heading'>
            <h1 styleName='title'><BrandLogo styleName='brand'/></h1>
            <div styleName='subtitle'>{require('../../../package.json').version}</div>
          </div>
          <ul styleName='items' key={locale}>
            {menu.global.map(item => (
              <li styleName='itemsItem' key={item.key}>
                <a
                  styleName='itemsLink'
                  href={item.path}
                  target='_blank'
                  rel='noopener noreferrer'>{I18n.t(item.title)}</a>
              </li>
            ))}
          </ul>
          <MuiThemeProvider muiTheme={inversedTheme}>
            <ul styleName='actions'>
              <li>
                <LocaleDropDown/>
              </li>
            </ul>
          </MuiThemeProvider>
        </div>
        {open
          ? (
            <div styleName='row when-open'>
              <Rates/>
            </div>
          )
          : null
        }
        <div styleName='toggle'>
          <IconButton iconStyle={styles.brand.toggle.iconStyle} onTouchTap={() => this.handleToggle()}>
            <FontIcon className='material-icons'>{open ? 'arrow_upward' : 'arrow_downward'}</FontIcon>
          </IconButton>
        </div>
      </div>
    )
  }

  handleToggle () {
    this.props.toggleBrandPartial(!this.props.open)
  }
}

function mapStateToProps (state) {
  return {
    locale: state.get('i18n').locale,
    open: state.get('ui').open
  }
}

function mapDispatchToProps (dispatch) {
  return {
    toggleBrandPartial: (open) => dispatch({type: OPEN_BRAND_PARTIAL, payload: {open}})
  }
}

