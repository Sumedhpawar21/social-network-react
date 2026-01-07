import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useSeenMessages } from "@/helpers/socketHelpers";
import { cn } from "@/lib/utils";
import type { messageInterface } from "@/types/types";
import { Check, Clock, MailCheck, XCircle } from "lucide-react";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Socket } from "socket.io-client";
interface MessageComponentProps {
  isSender: boolean;
  msg: messageInterface;
  friend_avatar: string | null;
  isLastMessage: boolean;
  selectedChatId: number;
  socket: Socket;
  selectedFriendId: number;
}

const MessageComponent = ({
  isSender,
  msg,
  friend_avatar,
  isLastMessage,
  selectedChatId,
  socket,
  selectedFriendId,
}: MessageComponentProps) => {
  const { ref: messageInViewRef, inView } = useInView();
  const markSeen = useSeenMessages(socket, selectedChatId, selectedFriendId);
  const formatTime = (timestamp: string | Date) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return `${date.getHours()}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const isFailed = msg?.status === "failed";
  const isSending = msg?.status === "sent";
  const isDelivered = msg?.status === "delivered";

  useEffect(() => {
    if (inView && !msg.seen_at && !isSender) {
      markSeen(String(msg._id));
    }
  }, [inView]);

  return (
    <div
      ref={messageInViewRef}
      className={cn(
        "flex items-end gap-2 mb-2.5",
        isSender ? "justify-end" : "justify-start"
      )}
    >
      {!isSender && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage
            src={
              friend_avatar ??
              "https://avatars.githubusercontent.com/u/124599?v=4"
            }
            alt="User Avatar"
            className="object-cover"
          />
        </Avatar>
      )}

      <div className="flex flex-col max-w-xs md:max-w-sm lg:max-w-md">
        <div
          className={cn(
            "px-4 py-2.5 rounded-lg text-sm shadow-sm",
            isSender
              ? isFailed
                ? "bg-red-500 text-white rounded-br-none"
                : "bg-green-500 text-white rounded-br-none"
              : "bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-700 dark:text-gray-100"
          )}
        >
          <p className="font-normal break-words text-center">{msg?.message}</p>
        </div>

        <div
          className={cn(
            "flex items-center mt-1 text-xs gap-2",
            isSender ? "justify-end" : "justify-start"
          )}
        >
          <span className="text-gray-500 dark:text-gray-400">
            {formatTime(msg?.createdAt)}
          </span>

          {isSender && (
            <>
              {isLastMessage && isSending && !msg?.seen_at && (
                <span className="text-yellow-500 flex items-center">
                  <Clock size={12} className="mr-1" /> Sending...
                </span>
              )}
              {isLastMessage && isDelivered && !msg?.seen_at && (
                <span className="text-blue-500 flex items-center">
                  <MailCheck size={12} className="mr-1" />
                  Delivered
                </span>
              )}
              {isLastMessage && isFailed && !msg?.seen_at && (
                <span className="text-white flex items-center bg-red-600 px-2 py-0.5 rounded-full">
                  <XCircle size={12} className="mr-1" />
                  Removing in {msg.countdown}s
                </span>
              )}
              {isLastMessage && msg?.seen_at && (
                <span className="ml-1.5 text-blue-500 flex items-center">
                  <Check size={12} className="mr-0.5" />
                  <span>Seen</span>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MessageComponent);
