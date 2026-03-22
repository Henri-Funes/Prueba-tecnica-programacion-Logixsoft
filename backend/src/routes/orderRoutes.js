const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de pedidos requieren JWT
router.use(authMiddleware);

// GET /api/orders
router.get('/', orderController.listOrders);

// POST /api/orders
router.post('/', orderController.createOrder);

// PATCH /api/orders/:id
router.patch('/:id', orderController.updateOrder);

module.exports = router;
