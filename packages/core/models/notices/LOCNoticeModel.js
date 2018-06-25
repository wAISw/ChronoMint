/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import { I18n } from '@chronobank/core-dependencies/i18n'
import { Icons } from '@chronobank/core-dependencies/icons'

import { abstractNoticeModel } from './AbstractNoticeModel'

const ADDED = 'notices.locs.added'
const REMOVED = 'notices.locs.removed'
const UPDATED = 'notices.locs.updated'
const STATUS_UPDATED = 'notices.locs.statusUpdated'
const ISSUED = 'notices.locs.issued'
const REVOKED = 'notices.locs.revoked'
const FAILED = 'notices.locs.failed'

export const statuses = {
  ADDED,
  REMOVED,
  UPDATED,
  STATUS_UPDATED,
  ISSUED,
  REVOKED,
  FAILED,
}

export default class LOCNoticeModel extends abstractNoticeModel({
  action: null,
  name: null,
  amount: null,
}) {
  icon () {
    return Icons.get('notices.locs.icon')
  }

  title () {
    return I18n.t('notices.locs.title')
  }

  // noinspection JSUnusedGlobalSymbols
  details () {
    const amount = this.get('amount')
    return amount
      ? [
        { label: I18n.t('notices.locs.details.amount'), value: `${amount}` },
      ]
      : null
  }

  message () {
    return I18n.t(this.get('action'), {
      name: this.get('name'),
    })
  }
}
