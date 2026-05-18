import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service – Sportsurge Official',
  description: 'Terms of Service for Sportsurge Official, including usage guidelines, disclaimers, and legal information.',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#222226' }}>Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: May 2026</p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'rgba(34,34,38,0.7)' }}>
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Sportsurge Official ("the Service"), available at sportsurge.com, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>2. Description of Service</h2>
            <p>
              Sportsurge Official provides live sports scores, match schedules, fixtures, standings, expert analysis, and legal broadcast guides for various sports including NBA, NFL, MLB, NHL, F1, MMA, Cricket, Boxing, and College Sports. We are an informational and editorial platform — we do not host, stream, or provide any live video content ourselves.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>3. Use of the Service</h2>
            <p className="mb-2">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service in any way that violates any applicable local, state, national, or international law</li>
              <li>Attempt to interfere with or disrupt the integrity or performance of the Service</li>
              <li>Use any automated system, including robots, spiders, or scrapers, to access the Service</li>
              <li>Reproduce, duplicate, copy, sell, or exploit any portion of the Service without express written permission</li>
              <li>Use the Service to transmit any harmful, offensive, or objectionable content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>4. Content Disclaimer</h2>
            <p>
              All information provided on Sportsurge Official is for informational purposes only. While we strive to provide accurate and up-to-date information, we make no warranties or representations about the accuracy, completeness, or reliability of the content. Scores, schedules, and other data may be delayed or contain errors.
            </p>
            <p className="mt-2">
              Any references to streaming or broadcast options are provided as informational guides only. We do not endorse, promote, or facilitate access to any unauthorized or illegal streaming services. Users are responsible for ensuring that any streaming services they access comply with applicable laws in their jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>5. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by Sportsurge Official and are protected by international copyright, trademark, and other intellectual property laws. Team names, logos, and trademarks referenced on our site are property of their respective owners and are used for informational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>6. Third-Party Links and Services</h2>
            <p>
              Our Service may contain links to third-party websites or services that are not owned or controlled by Sportsurge Official. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that Sportsurge Official shall not be responsible or liable for any damage or loss caused by or in connection with the use of any such third-party content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>7. Advertising</h2>
            <p>
              Sportsurge Official displays advertisements through Google AdSense and other advertising partners. These advertisements are provided by third-party ad networks and are not endorsed by us. We are not responsible for the content, accuracy, or opinions expressed in any advertisements appearing on our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>8. Limitation of Liability</h2>
            <p>
              In no event shall Sportsurge Official, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>9. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>10. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Email: legal@sportsurge.com</li>
              <li>Website: sportsurge.com</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}