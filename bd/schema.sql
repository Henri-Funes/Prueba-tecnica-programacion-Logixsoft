-- Script base para la prueba tecnica (PostgreSQL)
-- Ejecutar en pgAdmin sobre la base: logixsoft_db

BEGIN;

-- Tipos para mantener consistencia de roles y estados
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'cliente');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pendiente', 'en_proceso', 'entregado', 'cancelado');
  END IF;
END
$$;

-- Usuarios con password cifrada (hash bcrypt/argon2 desde backend)
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol user_role NOT NULL DEFAULT 'cliente',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pedidos/Marcadores vinculados al usuario
CREATE TABLE IF NOT EXISTS pedidos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  numero_pedido INTEGER NOT NULL,
  nombre_cliente VARCHAR(160) NOT NULL,
  latitud NUMERIC(9,6) NOT NULL,
  longitud NUMERIC(9,6) NOT NULL,
  direccion TEXT,
  estado order_status NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_pedidos_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- Migracion segura para entornos existentes donde numero_pedido no exista aun
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS numero_pedido INTEGER;

WITH pedidos_numerados AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY usuario_id ORDER BY created_at, id) AS rn
  FROM pedidos
)
UPDATE pedidos p
SET numero_pedido = pn.rn
FROM pedidos_numerados pn
WHERE p.id = pn.id
  AND p.numero_pedido IS NULL;

ALTER TABLE pedidos
ALTER COLUMN numero_pedido SET NOT NULL;

-- Normaliza datos heredados donde nombre_cliente incluia "Pedido N"
UPDATE pedidos
SET nombre_cliente = regexp_replace(
  nombre_cliente,
  ' Pedido ' || numero_pedido::text || '$',
  ''
)
WHERE nombre_cliente ~ (' Pedido ' || numero_pedido::text || '$');

-- Indices utiles para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pedidos_usuario_numero_pedido ON pedidos(usuario_id, numero_pedido);

-- Trigger generico para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_pedidos_updated_at ON pedidos;
CREATE TRIGGER trg_pedidos_updated_at
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
