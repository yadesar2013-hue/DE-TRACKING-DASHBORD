import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/shareService';

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const check = async () => {
    try { const data = await apiRequest('/api/session'); setAllowed(data.authenticated); setError(''); }
    catch (e: any) { setError(e.message); }
    finally { setChecked(true); }
  };
  useEffect(() => { check(); }, []);
  if (allowed) return <>{children}</>;
  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
    <form className="bg-white shadow-lg rounded-xl p-6 max-w-md w-full space-y-4" onSubmit={async e => {
      e.preventDefault();
      try { await apiRequest('/api/session', { method: 'POST', body: JSON.stringify({ code }) }); setCode(''); await check(); }
      catch (e: any) { setError(e.message); }
    }}>
      <h1 className="text-xl font-bold text-indigo-900">Fondation HYSTERESIS</h1>
      <p>{checked ? 'Saisissez le code d’accès à l’espace partagé.' : 'Connexion à l’espace partagé…'}</p>
      <label className="block">Code d’accès<input type="password" autoComplete="current-password" value={code} onChange={e => setCode(e.target.value)} className="mt-1 border rounded w-full p-2" required /></label>
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
      <button className="bg-indigo-700 text-white rounded px-4 py-2" type="submit">Ouvrir le tableau de bord</button>
      <button className="ml-3 underline text-sm" type="button" onClick={check}>Réessayer la connexion</button>
    </form>
  </main>;
}
