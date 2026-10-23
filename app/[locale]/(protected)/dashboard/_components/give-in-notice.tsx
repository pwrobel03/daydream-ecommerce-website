import React from "react";
import { Info } from "lucide-react";

const GiveInNotice = ({ note }: { note?: string }) => {
  return (
    <div className="p-6 flex flex-row bg-blue-50 border border-blue-300 rounded-[1rem] gap-4 items-center">
      <Info className="text-blue-500" size={32} />
      <p className="text-[10px] font-medium leading-relaxed text-blue-700 uppercase tracking-wider italic">
        {note
          ? note
          : "Note: This is one of critical component in service functionallity, chages here would impact other parts of application as well!"}
      </p>
    </div>
  );
};

export default GiveInNotice;
