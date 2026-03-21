// useSignalR hook
// Manages the Azure SignalR HubConnection lifecycle: negotiate, connect,
// reconnect on drop, subscribe to room events (sign updates, transcripts,
// participant joins/leaves), and send messages from the client.

"use client";

import { useEffect, useRef } from "react";
import type { HubConnection } from "@microsoft/signalr";
// HubConnectionBuilder will be used when implementing the TODO
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { HubConnectionBuilder } from "@microsoft/signalr";

export function useSignalR(_roomId: string) {
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    // TODO: Build HubConnection, start, subscribe to events
    const conn = connectionRef.current;
    return () => {
      conn?.stop();
    };
  }, [_roomId]);

  return { connection: connectionRef.current };
}
