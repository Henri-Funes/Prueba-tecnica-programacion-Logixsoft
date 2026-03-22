const orderRepository = require('../repositories/orderRepository');
const userRepository = require('../repositories/userRepository');

const ALLOWED_ORDER_STATES = ['pendiente', 'en_proceso', 'entregado', 'cancelado'];

async function listOrders(userId) {
  return orderRepository.listOrdersByUserId(userId);
}

async function createOrder(userId, payload) {
  const latitud = payload.latitud ?? payload.latitude ?? payload.lat;
  const longitud = payload.longitud ?? payload.longitude ?? payload.lng;
  const { direccion, estado } = payload;

  if (latitud === undefined || longitud === undefined) {
    const error = new Error('latitud y longitud son requeridos');
    error.statusCode = 400;
    throw error;
  }

  const user = await userRepository.findUserById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const parsedLat = Number(latitud);
  const parsedLng = Number(longitud);

  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
    const error = new Error('latitud y longitud deben ser numericos');
    error.statusCode = 400;
    throw error;
  }

  if (estado !== undefined && !ALLOWED_ORDER_STATES.includes(estado)) {
    const error = new Error('Estado de pedido invalido');
    error.statusCode = 400;
    throw error;
  }

  return orderRepository.createOrder({
    usuarioId: userId,
    latitud: parsedLat,
    longitud: parsedLng,
    direccion,
    estado
  });
}

async function updateOrder(userId, orderId, payload) {
  const numericOrderId = Number(orderId);
  if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
    const error = new Error('ID de pedido invalido');
    error.statusCode = 400;
    throw error;
  }

  const existing = await orderRepository.findOrderByIdAndUserId(numericOrderId, userId);
  if (!existing) {
    const error = new Error('Pedido no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const updates = {};

  if (payload.nombreCliente !== undefined) {
    if (!payload.nombreCliente) {
      const error = new Error('nombreCliente no puede estar vacio');
      error.statusCode = 400;
      throw error;
    }
    updates.nombreCliente = payload.nombreCliente;
  }

  const incomingLatitud = payload.latitud ?? payload.latitude ?? payload.lat;
  const incomingLongitud = payload.longitud ?? payload.longitude ?? payload.lng;

  if (incomingLatitud !== undefined) {
    const parsedLat = Number(incomingLatitud);
    if (Number.isNaN(parsedLat)) {
      const error = new Error('latitud debe ser numerica');
      error.statusCode = 400;
      throw error;
    }
    updates.latitud = parsedLat;
  }

  if (incomingLongitud !== undefined) {
    const parsedLng = Number(incomingLongitud);
    if (Number.isNaN(parsedLng)) {
      const error = new Error('longitud debe ser numerica');
      error.statusCode = 400;
      throw error;
    }
    updates.longitud = parsedLng;
  }

  if (payload.direccion !== undefined) {
    updates.direccion = payload.direccion || null;
  }

  if (payload.estado !== undefined) {
    if (!ALLOWED_ORDER_STATES.includes(payload.estado)) {
      const error = new Error('Estado de pedido invalido');
      error.statusCode = 400;
      throw error;
    }
    updates.estado = payload.estado;
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error('No hay cambios para actualizar');
    error.statusCode = 400;
    throw error;
  }

  const immutableStatuses = ['entregado', 'cancelado'];
  if (
    immutableStatuses.includes(existing.estado) &&
    (updates.latitud !== undefined ||
      updates.longitud !== undefined ||
      updates.direccion !== undefined ||
      updates.nombreCliente !== undefined)
  ) {
    const error = new Error('Este pedido ya no permite cambios de ubicacion');
    error.statusCode = 409;
    throw error;
  }

  return orderRepository.updateOrderByIdAndUserId(numericOrderId, userId, updates);
}

module.exports = {
  listOrders,
  createOrder,
  updateOrder
};
