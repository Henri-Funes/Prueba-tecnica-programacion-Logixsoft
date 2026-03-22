import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { login } from '../services/api';
import worldMapBg from '../images/mapamundi-optimized.WebP';

const LoginIcon = () => (
  <div className="bg-blue-100 p-4 rounded-full text-blue-600">
    <Truck size={48} strokeWidth={1.5} />
  </div>
);

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
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
          <p className="text-sm font-medium text-slate-600">Portal de clientes</p>
        </header>

        <div className="mx-auto flex max-w-md flex-col items-center">
          <LoginIcon />
          <h1 className="mt-4 text-center text-3xl font-bold tracking-tight text-blue-800">Iniciar sesion</h1>
          <p className="mb-6 mt-2 text-center text-sm text-slate-600">Accede para gestionar pedidos y ubicaciones</p>

          <form onSubmit={handleSubmit} className="grid w-full gap-3">
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
              placeholder="********"
              className="rounded-full border border-slate-300/90 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />

            {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 rounded-full bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Validando...' : 'Iniciar sesion'}
            </button>

            <div className="mt-1 flex items-center justify-between text-sm">
              <Link className="font-semibold text-blue-700 transition hover:text-blue-900" to="/register">
                Crear cuenta
              </Link>
              <span className="text-slate-500">Necesitas ayuda?</span>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;
