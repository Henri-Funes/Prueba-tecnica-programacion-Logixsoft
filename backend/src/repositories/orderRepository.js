const pool = require('../config/db');

async function listOrdersByUserId(userId) {
  const query = `
    SELECT id, usuario_id, numero_pedido, nombre_cliente, latitud, longitud, direccion, estado, created_at, updated_at
    FROM pedidos
    WHERE usuario_id = $1
    ORDER BY numero_pedido DESC
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
}

async function createOrder({ usuarioId, latitud, longitud, direccion, estado }) {
  const query = `
    WITH user_data AS (
      SELECT nombre
      FROM usuarios
      WHERE id = $1
    ),
    next_order AS (
      SELECT COALESCE(MAX(numero_pedido), 0) + 1 AS numero
      FROM pedidos
      WHERE usuario_id = $1
    ),
    resolved_payload AS (
      SELECT
        next_order.numero AS numero_pedido_final,
        user_data.nombre AS nombre_cliente_final
      FROM user_data
      CROSS JOIN next_order
    )
    INSERT INTO pedidos (usuario_id, numero_pedido, nombre_cliente, latitud, longitud, direccion, estado)
    SELECT $1, resolved_payload.numero_pedido_final, resolved_payload.nombre_cliente_final, $2, $3, $4, $5
    FROM resolved_payload
    RETURNING id, usuario_id, numero_pedido, nombre_cliente, latitud, longitud, direccion, estado, created_at, updated_at
  `;

  const values = [usuarioId, latitud, longitud, direccion || null, estado || 'pendiente'];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function findOrderByIdAndUserId(orderId, userId) {
  const query = `
    SELECT id, usuario_id, numero_pedido, nombre_cliente, latitud, longitud, direccion, estado, created_at, updated_at
    FROM pedidos
    WHERE id = $1 AND usuario_id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [orderId, userId]);
  return rows[0] || null;
}

async function updateOrderByIdAndUserId(orderId, userId, payload) {
  const updates = [];
  const values = [];

  const fields = {
    nombreCliente: 'nombre_cliente',
    latitud: 'latitud',
    longitud: 'longitud',
    direccion: 'direccion',
    estado: 'estado'
  };

  Object.entries(fields).forEach(([key, column]) => {
    if (payload[key] !== undefined) {
      values.push(payload[key]);
      updates.push(`${column} = $${values.length}`);
    }
  });

  values.push(orderId);
  values.push(userId);

  const query = `
    UPDATE pedidos
    SET ${updates.join(', ')}
    WHERE id = $${values.length - 1} AND usuario_id = $${values.length}
    RETURNING id, usuario_id, numero_pedido, nombre_cliente, latitud, longitud, direccion, estado, created_at, updated_at
  `;

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

module.exports = {
  listOrdersByUserId,
  createOrder,
  findOrderByIdAndUserId,
  updateOrderByIdAndUserId
};
