import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Mail, Lock, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      await authService.signIn(data.email, data.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background spartiate */}
      <div className="absolute inset-0 z-0">
        <img
          src="/spartan.avif"
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="w-9 h-9 text-[#c9a870]" />
            <h1 className="font-rajdhani text-4xl font-bold tracking-wide uppercase text-[#c9a870]">
              Gain &amp; Glory
            </h1>
          </div>
          <p className="text-[#a3a3a3] font-inter text-sm tracking-wide">
            Reprends ta progression
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-black/60 backdrop-blur-md border border-[#c9a870]/20 p-8">
          {error && (
            <div className="mb-4 p-3 bg-transparent border border-red-800/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="ton@email.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-[#c9a870]/70 hover:text-[#c9a870] transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              icon={<LogIn className="w-4 h-4" />}
              className="w-full"
              size="lg"
            >
              SE CONNECTER
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#a3a3a3]">
            Pas encore de compte ?{' '}
            <Link
              to="/register"
              className="text-[#c9a870] hover:text-[#dfc99e] font-medium transition-colors"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
