"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');  // New field for username
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username  // Save username in user metadata
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      console.error("SignUp Error:", signUpError);
    } else {
      alert("✅ Sign up successful! You can now login.");
      router.push('/');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setError(loginError.message);
      console.error("Login Error:", loginError);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="bg-[#0F0F0F] p-10 rounded-3xl border border-[#9D00FF]/50 max-w-md w-full">
        <h1 className="text-4xl font-bold neon-text-purple text-center mb-8">DrunkPlay</h1>

        <input
          type="text"
          placeholder="Username (Nickname)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-4"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-4"
        />

        <input
          type="password"
          placeholder="Password (at least 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mb-6"
        />

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-[#9D00FF] to-[#00F0FF] rounded-2xl mb-3"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full py-4 border border-[#00F0FF] rounded-2xl"
        >
          {loading ? "Loading..." : "Sign Up"}
        </button>
      </div>
    </div>
  );
}


