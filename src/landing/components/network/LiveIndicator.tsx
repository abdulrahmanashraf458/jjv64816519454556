import React from "react";

interface LiveIndicatorProps {
  active: boolean;
}

const LiveIndicator: React.FC<LiveIndicatorProps> = ({ active }) => {
  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full 
      ${active ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#6C5DD3]/20 text-[#6C5DD3]'}
      transition-all duration-300`}
    >
      <span 
        className={`w-2 h-2 rounded-full ${active ? 'bg-[#22C55E] animate-pulse' : 'bg-[#6C5DD3]'}`}
      ></span>
      <span className="text-xs font-medium">
        {active ? 'NEW TRANSACTION' : 'LIVE UPDATES'}
      </span>
    </div>
  );
};

export default LiveIndicator; 