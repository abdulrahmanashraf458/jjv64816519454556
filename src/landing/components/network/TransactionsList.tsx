import React, { useRef, useEffect } from "react";
import { Transaction } from "../../pages/NetworkTransactions";

interface TransactionsListProps {
  transactions: Transaction[];
  newTransaction: boolean;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ 
  transactions,
  newTransaction
}) => {
  const tableRef = useRef<HTMLDivElement>(null);

  // Add animation effect when new transactions arrive
  useEffect(() => {
    if (newTransaction && tableRef.current) {
      tableRef.current.classList.add('animate-pulse');
      
      setTimeout(() => {
        if (tableRef.current) {
          tableRef.current.classList.remove('animate-pulse');
        }
      }, 1000);
    }
  }, [newTransaction]);

  return (
    <div 
      ref={tableRef}
      className="bg-[#262626] rounded-xl overflow-hidden shadow-lg transition-colors"
    >
      {/* Table Header */}
      <div className="grid grid-cols-12 bg-[#2A2A2D] px-4 py-3 text-sm text-[#A1A1AA] font-medium">
        <div className="col-span-3 lg:col-span-2">Amount</div>
        <div className="col-span-5 lg:col-span-5">Transaction ID</div>
        <div className="col-span-4 lg:col-span-5 text-right">Time</div>
      </div>

      {/* Transaction Items */}
      <div className="divide-y divide-[#3A3A3D]">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-[#A1A1AA]">
            No transactions found
          </div>
        ) : (
          transactions.map((tx, index) => (
            <div 
              key={tx.tx_id}
              className={`grid grid-cols-12 px-4 py-4 text-sm hover:bg-[#2A2A2D] transition-colors
                ${index === 0 && newTransaction ? 'bg-[#6C5DD3]/10' : ''}`}
            >              
              {/* Amount */}
              <div className="col-span-3 lg:col-span-2 font-mono font-semibold text-white">
                {parseFloat(tx.amount.toString()).toFixed(2)} CRN
              </div>
              
              {/* Transaction ID */}
              <div className="col-span-5 lg:col-span-5">
                <span className="text-[#A1A1AA] overflow-hidden text-ellipsis" title={tx.tx_id}>
                  {tx.tx_id}
                </span>
              </div>
              
              {/* Date & Time */}
              <div className="col-span-4 lg:col-span-5 text-right text-[#A1A1AA]">
                {new Date(tx.timestamp).toLocaleString([], {
                  year: '2-digit',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionsList; 