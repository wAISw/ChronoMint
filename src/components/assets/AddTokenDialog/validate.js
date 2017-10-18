import validator from 'components/forms/validator'
import ErrorList from 'components/forms/ErrorList'

export default function validate (values) {
  let platformErrors = new ErrorList()
  platformErrors.add(validator.required(values.get('platform')))

  let tokenSymbolErrors = new ErrorList()
  tokenSymbolErrors.add(validator.required(values.get('tokenSymbol')))

  let descriptionErrors = new ErrorList()
  descriptionErrors.add(validator.required(values.get('description')))

  let smallestUnitErrors = new ErrorList()
  smallestUnitErrors.add(validator.positiveNumber(values.get('smallestUnit')))
  smallestUnitErrors.add(validator.required(values.get('smallestUnit')))

  let amountErrors = new ErrorList()
  if (values.get('reissuable')) {
    amountErrors.add(validator.positiveNumber(values.get('amount')))
    amountErrors.add(validator.required(values.get('amount')))
  }

  let feePercentErrors = new ErrorList()
  let feeAddressErrors = new ErrorList()
  if (values.get('withFee')) {
    feePercentErrors.add(validator.positiveNumber(values.get('feePercent')))
    feePercentErrors.add(validator.required(values.get('feePercent')))
    feeAddressErrors.add(validator.address(values.get('feeAddress'), true))
  }

  return {
    platform: platformErrors.getErrors(),
    tokenSymbol: tokenSymbolErrors.getErrors(),
    description: descriptionErrors.getErrors(),
    smallestUnit: smallestUnitErrors.getErrors(),
    amount: amountErrors.getErrors(),
    feePercent: feePercentErrors.getErrors(),
    feeAddress: feeAddressErrors.getErrors()
  }
}