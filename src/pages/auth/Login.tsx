import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});

type FormData = z.infer<typeof schema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/', { replace: true });
    } catch {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Left banner */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 shadow-2xl mb-6">
          <UtensilsCrossed className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Restaurant ERP</h1>
        <p className="mt-4 text-lg text-blue-200 text-center max-w-sm">
          Complete management platform for your restaurant — orders, inventory, finance & more.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
          {['Orders & POS', 'Inventory', 'Finance', 'Loyalty', 'Reservations', 'Analytics'].map((f) => (
            <div key={f} className="flex items-center gap-2 text-blue-200">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin@restaurant.local"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                Sign in
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Demo accounts</p>
              <div className="space-y-1.5">
                {[
                  { role: 'Admin', email: 'admin@restaurant.local', pass: 'Admin123!' },
                  { role: 'Manager', email: 'manager@restaurant.local', pass: 'Manager123!' },
                  { role: 'Employee', email: 'employee@restaurant.local', pass: 'Employee123!' },
                  { role: 'Client', email: 'client@restaurant.local', pass: 'Client123!' },
                ].map(({ role, email, pass }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { onSubmit({ email, password: pass }); }}
                    className="w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <span className="font-medium">{role}:</span>{' '}
                    <span className="text-gray-500">{email}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-gray-500">
              New here?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
