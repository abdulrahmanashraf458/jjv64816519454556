import React, { useState, useEffect, useRef } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import TransactionsList from "../components/network/TransactionsList";
// @ts-ignore
import TransactionStats from "../components/network/TransactionStats";
// @ts-ignore
import LiveIndicator from "../components/network/LiveIndicator";
import { io, Socket } from "socket.io-client";
import Footer from "../components/Footer";

export interface Transaction {
  tx_id: string;
  amount: number;
  timestamp: string;
  sender: {
    public_address: string;
    username: string;
  };
  receiver: {
    public_address: string;
    username: string;
  };
  status: string;
}

const NetworkTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [newTransactionReceived, setNewTransactionReceived] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial transactions
  useEffect(() => {
    fetchTransactions();
  }, [page]);

  // Setup socket connection for real-time updates
  useEffect(() => {
    // Create socket connection
    socketRef.current = io('/network-transactions', {
      transports: ['websocket'],
      upgrade: false
    });

    // Listen for new transactions
    socketRef.current.on('new_transactions', (data: { transactions: Transaction[] }) => {
      setTransactions(prevTx => {
        // Add new transactions at the top and filter out duplicates
        const newTx = [...data.transactions, ...prevTx];
        const uniqueTx = newTx.filter((tx, index, self) => 
          index === self.findIndex(t => t.tx_id === tx.tx_id)
        );
        return uniqueTx.slice(0, 100); // Keep only the 100 latest
      });
      
      // Update total count and visual indicator
      setTotalTransactions(prev => prev + data.transactions.length);
      setNewTransactionReceived(true);
      
      // Reset the visual indicator after 2 seconds
      setTimeout(() => {
        setNewTransactionReceived(false);
      }, 2000);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/network-transactions?page=${page}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
      setTotalPages(data.meta.pages);
      setTotalTransactions(data.meta.total);
      setError(null);
    } catch (err) {
      setError('Error loading transactions. Please try again later.');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#6C5DD3] to-[#8875FF] bg-clip-text text-transparent mb-4">
            Cryptonel Network Transactions
          </h1>
          <p className="text-xl text-[#A1A1AA] max-w-3xl mx-auto">
            Real-time view of all transactions happening on the Cryptonel network
          </p>
          
          <div className="mt-6 flex items-center justify-center">
            <LiveIndicator active={newTransactionReceived} />
          </div>
        </div>
        
        {/* Stats Section */}
        <TransactionStats totalTransactions={totalTransactions} />
        
        {/* Transactions Table */}
        {loading && transactions.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#6C5DD3] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-[#262626] rounded-lg">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => fetchTransactions()} 
              className="mt-4 px-4 py-2 bg-[#6C5DD3] rounded-lg hover:bg-[#5B4DC3] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <TransactionsList transactions={transactions} newTransaction={newTransactionReceived} />
            
            {/* Pagination */}
            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg ${
                  page === 1 
                    ? 'bg-[#3A3A3D] text-[#A1A1AA] cursor-not-allowed' 
                    : 'bg-[#6C5DD3] hover:bg-[#5B4DC3] text-white transition-colors'
                }`}
              >
                Previous
              </button>
              
              <span className="text-[#A1A1AA]">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded-lg ${
                  page === totalPages 
                    ? 'bg-[#3A3A3D] text-[#A1A1AA] cursor-not-allowed' 
                    : 'bg-[#6C5DD3] hover:bg-[#5B4DC3] text-white transition-colors'
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default NetworkTransactions; 