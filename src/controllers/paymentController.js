import SSLCommerzPayment from 'sslcommerz-lts';
import { orderRepository } from '../repositories/index.js';


const store_id = process.env.STORE_ID || 'testbox';
const store_passwd = process.env.STORE_PASSWD || 'testbox@ssl';
const is_live = process.env.NODE_ENV === 'production';

export const initPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await orderRepository.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    const backendUrl =
      process.env.API_BASE_URL || 'http://localhost:5000/api/v1';

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
    paymentStatus: 'PAID',
    orderStatus: 'PROCESSING',
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/order-success?orderId=${tran_id}`);
};

export const paymentFail = async (req, res) => {
  const { tran_id } = req.params;

  await orderRepository.findByIdAndUpdate(tran_id, {
    paymentStatus: 'FAILED',
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/order-fail`);
};

export const paymentCancel = async (req, res) => {
  const { tran_id } = req.params;

  await orderRepository.findByIdAndUpdate(tran_id, {
    paymentStatus: 'CANCELLED',
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/order-fail`);
};