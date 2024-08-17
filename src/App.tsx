import { useState } from 'react'
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { ethers } from "ethers";
import bs58 from "bs58";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [mnemonic, setMnemonic] = useState("");
  const [ethWallets, setEthWallets] = useState<
    { address: string; publicKey: string; privateKey: string }[]>([]);
  const [ethAccountNumber, setEthAccountNumber] = useState(0);

  const createAccount = async () => {
    const newMnemonic = generateMnemonic();
    //console.log(newMnemonic);
    setMnemonic(newMnemonic); 
    //console.log(mnemonic);
  };
  
  const createWallet = async () => {
    if (!mnemonic) return;
    
    const seed = mnemonicToSeedSync(mnemonic); // UInt8Array
    const path = `m/44'/60'/${ethAccountNumber}'/0'`;
    // Derive the seed from the path
    const hdNode = ethers.HDNodeWallet.fromSeed(seed);
    // Derive the wallet from the path
    const wallet = hdNode.derivePath(path);
    // Derive the public key from the wallet
    const publicKey = bs58.encode(Buffer.from(wallet.publicKey));
    const privateKey = bs58.encode(Buffer.from(wallet.privateKey));
    setEthWallets((prevWallets) => [
      ...prevWallets,
      { publicKey: publicKey, privateKey: privateKey, address: wallet.address },
    ]);
    setEthAccountNumber(() => ethAccountNumber + 1);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`${text.length > 40 ? 'Private' : 'Public'} key copied to clipboard!`);
  };

  return (
    <>
      <div>
        {!mnemonic && <button onClick={createAccount}>Create Seed Phrase</button>}
        {mnemonic && (
        <>          
          <h2 className="text-xl font-semibold mb-4">Your Mnemonic Phrase</h2>
          <div className="flex bg-ivore-100 rounded-md flex-wrap gap-2">
            {mnemonic.split(" ").map((word, index) => (
              <div className="bg-purple-800 p-2 rounded-md" key={index}>{word}</div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Keep this phrase safe and secure. Its the only way to recover your wallet.
          </p>
        </>
        )}
      </div>
      <h1 className="text-4xl font-bold mt-6 mb-4">Walleteer</h1>
      {mnemonic && (
        <div>
            <button onClick={createWallet}>add new Wallet</button>
        </div>
      )}
      <div>
        {ethWallets.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mt-8 mb-8">Your Ethereum Wallets</h2>
            {ethWallets.map((wallet, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-600 bg-black rounded">
                <p><strong>Address:</strong> {wallet.address}</p>
                <p><strong>Public Key:</strong> {wallet.publicKey}</p>
                <button
                  onClick={() => copyToClipboard(wallet.publicKey)}
                  className="mt-2 p-2 bg-blue-500 text-white rounded"
                >
                Copy Public Key
                </button>
                <button
                  onClick={() => copyToClipboard(wallet.privateKey)}
                  className="mt-2 p-2 ml-2 bg-red-600 text-white rounded"
                >
                  Copy Private Key
                </button>
              </div>
            ))}
          </div>
        )}      
      </div>
    </>
  )
}

export default App
