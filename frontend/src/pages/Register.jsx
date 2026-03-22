import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { register } from '../services/api';
import worldMapBg from '../images/mapamundi-optimized.WebP';

const RegisterIcon = () => (
  <div className="bg-blue-100 p-4 rounded-full text-blue-600">
    <Truck size={48} strokeWidth={1.5} />
  </div>
);

function Register() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ nombre, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative min-h-screen bg-slate-900 p-4 text-slate-900"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 25, 48, 0.55), rgba(10, 25, 48, 0.55)), url(${worldMapBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <section className="mx-auto mt-6 w-full max-w-5xl rounded-2xl border border-white/25 bg-white/75 p-5 shadow-2xl backdrop-blur-sm md:mt-10 md:p-8">
        <header className="mb-10 flex items-center justify-between text-slate-900">
          <p className="text-lg font-semibold tracking-wide">Logixsoft Delivery</p>
          <p className="text-sm font-medium text-slate-600">Registro de clientes</p>
        </header>

        <div className="mx-auto flex max-w-md flex-col items-center">
          <RegisterIcon />
          <h1 className="mt-4 text-center text-3xl font-bold tracking-tight text-blue-800">Crear cuenta</h1>
          <p className="mb-6 mt-2 text-center text-sm text-slate-600">Registra tu usuario para gestionar pedidos</p>

          <form onSubmit={handleSubmit} className="grid w-full gap-3">
            <label htmlFor="nombre" className="text-sm font-semibold text-slate-700">
              Nombre de usuario
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Tu nombre"
              className="rounded-full border border-slate-300/90 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />

            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              className="rounded-full border border-slate-300/90 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />

            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="minimo 8 caracteres"
              className="rounded-full border border-slate-300/90 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              minLength={8}
              required
            />

            {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 rounded-full bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>

            <div className="mt-1 flex items-center justify-between text-sm">
              <Link className="font-semibold text-blue-700 transition hover:text-blue-900" to="/login">
                Volver a login
              </Link>
              <span className="text-slate-500">Tu cuenta sera tipo cliente</span>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Register;
