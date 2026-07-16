'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { chainConfig } from "@/lib/chain-config";
interface Web3ContextType {
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
    account: string | null;
    connectWallet: () => Promise<void>;
    disconnect: () => void;
    isConnecting: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const switchToSepolia = async () => {
        if (!window.ethereum) return;
        const sepoliaChainId = chainConfig.chainIdHex; // 11155111 in hex
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: sepoliaChainId }],
            });
        } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: chainConfig.chainIdHex,
                                chainName: chainConfig.chainName,
                                nativeCurrency: chainConfig.nativeCurrency,
                                rpcUrls: [chainConfig.rpcUrl],
                                blockExplorerUrls: [chainConfig.blockExplorerUrl],
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

            // Check network and switch if needed
            initProvider.getNetwork().then(async (network) => {
                const expectedChainId = chainConfig.chainId; // Sepolia
                if (network.chainId !== expectedChainId) {
                    console.log(`⚠️ Current network: ${network.chainId} (${network.name}), expected: ${expectedChainId} (Sepolia)`);
                    console.log('🔄 Attempting to switch to Sepolia network...');
                    try {
                        await switchToSepolia();
                        // After switching, update provider without reloading
                        console.log('✅ Network switched, updating provider...');
                        if (!window.ethereum) {
                            console.error('❌ window.ethereum is not available');
                            return;
                        }
                        const newProvider = new ethers.BrowserProvider(window.ethereum);
                        setProvider(newProvider);
                        // Re-check accounts after network switch
                        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                        if (accounts.length > 0) {
                            const newSigner = await newProvider.getSigner();
                            setSigner(newSigner);
                            setAccount(accounts[0]);
                        }
                        return;
                    } catch (error) {
                        console.error('❌ Failed to switch network:', error);
                        alert('Please manually switch to Sepolia network in MetaMask (Chain ID: 11155111)');
                    }
                } else {
                    console.log('✅ Connected to Sepolia network');
                }

                setProvider(initProvider);

                // Check if already connected
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

            // Listen for account changes
            if (window.ethereum && window.ethereum.on) {
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', async () => {
                    // Update provider when chain changes, without reloading page
                    console.log('🔄 Chain changed, updating provider...');
                    if (!window.ethereum) {
                        console.error('❌ window.ethereum is not available');
                        return;
                    }
                    const newProvider = new ethers.BrowserProvider(window.ethereum);
                    const network = await newProvider.getNetwork();
                    console.log('✅ New network:', { chainId: Number(network.chainId), name: network.name });
                    setProvider(newProvider);
                    // Re-check accounts after chain change
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

            // 确保 provider 存在后再获取 signer
            if (window.ethereum) {
                try {
                    const currentProvider = new ethers.BrowserProvider(window.ethereum);
                    const newSigner = await currentProvider.getSigner();
                    setSigner(newSigner);
                    // 如果 provider 状态还没有设置，也设置它
                    setProvider(currentProvider);
                    console.log('✅ Account changed, signer updated:', newAccount);
                } catch (error) {
                    console.error('Failed to get signer after account change:', error);
                }
            }
        }
    };


    const connectWallet = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        try {
            setIsConnecting(true);
            const newProvider = new ethers.BrowserProvider(window.ethereum);

            // Check and switch to Sepolia network
            const network = await newProvider.getNetwork();
            const expectedChainId = BigInt(11155111); // Sepolia

            if (network.chainId !== expectedChainId) {
                console.log(`Current network: ${network.chainId}, expected: ${expectedChainId}`);
                await switchToSepolia();
                // Update provider after network switch, without reloading
                if (!window.ethereum) {
                    console.error('❌ window.ethereum is not available');
                    return;
                }
                const updatedProvider = new ethers.BrowserProvider(window.ethereum);
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
            alert(error.message || 'Failed to connect wallet');
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

