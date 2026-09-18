import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">{title}</h2>
    <div className="space-y-3 text-slate-600 leading-relaxed text-sm sm:text-base">{children}</div>
  </section>
);

export default function Privacy() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="Study Buddy" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-lg text-blue-600 truncate">Study Buddy</span>
          </Link>
          <Button variant="ghost" className="gap-2 text-slate-600" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
        {/* Page header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold px-3 py-1 mb-4">
            <Shield className="w-3.5 h-3.5" />
            Legal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-slate-500 text-sm">
            Last updated: September 2026 &nbsp;·&nbsp; Nabster Tsr Study Buddy
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm">
          <Section title="1. Introduction">
            <p>
              Welcome to Study Buddy, an AI-powered educational application developed by <strong>Nabster Tsr</strong>.
              This Privacy Policy explains how we collect, use, and protect your information when you use the
              Study Buddy web application at <strong>profilegenius.fun</strong> or the Study Buddy Android application.
            </p>
            <p>
              By using Study Buddy, you agree to the collection and use of information in accordance with this policy.
              We are committed to protecting your privacy and being transparent about our data practices.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p><strong>Account Information:</strong> When you create a Study Buddy account, we collect your email address and the password you choose (stored securely via Firebase Authentication — your plain-text password is never stored by us).</p>
            <p><strong>Study Data:</strong> Materials you upload (PDFs, images, notes), assignments you create, quiz results, study session durations, and module/subject data are stored in your account's database. This data is used solely to provide the app's functionality to you.</p>
            <p><strong>Usage Data:</strong> We may collect anonymous, aggregated usage statistics such as which features are used most frequently. This data does not identify individual users and is used to improve the app.</p>
            <p><strong>Device Information:</strong> On the Android app, basic device information (OS version, device model) may be collected by Firebase to facilitate crash reporting and performance monitoring.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide, maintain, and improve the Study Buddy application and its features</li>
              <li>To authenticate your account and keep your study data synced across devices</li>
              <li>To send you deadline notifications and app-related communications you have opted into</li>
              <li>To detect and prevent fraudulent use or abuse of the platform</li>
              <li>To analyze aggregate, anonymous usage patterns to improve the product</li>
            </ul>
            <p>We do <strong>not</strong> sell your personal information to third parties. We do not use your study content to train AI models without explicit consent.</p>
          </Section>

          <Section title="4. Google AdSense and Advertising">
            <p>
              Study Buddy uses <strong>Google AdSense</strong> (on the web application) and <strong>Google AdMob</strong>
              (on the Android application) to display advertisements. These services help us keep Study Buddy free for all students.
            </p>
            <p>
              Google may use cookies and device identifiers to serve ads based on your interests. You can opt out of personalized advertising by visiting{' '}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                Google Ad Settings <ExternalLink className="w-3 h-3" />
              </a>.
            </p>
            <p>
              For more information about how Google uses data when you use our partners' sites or apps, please visit{' '}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                How Google uses data <ExternalLink className="w-3 h-3" />
              </a>.
            </p>
            <p>
              Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to websites. Users may opt out of the use of the DART cookie by visiting the{' '}
              <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Ad and Content Network privacy policy</a>.
            </p>
          </Section>

          <Section title="5. Cookies and Tracking Technologies">
            <p>
              Study Buddy's web application uses cookies and similar tracking technologies for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Authentication cookies:</strong> Required to keep you logged in across sessions (provided by Firebase Authentication)</li>
              <li><strong>Local storage:</strong> Used to store your app preferences (such as dark mode, naming preferences) locally on your device</li>
              <li><strong>Advertising cookies:</strong> Used by Google AdSense to measure ad performance and serve relevant advertisements</li>
              <li><strong>Analytics cookies:</strong> Used by Google Analytics (if applicable) to understand aggregate usage patterns</li>
            </ul>
            <p>
              You can control cookie settings through your browser. Note that disabling cookies may affect the functionality of Study Buddy, particularly authentication.
            </p>
          </Section>

          <Section title="6. Data Storage and Security">
            <p>
              Your account and study data are stored on <strong>Google Firebase</strong> servers, which provide enterprise-grade security, encryption at rest and in transit, and compliance with major international data protection standards.
            </p>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
            <p>
              Study materials uploaded to the app are processed by AI services and are not permanently stored beyond what is necessary to serve your request unless you explicitly save them to your account.
            </p>
          </Section>

          <Section title="7. Children's Privacy (COPPA Notice)">
            <p>
              Study Buddy is designed to be a safe educational tool for students of all ages, including children under 13. We do not knowingly collect personal information from children under 13 beyond what is strictly necessary to operate the educational features of the app.
            </p>
            <p>
              If you are a parent or guardian and you are aware that your child has provided us with personal information without your consent, please contact us immediately at the email below. We will take steps to remove that information from our servers.
            </p>
            <p>
              We comply with the Children's Online Privacy Protection Act (COPPA) and take special care to ensure our advertising systems serve only age-appropriate content. Google AdSense and AdMob are configured to serve family-safe advertisements on Study Buddy.
            </p>
          </Section>

          <Section title="8. Third-Party Services">
            <p>Study Buddy integrates with the following third-party services. Each has its own Privacy Policy:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Google Firebase</strong> — Authentication and database:{' '}
                <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Privacy Policy</a>
              </li>
              <li>
                <strong>Google AdSense / AdMob</strong> — Advertising:{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Privacy Policy</a>
              </li>
              <li>
                <strong>AI Language Model Providers</strong> — Used to generate quizzes, summaries, and learning paths. Content sent to these services is subject to their respective privacy policies and is not used to train models on your personal data.
              </li>
            </ul>
          </Section>

          <Section title="9. Your Rights">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data via our <a href="/account-deletion.html" className="text-blue-600 hover:underline">Account Deletion page</a></li>
              <li><strong>Objection to advertising:</strong> Opt out of personalized advertising via Google Ad Settings</li>
            </ul>
            <p>To exercise any of these rights, contact us at the email address below.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this page periodically.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <div className="flex items-center gap-2 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 w-fit">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-slate-800">contact via: </span>
              <a href="https://buymeacoffee.com/nabstertsr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                buymeacoffee.com/nabstertsr
              </a>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Nabster Tsr Study Buddy · profilegenius.fun · {year}
            </p>
          </Section>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => navigate('/Signup')}>
            Get started free
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/')}>
            Back to home
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-slate-400">
          <span>© {year} Nabster Tsr Study Buddy</span>
          <div className="flex gap-4 flex-wrap">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <Link to="/About" className="hover:text-blue-600">About</Link>
            <Link to="/EULA" className="hover:text-blue-600">EULA</Link>
            <Link to="/Blog" className="hover:text-blue-600">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
