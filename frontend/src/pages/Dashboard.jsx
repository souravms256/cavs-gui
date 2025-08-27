import { useState, useEffect } from "react";
import { sha256 } from "js-sha256";
import { ethers } from "ethers";

// ✅ Load contract ABI & address from .env
const contractABI = [

];
const contractAddress = ""

export default function Dashboard({ userName, onNavigate }) {
  const [newContent, setNewContent] = useState("");
  const [checkHash, setCheckHash] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkStatus, setCheckStatus] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [metamaskStatus, setMetamaskStatus] = useState("Connecting to MetaMask...");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [contentHash, setContentHash] = useState(null);

  // ✅ Connect to MetaMask on mount - Fixed for ethers v6
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window.ethereum === "undefined") {
          setMetamaskStatus("Please install MetaMask to use this application.");
          return;
        }

        // ethers v6 syntax
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);

        await web3Provider.send("eth_requestAccounts", []);
        const signer = await web3Provider.getSigner();
        setSigner(signer);

        const verificationContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(verificationContract);

        const network = await web3Provider.getNetwork();
        setMetamaskStatus(`Connected to ${network.name} (Chain ID: ${network.chainId})`);
      } catch (error) {
        setMetamaskStatus(`Failed to connect: ${error.message}`);
        console.error("MetaMask connection error:", error);
      }
    };

    init();
  }, []);

  // ✅ Verify new content
  const handleVerifyNewContent = async () => {
    setIsLoading(true);
    setVerificationResult(null);
    setVerifyStatus("loading");
    setTransactionHash(null);
    setContentHash(null);

    if (!newContent.trim()) {
      setVerifyStatus("failed");
      setIsLoading(false);
      return;
    }

    const generatedContentHash = "0x" + sha256(newContent);
    setContentHash(generatedContentHash);

    try {
      const isContentVerified = await contract.isVerified(generatedContentHash);
      if (isContentVerified) {
        setVerificationResult(true);
        setVerifyStatus("success");
        setTransactionHash("Content already verified");
      } else {
        const tx = await contract.verifyContent(generatedContentHash);
        setVerifyStatus("waiting");
        const receipt = await tx.wait();
        setVerificationResult(true);
        setVerifyStatus("success");
        setTransactionHash(receipt.hash);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult(false);
      setVerifyStatus("failed");
      setTransactionHash(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Check existing hash
  const handleCheckExistingHash = async () => {
    setIsLoading(true);
    setVerificationResult(null);
    setCheckStatus("loading");

    if (!checkHash.trim()) {
      setCheckStatus("failed");
      setIsLoading(false);
      return;
    }

    try {
      const isVerified = await contract.isVerified(checkHash);

      if (isVerified) {
        setVerificationResult(true);
        setCheckStatus("success");
      } else {
        setVerificationResult(false);
        setCheckStatus("failed");
      }
    } catch (error) {
      console.error("Checking error:", error);
      setVerificationResult(false);
      setCheckStatus("failed");
    } finally {
      setIsLoading(false);
    }
  };

  const isVerifyButtonDisabled = isLoading || !newContent.trim() || !contract;
  const isCheckButtonDisabled = isLoading || !checkHash.trim() || !contract;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 space-y-8 max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-800 text-center">
          Welcome, {userName}!
        </h2>
        <p className="text-gray-600 text-center">
          A system for transparently and immutably verifying content on the blockchain.
        </p>

        <div id="status" className="p-2 rounded-lg text-sm font-semibold text-center bg-gray-200 text-gray-700">
          {metamaskStatus}
        </div>

        {/* Verify New Content */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner border border-gray-200">
          <h3 className="text-2xl font-bold mb-4 text-gray-700">1. Verify New Content</h3>
          <textarea
            className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all duration-300 resize-none"
            placeholder="Paste your text content here..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          ></textarea>
          <button
            onClick={handleVerifyNewContent}
            disabled={isVerifyButtonDisabled}
            className="w-full mt-4 py-3 px-4 rounded-md shadow-sm text-white font-bold bg-gray-800 hover:bg-gray-900 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && verifyStatus === "loading" ? "Verifying..." : "Verify New Content"}
          </button>
          {verifyStatus && verifyStatus !== "loading" && (
            <div className={`mt-4 p-4 rounded-lg text-sm text-center font-medium fade-in ${verifyStatus === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {verifyStatus === "success" ? "Verification successful!" : "Verification failed!"}
              {verifyStatus === "success" && (
                <div className="mt-3 text-left">
                  <div className="mb-2">
                    <strong>Content Hash (use this for checking):</strong>
                    <div className="bg-white p-2 mt-1 rounded border break-all font-mono text-xs">
                      {contentHash}
                    </div>
                  </div>
                  {transactionHash && transactionHash !== "Content already verified" && (
                    <div>
                      <strong>Transaction Hash (proof of verification):</strong>
                      <div className="bg-white p-2 mt-1 rounded border break-all font-mono text-xs">
                        {transactionHash}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Check Existing Hash */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner border border-gray-200">
          <h3 className="text-2xl font-bold mb-4 text-gray-700">2. Check an Existing Hash</h3>
          <p className="text-sm text-gray-600 mb-4">
            Enter the <strong>Content Hash</strong> (not transaction hash) from a previous verification to check if content is verified.
          </p>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all duration-300"
            placeholder="Enter content hash (e.g., 0x...)"
            value={checkHash}
            onChange={(e) => setCheckHash(e.target.value)}
          />
          <button
            onClick={handleCheckExistingHash}
            disabled={isCheckButtonDisabled}
            className="w-full mt-4 py-3 px-4 rounded-md shadow-sm text-white font-bold bg-gray-800 hover:bg-gray-900 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && checkStatus === "loading" ? "Checking..." : "Check Existing Hash"}
          </button>
          {checkStatus && checkStatus !== "loading" && (
            <div className={`mt-4 p-4 rounded-lg text-sm text-center font-medium fade-in ${checkStatus === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {checkStatus === "success" ? "Content is verified on blockchain!" : "Content hash not found - not verified!"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}