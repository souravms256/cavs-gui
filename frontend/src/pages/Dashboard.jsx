import { useState } from "react";
export default function Dashboard({ userEmail, onNavigate }){
  const [content, setContent] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = () => {
    setIsLoading(true);
    setVerificationResult(null);

    // Simulate an API call
    setTimeout(() => {
      const isVerified = Math.random() > 0.5; // 50% chance of being "verified"
      setIsLoading(false);
      setVerificationResult(isVerified);
    }, 2000); // Simulate a 2-second verification process
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 space-y-8 max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-800 text-center">
          Welcome, {userEmail}!
        </h2>
        <p className="text-gray-600 text-center">
          Paste or type content below to verify its authenticity.
        </p>

        <div className="space-y-4">
          <textarea
            className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all duration-300 resize-none"
            placeholder="Paste your text content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
          <button
            onClick={handleVerify}
            disabled={isLoading || !content.trim()}
            className="w-full py-3 px-4 rounded-md shadow-sm text-white font-bold bg-gray-800 hover:bg-gray-900 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify Content"}
          </button>
        </div>

        {verificationResult !== null && (
          <div className={`p-6 rounded-lg shadow-inner text-center ${verificationResult ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} fade-in`}>
            {verificationResult ? (
              <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <p className="text-2xl font-bold mt-2">Content Verified!</p>
                <p className="mt-1 text-sm">This content appears to be original and authentic.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
                <p className="text-2xl font-bold mt-2">Verification Failed</p>
                <p className="mt-1 text-sm">This content may be unoriginal or has been flagged for authenticity concerns.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}