import { useState, useCallback } from 'react';
import { ChatMessage } from '../types/chat';

const suggestedQuestions = [
  "Turn on the light in room",
  "Notify me about temperature and humidity in room",
  "Tell me about temperature and humidity in room",
  "When PIR gets activated in room, turn on the lights",
  "What can you do",
  "Schedule turning off lawn light everyday at 7am",
  "Schedule turning on lawn light everyday at 7pm",
  "Which song is playing",
  "Change the song",
  "Alert when PIR gets 1",
  "Turn off hall TV after 5 minutes",
  "Turn off music after half an hour",
  "What's the current temperature in the living room?",
  "Set bedroom lights to 50% brightness",
  "Open the garage door",
  "Turn on room switchboard",
  "Is everything off in room?",
  "Turn off all lights in home except lawn",
  "Start playing song",
];

const getRandomQuestions = (questions: string[]) => {
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
};

export const useChatState = () => {
  const [userInput, setUserInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [randomQuestions, setRandomQuestions] = useState<string[]>([]);
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");

  useEffect(() => {
    setRandomQuestions(getRandomQuestions(suggestedQuestions));
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage.type === "assistant") {
        const utterance = new SpeechSynthesisUtterance(
          lastMessage.data?.reply || lastMessage.text
        );
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [chatHistory]);

  const handleUserInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim()) {
      return;
    }

    const newMessage: ChatMessage = {
      type: "user",
      text: userInput.trim(),
    };

    setChatHistory((prev) => [...prev, newMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      const historyForAPI = [...chatHistory, newMessage].map((msg) => ({
        role: msg.type === "user" ? "user" : "assistant",
        content:
          msg.type === "user" ? msg.text : msg.data ? msg.data.reply : msg.text,
      }));

      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: newMessage.text,
          history: historyForAPI.slice(-5),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantData = data.reply;

        const assistantMessage: ChatMessage = {
          type: "assistant",
          text: assistantData.reply,
          data: assistantData,
        };

        setChatHistory((prev) => [...prev, assistantMessage]);
      } else {
        console.error("Error from API:", data.error);
        const assistantMessage: ChatMessage = {
          type: "assistant",
          text: "An error occurred. Please try again later.",
        };
        setChatHistory((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const assistantMessage: ChatMessage = {
        type: "assistant",
        text: "An error occurred. Please try again later.",
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, chatHistory]);

  const handleVoiceInputSubmit = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) {
        return;
      }

      const newMessage: ChatMessage = {
        type: "user",
        text: transcript.trim(),
      };

      setChatHistory((prev) => [...prev, newMessage]);
      setIsLoading(true);
      setLiveTranscript("");

      try {
        const historyForAPI = [...chatHistory, newMessage].map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content:
            msg.type === "user" ? msg.text : msg.data ? msg.data.reply : msg.text,
        }));

        const response = await fetch("/api/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userMessage: newMessage.text,
            history: historyForAPI.slice(-2),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const assistantData = data.reply;

          const assistantMessage: ChatMessage = {
            type: "assistant",
            text: assistantData.reply,
            data: assistantData,
          };
          setLiveTranscript(assistantData.reply);
          setChatHistory((prev) => [...prev, assistantMessage]);
        } else {
          console.error("Error from API:", data.error);
          const assistantMessage: ChatMessage = {
            type: "assistant",
            text: "An error occurred. Please try again later.",
          };
          setChatHistory((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        console.error("Error:", error);
        const assistantMessage: ChatMessage = {
          type: "assistant",
          text: "An error occurred. Please try again later.",
        };
        setChatHistory((prev) => [...prev, assistantMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [chatHistory]
  );

  const handleVoiceModeStart = useCallback(() => {
    setIsVoiceMode(true);
    setLiveTranscript("");
  }, []);

  const handleVoiceModeEnd = useCallback(() => {
    setIsVoiceMode(false);
    setLiveTranscript("");
  }, []);

  const handleClearChat = useCallback(() => {
    setChatHistory([]);
    setUserInput("");
    setIsLoading(false);
    setRandomQuestions(getRandomQuestions(suggestedQuestions));
    setIsVoiceMode(false);
    setLiveTranscript("");
  }, []);

  const handleSuggestedQuestionClick = useCallback((question: string) => {
    setUserInput(question);
  }, []);

  return {
    userInput,
    chatHistory,
    isLoading,
    randomQuestions,
    isVoiceMode,
    liveTranscript,
    handleUserInput,
    handleSubmit,
    handleVoiceInputSubmit,
    handleVoiceModeStart,
    handleVoiceModeEnd,
    handleClearChat,
    handleSuggestedQuestionClick,
  };
};

export default useChatState;