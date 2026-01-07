import { getAllMessages } from "@/APIs/messagesAPI";
import { cacheKeyStore } from "@/constants";
import {
  addNewMessageToCache,
  mapDbMessageToTempMessage,
  markMessageAsFailedWithCountdown,
  updateMessageSeenAt,
} from "@/helpers/socketHelpers";
import { messageInterface } from "@/types/types";
import {
  InfiniteData,
  QueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

type EventHandlers = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [event: string]: (...args: any[]) => void;
};
interface useGetMessagesProps {
  chatId: number;
}
export interface MessagesPage {
  data: messageInterface[];
  meta: {
    currentPage: number;
    totalMessages: number;
    totalPages: number;
  };
}

const useSocketEvents = (socket: Socket, handlers: EventHandlers) => {
  const savedHandlers = useRef<EventHandlers>(handlers);

  useEffect(() => {
    savedHandlers.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const currentHandler = savedHandlers.current;
    Object.entries(currentHandler).forEach(([event, handler]) => {
      socket.on(event, handler);
    });
    return () => {
      Object.entries(currentHandler).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket]);
};

const useGetMessages = ({
  chatId,
}: useGetMessagesProps): {
  data: InfiniteData<MessagesPage> | undefined;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
} => {
  const { data, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery<MessagesPage>({
      queryKey: [cacheKeyStore.messages, chatId],
      queryFn: ({ pageParam = 1 }) =>
        getAllMessages({ page: Number(pageParam), chatId }),
      getNextPageParam: (lastPage) => {
        const { meta } = lastPage;
        if (!meta) return;
        return meta.currentPage < meta.totalPages
          ? meta.currentPage + 1
          : undefined;
      },
      initialPageParam: 1,
      staleTime: 5 * 60 * 1000,
      retry: false,
      enabled: !!chatId,
    });

  return { data, isFetching, hasNextPage, isFetchingNextPage, fetchNextPage };
};

function useUserId(
  key: string,
  initialValue: number
): [number, (value: number) => void] {
  const [storedValue, setStoredValue] = useState<number>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? parseInt(item, 10) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: number) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setStoredValue(parseInt(item, 10));
      }
    } catch (error) {
      console.error(
        `Error syncing localStorage key "${key}" with state:`,
        error
      );
    }
  }, [key]);

  return [storedValue, setValue];
}

export function useNewMessagesListener(
  selectedChatId: number,
  userId: number,
  queryClient: QueryClient
) {
  return useCallback(
    (data: { chatId: number; messageForRealTime: messageInterface }) => {
      if (Number(data.chatId) !== selectedChatId) return;

      addNewMessageToCache({
        queryClient,
        chatId: selectedChatId,
        message: data.messageForRealTime,
      });
    },
    [selectedChatId, userId, queryClient]
  );
}

export function useMapDbMessageToTempMessageListener(
  selectedChatId: number,
  queryClient: QueryClient
) {
  return useCallback(
    (data: { chatId: number; message: messageInterface; tempId: string }) => {
      if (Number(data.chatId) !== selectedChatId) return;

      mapDbMessageToTempMessage({
        chatId: selectedChatId,
        message: data.message,
        tempId: data.tempId,
        queryClient,
      });
    },
    [selectedChatId, queryClient]
  );
}

export function useFailMessageListener(queryClient: QueryClient) {
  return useCallback((data: { chatId: number; tempId: string }) => {
    markMessageAsFailedWithCountdown({
      chatId: data.chatId,
      tempId: data.tempId,
      queryClient: queryClient,
    });
  }, []);
}

export const useStartTypingListener = ({
  chatId,
  setUserTyping,
}: {
  chatId: number;
  setUserTyping: (data: boolean) => void;
}) => {
  return useCallback(
    (data: { chatId: number }) => {
      if (data.chatId === chatId) {
        setTimeout(() => {
          setUserTyping(true);
        }, 500);
      }
    },
    [chatId, setUserTyping]
  );
};

export const useStopTypingListener = ({
  chatId,
  setUserTyping,
}: {
  chatId: number;
  setUserTyping: (data: boolean) => void;
}) => {
  return useCallback(
    (data: { chatId: number }) => {
      if (data.chatId === chatId) {
        setTimeout(() => {
          setUserTyping(false);
        }, 500);
      }
    },
    [chatId, setUserTyping]
  );
};



export function useMessageSeenListener(queryClient: QueryClient) {
  return useCallback(
    (data: { chatId: number; messageIds: string[]; seen_at: Date }) => {
      updateMessageSeenAt({
        chatId: Number(data.chatId),
        messageIds: data.messageIds,
        seenAt: data.seen_at,
        queryClient,
      });
    },
    []
  );
}


export { useGetMessages, useSocketEvents, useUserId };

