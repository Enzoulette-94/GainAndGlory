import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase-client';
import { authService } from '../services/auth.service';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase émet un événement PASSWORD_RECOVERY quand l'URL contient le token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/logo.png" alt="" className="w-full h-full object-cover object-center" />
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
            Nouveau mot de passe
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-[#c9a870]/20 p-8">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-[#f5f5f5] font-medium">Mot de passe mis à jour !</p>
              <p className="text-[#a3a3a3] text-sm">Redirection vers le dashboard...</p>
            </div>
          ) : !ready ? (
            <p className="text-[#a3a3a3] text-sm text-center">
              Lien invalide ou expiré. Refais une demande depuis la page de connexion.
            </p>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-transparent border border-red-800/50 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  ENREGISTRER
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
