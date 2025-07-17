const express = require('express');
const { authenticateToken, requirePatient, requireDoctor } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const paymentController = require('./payment.controller');
const paymentValidation = require('./payment.validation');
const { body } = require('express-validator');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for appointment
// @access  Private
router.post('/create-payment-intent',
    authenticateToken, // Assuming authenticateToken is needed for all private routes
    paymentValidation.createPaymentIntentValidation,
    asyncHandler(paymentController.createPaymentIntent)
);

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update appointment
// @access  Private
router.post('/confirm-payment',
    authenticateToken,
    paymentValidation.confirmPaymentValidation,
    asyncHandler(paymentController.confirmPayment)
);

// @route   POST /api/payments/create-subscription
// @desc    Create subscription for premium features
// @access  Private
router.post('/create-subscription',
    authenticateToken,
    paymentValidation.createSubscriptionValidation,
    asyncHandler(paymentController.createSubscription)
);

// @route   GET /api/payments/subscription/:subscriptionId
// @desc    Get subscription details
// @access  Private
router.get('/subscription/:subscriptionId',
    authenticateToken,
    asyncHandler(paymentController.getSubscriptionDetails)
);

// @route   POST /api/payments/cancel-subscription
// @desc    Cancel subscription
// @access  Private
router.post('/cancel-subscription',
    authenticateToken,
    paymentValidation.cancelSubscriptionValidation,
    asyncHandler(paymentController.cancelSubscription)
);

// @route   GET /api/payments/invoices
// @desc    Get user's payment invoices
// @access  Private
router.get('/invoices',
    authenticateToken,
    asyncHandler(paymentController.getUserInvoices)
);

// @route   GET /api/payments/payment-methods
// @desc    Get user's payment methods
// @access  Private
router.get('/payment-methods',
    authenticateToken,
    asyncHandler(paymentController.getUserPaymentMethods)
);

// @route   POST /api/payments/add-payment-method
// @desc    Add new payment method
// @access  Private
router.post('/add-payment-method',
    authenticateToken,
    paymentValidation.addPaymentMethodValidation,
    asyncHandler(paymentController.addPaymentMethod)
);

// @route   DELETE /api/payments/remove-payment-method
// @desc    Remove payment method
// @access  Private
router.delete('/remove-payment-method',
    authenticateToken,
    paymentValidation.removePaymentMethodValidation,
    asyncHandler(paymentController.removePaymentMethod)
);

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public (raw body parsing is handled here for Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(paymentController.handleStripeWebhook));

module.exports = router;