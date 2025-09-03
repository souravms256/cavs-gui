import { useState, useEffect } from "react";
import { sha256 } from "js-sha256";
import { ethers } from "ethers";
import { FileText, File, CheckCircle, XCircle } from "lucide-react"; // icons

const contractABI = [];
const contractAddress = "";

export default function Dashboard({ userName }) {
  const [mode, setMode] = useState("text"); // "text" | "file" | "hash"
  const [newContent, setNewContent] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metamaskStatus, setMetamaskStatus] = useState("Connecting to MetaMask...");
  const [contract, setContract] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [contentHash, setContentHash] = useState(null);
  const [hashToVerify, setHashToVerify] = useState(""); // NEW: for verifying existing hash
  const [hashCheckResult, setHashCheckResult] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          setMetamaskStatus("Please install MetaMask to use this application.");
          return;
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        setContract(new ethers.Contract(contractAddress, contractABI, signer));
        const network = await provider.getNetwork();
        setMetamaskStatus(`Connected to ${network.name} (Chain ID: ${network.chainId})`);
      } catch (error) {
        setMetamaskStatus(`Failed to connect: ${error.message}`);
        console.error("MetaMask error:", error);
      }
    };
    init();
  }, []);

  const generateBytes32Hash = (hexString) => ethers.zeroPadValue(hexString, 32);

  // Verify Text
  const handleVerifyNewContent = async () => {
    if (!newContent.trim()) return;
    setIsLoading(true);
    try {
      const hash = generateBytes32Hash("0x" + sha256(newContent));
      setContentHash(hash);
      const already = await contract.isVerified(hash);
      if (already) {
        setVerificationResult("success");
        setTransactionHash("Content already verified");
      } else {
        const tx = await contract.verifyContent(hash);
        const receipt = await tx.wait();
        setVerificationResult("success");
        setTransactionHash(receipt.hash);
      }
    } catch (err) {
      console.error(err);
      setVerificationResult("failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify File
  const handleVerifyFile = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = new Uint8Array(e.target.result);
        let hex = "";
        fileData.forEach((b) => (hex += b.toString(16).padStart(2, "0")));
        const hash = generateBytes32Hash("0x" + sha256(hex));
        setContentHash(hash);
        const already = await contract.isVerified(hash);
        if (already) {
          setVerificationResult("success");
          setTransactionHash("File already verified");
        } else {
          const tx = await contract.verifyContent(hash);
          const receipt = await tx.wait();
          setVerificationResult("success");
          setTransactionHash(receipt.hash);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setVerificationResult("failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Existing Hash
  const handleVerifyHash = async () => {
    if (!hashToVerify.trim()) return;
    setIsLoading(true);
    try {
      const already = await contract.isVerified(hashToVerify.trim());
      setHashCheckResult(already);
    } catch (err) {
      console.error("Hash verify failed:", err);
      setHashCheckResult("error");
    } finally {
      setIsLoading(false);
    }
  };

  // File Preview
  const handleFileChange = (f) => {
    setFile(f);
    if (f && f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files[0]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 space-y-8 max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-800 text-center">
          Welcome, {userName}!
        </h2>
        <p className="text-gray-600 text-center">
          A system for transparently and immutably verifying content on the blockchain.
        </p>

        {/* MetaMask Status */}
        <div className="p-2 rounded-lg text-sm font-semibold text-center bg-gray-200 text-gray-700">
          {metamaskStatus}
        </div>

        {/* Toggle */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => setMode("text")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              mode === "text" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Verify Text
          </button>
          <button
            onClick={() => setMode("file")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              mode === "file" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Verify File
          </button>
          <button
            onClick={() => setMode("hash")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              mode === "hash" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Verify Hash
          </button>
        </div>

        {/* Content Section */}
        {mode === "text" && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-inner border border-gray-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-700">Enter Text Content</h3>
            <textarea
              className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none"
              placeholder="Paste your text content here..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            ></textarea>
            <button
              onClick={handleVerifyNewContent}
              disabled={!newContent.trim() || !contract}
              className="w-full mt-4 py-3 px-4 rounded-md font-bold text-white bg-gray-800 hover:bg-gray-900 disabled:opacity-50"
            >
              Verify Text Content
            </button>

            {verificationResult && (
              <div
                className={`mt-4 p-4 rounded-lg text-sm text-center font-medium ${
                  verificationResult === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {verificationResult === "success"
                  ? "Verification successful!"
                  : "Verification failed!"}
                {contentHash && (
                  <div className="mt-3 text-left">
                    <strong>Content Hash:</strong>
                    <div className="bg-white p-2 mt-1 rounded border break-all font-mono text-xs">
                      {contentHash}
                    </div>
                  </div>
                )}
                {transactionHash && (
                  <div className="mt-2 text-left">
                    <strong>Transaction Hash:</strong>
                    <div className="bg-white p-2 mt-1 rounded border break-all font-mono text-xs">
                      {transactionHash}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === "file" && (
          <div
            className="bg-gray-50 p-6 rounded-lg shadow-inner border border-gray-200"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <h3 className="text-2xl font-bold mb-4 text-gray-700">Upload a File</h3>
            <div
              className="w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-gray-100"
              onClick={() => document.getElementById("fileInput").click()}
            >
              {file ? (
                previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mx-auto max-h-40 object-contain rounded-md"
                  />
                ) : file.type === "application/pdf" ? (
                  <div className="flex items-center justify-center space-x-2 text-gray-700">
                    <FileText className="w-6 h-6" /> <span>{file.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 text-gray-700">
                    <File className="w-6 h-6" /> <span>{file.name}</span>
                  </div>
                )
              ) : (
                <p className="text-gray-500">Drag & drop a file here, or click to select</p>
              )}
            </div>
            <input
              type="file"
              id="fileInput"
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="hidden"
            />
            <button
              onClick={handleVerifyFile}
              disabled={!file || !contract}
              className="w-full mt-4 py-3 px-4 rounded-md font-bold text-white bg-gray-800 hover:bg-gray-900 disabled:opacity-50"
            >
              Verify File
            </button>

            {verificationResult && (
              <div
                className={`mt-4 p-4 rounded-lg text-sm text-center font-medium ${
                  verificationResult === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {verificationResult === "success"
                  ? "Verification successful!"
                  : "Verification failed!"}
                {contentHash && (
                  <div className="mt-3 text-left">
                    <strong>Content Hash:</strong>
                    <div className="bg-white p-2 mt-1 rounded border break-all font-mono text-xs">
                      {contentHash}
                    </div>
                  </div>
                )}
                {transactionHash && (
                  <div className="mt-2 text-left">
                    <strong>Transaction Hash:</strong>
                    <div className="bg-white p-2 mt-1 rounded border break-all font-mono text-xs">
                      {transactionHash}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === "hash" && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-inner border border-gray-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-700">Verify Existing Hash</h3>
            <input
              type="text"
              placeholder="Enter content hash (0x...)"
              value={hashToVerify}
              onChange={(e) => setHashToVerify(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
            />
            <button
              onClick={handleVerifyHash}
              disabled={!hashToVerify.trim() || !contract}
              className="w-full mt-4 py-3 px-4 rounded-md font-bold text-white bg-gray-800 hover:bg-gray-900 disabled:opacity-50"
            >
              Check Hash
            </button>

            {hashCheckResult !== null && (
              <div
                className={`mt-4 p-4 rounded-lg text-sm text-center font-medium ${
                  hashCheckResult === true
                    ? "bg-green-100 text-green-800"
                    : hashCheckResult === false
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {hashCheckResult === true && (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-5 h-5" /> <span>This hash is verified!</span>
                  </div>
                )}
                {hashCheckResult === false && (
                  <div className="flex items-center justify-center space-x-2">
                    <XCircle className="w-5 h-5" /> <span>Not verified on-chain</span>
                  </div>
                )}
                {hashCheckResult === "error" && (
                  <span>⚠️ Error checking the hash</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
