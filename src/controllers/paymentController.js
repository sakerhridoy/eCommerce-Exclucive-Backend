import SSLCommerzPayment from 'sslcommerz-lts';
import { orderRepository } from '../repositories/index.js';
import * as orderService from '../services/index.js';
import { PAYMENT_STATUS, ORDER_STATUS } from '../utils/index.js';
import { config } from '../config/index.js';

const store_id = config.sslcommerz.storeId || 'testbox';
const store_passwd = config.sslcommerz.storePassword || 'testbox@ssl';
const is_live = !config.sslcommerz.sandbox;

export const initPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await orderRepository.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    const backendUrl = config.apiBaseUrl;

    const data = {
      total_amount: order.total,
      currency: 'BDT',
      tran_id: order._id.toString(),
      success_url: `${backendUrl}/payments/success/${order._id}`,
      fail_url: `${backendUrl}/payments/fail/${order._id}`,
      cancel_url: `${backendUrl}/payments/cancel/${order._id}`,
      ipn_url: `${backendUrl}/payments/ipn`,
      shipping_method: 'Courier',
      product_name: 'eCommerce Products',
      product_category: 'General',
      product_profile: 'general',
      cus_name: order.shippingAddress?.name || 'Customer',
      cus_email: 'customer@example.com',
      cus_add1: order.shippingAddress?.street || 'Dhaka',
      cus_city: order.shippingAddress?.city || 'Dhaka',
      cus_state: order.shippingAddress?.state || 'Dhaka',
      cus_postcode: order.shippingAddress?.zipCode || '1000',
      cus_country: order.shippingAddress?.country || 'Bangladesh',
      cus_phone: order.shippingAddress?.phone || '01711111111',
      ship_name: order.shippingAddress?.name || 'Customer',
      ship_add1: order.shippingAddress?.street || 'Dhaka',
      ship_city: order.shippingAddress?.city || 'Dhaka',
      ship_state: order.shippingAddress?.state || 'Dhaka',
      ship_postcode: order.shippingAddress?.zipCode || 1000,
      ship_country: order.shippingAddress?.country || 'Bangladesh',
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

    sslcz
      .init(data)
      .then(apiResponse => {
        if (apiResponse?.GatewayPageURL) {
          res.status(200).json({
            success: true,
            data: { paymentUrl: apiResponse.GatewayPageURL },
          });
        } else {
          console.error('SSLCommerz Error:', apiResponse);
          res.status(400).json({
            success: false,
            message:
              apiResponse?.failedreason || 'SSLCommerz rejected the request.',
          });
        }
      })
      .catch(error => {
        console.error('SSLcz Init Catch:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to reach SSLCommerz Server',
        });
      });
  } catch (error) {
    console.error('Payment Init Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment initiation failed',
    });
  }
};

export const paymentSuccess = async (req, res) => {
  const { tran_id } = req.params;

  await orderRepository.findByIdAndUpdate(tran_id, {
    paymentStatus: PAYMENT_STATUS.PAID,
    orderStatus: ORDER_STATUS.PROCESSING,
  });

  const frontendUrl = config.frontendUrl;
  res.redirect(`${frontendUrl}/order-success?orderId=${tran_id}`);
};

export const paymentFail = async (req, res) => {
  const { tran_id } = req.params;

  try {
    // Mark the order cancelled and return reserved stock to inventory.
    await orderService.handlePaymentFailure(tran_id, PAYMENT_STATUS.FAILED);
  } catch (error) {
    console.error('Payment fail handler error:', error);
  }

  const frontendUrl = config.frontendUrl;
  res.redirect(`${frontendUrl}/order-fail`);
};

export const paymentCancel = async (req, res) => {
  const { tran_id } = req.params;

  try {
    await orderService.handlePaymentFailure(tran_id, PAYMENT_STATUS.FAILED);
  } catch (error) {
    console.error('Payment cancel handler error:', error);
  }

  const frontendUrl = config.frontendUrl;
  res.redirect(`${frontendUrl}/order-fail`);
};

export const paymentIpn = async (req, res) => {
  try {
    const { tran_id, status } = req.body;

    if (!tran_id) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid IPN payload' });
    }

    const isSuccessful =
      status === 'VALID' || status === 'VALIDATED' || status === 'SUCCESS';

    if (isSuccessful) {
      await orderRepository.findByIdAndUpdate(tran_id, {
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.PROCESSING,
      });
    } else {
      // Failed IPN => restore stock and cancel the order.
      await orderService.handlePaymentFailure(tran_id, PAYMENT_STATUS.FAILED);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('SSLCommerz IPN Error:', error);
    return res.status(200).json({ success: false });
  }
};
