import { useState, useEffect } from "react";
import { sha256 } from "js-sha256";
import { ethers } from "ethers";
import { FileText, File, CheckCircle, XCircle, History, Upload } from "lucide-react";

const contractABI = [];

// Contract deployed on Ganache
const contractAddress = "";

// IPFS Configuration - Choose your service
const IPFS_SERVICES = {
  PINATA: {
    name: "Pinata",
    endpoint: "https://api.pinata.cloud/pinning/pinFileToIPFS",
    gateway: "https://gateway.pinata.cloud/ipfs/",
    headers: {
      'pinata_api_key': '',
      'pinata_secret_api_key': ''
    }
  },
  WEB3_STORAGE: {
    name: "Web3.Storage",
    endpoint: "https://api.web3.storage/upload",
    gateway: "https://w3s.link/ipfs/",
    headers: {
      'Authorization': 'Bearer your_web3_storage_token_here'
    }
  },
  LOCAL_IPFS: {
    name: "Local IPFS",
    endpoint: "http://127.0.0.1:5001/api/v0/add",
    gateway: "http://127.0.0.1:8080/ipfs/",
    headers: {}
  },
  NFT_STORAGE: {
    name: "NFT.Storage",
    endpoint: "https://api.nft.storage/upload",
    gateway: "https://nftstorage.link/ipfs/",
    headers: {
      'Authorization': 'Bearer your_nft_storage_token_here'
    }
  }
};

// Change this to switch between services
const CURRENT_IPFS_SERVICE = 'PINATA'; // Change to PINATA, WEB3_STORAGE, or NFT_STORAGE

