import { WebSocketServer } from 'ws';
import { RealtimeClient } from '@openai/realtime-api-beta';
import OpenAI from 'openai';

export class RealtimeRelay {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.openai = new OpenAI({ apiKey });
    this.sockets = new WeakMap();
    this.wss = null;
  }

  listen(port) {
    this.wss = new WebSocketServer({ port });
    this.wss.on('connection', this.connectionHandler.bind(this));
    this.log(`Listening on ws://localhost:${port}`);
  }

  async connectionHandler(ws, req) {
    try {
      if (!req.url) {
        this.log('No URL provided, closing connection.');
        ws.close();
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      if (pathname !== '/') {
        this.log(`Invalid pathname: "${pathname}"`);
        ws.close();
        return;
      }

      // Instantiate new client
      this.log(`Connecting with key "${this.apiKey.slice(0, 3)}..."`);
      const client = new RealtimeClient({ apiKey: this.apiKey });

      // Relay: OpenAI Realtime API Event -> Browser Event
      client.realtime.on('server.*', (event) => {
        try {
          if (event.type === 'response.done' && event.response.status === 'failed') {
            this.log('Response failed with details:', JSON.stringify(event.response.status_details, null, 2));
          }
          
          this.log(`Relaying "${event.type}" to Client:`);
          ws.send(JSON.stringify(event));
        } catch (error) {
          this.log('Error sending event to client:', error);
        }
      });

      // Relay: Browser Event -> OpenAI Realtime API Event
      // We need to queue data waiting for the OpenAI connection
      const messageQueue = [];
      const messageHandler = (data) => {
        try {
          const event = JSON.parse(data);
          this.log(`Relaying "${event.type}" to OpenAI`);
          client.realtime.send(event.type, event);
        } catch (e) {
          console.error('Error details:', e);
          this.log(`Error parsing event from client: ${data}`);
        }
      };
      ws.on('message', async (data) => {
        try {
          const event = JSON.parse(data);
          
          // Regular message handling
          if (!client.isConnected()) {
            messageQueue.push(data);
          } else {
            messageHandler(data);
          }
        } catch (e) {
          console.error('=== Message Handler Error ===');
          console.error('Error details:', e);
          console.error('=== End Error ===\n');
        }
      });
      ws.on('close', () => client.disconnect());

      // Connect to OpenAI Realtime API
      try {
        this.log(`Connecting to OpenAI...`);
        await client.connect();
      } catch (e) {
        this.log(`Error connecting to OpenAI: ${e.message}`);
        ws.close();
        return;
      }
      this.log(`Connected to OpenAI successfully!`);
      while (messageQueue.length) {
        messageHandler(messageQueue.shift());
      }
      client.on('conversation.updated', ({ item, delta }) => {
        const items = client.conversation.getItems(); // can use this to render all items
        console.log('items', items);
        /* includes all changes to conversations, delta may be populated */
      });

      // Add error event handler for the WebSocket
      ws.on('error', (error) => {
        this.log('WebSocket error:', error);
      });
    } catch (error) {
      this.log('Unexpected error in connection handler:', error);
      try {
        ws.close();
      } catch (closeError) {
        this.log('Error while closing websocket:', closeError);
      }
    }
  }

  log(...args) {
    console.log(`[RealtimeRelay]`, ...args);
  }

  
}