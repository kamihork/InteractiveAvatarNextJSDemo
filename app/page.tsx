"use client";

import { useState } from "react";

import InteractiveAvatar from "@/components/InteractiveAvatar";

export default function App() {
  const [chatBotStart, setChatBotStart] = useState(false);
  const handleStart = () => {
    setChatBotStart(true);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-white">
      <InteractiveAvatar chatBotStart={chatBotStart} setChatBotStart={setChatBotStart} />
      {!chatBotStart && (
        <button className="fixed bottom-4 right-4 px-4 py-2 bg-blue-500 text-white rounded-md" onClick={handleStart}>
          AIチャットボットに相談（β版）
        </button>
      )}
    </div>
  );
}
