/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

import AbstractModel from './AbstractModel'

const schemaFactory = () => ({
  // key: Joi.string().required(),
  // type: Joi.string().required(),
  // name: Joi.string().required(),
  // category: Joi.string().allow(null),
  // date: Joi.object().type(Date).required(),
  // icon: Joi.string().allow(null),
  // title: Joi.string().required(),
  // message: Joi.string().allow(null),
  // amountTitle: Joi.string().allow(null),
  // isAmountSigned: Joi.boolean(),
  // amount: Joi.object().type(AmountModel).allow(null),
  // target: Joi.string().allow(null)
})

export default class LogEventModel extends AbstractModel {
  constructor (data, options) {
    super(data, schemaFactory(), options)
    Object.freeze(this)
  }
}