export default function Dashboard({ userName = "User" }) {
  const [mode, setMode] = useState("text");
  const [newContent, setNewContent] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metamaskStatus, setMetamaskStatus] = useState("Connecting to MetaMask...");
  const [contract, setContract] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [contentHash, setContentHash] = useState(null);
  const [ipfsCid, setIpfsCid] = useState(null);
  const [hashToVerify, setHashToVerify] = useState("");
  const [hashCheckResult, setHashCheckResult] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");

  // Initialize connection to Ganache
  useEffect(() => {
    const initGanache = async () => {
      try {
        if (!window.ethereum) {
          setMetamaskStatus("❌ Please install MetaMask to use this application.");
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);

        // Add Ganache network to MetaMask if not present
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }], // 1337 in hex
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x539',
                  chainName: 'Ganache Local Testnet',
                  rpcUrls: ['http://127.0.0.1:7545'],
                  nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                  }
                }]
              });
            } catch (addError) {
              console.error('Failed to add Ganache network:', addError);
              setMetamaskStatus("❌ Failed to add Ganache network to MetaMask");
              return;
            }
          }
        }

        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const account = await signer.getAddress();
        setCurrentAccount(account);
        
        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(contractInstance);
        
        const network = await provider.getNetwork();
        setMetamaskStatus(`✅ Connected to Ganache (Chain ID: ${network.chainId}) | Account: ${account.slice(0,6)}...${account.slice(-4)}`);
        
      } catch (error) {
        setMetamaskStatus(`❌ Connection failed: ${error.message}`);
        console.error("Ganache connection error:", error);
      }
    };

    initGanache();
  }, []);

  // Cleanup preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const generateBytes32Hash = (hexString) => ethers.zeroPadValue(hexString, 32);

  // Generic IPFS upload function
  const uploadToIPFS = async (content, isFile = false) => {
    const service = IPFS_SERVICES[CURRENT_IPFS_SERVICE];
    setUploadProgress(`📤 Uploading to ${service.name}...`);
    
    try {
      let response;
      
      switch(CURRENT_IPFS_SERVICE) {
        case 'PINATA':
          response = await uploadToPinata(content, isFile, service);
          break;
        case 'WEB3_STORAGE':
          response = await uploadToWeb3Storage(content, isFile, service);
          break;
        case 'LOCAL_IPFS':
          response = await uploadToLocalIPFS(content, isFile, service);
          break;
        case 'NFT_STORAGE':
          response = await uploadToNFTStorage(content, isFile, service);
          break;
        default:
          throw new Error(`Unsupported IPFS service: ${CURRENT_IPFS_SERVICE}`);
      }
      
      setUploadProgress("✅ Upload successful!");
      return response;
    } catch (error) {
      setUploadProgress(`❌ Upload failed: ${error.message}`);
      console.error("IPFS upload error:", error);
      throw error;
    }
  };

  const uploadToPinata = async (content, isFile, service) => {
    const formData = new FormData();
    
    if (isFile) {
      formData.append('file', content);
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      formData.append('file', blob, 'content.txt');
    }

    const response = await fetch(service.endpoint, {
      method: 'POST',
      headers: service.headers,
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  };

  const uploadToWeb3Storage = async (content, isFile, service) => {
    let fileToUpload;
    
    if (isFile) {
      fileToUpload = content;
    } else {
      fileToUpload = new File([content], 'content.txt', { type: 'text/plain' });
    }

    const response = await fetch(service.endpoint, {
      method: 'POST',
      headers: {
        ...service.headers,
        'X-NAME': fileToUpload.name
      },
      body: fileToUpload
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Web3.Storage error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.cid;
  };

  const uploadToLocalIPFS = async (content, isFile, service) => {
    const formData = new FormData();
    
    if (isFile) {
      formData.append('file', content);
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      formData.append('file', blob);
    }

    const response = await fetch(service.endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local IPFS error: ${response.status} ${response.statusText} - ${errorText}. Make sure IPFS daemon is running!`);
    }

    const result = await response.json();
    return result.Hash;
  };

  const uploadToNFTStorage = async (content, isFile, service) => {
    let fileToUpload;
    
    if (isFile) {
      fileToUpload = content;
    } else {
      fileToUpload = new File([content], 'content.txt', { type: 'text/plain' });
    }

    const response = await fetch(service.endpoint, {
      method: 'POST',
      headers: service.headers,
      body: fileToUpload
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NFT.Storage error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.value.cid;
  };

  // Verify text content
  const handleVerifyNewContent = async () => {
    if (!newContent.trim()) return;
    setIsLoading(true);
    setVerificationResult(null);
    setContentHash(null);
    setIpfsCid(null);
    setTransactionHash(null);

    try {
      // 1. Upload to IPFS
      const cid = await uploadToIPFS(newContent, false);
      setIpfsCid(cid);
      
      // 2. Generate content hash
      const hash = generateBytes32Hash("0x" + sha256(newContent));
      setContentHash(hash);
      
      setUploadProgress("🔗 Verifying on blockchain...");
      
      // 3. Check if already verified
      const alreadyVerified = await contract.isVerified(hash);
      
      if (alreadyVerified) {
        setVerificationResult("success");
        setTransactionHash("Content already verified on blockchain");
      } else {
        // 4. Verify on blockchain
        const tx = await contract.verifyContent(hash, cid);
        setUploadProgress("⏳ Waiting for transaction confirmation...");
        
        const receipt = await tx.wait();
        setVerificationResult("success");
        setTransactionHash(receipt.hash);
      }
      
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult("failed");
    } finally {
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  // Verify file content
  const handleVerifyFile = async () => {
    if (!file) return;
    setIsLoading(true);
    setVerificationResult(null);
    setContentHash(null);
    setIpfsCid(null);
    setTransactionHash(null);

    try {
      // 1. Upload file to IPFS
      const cid = await uploadToIPFS(file, true);
      setIpfsCid(cid);
      
      // 2. Generate hash from file content
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileData = new Uint8Array(e.target.result);
          let hex = "";
          fileData.forEach((b) => (hex += b.toString(16).padStart(2, "0")));
          const hash = generateBytes32Hash("0x" + sha256(hex));
          setContentHash(hash);
          
          setUploadProgress("🔗 Verifying on blockchain...");
          
          // 3. Check if already verified
          const alreadyVerified = await contract.isVerified(hash);
          
          if (alreadyVerified) {
            setVerificationResult("success");
            setTransactionHash("File already verified on blockchain");
          } else {
            // 4. Verify on blockchain
            const tx = await contract.verifyContent(hash, cid);
            setUploadProgress("⏳ Waiting for transaction confirmation...");
            
            const receipt = await tx.wait();
            setVerificationResult("success");
            setTransactionHash(receipt.hash);
          }
        } catch (error) {
          console.error("File verification error:", error);
          setVerificationResult("failed");
        } finally {
          setIsLoading(false);
          setUploadProgress("");
        }
      };
      
      reader.onerror = (error) => {
        console.error("File reading error:", error);
        setVerificationResult("failed");
        setIsLoading(false);
        setUploadProgress("");
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      console.error("File upload error:", error);
      setVerificationResult("failed");
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  // Verify existing hash
  const handleVerifyHash = async () => {
    if (!hashToVerify.trim() || !contract) return;
    setIsLoading(true);
    setHashCheckResult(null);
    
    try {
      // Validate hash format
      if (!hashToVerify.startsWith('0x') || hashToVerify.length !== 66) {
        throw new Error("Invalid hash format. Hash should be 32 bytes in hex format (0x...)");
      }
      
      const isVerified = await contract.isVerified(hashToVerify.trim());
      setHashCheckResult(isVerified);
    } catch (error) {
      console.error("Hash verification error:", error);
      setHashCheckResult("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Load user history
  const loadUserHistory = async () => {
    if (!contract || !currentAccount) return;
    setIsLoading(true);
    
    try {
      const history = await contract.getUserHistory(currentAccount);
      setUserHistory(history);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // File handling
  const handleFileChange = (selectedFile) => {
    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setFile(selectedFile);
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const currentService = IPFS_SERVICES[CURRENT_IPFS_SERVICE];

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="bg-white p-8 rounded-lg shadow-2xl border-2 border-black space-y-8 max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center space-y-4 border-b-2 border-black pb-6">
          <h1 className="text-4xl font-bold text-black">
            Welcome, <span className="underline">{userName}</span>! 👋
          </h1>
          <p className="text-gray-700 text-lg font-medium">
            Decentralized Content Verification System
          </p>
          <p className="text-sm text-gray-600">
            📡 Ganache Testnet + 🌐 {currentService.name} IPFS
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-gray-100 p-4 rounded border-2 border-gray-400">
          <p className="text-sm font-medium text-black">{metamaskStatus}</p>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="bg-gray-100 border-2 border-gray-400 p-4 rounded">
            <div className="flex items-center">
              <Upload className="w-5 h-5 text-black mr-2 animate-pulse" />
              <p className="text-black font-medium">{uploadProgress}</p>
            </div>
          </div>
        )}

        {/* Mode Selection */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { key: "text", label: "📝 Verify Text" },
            { key: "file", label: "📁 Verify File" },
            { key: "hash", label: "🔍 Check Hash" },
            { key: "history", label: "📊 History" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setMode(key);
                if (key === "history") loadUserHistory();
              }}
              className={`px-6 py-3 rounded border-2 font-bold transition-all ${
                mode === key 
                  ? "bg-black text-white border-black shadow-lg" 
                  : "bg-white text-black border-gray-400 hover:border-black hover:bg-gray-100"
              }`}
            >
              {key === "history" && <History className="w-4 h-4 inline mr-2" />}
              {label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {mode === "text" && (
          <div className="bg-white p-8 rounded border-2 border-black">
            <h3 className="text-2xl font-bold mb-6 text-black">📝 Enter Text Content</h3>
            <textarea
              className="w-full h-48 p-4 border-2 border-gray-400 rounded resize-none focus:border-black focus:outline-none"
              placeholder="Enter your text content here to verify its authenticity..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <button
              onClick={handleVerifyNewContent}
              disabled={!newContent.trim() || !contract || isLoading}
              className="w-full mt-6 py-4 px-6 rounded border-2 font-bold text-white bg-black border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "🔄 Processing..." : "🚀 Upload to IPFS & Verify on Blockchain"}
            </button>

            {verificationResult && (
              <div className={`mt-6 p-6 rounded border-2 ${
                verificationResult === "success" 
                  ? "bg-white border-black" 
                  : "bg-gray-100 border-black"
              }`}>
                <div className="text-center mb-4">
                  {verificationResult === "success" ? (
                    <CheckCircle className="w-12 h-12 text-black mx-auto mb-2" />
                  ) : (
                    <XCircle className="w-12 h-12 text-black mx-auto mb-2" />
                  )}
                  <h4 className="text-lg font-bold text-black">
                    {verificationResult === "success" ? "✅ Verification Successful!" : "❌ Verification Failed!"}
                  </h4>
                </div>

                {ipfsCid && (
                  <div className="space-y-3">
                    <div>
                      <strong className="text-black">🌐 IPFS CID:</strong>
                      <div className="bg-gray-100 p-3 mt-2 rounded border border-gray-400 font-mono text-sm break-all">
                        {ipfsCid}
                      </div>
                      <a
                        href={`${currentService.gateway}${ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 px-4 py-2 bg-black text-white rounded border-2 border-black hover:bg-gray-800 text-sm font-medium"
                      >
                        🔗 View on IPFS
                      </a>
                    </div>
                    
                    {contentHash && (
                      <div>
                        <strong className="text-black">🔐 Content Hash:</strong>
                        <div className="bg-gray-100 p-3 mt-2 rounded border border-gray-400 font-mono text-sm break-all">
                          {contentHash}
                        </div>
                      </div>
                    )}
                    
                    {transactionHash && (
                      <div>
                        <strong className="text-black">📋 Transaction:</strong>
                        <div className="bg-gray-100 p-3 mt-2 rounded border border-gray-400 font-mono text-sm break-all">
                          {transactionHash}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === "file" && (
          <div 
            className="bg-white p-8 rounded border-2 border-black"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <h3 className="text-2xl font-bold mb-6 text-black">📁 Upload a File</h3>
            
            <div
              className="w-full p-8 border-2 border-dashed border-gray-400 rounded text-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all"
              onClick={() => document.getElementById("fileInput").click()}
            >
              {file ? (
                <div className="space-y-4">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mx-auto max-h-48 object-contain rounded border-2 border-gray-400"
                    />
                  ) : (
                    <div className="flex items-center justify-center space-x-3 text-black">
                      {file.type === "application/pdf" ? (
                        <FileText className="w-12 h-12 text-black" />
                      ) : (
                        <File className="w-12 h-12 text-black" />
                      )}
                      <div>
                        <p className="font-bold text-black">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12">
                  <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-700 text-lg">
                    Drag & drop a file here, or <span className="text-black font-bold underline">click to select</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Supports images, documents, and more
                  </p>
                </div>
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
              disabled={!file || !contract || isLoading}
              className="w-full mt-6 py-4 px-6 rounded border-2 font-bold text-white bg-black border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "🔄 Processing..." : "🚀 Upload to IPFS & Verify on Blockchain"}
            </button>

            {verificationResult && (
              <div className={`mt-6 p-6 rounded border-2 ${
                verificationResult === "success" 
                  ? "bg-white border-black" 
                  : "bg-gray-100 border-black"
              }`}>
                <div className="text-center mb-4">
                  {verificationResult === "success" ? (
                    <CheckCircle className="w-12 h-12 text-black mx-auto mb-2" />
                  ) : (
                    <XCircle className="w-12 h-12 text-black mx-auto mb-2" />
                  )}
                  <h4 className="text-lg font-bold text-black">
                    {verificationResult === "success" ? "✅ File Verification Successful!" : "❌ File Verification Failed!"}
                  </h4>
                </div>

                {ipfsCid && (
                  <div className="space-y-3">
                    <div>
                      <strong className="text-black">🌐 IPFS CID:</strong>
                      <div className="bg-gray-100 p-3 mt-2 rounded border border-gray-400 font-mono text-sm break-all">
                        {ipfsCid}
                      </div>
                      <a
                        href={`${currentService.gateway}${ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 px-4 py-2 bg-black text-white rounded border-2 border-black hover:bg-gray-800 text-sm font-medium"
                      >
                        🔗 View on IPFS
                      </a>
                    </div>
                    
                    {contentHash && (
                      <div>
                        <strong className="text-black">🔐 Content Hash:</strong>
                        <div className="bg-gray-100 p-3 mt-2 rounded border border-gray-400 font-mono text-sm break-all">
                          {contentHash}
                        </div>
                      </div>
                    )}
                    
                    {transactionHash && (
                      <div>
                        <strong className="text-black">📋 Transaction:</strong>
                        <div className="bg-gray-100 p-3 mt-2 rounded border border-gray-400 font-mono text-sm break-all">
                          {transactionHash}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === "hash" && (
          <div className="bg-white p-8 rounded border-2 border-black">
            <h3 className="text-2xl font-bold mb-6 text-black">🔍 Verify Existing Hash</h3>
            
            <input
              type="text"
              placeholder="Enter content hash (0x...)"
              value={hashToVerify}
              onChange={(e) => setHashToVerify(e.target.value)}
              className="w-full p-4 border-2 border-gray-400 rounded font-mono text-sm focus:border-black focus:outline-none"
            />
            
            <button
              onClick={handleVerifyHash}
              disabled={!hashToVerify.trim() || !contract || isLoading}
              className="w-full mt-6 py-4 px-6 rounded border-2 font-bold text-white bg-black border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "🔄 Checking..." : "🔍 Check Hash on Blockchain"}
            </button>

            {hashCheckResult !== null && (
              <div className={`mt-6 p-6 rounded border-2 text-center ${
                hashCheckResult === true
                  ? "bg-white border-black"
                  : hashCheckResult === false
                  ? "bg-gray-100 border-black"
                  : "bg-gray-200 border-black"
              }`}>
                <div className="mb-4">
                  {hashCheckResult === true ? (
                    <CheckCircle className="w-12 h-12 text-black mx-auto mb-2" />
                  ) : hashCheckResult === false ? (
                    <XCircle className="w-12 h-12 text-black mx-auto mb-2" />
                  ) : (
                    <XCircle className="w-12 h-12 text-black mx-auto mb-2" />
                  )}
                  <h4 className="text-lg font-bold text-black">
                    {hashCheckResult === true 
                      ? "✅ Hash is Verified!" 
                      : hashCheckResult === false 
                      ? "❌ Hash Not Found" 
                      : "⚠️ Verification Error"}
                  </h4>
                  <p className="text-sm mt-2 text-gray-700">
                    {hashCheckResult === true 
                      ? "This content hash exists on the blockchain and has been verified." 
                      : hashCheckResult === false 
                      ? "This content hash has not been verified on the blockchain." 
                      : "An error occurred while checking the hash. Please check the format and try again."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "history" && (
          <div className="bg-white p-8 rounded border-2 border-black">
            <h3 className="text-2xl font-bold mb-6 text-black">📊 Your Verification History</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto"></div>
                <p className="mt-4 text-gray-700 font-medium">Loading history...</p>
              </div>
            ) : userHistory.length > 0 ? (
              <div className="space-y-4">
                {userHistory.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded border-2 border-gray-400">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-bold text-black mb-2">Content Hash</h4>
                        <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded border border-gray-300">
                          {item.contentHash}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-bold text-black mb-2">IPFS CID</h4>
                        <div className="space-y-2">
                          <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded border border-gray-300">
                            {item.ipfsCid}
                          </p>
                          <a
                            href={`${currentService.gateway}${item.ipfsCid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 font-medium border border-black"
                          >
                            🔗 View on IPFS
                          </a>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-black mb-2">Verified At</h4>
                        <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded border border-gray-300">
                          {formatTimestamp(item.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-700 text-lg font-medium">No verification history found</p>
                <p className="text-gray-600 text-sm mt-2">
                  Start verifying content to build your history!
                </p>
              </div>
            )}
            
            <button
              onClick={loadUserHistory}
              disabled={!contract || !currentAccount || isLoading}
              className="w-full mt-6 py-3 px-6 rounded border-2 font-bold text-black border-black bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              🔄 Refresh History
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm border-t-2 border-black pt-6">
          <p className="font-medium">
            🔐 Powered by Ethereum Smart Contracts & IPFS | 
            🌐 Network: Ganache Testnet | 
            📦 Storage: {currentService.name}
          </p>
        </div>
      </div>
    </div>
  );
}