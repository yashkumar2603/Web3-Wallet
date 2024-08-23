import { useState, useEffect } from 'react'
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;
import { ethers } from "ethers";
import './App.css'
import axios from 'axios';

function App() {
  const [mnemonic, setMnemonic] = useState("");
  const [ethWallets, setEthWallets] = useState<
    { address: string; publicKey: string; privateKey: string; balance: number}[]>([]);
  const [ethAccountNumber, setEthAccountNumber] = useState(0);

  const createAccount = async () => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
  };

  const createWallet = async () => {
    const API_KEY = import.meta.env.VITE_API_KEY;
    if (!mnemonic) return;

    const seed = mnemonicToSeedSync(mnemonic);
    const path = `m/44'/60'/${ethAccountNumber}'/0'`;
    const hdNode = ethers.HDNodeWallet.fromSeed(seed);
    const wallet = hdNode.derivePath(path);

    const publicKey = wallet.publicKey; // No need to encode unless necessary
    const privateKey = wallet.privateKey;

    try {
      const response = await axios.post('https://mainnet.infura.io/v3/' + API_KEY, {
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [wallet.address, "latest"],
        id: 1
      });
      const balanceHex = response.data.result;
      const balanceDecimal = parseInt(balanceHex, 16);

      setEthWallets((prevWallets) => [
        ...prevWallets,
        {
          publicKey: publicKey,
          privateKey: privateKey,
          address: wallet.address,
          balance: balanceDecimal
        },
      ]);

      setEthAccountNumber(ethAccountNumber + 1);
    } catch (error) {
      console.error('Error fetching balance:', error);
      alert('Network error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`${text.length > 40 ? 'Private' : 'Public'} key copied to clipboard!`);
  };

  const [blockNumber, setBlockNumber] = useState(0);

  // Function to fetch the current block number
  const currentBlock = async () => {
    try {
      const API_KEY = import.meta.env.VITE_API_KEY;
      const response = await axios.post('https://mainnet.infura.io/v3/' + API_KEY, {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      });
      const blockNumberHex = response.data.result;
      const blockNumberDecimal = parseInt(blockNumberHex, 16);
      setBlockNumber(blockNumberDecimal);
    } catch (error) {
      console.error('Error fetching current block number', error);
      alert('Network error');
    }
  };

  // Use useEffect to call currentBlock when the component mounts
  useEffect(() => {
    currentBlock();
  }, []);

  return (
    <>
      <div>
        <div className={"flex flex-col items-center my-16"}>
          <p className={"text-lg"}>Current Block Number on the Ethereum Network</p>
          <div className={"text-lg text-white/80 bg-purple-800/40 p-1.5 rounded-2xl"}>
            {blockNumber !== null ? (
                <p>{blockNumber}</p>
            ) : (
                <p>Loading...</p>
            )}
          </div>
        </div>
      </div>
      {!mnemonic && (
        <>
          <div className="flex flex-col gap-3">
            <button onClick={createAccount}>Create Seed Phrase</button>
            <input className="rounded flex placeholder: text-center bg-gray-800 w-full h-[2.5rem]" placeholder="Or paste seed phrase to recover" value={mnemonic} onChange={(e) => setMnemonic(e.target.value)}/>
          </div>
        </>
      )}
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
      <h1 className="text-4xl font-bold mt-6 mb-4">Walleteer</h1>
      {mnemonic && (
        <div>
            <button onClick={createWallet}>add new Wallet</button>
        </div>
      )}
      <div>
        {ethWallets.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mt-8 mb-8 text-center">Your Ethereum Wallets</h2>
              {ethWallets.map((wallet, index) => (
                  <div key={index}
                       className="mb-6 p-6 border border-gray-600 bg-gray-900 rounded-lg shadow-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400 mb-2"><strong>Address:</strong> {wallet.address}</p>
                      <p className="text-sm text-gray-400 mb-4"><strong>Public Key:</strong> {wallet.publicKey}</p>
                      <button
                          onClick={() => copyToClipboard(wallet.publicKey)}
                          className="mt-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-200"
                      >
                        Copy Public Key
                      </button>
                      <button
                          onClick={() => copyToClipboard(wallet.privateKey)}
                          className="mt-2 p-2 ml-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors duration-200"
                      >
                        Copy Private Key
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">{wallet.balance} ETH</p>
                      <p className="text-sm text-gray-400">Balance</p>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
    </>
  )
}

export default App
