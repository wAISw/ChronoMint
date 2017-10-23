import PropTypes from 'prop-types'
import React from 'react'
import {Translate} from 'react-redux-i18n'
import {connect} from 'react-redux'
import moment from 'moment'
import {getTransactions} from 'redux/assetsManager/actions'
import Moment, {SHORT_DATE} from 'components/common/Moment/index'
import TokenValue from 'components/common/TokenValue/TokenValue'

import './HistoryTable.scss'

function prefix (token) {
  return `Assets.HistoryTable.${token}`
}


function mapStateToProps (state) {
  return {
    locale: state.get('i18n').locale,
    transactionsList: state.get('assetsManager').transactionsList,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    getTransactions: () => dispatch(getTransactions()),
  }
}

@connect(mapStateToProps, mapDispatchToProps)
export default class HistoryTable extends React.Component {
  static propTypes = {
    tokens: PropTypes.object,
    onLoadMore: PropTypes.func,
    isFetching: PropTypes.bool,
    transactions: PropTypes.object,
    historyItems: PropTypes.array,
    endOfList: PropTypes.bool,
    selectedNetworkId: PropTypes.number,
    selectedProviderId: PropTypes.number,
    locale: PropTypes.string,
    getTransactions: PropTypes.func,
    transactionsList: PropTypes.array,
  }

  componentDidMount () {
    this.props.getTransactions()
  }

  render () {
    const data = this.buildTableData(this.props.transactionsList, this.props.locale)

    return (
      <div styleName='root'>
        <div styleName='header'>
          <h3><Translate value={prefix('title')} /></h3>
        </div>
        <div styleName='content'>
          {data.length ? <div styleName='table'>
            <div styleName='table-head'>
              <div styleName='row'>
                <div styleName='col-time'><Translate value={prefix('time')} /></div>
                <div styleName='col-type'><Translate value={prefix('type')} /></div>
                <div styleName='col-manager'><Translate value={prefix('manager')} /></div>
                <div styleName='col-value'><Translate value={prefix('value')} /></div>
              </div>
            </div>
          </div> : ''}
          {data.map((group, index) => (
            <div styleName='section' key={index}>
              <div styleName='section-header'>
                <h5>{group.dateTitle}</h5>
              </div>
              <div styleName='table'>
                <div styleName='table-body'>
                  {group.transactions.map((item, index) => this.renderRow(item, index))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  renderRow ({trx, timeTitle}, index) {
    return (
      <div styleName='row' key={index}>
        <div styleName='col-time'>
          <div styleName='property'>
            <div styleName='text-faded'>{timeTitle}</div>
          </div>
        </div>

        <div styleName='col-type'>
          <div styleName='property'>
            <span styleName='badge-in'>{trx.type()}</span>
          </div>
        </div>

        <div styleName='col-manager'>
          <div styleName='property'>
            <div styleName='text-faded'>{trx.from()}</div>
          </div>
        </div>

        <div styleName='col-value'>
          <div styleName='property'>
            <div styleName='value'>
              {
                trx.value() && trx.symbol() &&
                <TokenValue
                  value={trx.value()}
                  symbol={trx.symbol()}
                />
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  buildTableData (historyItems, locale) {
    moment.locale(locale)
    const groups = historyItems
      .reduce((data, trx) => {
        const groupBy = trx.date('YYYY-MM-DD')
        data[groupBy] = data[groupBy] || {
          dateBy: trx.date('YYYY-MM-DD'),
          dateTitle: <Moment date={trx.date('YYYY-MM-DD')} format={SHORT_DATE} />,
          transactions: [],
        }
        data[groupBy].transactions.push({
          trx,
          timeBy: trx.date('HH:mm:ss'),
          timeTitle: trx.date('HH:mm'),
        })
        return data
      }, {})

    return Object.values(groups)
      .sort((a, b) => a.dateBy > b.dateBy ? -1 : a.dateBy < b.dateBy)
      .map(group => ({
        ...group,
        transactions: group.transactions.sort((a, b) => a.timeBy > b.timeBy ? -1 : a.timeBy < b.timeBy),
      }))
  }
}

