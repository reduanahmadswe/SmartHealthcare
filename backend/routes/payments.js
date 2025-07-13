const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken, requirePatient, requireDoctor } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for appointment
// @access  Private
router.post('/create-payment-intent', [
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('amount').isNumeric().withMessage('Valid amount is required'),
  body('currency').optional().isIn(['usd', 'inr', 'bdt']).withMessage('Valid currency is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { appointmentId, amount, currency = 'usd' } = req.body;

  // Check if appointment exists and belongs to user
  const Appointment = require('../models/Appointment');
  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName email')
    .populate('doctor', 'firstName lastName email');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if user has access to this appointment
  const isPatient = appointment.patient._id.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        appointmentId: appointmentId,
        patientId: appointment.patient._id.toString(),
        doctorId: appointment.doctor._id.toString(),
        userId: req.user._id.toString()
      },
      description: `Payment for appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      receipt_email: req.user.email
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent'
    });
  }
}));

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update appointment
// @access  Private
router.post('/confirm-payment', [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { paymentIntentId, appointmentId } = req.body;

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Update appointment with payment information
    const Appointment = require('../models/Appointment');
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update appointment payment status
    appointment.payment = {
      status: 'paid',
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      paymentIntentId: paymentIntentId,
      paymentMethod: paymentIntent.payment_method,
      paidAt: new Date()
    };

    await appointment.save();

    // Send confirmation email
    await sendEmail({
      to: req.user.email,
      subject: 'Payment Confirmed - Smart Healthcare Assistant',
      template: 'paymentConfirmed',
      context: {
        patientName: req.user.firstName,
        amount: appointment.payment.amount,
        currency: appointment.payment.currency.toUpperCase(),
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime
      }
    });

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment'
    });
  }
}));

// @route   POST /api/payments/create-subscription
// @desc    Create subscription for premium features
// @access  Private
router.post('/create-subscription', [
  body('priceId').notEmpty().withMessage('Price ID is required'),
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { priceId, paymentMethodId } = req.body;

  try {
    // Attach payment method to customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        metadata: {
          userId: req.user._id.toString()
        }
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: req.user._id.toString()
      }
    });

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      }
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription'
    });
  }
}));

// @route   GET /api/payments/subscription/:subscriptionId
// @desc    Get subscription details
// @access  Private
router.get('/subscription/:subscriptionId', asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'latest_invoice']
    });

    // Check if user owns this subscription
    if (subscription.metadata.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        subscription
      }
    });
  } catch (error) {
    console.error('Subscription retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscription'
    });
  }
}));

// @route   POST /api/payments/cancel-subscription
// @desc    Cancel subscription
// @access  Private
router.post('/cancel-subscription', [
  body('subscriptionId').notEmpty().withMessage('Subscription ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { subscriptionId } = req.body;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Check if user owns this subscription
    if (subscription.metadata.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Cancel subscription at period end
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current period',
      data: {
        subscription: canceledSubscription
      }
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error canceling subscription'
    });
  }
}));

// @route   GET /api/payments/invoices
// @desc    Get user's payment invoices
// @access  Private
router.get('/invoices', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    // Find customer by email
    const customers = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.json({
        success: true,
        data: {
          invoices: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalInvoices: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    const customer = customers.data[0];

    // Get invoices for customer
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: limit,
      starting_after: page > 1 ? (page - 1) * limit : undefined
    });

    res.json({
      success: true,
      data: {
        invoices: invoices.data,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(invoices.data.length / limit),
          totalInvoices: invoices.data.length,
          hasNextPage: invoices.has_more,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Invoice retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving invoices'
    });
  }
}));

// @route   GET /api/payments/payment-methods
// @desc    Get user's payment methods
// @access  Private
router.get('/payment-methods', asyncHandler(async (req, res) => {
  try {
    // Find customer by email
    const customers = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.json({
        success: true,
        data: {
          paymentMethods: []
        }
      });
    }

    const customer = customers.data[0];

    // Get payment methods for customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card'
    });

    res.json({
      success: true,
      data: {
        paymentMethods: paymentMethods.data
      }
    });
  } catch (error) {
    console.error('Payment methods retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment methods'
    });
  }
}));

// @route   POST /api/payments/add-payment-method
// @desc    Add new payment method
// @access  Private
router.post('/add-payment-method', [
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { paymentMethodId } = req.body;

  try {
    // Find or create customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        metadata: {
          userId: req.user._id.toString()
        }
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id
    });

    res.json({
      success: true,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding payment method'
    });
  }
}));

// @route   DELETE /api/payments/remove-payment-method
// @desc    Remove payment method
// @access  Private
router.delete('/remove-payment-method', [
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { paymentMethodId } = req.body;

  try {
    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Remove payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing payment method'
    });
  }
}));

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}));

// Webhook handlers
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  console.log('Payment succeeded:', paymentIntent.id);
  // Update appointment payment status if needed
};

const handlePaymentIntentFailed = async (paymentIntent) => {
  console.log('Payment failed:', paymentIntent.id);
  // Handle failed payment
};

const handleSubscriptionCreated = async (subscription) => {
  console.log('Subscription created:', subscription.id);
  // Update user subscription status
};

const handleSubscriptionUpdated = async (subscription) => {
  console.log('Subscription updated:', subscription.id);
  // Update user subscription status
};

const handleSubscriptionDeleted = async (subscription) => {
  console.log('Subscription deleted:', subscription.id);
  // Update user subscription status
};

const handleInvoicePaymentSucceeded = async (invoice) => {
  console.log('Invoice payment succeeded:', invoice.id);
  // Handle successful invoice payment
};

const handleInvoicePaymentFailed = async (invoice) => {
  console.log('Invoice payment failed:', invoice.id);
  // Handle failed invoice payment
};

module.exports = router; 