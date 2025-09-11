import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";

export default function TermsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="mb-4"
            data-testid="button-back"
          >
            ← Back to Home
          </Button>
        </div>

        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
          <p className="text-gray-600 mb-8">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">Important Notice</h2>
            <p className="text-blue-700">
              ClassStore is a student-to-student marketplace operated within our school premises. 
              By using our service, you acknowledge that this is a voluntary business platform and 
              you are not being forced to make any purchases.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Service Overview</h2>
            <p className="text-gray-700 mb-4">
              ClassStore provides a platform for students within our school to buy and sell 
              pre-owned educational materials, books, supplies, and other school-related items. 
              Our service facilitates connections between student buyers and sellers within the 
              school community.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Platform exclusively for current students of our school</li>
              <li>Focus on educational materials and school supplies</li>
              <li>Pre-owned and used items only</li>
              <li>Face-to-face transactions within school premises</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility and Access</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-semibold">
                This service is EXCLUSIVELY available to enrolled students of our school.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Valid student enrollment required</li>
              <li>Student ID verification may be requested</li>
              <li>Service restricted to school premises only</li>
              <li>No external parties or non-students permitted</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Payment Terms</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-800 mb-2">Cash on Delivery (COD) Only</h3>
              <p className="text-green-700">
                All transactions must be completed with cash payment at the time of item collection.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Payment in cash only - no digital payments, checks, or credit</li>
              <li>Payment due upon item collection</li>
              <li>Exact change preferred to avoid complications</li>
              <li>No advance payments or deposits required</li>
              <li>Face-to-face payment verification required</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Collection and Delivery</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>All items must be collected in person on school premises</li>
              <li>Pickup locations limited to: Main Gate, Library, Cafeteria, Sports Ground, or Parking Area</li>
              <li>Collection during school hours or approved time slots only</li>
              <li>Buyer and seller must meet face-to-face for transaction completion</li>
              <li>No postal delivery or external location pickups</li>
              <li>Items not collected within 7 days may be relisted</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. No Return Policy</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-red-800 mb-2">STRICTLY NO RETURNS</h3>
              <p className="text-red-700">
                All sales are final. No returns, refunds, or exchanges are accepted under any circumstances.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>All purchases are final upon payment and collection</li>
              <li>No refunds for any reason including damage, defects, or dissatisfaction</li>
              <li>No exchanges or store credit available</li>
              <li>Buyers responsible for inspecting items before purchase</li>
              <li>Sellers encouraged to provide accurate descriptions and photos</li>
              <li>Platform not responsible for item quality or condition disputes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Item Condition and Quality</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>All items are pre-owned and sold "as-is"</li>
              <li>Sellers must provide honest descriptions of item condition</li>
              <li>Buyers advised to inspect items thoroughly before purchase</li>
              <li>Minor wear and tear expected on used items</li>
              <li>No warranties or guarantees on item functionality or condition</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Seller Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide accurate item descriptions and photographs</li>
              <li>Respond promptly to buyer inquiries</li>
              <li>Meet buyers at agreed pickup locations and times</li>
              <li>Ensure items are in described condition</li>
              <li>Handle own items until successful sale completion</li>
              <li>Remove listings promptly when items are sold</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Buyer Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Inspect items carefully before committing to purchase</li>
              <li>Bring exact change for smooth transactions</li>
              <li>Arrive punctually at agreed pickup times</li>
              <li>Respect seller's time and availability</li>
              <li>Communicate clearly about pickup arrangements</li>
              <li>Accept item condition as described and shown</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Prohibited Items</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Damaged or unsafe items</li>
              <li>Counterfeit or pirated materials</li>
              <li>Items violating school policies</li>
              <li>Personal items not related to education</li>
              <li>Items belonging to the school or requiring return</li>
              <li>Expired or outdated materials with no educational value</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Platform Limitations</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-gray-700">
                ClassStore serves as a connection platform only. We do not guarantee transactions, 
                item quality, or resolve disputes between users.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Platform facilitates connections only, not transactions</li>
              <li>No guarantees on item availability or quality</li>
              <li>Users responsible for their own safety during meetings</li>
              <li>Platform not liable for transaction disputes</li>
              <li>No customer service for completed transactions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Privacy and Data</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Contact information shared only with connected buyers/sellers</li>
              <li>No personal data shared with external parties</li>
              <li>Users responsible for protecting their own privacy</li>
              <li>Platform may retain transaction records for school purposes</li>
              <li>Students may request data removal upon graduation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Voluntary Participation</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-700">
                <strong>Important:</strong> Participation in ClassStore is entirely voluntary. 
                No student is required or pressured to buy or sell items through this platform.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>No obligation to participate in the marketplace</li>
              <li>No pressure to make purchases or sales</li>
              <li>Students may discontinue use at any time</li>
              <li>Alternative sources for school materials remain available</li>
              <li>Platform operates as an optional convenience service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Safety Guidelines</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Always meet in public areas within school premises</li>
              <li>Inform friends or classmates about your transactions</li>
              <li>Meet during school hours when possible</li>
              <li>Trust your instincts - don't proceed if uncomfortable</li>
              <li>Report any concerning behavior to school authorities</li>
              <li>Verify student identity when meeting new sellers/buyers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Terms may be updated to reflect policy changes</li>
              <li>Users will be notified of significant changes</li>
              <li>Continued use constitutes acceptance of updated terms</li>
              <li>Major changes will include effective date notifications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact and Support</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 mb-2">
                For questions about these terms or platform issues:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Contact school administration</li>
                <li>Speak with the student activities coordinator</li>
                <li>Email the school's student services department</li>
              </ul>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-12">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Acknowledgment</h3>
              <p className="text-green-700">
                By using ClassStore, you acknowledge that you have read, understood, and agree to 
                these Terms and Conditions. You confirm that you are a current student of the school, 
                understand the no-return policy, accept cash-only payment terms, and agree to 
                face-to-face transactions within school premises.
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button 
              onClick={() => setLocation("/")}
              className="bg-black text-white hover:bg-gray-800 px-8 py-3"
              data-testid="button-back-to-home"
            >
              Back to ClassStore
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}