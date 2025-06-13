import React from "react";
import { Activity, Zap } from "lucide-react";

interface TransactionStatsProps {
  totalTransactions: number;
}

const TransactionStats: React.FC<TransactionStatsProps> = ({ 
  totalTransactions 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
      {/* Total Transactions Stat */}
      <div className="bg-gradient-to-br from-[#2A2A2D] to-[#262626] rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-[#6C5DD3]/20 p-3 rounded-lg">
            <Activity className="h-6 w-6 text-[#6C5DD3]" />
          </div>
          <div>
            <p className="text-sm text-[#A1A1AA] font-medium">Total Transactions</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {totalTransactions.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Network Status */}
      <div className="bg-gradient-to-br from-[#2A2A2D] to-[#262626] rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-[#22C55E]/20 p-3 rounded-lg">
            <Zap className="h-6 w-6 text-[#22C55E]" />
          </div>
          <div>
            <p className="text-sm text-[#A1A1AA] font-medium">Network Status</p>
            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-[#22C55E] mr-2"></span>
              Active
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionStats; 