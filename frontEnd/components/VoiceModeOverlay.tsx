import React from 'react';
import { Button } from "@nextui-org/button";
import { FaMicrophoneSlash } from "react-icons/fa";
import LoadV1 from "./loader";

interface VoiceModeOverlayProps {
  liveTranscript: string;
  onEndConversation: () => void;
}

const VoiceModeOverlay: React.FC<VoiceModeOverlayProps> = ({
  liveTranscript,
  onEndConversation,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="mb-8">
        <LoadV1 />
      </div>

      <div className="gradient-text4 text-2xl text-center px-4">
        {liveTranscript || "Listening..."}
      </div>

      <Button
        onClick={onEndConversation}
        className="mt-8 bg-red-600 hover:bg-red-700 flex items-center"
      >
        <FaMicrophoneSlash className="mr-2" />
        End Conversation
      </Button>
    </div>
  );
};

export default VoiceModeOverlay;