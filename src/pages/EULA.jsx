import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

/** Read-only EULA page linked from the marketing footer (does not replace product-entry acceptance). */
export default function EULA() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button type="button" className="flex items-center gap-2" onClick={() => navigate('/')}>
            <img src={logo} alt="Study Buddy" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-lg text-blue-600">Study Buddy</span>
          </button>
          <Button variant="outline" className="rounded-lg" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">End-User License Agreement</h1>
        <p className="text-slate-500 mb-8 text-sm">Nabster Tsr Study Buddy</p>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base shadow-sm">
          <p>
            This End-User License Agreement (&quot;EULA&quot;) is a legal agreement between you and <strong>Nabster Tsr</strong> for the Study Buddy software and related services.
          </p>
          <p>By accepting this agreement or using the product, you acknowledge that:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The software is provided <strong>&quot;AS IS&quot;</strong> without warranty of any kind.</li>
            <li>Academic accuracy is not guaranteed; verify all AI-generated content.</li>
            <li>Your study documents may be processed locally via sidecars (Python/Go) where applicable.</li>
            <li>Usage data may be stored locally in your Application Data folder on desktop builds.</li>
          </ul>
          <p className="text-slate-500 text-sm">
            A full copy of <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">EULA.md</code> ships with the application package for your records.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={() => navigate('/Signup')}>
            Get started free
          </Button>
          <Button variant="outline" className="rounded-lg" onClick={() => navigate('/')}>
            Back to home
          </Button>
        </div>
      </main>
    </div>
  );
}
