const { body } = require('express-validator');

exports.createPaymentIntentValidation = [
    body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
    body('amount').isNumeric().withMessage('Valid amount is required'),
    body('currency').optional().isIn(['usd', 'inr', 'bdt']).withMessage('Valid currency is required')
];

exports.confirmPaymentValidation = [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    body('appointmentId').isMongoId().withMessage('Valid appointment ID is required')
];

exports.createSubscriptionValidation = [
    body('priceId').notEmpty().withMessage('Price ID is required'),
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
];

exports.cancelSubscriptionValidation = [
    body('subscriptionId').notEmpty().withMessage('Subscription ID is required')
];

exports.addPaymentMethodValidation = [
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
];

exports.removePaymentMethodValidation = [
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
];