import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = (token: string | null) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(process.env.NEXT_PUBLIC_API_URL + "/hubs/chat", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => setConnection(newConnection))
      .catch((err: any) => console.error("SignalR Connection Error: ", err));

    return () => {
      newConnection.stop();
    };
  }, [token]);

  return connection;
};