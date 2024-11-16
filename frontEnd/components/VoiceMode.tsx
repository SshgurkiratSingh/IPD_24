import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@nextui-org/button";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

interface VoiceModeProps {
  isListening: boolean;
  transcript: string;
  onStart: () => void;
  onStop: () => void;
}

const VoiceMode: React.FC<VoiceModeProps> = ({
  isListening,
  transcript,
  onStart,
  onStop,
}) => {
  return (
    <AnimatePresence>
      {isListening && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={onStop}
        >
          <motion.div
            className="text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <div className="w-32 h-32 bg-blue-500 rounded-full opacity-20 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              <div className="w-24 h-24 bg-blue-500 rounded-full opacity-40 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              <Button
                isIconOnly
                className="w-16 h-16 bg-blue-600 rounded-full relative z-10"
                onClick={onStop}
              >
                <FaMicrophone className="w-6 h-6 text-white" />
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 px-4 py-2 bg-gray-800 rounded-lg max-w-md mx-auto"
            >
              <p className="text-white text-lg">
                {transcript || "Listening..."}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceMode;