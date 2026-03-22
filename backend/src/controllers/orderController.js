const orderService = require('../services/orderService');

async function listOrders(req, res, next) {
  try {
    const orders = await orderService.listOrders(req.user.sub);
    return res.status(200).json(orders);
  } catch (error) {
    return next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.user.sub, req.body);
    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
}

async function updateOrder(req, res, next) {
  try {
    const updated = await orderService.updateOrder(req.user.sub, req.params.id, req.body);
    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listOrders,
  createOrder,
  updateOrder
};
