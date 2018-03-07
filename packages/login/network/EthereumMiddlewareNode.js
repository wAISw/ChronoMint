import AbstractNode from './AbstractNode'

const eventsList = [
  'platformrequested',
  'restricted',
  'unrestricted',
  'paused',
  'unpaused',
]

export default class EthereumMiddlewareNode extends AbstractNode {
  constructor () {
    super(...arguments)

    this.addListener('subscribe', (address) => this._handleSubscribe(address))
    this.addListener('unsubscribe', (address) => this._handleUnsubscribe(address))
    this.connect()
  }

  async _handleSubscribe ({ ethAddress, nemAddress }) {
    if (!this._socket) {
      return
    }
    try {
      await this._api.post('addr', {
        address: ethAddress,
        nem: nemAddress,
      })

      this.executeOrSchedule(() => {
        eventsList.map((event) => {
          this._openSubscription(`${this._socket.channels.common}.${event}`, (data) => {
            this.trace(event, data)
            this.emit(event, data)
          })
        })
      })

    } catch (e) {
      this.trace('Address subscription error', e)
    }
  }

  async _handleUnsubscribe ({ ethAddress, nemAddress }) {
    try {
      await this._api.delete('addr', {
        address: ethAddress,
        nem: nemAddress,
      })
    } catch (e) {
      this.trace('Address unsubscription error', e)
    }
  }

  async getEventsData (eventName: string, queryFilter: string, mapCallback) {
    const response = await this._api.get(`events/${eventName}/?${queryFilter}`)
    if (response && response.data.length) {
      return response.data.map(mapCallback)
    }

    return []
  }

}
