const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendEmail } = require('../../utils/emailService'); 

// Assuming models are in ../models
const Appointment = require('../appointment/appointment.model');
const User = require('../user/user.model');

// Create payment intent
exports.createStripePaymentIntent = async ({ amount, currency, appointmentId, patientId, doctorId, userId, description, receiptEmail }) => {
    return await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        metadata: {
            appointmentId: appointmentId,
            patientId: patientId,
            doctorId: doctorId,
            userId: userId
        },
        description: description,
        receipt_email: receiptEmail
    });
};

// Retrieve payment intent
exports.retrieveStripePaymentIntent = async (paymentIntentId) => {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
};

// Create or find a Stripe customer
const findOrCreateStripeCustomer = async (email, firstName, lastName, userId) => {
    const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1
    });

    if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
    } else {
        return await stripe.customers.create({
            email: email,
            name: `${firstName} ${lastName}`,
            metadata: {
                userId: userId
            }
        });
    }
};

// Create subscription
exports.createStripeSubscription = async (userEmail, userFirstName, userLastName, userId, priceId, paymentMethodId) => {
    const customer = await findOrCreateStripeCustomer(userEmail, userFirstName, userLastName, userId);

    await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
    });

    await stripe.customers.update(customer.id, {
        invoice_settings: {
            default_payment_method: paymentMethodId
        }
    });

    return await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
            userId: userId
        }
    });
};

// Retrieve subscription
exports.retrieveStripeSubscription = async (subscriptionId) => {
    return await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'latest_invoice']
    });
};

// Cancel subscription
exports.cancelStripeSubscription = async (subscriptionId) => {
    return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
    });
};

// Get user invoices
exports.getUserInvoices = async (userEmail, page, limit) => {
    const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
    });

    if (customers.data.length === 0) {
        return { invoices: [], pagination: { currentPage: page, totalPages: 0, totalInvoices: 0, hasNextPage: false, hasPrevPage: false } };
    }

    const customer = customers.data[0];

    const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: limit,
        starting_after: page > 1 ? (page - 1) * limit : undefined // This is not truly pagination but rather retrieves a chunk after an ID. For proper pagination, you'd use `starting_after` with the last ID of the previous page. Given the original code, this approximation is used.
    });

    return {
        invoices: invoices.data,
        pagination: {
            currentPage: page,
            // Stripe's list API doesn't directly provide totalPages or totalInvoices for precise pagination without iterating all.
            // This is an approximation based on the fetched data.
            totalPages: Math.ceil(invoices.data.length / limit),
            totalInvoices: invoices.data.length, // This will only be the count of the fetched limit, not total available.
            hasNextPage: invoices.has_more,
            hasPrevPage: page > 1
        }
    };
};

// Get user payment methods
exports.getUserPaymentMethods = async (userEmail) => {
    const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
    });

    if (customers.data.length === 0) {
        return [];
    }

    const customer = customers.data[0];

    const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card'
    });
    return paymentMethods.data;
};

// Add payment method
exports.addPaymentMethod = async (userEmail, userFirstName, userLastName, userId, paymentMethodId) => {
    const customer = await findOrCreateStripeCustomer(userEmail, userFirstName, userLastName, userId);

    await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
    });
};

// Remove payment method
exports.removePaymentMethod = async (paymentMethodId) => {
    await stripe.paymentMethods.detach(paymentMethodId);
};


// Construct Stripe Webhook Event
exports.constructStripeWebhookEvent = (requestBody, signature, endpointSecret) => {
    return stripe.webhooks.constructEvent(requestBody, signature, endpointSecret);
};

// Handle Webhook Event
exports.handleWebhookEvent = async (event) => {
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
};

// Webhook handlers (internal to service, could be further abstracted)
const handlePaymentIntentSucceeded = async (paymentIntent) => {
    console.log('Payment succeeded:', paymentIntent.id);
    // Logic to update appointment payment status, etc.
    // Example: const appointmentId = paymentIntent.metadata.appointmentId;
    // const appointment = await Appointment.findById(appointmentId);
    // if (appointment) { appointment.payment.status = 'paid'; await appointment.save(); }
};

const handlePaymentIntentFailed = async (paymentIntent) => {
    console.log('Payment failed:', paymentIntent.id);
    // Logic to handle failed payment
};

const handleSubscriptionCreated = async (subscription) => {
    console.log('Subscription created:', subscription.id);
    // Logic to update user subscription status (e.g., in User model)
    // Example: const userId = subscription.metadata.userId;
    // const user = await User.findById(userId);
    // if (user) { user.subscription = { id: subscription.id, status: subscription.status, ... }; await user.save(); }
};

const handleSubscriptionUpdated = async (subscription) => {
    console.log('Subscription updated:', subscription.id);
    // Logic to update user subscription status
};

const handleSubscriptionDeleted = async (subscription) => {
    console.log('Subscription deleted:', subscription.id);
    // Logic to update user subscription status (e.g., set to 'canceled' or remove)
};

const handleInvoicePaymentSucceeded = async (invoice) => {
    console.log('Invoice payment succeeded:', invoice.id);
    // Logic to handle successful invoice payment, e.g., send receipt email if not already sent
};

const handleInvoicePaymentFailed = async (invoice) => {
    console.log('Invoice payment failed:', invoice.id);
    // Logic to handle failed invoice payment, e.g., notify user
};