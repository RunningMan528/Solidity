'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    const sepoliaChainId = '0xaa36a7'; // 11155111 in hex
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sepoliaChainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: sepoliaChainId,
                chainName: 'Sepolia',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/demo'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const initProvider = new ethers.BrowserProvider(window.ethereum);
      
      initProvider.getNetwork().then(async (network) => {
        const chainIdNumber = Number(network.chainId);
        setChainId(chainIdNumber);
        
        const expectedChainId = BigInt(11155111); // Sepolia
        if (network.chainId !== expectedChainId) {
          console.log(`⚠️ Current network: ${network.chainId} (${network.name}), expected: ${expectedChainId} (Sepolia)`);
          try {
            await switchToSepolia();
            if (!window.ethereum) return;
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            const newNetwork = await newProvider.getNetwork();
            setChainId(Number(newNetwork.chainId));
            setProvider(newProvider);
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
              const newSigner = await newProvider.getSigner();
              setSigner(newSigner);
              setAccount(accounts[0]);
            }
            return;
          } catch (error) {
            console.error('❌ Failed to switch network:', error);
          }
        }
        
        setProvider(initProvider);

        if (window.ethereum) {
          window.ethereum
            .request({ method: 'eth_accounts' })
            .then((accounts: string[]) => {
              if (accounts.length > 0) {
                handleAccountsChanged(accounts);
              }
            });
        }
      });

      if (window.ethereum && window.ethereum.on) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', async () => {
          if (!window.ethereum) return;
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          const network = await newProvider.getNetwork();
          const chainIdNumber = Number(network.chainId);
          setChainId(chainIdNumber);
          console.log('✅ New network:', { chainId: chainIdNumber, name: network.name });
          setProvider(newProvider);
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const newSigner = await newProvider.getSigner();
            setSigner(newSigner);
            setAccount(accounts[0]);
          } else {
            setAccount(null);
            setSigner(null);
          }
        });
      }
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
      setSigner(null);
    } else {
      const newAccount = accounts[0];
      setAccount(newAccount);
      
      if (window.ethereum) {
        try {
          const currentProvider = new ethers.BrowserProvider(window.ethereum);
          const newSigner = await currentProvider.getSigner();
          setSigner(newSigner);
          setProvider(currentProvider);
        } catch (error) {
          console.error('Failed to get signer after account change:', error);
        }
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('请安装 MetaMask!');
      return;
    }

    try {
      setIsConnecting(true);
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      
      const network = await newProvider.getNetwork();
      const chainIdNumber = Number(network.chainId);
      setChainId(chainIdNumber);
      
      const expectedChainId = BigInt(11155111);
      
      if (network.chainId !== expectedChainId) {
        await switchToSepolia();
        if (!window.ethereum) return;
        const updatedProvider = new ethers.BrowserProvider(window.ethereum);
        const updatedNetwork = await updatedProvider.getNetwork();
        setChainId(Number(updatedNetwork.chainId));
        const accounts = await updatedProvider.send('eth_requestAccounts', []);
        const newSigner = await updatedProvider.getSigner();
        setProvider(updatedProvider);
        setSigner(newSigner);
        setAccount(accounts[0]);
        return;
      }

      const accounts = await newProvider.send('eth_requestAccounts', []);
      const newSigner = await newProvider.getSigner();

      setProvider(newProvider);
      setSigner(newSigner);
      setAccount(accounts[0]);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      alert(error.message || '连接钱包失败');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setSigner(null);
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        connectWallet,
        disconnect,
        isConnecting,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

