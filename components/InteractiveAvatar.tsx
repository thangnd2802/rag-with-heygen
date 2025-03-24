/* eslint-disable no-console */
import type { StartAvatarResponse } from "@heygen/streaming-avatar";

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  // Input,
  // Select,
  // SelectItem,
  Spinner,
  Chip,
  Tabs,
  Tab,
  Input,
} from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, usePrevious } from "ahooks";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Mic, MicOff } from "lucide-react";

import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";
// import { headers } from "next/headers";

// import { AVATARS, STT_LANGUAGE_LIST } from "@/app/lib/constants";

interface IMessage {
  id: number;
  text: string;
  sender: "user" | "agent";
}

export default function InteractiveAvatar(props: { agentId: any, keys: { rag_api_key: string, heygen_api_key: string} }) {
  const { agentId, keys } = props;

  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  // const [knowledgeId, setKnowledgeId] = useState<string>("");
  const [avatarId, setAvatarId] = useState<string>("SilasHR_public");
  const [language, setLanguage] = useState<string>("en");

  const [data, setData] = useState<StartAvatarResponse>();
  const [text, setText] = useState<string>("");
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  // const [chatMode, setChatMode] = useState("text_mode");
  // const [isUserTalking, setIsUserTalking] = useState(false);
  const [ragflowSessionId, setRagflowSessionId] = useState<string>("");

  function ragflowConfig() {
    return {
      url: process.env.NEXT_PUBLIC_RAGFLOW_API_URL,
      api_key: keys.rag_api_key, //process.env.NEXT_PUBLIC_RAGFLOW_API_KEY,
      agent_id: agentId, //process.env.NEXT_PUBLIC_RAGFLOW_AGENT_ID,
    };
  }

  function baseApiUrl() {
    return process.env.NEXT_PUBLIC_BASE_API_URL;
  }

  async function fetchAccessToken() {
    try {
      if (!keys.heygen_api_key) {
        console.error("Heygen API key not found");
        alert("Heygen API key not found");

        return;
      }

      const apiUrl = baseApiUrl();

      // const response = await fetch("/api/get-access-token", {
      //   method: "POST",
      // });
      // const token = await response.text();

      const res = await fetch(`${apiUrl}/v1/streaming.create_token`, {
        method: "POST",
        headers: {
          "x-api-key": keys.heygen_api_key,
        },
      });

      const data = await res.json();
      const token = data.data.token;

      console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      alert("Error fetching access token or missing API key");
    }

    return "";
  }

  async function startAgentSession() {
    try {
      const ragflow = ragflowConfig();
      const response = await fetch(
        `${ragflow.url}/api/v1/agents/${ragflow.agent_id}/sessions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ragflow.api_key}`,
          },
        },
      );

      if (response.status === 200) {
        const data = await response.json();

        setRagflowSessionId(data["data"]["id"]);
      } else {
        console.error("Fetch agent session eror");
      }
    } catch (err) {
      console.error("Error start agent session: ", err);
    }
  }

  useEffect(() => {
    if (!ragflowSessionId || ragflowSessionId === "") {
      startAgentSession();
    }
  }, [ragflowSessionId]);

  async function messageCompletion(text: string) {
    try {
      if (!ragflowSessionId) {
        console.error("Ragflow session ID not found");

        return;
      }
      const ragflow = ragflowConfig();
      const response = await fetch(
        `${ragflow.url}/api/v1/agents/${ragflow.agent_id}/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ragflow.api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: ragflowSessionId,
            question: text,
            stream: false,
            sync_dsl: true,
          }),
        },
      );

      if (response.status === 200) {
        const data = await response.json();

        console.log("Agent response: ", data);

        return data["data"]["answer"];
      } else {
        console.error("Fetch agent completion eror");
      }
    } catch (err) {
      console.error("ERROR msg with Agent: ", err);
    }
  }

  async function startSession() {
    setIsLoadingSession(true);
    const newToken = await fetchAccessToken();

    if (!newToken) {
      setIsLoadingSession(false);

      return;
    }

    avatar.current = new StreamingAvatar({
      token: newToken,
      basePath: baseApiUrl(),
    });
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
      console.log("Avatar started talking", e);
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
      console.log("Avatar stopped talking", e);
    });
    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log("Stream disconnected");
      endSession();
    });
    avatar.current?.on(StreamingEvents.STREAM_READY, (event) => {
      console.log(">>>>> Stream ready:", event.detail);
      setStream(event.detail);
    });
    // avatar.current?.on(StreamingEvents.USER_START, (event) => {
    //   console.log(">>>>> User started talking:", event);
    //   setIsUserTalking(true);
    // });
    // avatar.current?.on(StreamingEvents.USER_STOP, (event) => {
    //   console.log(">>>>> User stopped talking:", event);
    //   setIsUserTalking(false);
    // });
    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.Low,
        avatarName: avatarId,
        // knowledgeId: knowledgeId, // Or use a custom `knowledgeBase`.
        voice: {
          rate: 1.5, // 0.5 ~ 1.5
          emotion: VoiceEmotion.FRIENDLY,
          // elevenlabsSettings: {
          //   stability: 1,
          //   similarity_boost: 1,
          //   style: 1,
          //   use_speaker_boost: false,
          // },
        },
        language: language,
        disableIdleTimeout: true,
      });

      setData(res);
      // default to voice mode
      // await avatar.current?.startVoiceChat({
      //   useSilencePrompt: false,
      // });
      // setChatMode("voice_mode");
      setIsSessionLoaded(true);
    } catch (error) {
      console.error("Error starting avatar session:", error);
    } finally {
      setIsLoadingSession(false);
    }
  }

  async function handleSpeak(textNeedToSpeak: string) {
    setIsLoadingRepeat(true);
    if (!avatar.current) {
      setDebug("Avatar API not initialized");

      return;
    }
    // speak({ text: text, task_type: TaskType.REPEAT })
    await avatar.current
      .speak({
        text: textNeedToSpeak,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      })
      .catch((e) => {
        setDebug(e.message);
      });
    setIsLoadingRepeat(false);
  }

  // async function handleInterrupt() {
  //   if (!avatar.current) {
  //     setDebug("Avatar API not initialized");

  //     return;
  //   }
  //   await avatar.current.interrupt().catch((e) => {
  //     setDebug(e.message);
  //   });
  // }

  async function endSession() {
    await avatar.current?.stopAvatar();
    setStream(undefined);
  }

  // const handleChangeChatMode = useMemoizedFn(async (v) => {
  //   if (v === chatMode) {
  //     return;
  //   }
  //   if (v === "text_mode") {
  //     avatar.current?.closeVoiceChat();
  //   } else {
  //     await avatar.current?.startVoiceChat();
  //   }
  //   setChatMode(v);
  // });

  const previousText = usePrevious(text);

  useEffect(() => {
    if (!previousText && text) {
      avatar.current?.startListening();
    } else if (previousText && !text) {
      avatar?.current?.stopListening();
    }
  }, [text, previousText]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        setDebug("Playing");
      };
    }
  }, [mediaStream, stream]);

  const { transcript, listening, resetTranscript, isMicrophoneAvailable } =
    useSpeechRecognition();
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(0);

  function clearHistoryAndAgentSession() {
    setMessages([]);
    setRagflowSessionId("");
    setInputValue("");
  }

  const startListening = () => {
    if (!isMicrophoneAvailable) {
      alert("Microphone is not available. Please check your permissions.");

      return;
    }

    resetTranscript();
    setIsListening(true);
    setInputValue(""); // Clear input when starting
    SpeechRecognition.startListening({
      continuous: true,
      language: "en-US",
      interimResults: true,
    });
    setLastSpeechTime(Date.now()); // Set initial speech time
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);

    // Ensure final transcript is captured
    if (transcript.trim()) {
      setInputValue(transcript);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Auto-stop when silence detected (2s after last speech)
  useEffect(() => {
    if (isListening) {
      const silenceTimeout = setTimeout(() => {
        if (Date.now() - lastSpeechTime > 2000) {
          stopListening();
        }
      }, 2000);

      return () => clearTimeout(silenceTimeout);
    }
  }, [transcript, isListening, lastSpeechTime]);

  // Update last speech time whenever transcript changes
  useEffect(() => {
    if (transcript.trim()) {
      setLastSpeechTime(Date.now());
    }
  }, [transcript]);

  const [isCompleting, setIsCompleting] = useState(false);

  // useEffect(() => {
  //   const fetchCompletion = async () => {
  //     if (!inputValue) return;

  //     setMessages((prev) => [
  //       ...prev,
  //       { id: prev.length + 1, text: inputValue, sender: "user" },
  //     ]);

  //     setIsCompleting(false);

  //     try {
  //       const response = await messageCompletion(inputValue);

  //       if (response) {
  //         __(response);
  //         setMessages((prev) => [
  //           ...prev,
  //           { id: prev.length + 1, text: response, sender: "agent" },
  //         ]);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching completion:", error);
  //     }
  //   };

  //   fetchCompletion();
  // }, [inputValue]);

  const fetchCompletion = async () => {
    if (!inputValue) return;

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: inputValue, sender: "user" },
    ]);

    setIsCompleting(false);

    setInputValue("");

    try {
      const response = await messageCompletion(inputValue);

      if (response) {
        const textToRead = response.replace(/##\d+\$\$/g, "");

        if (isSessionLoaded) {
          handleSpeak(textToRead);
        }

        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, text: textToRead, sender: "agent" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching completion:", error);
    }
  };

  const [messages, setMessages] = useState<IMessage[]>([]);

  // if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
  //   return (
  //     <p className="text-red-500">
  //       Your browser does not support speech recognition.
  //     </p>
  //   );
  // }

  return (
    <>
      <div className="w-full flex flex-row gap-4">
        <Card className="flex-1">
          <CardBody className="h-[500px] flex flex-col justify-center items-center">
            {stream ? (
              <div className="h-[500px] w-[900px] justify-center items-center flex rounded-lg overflow-hidden">
                <video
                  ref={mediaStream}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                >
                  <track kind="captions" />
                </video>
                <div className="flex flex-col gap-2 absolute bottom-3 right-3">
                  {/* <Button
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg"
                  size="md"
                  variant="shadow"
                  onClick={handleInterrupt}
                >
                  Interrupt task
                </Button> */}
                  <Button
                    className="bg-gradient-to-tr from-indigo-500 to-indigo-300  text-white rounded-lg"
                    size="md"
                    variant="shadow"
                    onClick={endSession}
                  >
                    End conversation
                  </Button>
                </div>
              </div>
            ) : !isLoadingSession ? (
              <div className="h-full justify-center items-center flex flex-col gap-8 w-[500px] self-center">
                <Button
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300 w-full text-white"
                  size="md"
                  variant="shadow"
                  onClick={startSession}
                >
                  Start conversation
                </Button>
              </div>
            ) : (
              <Spinner color="default" size="lg" />
            )}
          </CardBody>
          <Divider />
          <CardFooter className="flex flex-col gap-3 relative">
            {/* <Tabs
              aria-label="Options"
              selectedKey={chatMode}
              onSelectionChange={(v) => {
                handleChangeChatMode(v);
              }}
            >
              <Tab key="text_mode" title="Text mode" />
              <Tab key="voice_mode" title="Voice mode" />
            </Tabs> */}

            <div className="w-full flex flex-col relative justify-center items-center gap-2">
              <div className="flex flex-row items-end justify-center gap-6 space-y-4 w-full">
                <Input
                  // disabled={!isSessionLoaded || isCompleting}
                  endContent={
                    <Button
                      isIconOnly
                      className="text-blue-500"
                      size="sm"
                      variant="light"
                      onClick={toggleListening}
                    >
                      {isListening == false ? (
                        <MicOff className="w-6 h-6 text-red-500" />
                      ) : (
                        <Mic className="w-6 h-6 text-blue-500" />
                      )}
                    </Button>
                  }
                  placeholder={
                    isSessionLoaded
                      ? "Click mic and start speaking..."
                      : "Start a conversation first"
                  }
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white"
                  onClick={fetchCompletion}
                >
                  Send
                </Button>
              </div>
              {isListening && <p className="text-gray-500">Listening...</p>}
              {ragflowSessionId && (
                <p className="text-gray-500">Session ID: {ragflowSessionId}</p>
              )}
            </div>
            <Divider />
            <div className="w-full flex flex-row gap-4 items-end">
              <Button
                className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white"
                onClick={clearHistoryAndAgentSession}
              >
                Clear history
              </Button>
              <h4>Conversation History: </h4>
            </div>
            <div className="w-full max-w-[1000px] h-[350px] overflow-y-auto space-y-2 p-8">
              {messages.map((msg: any) => (
                <Card
                  key={msg.id}
                  className={`p-3 w-fit max-w-[75%] ${msg.sender === "user" ? "ml-auto bg-blue-500 text-white" : "mr-auto bg-gray-200 text-black"}`}
                >
                  {msg.text}
                </Card>
              ))}
            </div>
          </CardFooter>
        </Card>
      </div>
      <p className="font-mono text-right">
        <span className="font-bold">Console:</span>
        <br />
        {debug}
      </p>
    </>
  );
}
