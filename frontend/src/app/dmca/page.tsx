import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DMCA Policy – Sportsurge Official',
  description: 'DMCA copyright infringement policy and notice procedure for Sportsurge Official.',
};

export default function DMCAPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#222226' }}>DMCA Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: May 2026</p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'rgba(34,34,38,0.7)' }}>
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>1. Copyright Notice</h2>
            <p>
              Sportsurge Official respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond expeditiously to claims of copyright infringement committed using our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>2. Reporting Copyright Infringement</h2>
            <p className="mb-2">
              If you believe that content available on our Service infringes one or more of your copyrights, please notify us by providing the following information:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A physical or electronic signature of a person authorized to act on behalf of the owner of the copyright that has been allegedly infringed</li>
              <li>Identification of works or materials being infringed, or if multiple works at a single online site are covered by a single notification, a representative list of such works at that site</li>
              <li>Identification of the specific material that is claimed to be infringing and that is to be removed or have access disabled, and information reasonably sufficient to permit the service provider to locate the material</li>
              <li>Contact information for the notifier, including address, telephone number, and email address</li>
              <li>A statement that the notifier has a good faith belief that the material is not authorized by the copyright owner, its agent, or the law</li>
              <li>A statement made under penalty of perjury that the information provided in the notification is accurate and that the notifying party is authorized to make the complaint on behalf of the copyright owner</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>3. How to Submit a DMCA Notice</h2>
            <p>
              Please send all DMCA notices to our designated copyright agent:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Email: dmca@sportsurge.com</li>
              <li>Subject line: "DMCA Copyright Infringement Notice"</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>4. Counter-Notification</h2>
            <p>
              If you believe that your content was removed in error, you may submit a counter-notification. To be effective, a counter-notification must be a written communication provided to our copyright agent that includes substantially the following:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>A physical or electronic signature of the subscriber</li>
              <li>Identification of the material that has been removed or to which access has been disabled and the location at which the material appeared before it was removed or access to it was disabled</li>
              <li>A statement under penalty of perjury that the subscriber has a good faith belief that the material was removed or disabled as a result of mistake or misidentification</li>
              <li>The subscriber's name, address, telephone number, and a statement that the subscriber consents to the jurisdiction of the Federal District Court for the judicial district in which the address is located</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>5. Repeat Infringers</h2>
            <p>
              In accordance with the DMCA and other applicable law, Sportsurge Official has adopted a policy of terminating, in appropriate circumstances and at our sole discretion, subscribers or account holders who are deemed to be repeat infringers. We may also, at our sole discretion, limit access to our Service and/or terminate the accounts of any users who infringe any intellectual property rights of others, whether or not there is any repeat infringement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#222226' }}>6. Contact Us</h2>
            <p>
              If you have any questions about this DMCA Policy, please contact us at:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Email: dmca@sportsurge.com</li>
              <li>Website: sportsurge.com</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}