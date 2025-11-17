import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthScreen: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('Cadastro realizado! Verifique seu e-mail para confirmação.');
            }
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-primary dark:text-primary-dark">
                        Lista de Compras Inteligente
                    </h1>
                    <p className="text-lg text-foreground/80 dark:text-dark-foreground/80 mt-2">
                        {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                    </p>
                </div>

                <div className="bg-card dark:bg-dark-card rounded-xl shadow-2xl p-6 md:p-8">
                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-2">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark focus:border-transparent transition"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-2">Senha</label>
                             <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        {message && <p className="text-green-500 text-sm">{message}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary dark:bg-primary-dark text-primary-foreground font-bold rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                        </button>
                    </form>
                    <div className="text-center mt-6">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setMessage(null);
                            }}
                            className="text-sm text-primary dark:text-primary-dark hover:underline"
                        >
                            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
