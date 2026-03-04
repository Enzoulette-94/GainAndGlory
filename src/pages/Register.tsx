import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dumbbell, Mail, Lock, User, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

const schema = z.object({
  username: z.string().min(3, 'Min 3 caractères').max(20, 'Max 20 caractères')
    .regex(/^[a-zA-Z0-9_]+$/, 'Lettres, chiffres et _ uniquement'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Min 8 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
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

      // Vérifier si le pseudo est disponible
      const taken = await profileService.isUsernameTaken(data.username);
      if (taken) {
        setError('Ce pseudo est déjà pris');
        return;
      }

      await authService.signUp(data.email, data.password, data.username);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#080808]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-emerald-900/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">Gain & Glory</h1>
          </div>
          <p className="text-slate-400">Commence ton aventure sportive</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              Créer mon compte
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
