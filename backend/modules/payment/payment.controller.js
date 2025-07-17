const { validationResult } = require('express-validator');
const paymentService = require('./payment.service');
const { sendEmail } = require('../../utils/emailService'); 


const Appointment = require('../appointment/appointment.model');
const User = require('../user/user.model'); 

// Create payment intent for appointment
exports.createPaymentIntent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { appointmentId, amount, currency = 'usd' } = req.body;

    const appointment = await Appointment.findById(appointmentId)
        .populate('patient', 'firstName lastName email')
        .populate('doctor', 'firstName lastName email');

    if (!appointment) {
        return res.status(404).json({
            success: false,
            message: 'Appointment not found'
        });
    }

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
        const paymentIntent = await paymentService.createStripePaymentIntent({
            amount,
            currency,
            appointmentId: appointment.id,
            patientId: appointment.patient._id.toString(),
            doctorId: appointment.doctor._id.toString(),
            userId: req.user._id.toString(),
            description: `Payment for appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            receiptEmail: req.user.email
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
};

// Confirm payment and update appointment
exports.confirmPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { paymentIntentId, appointmentId } = req.body;

    try {
        const paymentIntent = await paymentService.retrieveStripePaymentIntent(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

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
        const user = req.user; // User from authenticateToken middleware
        await sendEmail({
            to: user.email,
            subject: 'Payment Confirmed - Smart Healthcare Assistant',
            template: 'paymentConfirmed',
            context: {
                patientName: user.firstName,
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
};

// Create subscription for premium features
exports.createSubscription = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { priceId, paymentMethodId } = req.body;

    try {
        const user = req.user;
        const subscription = await paymentService.createStripeSubscription(user.email, user.firstName, user.lastName, user._id.toString(), priceId, paymentMethodId);

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
};

// Get subscription details
exports.getSubscriptionDetails = async (req, res) => {
    const { subscriptionId } = req.params;

    try {
        const subscription = await paymentService.retrieveStripeSubscription(subscriptionId);

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
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { subscriptionId } = req.body;

    try {
        const subscription = await paymentService.retrieveStripeSubscription(subscriptionId);

        if (subscription.metadata.userId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const canceledSubscription = await paymentService.cancelStripeSubscription(subscriptionId);

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
};

// Get user's payment invoices
exports.getUserInvoices = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const invoicesData = await paymentService.getUserInvoices(req.user.email, page, limit);

        res.json({
            success: true,
            data: invoicesData
        });
    } catch (error) {
        console.error('Invoice retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving invoices'
        });
    }
};

// Get user's payment methods
exports.getUserPaymentMethods = async (req, res) => {
    try {
        const paymentMethods = await paymentService.getUserPaymentMethods(req.user.email);

        res.json({
            success: true,
            data: {
                paymentMethods
            }
        });
    } catch (error) {
        console.error('Payment methods retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving payment methods'
        });
    }
};

// Add new payment method
exports.addPaymentMethod = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { paymentMethodId } = req.body;

    try {
        const user = req.user;
        await paymentService.addPaymentMethod(user.email, user.firstName, user.lastName, user._id.toString(), paymentMethodId);

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
};

// Remove payment method
exports.removePaymentMethod = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { paymentMethodId } = req.body;

    try {
        await paymentService.removePaymentMethod(paymentMethodId);

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
};

// Handle Stripe webhooks
exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = paymentService.constructStripeWebhookEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    await paymentService.handleWebhookEvent(event);

    res.json({ received: true });
};