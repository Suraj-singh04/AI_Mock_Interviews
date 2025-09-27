"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { vapi } from "@/lib/vapi.sdk";

export interface AgentProps {
  userName: string;
  userId: string;
}

export enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

export interface SavedMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const Agent = ({ userName, userId }: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [conversation, setConversation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const latestMessage = messages[messages.length - 1]?.content || "";

  const isCallInactiveOrFinished =
    callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  useEffect(() => {
    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMsg: SavedMessage = {
          role: message.role,
          content: message.transcript,
        };
        // Keep only the latest message
        setMessages([newMsg]);

        const roleLabel = message.role === "user" ? "You" : "Bot";
        setConversation(
          (prev) => prev + `${roleLabel}: ${message.transcript}\n`
        );
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = () => setCallStatus(CallStatus.INACTIVE);

    vapi.on("call-start", () => setCallStatus(CallStatus.ACTIVE));
    vapi.on("call-end", () => setCallStatus(CallStatus.FINISHED));
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", () => {});
      vapi.off("call-end", () => {});
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setMessages([]);
    setConversation("");

    await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID || "", {
      variableValues: { username: userName, userid: userId },
    });
  };

  const handleDisconnect = async () => {
    setIsSubmitting(true);
    await vapi.stop();
    setCallStatus(CallStatus.FINISHED);

    if (conversation.trim()) {
      try {
        const res = await fetch("/api/vapi/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation: conversation.trim(), userId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) console.error("API error:", data.error);
        else console.log("Interview generated:", data);
      } catch (err) {
        console.error("Failed to send conversation:", err);
      }
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="vapi"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <div className="w-28 h-28 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-semibold text-6xl">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            {latestMessage && (
              <p
                key={`${messages.length}-${latestMessage.substring(0, 20)}`}
                className={cn(
                  "transition-opacity duration-500 opacity-0",
                  "animate-fadeIn opacity-100"
                )}
              >
                {latestMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Call Buttons */}
      <div className="mt-6 flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button
            className={cn(
              "relative px-8 py-4 rounded-full font-semibold text-white shadow-lg transition-all duration-200",
              callStatus === CallStatus.CONNECTING
                ? "bg-yellow-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            )}
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            {callStatus === CallStatus.CONNECTING && (
              <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            )}
            <span className="relative">
              {callStatus === CallStatus.CONNECTING
                ? "Connecting..."
                : callStatus === CallStatus.FINISHED
                ? "Start New Call"
                : "Start Interview"}
            </span>
          </button>
        ) : (
          <button
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-lg transition-all duration-200 active:scale-95"
            onClick={handleDisconnect}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "End Interview"}
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
