import { useEffect, useRef, useCallback } from 'react';

// Define SpeechRecognition type for TypeScript
const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || (window as any).webkitSpeechRecognition);

interface UseSpeechRecognitionProps {
  isVoiceMode: boolean;
  onTranscriptChange: (transcript: string) => void;
  onVoiceInputSubmit: (transcript: string) => void;
  onError: () => void;
}

const useSpeechRecognition = ({
  isVoiceMode,
  onTranscriptChange,
  onVoiceInputSubmit,
  onError,
}: UseSpeechRecognitionProps) => {
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        onTranscriptChange(finalTranscript + interimTranscript);

        if (finalTranscript) {
          onVoiceInputSubmit(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        onError();
      };

      recognition.onend = () => {
        if (isVoiceMode) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API is not supported in this browser.");
    }
  }, [isVoiceMode, onVoiceInputSubmit, onTranscriptChange, onError]);

  const startRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    startRecognition,
    stopRecognition,
    isSupported: !!SpeechRecognition
  };
};

export default useSpeechRecognition;