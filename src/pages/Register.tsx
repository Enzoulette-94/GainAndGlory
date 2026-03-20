import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Mail, Lock, User, UserPlus, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

const ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY as string;

const schema = z.object({
  accessKey: z.string().min(1, 'Clé d\'accès requise'),
  username: z.string().min(3, 'Min 3 caractères').max(20, 'Max 20 caractères')
    .regex(/^[a-zA-Z0-9_]+$/, 'Lettres, chiffres et _ uniquement'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Min 8 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
}).refine(d => d.accessKey === ACCESS_KEY, {
  message: 'Clé d\'accès invalide',
  path: ['accessKey'],
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);

      const taken = await profileService.isUsernameTaken(data.username);
      if (taken) {
        setError('Ce pseudo est déjà pris');
        return;
      }

      await authService.signUp(data.email, data.password, data.username);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background spartiate */}
      <div className="absolute inset-0 z-0">
        <img
          src="/logo.png"
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="w-9 h-9 text-[#c9a870]" />
            <h1 className="font-rajdhani text-4xl font-bold tracking-wide uppercase text-[#c9a870]">
              Gain &amp; Glory
            </h1>
          </div>
          <p className="text-[#a3a3a3] font-inter text-sm tracking-wide">
            Commence ton aventure sportive
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-[#c9a870]/20 p-8">
          {error && (
            <div className="mb-4 p-3 bg-transparent border border-red-800/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Clé d'accès"
              type="password"
              placeholder="••••••••••••"
              icon={<KeyRound className="w-4 h-4" />}
              error={errors.accessKey?.message}
              hint="Demande la clé à un administrateur"
              {...register('accessKey')}
            />
            <Input
              label="Pseudo"
              placeholder="ton_pseudo"
              icon={<User className="w-4 h-4" />}
              error={errors.username?.message}
              hint="3-20 caractères, lettres et chiffres uniquement"
              {...register('username')}
            />
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
              hint="Minimum 8 caractères"
              {...register('password')}
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              icon={<UserPlus className="w-4 h-4" />}
              className="w-full"
              size="lg"
            >
              CRÉER MON COMPTE
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#a3a3a3]">
            Déjà un compte ?{' '}
            <Link
              to="/login"
              className="text-[#c9a870] hover:text-[#dfc99e] font-medium transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
