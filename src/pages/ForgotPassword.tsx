import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../services/auth.service';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/spartan.avif" alt="" className="w-full h-full object-cover object-center" />
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
            Réinitialisation du mot de passe
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-[#c9a870]/20 p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-[#f5f5f5] font-medium">Email envoyé !</p>
              <p className="text-[#a3a3a3] text-sm">
                Vérifie ta boîte mail (<span className="text-[#c9a870]">{email}</span>) et clique sur le lien pour réinitialiser ton mot de passe.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[#c9a870] hover:text-[#dfc99e] text-sm transition-colors mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-transparent border border-red-800/50 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <p className="text-[#a3a3a3] text-sm mb-6">
                Saisis ton email et on t'envoie un lien pour créer un nouveau mot de passe.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="ton@email.com"
                  icon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  ENVOYER LE LIEN
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs text-[#a3a3a3] hover:text-[#c9a870] transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
