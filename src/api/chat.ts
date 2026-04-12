import axiosInstance from './axiosInstance'

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1')
  .replace('http://', 'ws://')
  .replace('https://', 'wss://')

export interface Contact {
  id: string
  full_name: string
  email: string
  role: 'employee' | 'manager' | 'admin'
}

export interface ChatMessage {
  type?: string
  sender_id: string
  sender_name: string
  text: string
  timestamp: string
  status: 'sent' | 'read'
}

export interface ChatRoom {
  id: string
  employee_id: string
  manager_id: string
  topic: string
  messages: ChatMessage[]
  status: 'open' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export const chatApi = {
  /** Get list of users available to chat with */
  getContacts: async (): Promise<Contact[]> => {
    const res = await axiosInstance.get<Contact[]>('/users/contacts')
    return res.data
  },

  /** Get all chats for the current user */
  getMyChats: async (): Promise<ChatRoom[]> => {
    const res = await axiosInstance.get<ChatRoom[]>('/chat/my-chats')
    return res.data
  },

  /** Create a new chat with a manager/admin */
  createChat: async (managerId: string, topic: string): Promise<ChatRoom> => {
    const res = await axiosInstance.post<ChatRoom>('/chat/create', {
      manager_id: managerId,
      topic,
    })
    return res.data
  },

  /** Send a REST message (fallback if WS not connected) */
  sendMessage: async (chatId: string, text: string): Promise<ChatRoom> => {
    const res = await axiosInstance.post<ChatRoom>(`/chat/${chatId}/send`, { text })
    return res.data
  },

  clearMessages: async (chatId: string): Promise<ChatRoom> => {
    const res = await axiosInstance.delete<ChatRoom>(`/chat/${chatId}/messages`)
    return res.data
  },
}

/** 
 * Creates a WebSocket connection to a specific chat room.
 * Returns the WebSocket instance.
 */
export function connectToChatWS(
  chatId: string,
  token: string,
  onMessage: (msg: ChatMessage) => void,
  onHistoryBatch: (msgs: ChatMessage[]) => void,
  onClose?: () => void,
  onError?: () => void,
): WebSocket {
  const url = `${WS_BASE}/ws/chat/${chatId}?token=${token}`
  const ws = new WebSocket(url)

  ws.onopen = () => {
    console.log(`[WS] Connected to chat ${chatId}`)
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'history_batch') {
        onHistoryBatch(data.messages || [])
      } else if (data.type === 'message') {
        onMessage(data)
      }
    } catch (e) {
      console.error('[WS] Failed to parse message', e)
    }
  }

  ws.onclose = () => {
    console.log(`[WS] Disconnected from chat ${chatId}`)
    onClose?.()
  }

  ws.onerror = (e) => {
    console.error('[WS] Error:', e)
    onError?.()
  }

  return ws
}
