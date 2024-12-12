import type { StartAvatarResponse } from "@heygen/streaming-avatar";

import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskMode, TaskType, VoiceEmotion } from "@heygen/streaming-avatar";
import { Button, Card, CardBody, Divider } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { AiOutlineAudioMuted, AiOutlineAudio, AiOutlineQuestionCircle } from "react-icons/ai";
import { IoMdClose } from "react-icons/io";

export default function InteractiveAvatar({ chatBotStart, setChatBotStart }: { chatBotStart: boolean; setChatBotStart: React.Dispatch<React.SetStateAction<boolean>> }) {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [data, setData] = useState<StartAvatarResponse>();
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const AVATAR_ID = process.env.NEXT_PUBLIC_AVATAR_ID || "";
  const KNOWLEDGE_ID = process.env.NEXT_PUBLIC_KNOWLEDGE_ID || "";

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
    }

    return "";
  }

  async function startSession() {
    console.log("Session started at:", new Date().toISOString());
    setIsLoadingSession(true);
    const newToken = await fetchAccessToken();

    avatar.current = new StreamingAvatar({
      token: newToken,
    });
    avatar.current.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
      // アバターが喋るメッセージ
      // console.log(event.detail.message);
    });
    avatar.current.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
      // ユーザーが喋るメッセージ
      // console.log(event.detail.message);
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {});
    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      endSession();
    });
    avatar.current?.on(StreamingEvents.STREAM_READY, (event) => {
      setStream(event.detail);
    });
    avatar.current?.on(StreamingEvents.USER_START, () => {
      setIsUserTalking(true);
    });
    avatar.current?.on(StreamingEvents.USER_STOP, () => {
      setIsUserTalking(false);
    });
    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.Low,
        avatarName: AVATAR_ID,
        knowledgeId: KNOWLEDGE_ID,
        voice: {
          rate: 1.0, // 0.5 ~ 1.5
          emotion: VoiceEmotion.EXCITED,
        },
        language: "ja",
        disableIdleTimeout: true,
      });

      setData(res);
      // 最初に喋らせる
      await handleSpeak("フルミーへようこそ！なんでも聞いて下さい！");
      // 音声チャットを開始
      await avatar.current?.startVoiceChat({
        useSilencePrompt: false,
      });
    } catch (error) {
      console.error("Error starting avatar session:", error);
    } finally {
      setIsLoadingSession(false);
    }
  }
  async function handleSpeak(input: string) {
    if (!avatar.current) return;
    // await avatar.current?.stopListening();
    await avatar.current
      .speak({
        text: input,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      })
      .catch((e) => {
        setDebug(e.message);
      });
    // await avatar?.current?.startListening();
  }

  async function endSession() {
    console.log("Session ended at:", new Date().toISOString());
    await avatar.current?.stopAvatar();
    setStream(undefined);
    setChatBotStart(false);
  }

  async function questionLink() {
    window.open("", "_blank");
  }

  useEffect(() => {
    if (chatBotStart) {
      startSession();
    }
  }, [chatBotStart]);

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

  const streamContent = stream ? (
    <>
      <div
        className={`flex justify-center items-center rounded-lg overflow-hidden
      w-full h-full sm:w-[300px] sm:h-auto relative
    `}
      >
        <video
          ref={mediaStream}
          autoPlay
          playsInline
          className="w-full h-full object-fit-contain"
          muted={isMuted}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        >
          <track kind="captions" />
        </video>
      </div>
      <div className="absolute top-3 right-3 bg-opacity-50 rounded-full p-2">
        <Button className="text-white" size="md" variant="shadow" onClick={endSession}>
          <IoMdClose />
        </Button>
      </div>
      <div className="absolute bottom-3 right-3 rounded-full p-2">
        <Button className="text-black bg-orange-200 " size="md" variant="shadow" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <AiOutlineAudioMuted /> : <AiOutlineAudio />}
        </Button>
      </div>
      <div className="absolute bottom-3 left-3 bg-opacity-50 rounded-full p-2">
        <Button className="text-white" size="md" variant="shadow" onClick={questionLink}>
          <AiOutlineQuestionCircle />
        </Button>
      </div>
    </>
  ) : (
    isLoadingSession && (
      <div className="w-[300px] h-[200px] bg-gray-200 animate-pulse rounded-lg flex justify-center items-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  );

  if (!chatBotStart) return null;

  return (
    <div>
      <Card
        className={`
        fixed bottom-0 right-0
        rounded-none
        w-full sm:w-auto sm:fixed sm:bottom-4 sm:right-4 sm:rounded-lg
        ${chatBotStart ? "h-full sm:h-[500px]" : ""}
      `}
      >
        <CardBody className="flex flex-col justify-center items-center">{streamContent}</CardBody>
        <Divider />
      </Card>
    </div>
  );
}
