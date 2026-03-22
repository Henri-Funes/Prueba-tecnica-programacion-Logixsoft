const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');

function buildToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      rol: user.rol
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function register({ nombre, email, password, rol = 'cliente' }) {
  const existingUser = await userRepository.findUserByEmail(email);
  if (existingUser) {
    const error = new Error('El correo ya esta registrado');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const safeNombre = (nombre && nombre.trim()) || email.split('@')[0];
  const user = await userRepository.createUser({ nombre: safeNombre, email, passwordHash, rol });
  const token = buildToken(user);

  return { user, token };
}

async function login({ email, password }) {
  const user = await userRepository.findUserByEmail(email);

  if (!user || !user.activo) {
    const error = new Error('Credenciales invalidas');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error('Credenciales invalidas');
    error.statusCode = 401;
    throw error;
  }

  const token = buildToken(user);

  return {
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    },
    token
  };
}

module.exports = {
  register,
  login
};
