import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – Sportsurge Official',
  description: 'Privacy Policy for Sportsurge Official, including information about data collection, cookies, and Google AdSense.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#222226' }}>Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: May 2026</p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'rgba(34,34,38,0.7)' }}>
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>1. Introduction</h2>
            <p>
              Welcome to Sportsurge Official ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at sportsurge.com (the "Service").
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>2. Information We Collect</h2>
            <p className="mb-2">
              We may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Usage Data:</strong> Information about how you use our Service, including pages visited, time spent on pages, and navigation patterns.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type, and IP address.</li>
              <li><strong>Cookies and Tracking Data:</strong> We use cookies and similar tracking technologies to track activity on our Service and hold certain information. See our Cookie Policy below for more details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>3. How We Use Your Information</h2>
            <p className="mb-2">
              We use the information we collect for various purposes, including to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain our Service</li>
              <li>Improve and personalize your experience</li>
              <li>Understand how users interact with our Service</li>
              <li>Display relevant advertisements</li>
              <li>Monitor and analyze usage and trends</li>
              <li>Detect, prevent, and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>4. Google AdSense and Advertising</h2>
            <p className="mb-2">
              We use Google AdSense to display advertisements on our Service. Google AdSense uses cookies to serve ads based on your prior visits to our website or other websites on the Internet. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.
            </p>
            <p className="mb-2">
              You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google Ads Settings</a>. Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">www.aboutads.info/choices</a>.
            </p>
            <p>
              For more information about how Google uses data, please review <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google's Privacy & Terms</a>.
            </p>
            <p className="mt-2">
              <strong>Our AdSense Publisher ID:</strong> ca-pub-9074769053982810
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>5. Cookies Policy</h2>
            <p className="mb-2">
              We use the following types of cookies:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Essential Cookies:</strong> Required for the basic functionality of our Service.</li>
              <li><strong>Analytics Cookies:</strong> Used to understand how visitors interact with our Service (e.g., Google Analytics).</li>
              <li><strong>Advertising Cookies:</strong> Used by Google AdSense and its partners to serve relevant advertisements.</li>
            </ul>
            <p className="mt-2">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some portions of our Service may not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>6. Google Analytics</h2>
            <p>
              We use Google Analytics to collect and analyze usage data. Google Analytics collects information such as how often users visit our site, what pages they visit, and what other sites they used prior to coming to our site. We use this information solely to improve our Service. Google Analytics collects only the IP address assigned to you on the date you visit our site, rather than your name or other identifying information. You can learn more about Google Analytics at <a href="https://www.google.com/analytics/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">google.com/analytics</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>7. Third-Party Services</h2>
            <p>
              We may employ third-party companies and individuals to facilitate our Service, provide the Service on our behalf, perform Service-related services, or assist us in analyzing how our Service is used. These third parties have access to your personal data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>8. Data Security</h2>
            <p>
              The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>9. Children's Privacy</h2>
            <p>
              Our Service does not address anyone under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us so that we can take necessary action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>10. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Email: privacy@sportsurge.com</li>
              <li>Website: sportsurge.com</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}