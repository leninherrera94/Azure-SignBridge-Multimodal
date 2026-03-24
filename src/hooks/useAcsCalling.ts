"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  CallClient,
  CallAgent,
  DeviceManager,
  LocalVideoStream,
  Call,
  RemoteVideoStream,
  Features
} from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

export interface RemoteParticipantStream {
  userId: string;
  stream: RemoteVideoStream;
}

export function useAcsCalling(roomId: string, startCall: boolean, onMessageReceived?: (payload: any) => void) {
  const [call, setCall] = useState<Call | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteParticipantStream[]>([]);
  const [localVideoStream, setLocalVideoStream] = useState<LocalVideoStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callAgentRef = useRef<CallAgent | null>(null);
  const callClientRef = useRef<CallClient | null>(null);
  const deviceManagerRef = useRef<DeviceManager | null>(null);
  const dataChannelSenderRef = useRef<any>(null);

  useEffect(() => {
    if (!startCall) return;

    let mounted = true;
    let currentCall: Call | null = null;
    let localStream: LocalVideoStream | null = null;

    async function init() {
      try {
        // 1. Fetch token and userId
        const res = await fetch("/api/rooms/join", { method: "POST" });
        if (!res.ok) throw new Error("Failed to fetch ACS token");
        const data = await res.json();
        const { token, communicationUserId } = data;

        if (!mounted) return;

        // 2. Initialize CallClient and CallAgent
        const callClient = new CallClient();
        callClientRef.current = callClient;

        const tokenCredential = new AzureCommunicationTokenCredential(token);
        const callAgent = await callClient.createCallAgent(tokenCredential, {
          displayName: `User-${communicationUserId.substring(10, 15)}`,
        });
        callAgentRef.current = callAgent;

        if (!mounted) return;

        // 3. Setup Devices
        const deviceManager = await callClient.getDeviceManager();
        deviceManagerRef.current = deviceManager;
        
        await deviceManager.askDevicePermission({ video: true, audio: true });
        const cameras = await deviceManager.getCameras();

        if (cameras.length > 0) {
          localStream = new LocalVideoStream(cameras[0]);
          setLocalVideoStream(localStream);
        }

        // 4. Join the Group Call
        // ACS Group calls require a valid UUID format. 
        // Our /room/[id] uses UUID because /room/new redirects to one.
        const callOptions = {
          videoOptions: localStream ? { localVideoStreams: [localStream] } : undefined,
          audioOptions: { muted: false },
        };

        currentCall = callAgent.join({ groupId: roomId }, callOptions);
        setCall(currentCall);

        // Setup DataChannel for real-time sync
        try {
          const dataChannelFeature = currentCall.feature(Features.DataChannel);
          const channelId = 100;
          
          let sender, receiver;
          // Try modern API first
          if (typeof dataChannelFeature.createDataChannelSender === 'function') {
            sender = dataChannelFeature.createDataChannelSender({ channelId });
            receiver = dataChannelFeature.createDataChannelReceiver({ channelId });
          } else {
            // Fallback for older SDK
            const dc = (dataChannelFeature as any).createDataChannel({ channelId, channelType: "UserFacing" });
            sender = dc.sender || dc;
            receiver = dc.receiver || dc;
          }

          receiver.on("MessageReceived", (e: any) => {
            if (onMessageReceived && e.data) {
              try {
                // e.data is usually Uint8Array
                const decoded = new TextDecoder().decode(e.data);
                const payload = JSON.parse(decoded);
                onMessageReceived(payload);
              } catch (err) {
                console.error("DataChannel parse error", err);
              }
            }
          });

          dataChannelSenderRef.current = sender;
        } catch (err) {
          console.warn("ACS DataChannel setup failed:", err);
        }

        // 5. Subscribe to Remote Participants
        const handleRemoteParticipantsUpdated = (e: any) => {
          e.added.forEach((participant: any) => {
            // Check existing streams
            participant.videoStreams.forEach((stream: RemoteVideoStream) => {
              if (stream.isAvailable) {
                setRemoteStreams((prev: RemoteParticipantStream[]) => [
                  ...prev.filter((s: RemoteParticipantStream) => s.stream !== stream), // prevent duplicates
                  { userId: participant.identifier.communicationUserId, stream }
                ]);
              }
            });

            // Listen for new streams
            participant.on("videoStreamsUpdated", (vsEvent: any) => {
              vsEvent.added.forEach((stream: RemoteVideoStream) => {
                const isAvailableHandler = () => {
                  if (stream.isAvailable) {
                    setRemoteStreams((prev: RemoteParticipantStream[]) => [
                      ...prev.filter((s: RemoteParticipantStream) => s.stream !== stream),
                      { userId: participant.identifier.communicationUserId, stream }
                    ]);
                  } else {
                    setRemoteStreams((prev: RemoteParticipantStream[]) => prev.filter((s: RemoteParticipantStream) => s.stream !== stream));
                  }
                };

                stream.on("isAvailableChanged", isAvailableHandler);
                
                // Trigger once if already available
                if (stream.isAvailable) {
                  isAvailableHandler();
                }
              });
            });
          });

          e.removed.forEach((participant: any) => {
            setRemoteStreams((prev: RemoteParticipantStream[]) =>
              prev.filter((s: RemoteParticipantStream) => s.userId !== participant.identifier.communicationUserId)
            );
          });
        };

        currentCall.on("remoteParticipantsUpdated", handleRemoteParticipantsUpdated);

      } catch (err: any) {
        console.error("ACS initialization failed:", err);
        if (mounted) setError(err.message || "Failed to join remote call");
      }
    }

    init();

    return () => {
      mounted = false;
      if (currentCall) {
        currentCall.hangUp().catch(console.error);
      }
      if (callAgentRef.current) {
        callAgentRef.current.dispose().catch(console.error);
      }
    };
  }, [roomId, startCall]);

  const toggleMic = useCallback(async (mute: boolean) => {
    if (!call) return;
    try {
      if (mute) {
        await call.mute();
      } else {
        await call.unmute();
      }
    } catch (err) {
      console.error("Failed to toggle mic", err);
    }
  }, [call]);

  const toggleCam = useCallback(async (turnOff: boolean) => {
    if (!call || !localVideoStream) return;
    try {
      if (turnOff) {
        await call.stopVideo(localVideoStream);
      } else {
        await call.startVideo(localVideoStream);
      }
    } catch (err) {
      console.error("Failed to toggle camera", err);
    }
  }, [call, localVideoStream]);

  const sendData = useCallback(async (payload: any) => {
    if (!dataChannelSenderRef.current) return;
    try {
      const data = new TextEncoder().encode(JSON.stringify(payload));
      await dataChannelSenderRef.current.sendMessage(data);
    } catch (err) {
      console.error("Failed to send ACS data channel message", err);
    }
  }, []);

  return { call, remoteStreams, localVideoStream, error, toggleMic, toggleCam, sendData };
}
