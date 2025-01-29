"use client";
import { useState } from 'react';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [error, setError] = useState('');
  const router = useRouter();
  
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Successfully logged in, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error during Google sign in:', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <>
      <div className="flex w-full h-screen bg-black items-center justify-center font-mono">
        <div className="border border-green-500 h-[300px] w-[300px] flex flex-col items-center justify-evenly">
          <div className="space-y-3 flex flex-col items-center">
            <h2 className="text-gray-600">Welcome to</h2>
            <h2 className="text-green-500 font-black text-3xl">
              {"<codeLog />"}
            </h2>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors duration-200 font-medium"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <p className="font-bold">Sign in with Google</p>
            </button>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}