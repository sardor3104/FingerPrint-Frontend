import { useState, useEffect, useRef, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Send, Search, Trash2, Paperclip, Plus,
  Loader2, Wifi, WifiOff, X, MessageSquare
} from 'lucide-react'
import {
  chatApi,
  connectToChatWS,
  Contact,
  ChatRoom,
  ChatMessage
} from '@/api/chat'

const ChatInterface = () => {
  const { user, token } = useAuthStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [contacts, setContacts] = useState<Contact[]>([])
  const [myChats, setMyChats] = useState<ChatRoom[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null)
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [sendingMsg, setSendingMsg] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatTopic, setNewChatTopic] = useState('')
  const [creatingChat, setCreatingChat] = useState(false)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load contacts & existing chats
  const loadChats = async (isInitial = false) => {
    if (isInitial) setLoadingContacts(true)
    try {
      const [c, chats] = await Promise.all([
        chatApi.getContacts(),
        chatApi.getMyChats(),
      ])
      setContacts(c)
      setMyChats(chats)
    } catch (e) {
      if (isInitial) toast.error('Kontaktlarni yuklashda xato')
    } finally {
      if (isInitial) setLoadingContacts(false)
    }
  }

  useEffect(() => {
    loadChats(true)
    
    // Background polling every 5 seconds to catch new chats/messages
    // when WebSocket is only connected to the active chat
    const interval = setInterval(() => loadChats(false), 5000)
    return () => clearInterval(interval)
  }, [])

  // Connect WebSocket when active chat changes
  const connectWS = useCallback((chat: ChatRoom) => {
    // Close old connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setWsConnected(false)
    }

    if (!token) return

    const ws = connectToChatWS(
      chat.id,
      token,
      (msg) => {
        if (msg.type === 'clear_chat') {
          setMessages([])
          toast.info('Chat tozalandi')
        } else {
          setMessages((prev) => [...prev, msg])
        }
      },
      (batch) => {
        setMessages(batch)
      },
      () => setWsConnected(false),
      () => {
        setWsConnected(false)
        toast.error('Chat ulanishi uzildi')
      }
    )
    ws.onopen = () => setWsConnected(true)
    wsRef.current = ws
  }, [token])

  useEffect(() => {
    return () => {
      wsRef.current?.close()
    }
  }, [])

  const handleSelectChat = (chat: ChatRoom) => {
    setActiveChat(chat)
    setMessages([])

    // Find contact info for display
    const contactId = user?.role === 'employee' ? chat.manager_id : chat.employee_id
    const contact = contacts.find(c => c.id === contactId) || {
      id: contactId,
      full_name: 'Unknown User',
      email: '',
      role: 'employee' as const
    }
    setActiveContact(contact)
    connectWS(chat)
  }

  const handleCreateChat = async (contact: Contact) => {
    if (!newChatTopic.trim()) {
      toast.error('Mavzu kiriting')
      return
    }
    setCreatingChat(true)
    try {
      const chat = await chatApi.createChat(contact.id, newChatTopic)
      setMyChats((prev) => [chat, ...prev])
      setNewChatTopic('')
      setShowNewChat(false)
      handleSelectChat(chat)
      toast.success('Yangi chat yaratildi!')
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Chat yaratishda xato')
    } finally {
      setCreatingChat(false)
    }
  }

  const handleSend = async () => {
    if (!message.trim() || !activeChat) return
    setSendingMsg(true)
    const text = message.trim()
    setMessage('')

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ text }))
        // Note: We don't optimistically append here because the WS server 
        // will broadcast the message back to us, preventing duplicates.
      } else {
        // REST fallback
        await chatApi.sendMessage(activeChat.id, text)
        toast.info('WebSocket ulanmagan, REST orqali yuborildi')
        
        // Local append only for REST fallback since WS won't push it back
        const optimistic: ChatMessage = {
          sender_id: user?.id || '',
          sender_name: user?.full_name || 'Me',
          text,
          timestamp: new Date().toISOString(),
          status: 'sent'
        }
        setMessages((prev) => [...prev, optimistic])
      }
    } catch (e) {
      toast.error('Xabar yuborishda xato')
    } finally {
      setSendingMsg(false)
      inputRef.current?.focus()
    }
  }

  const handleClearChat = async () => {
    if (!activeChat) return
    if (!confirm("Haqiqatan ham barcha xabarlarni o'chirmoqchimisiz?")) return
    try {
      await chatApi.clearMessages(activeChat.id)
      setMessages([])
      toast.success("Chat xabarlari tozalandi")
    } catch (e) {
      toast.error("O'chirishda xatolik yuz berdi")
    }
  }

  const filteredContacts = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '--:--'
    }
  }

  const isMyMessage = (msg: ChatMessage) => msg.sender_id === user?.id

  // Find existing chat with a contact
  const findExistingChat = (contact: Contact): ChatRoom | undefined => {
    return myChats.find(
      (c) => c.employee_id === contact.id || c.manager_id === contact.id
    )
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden">
        {/* Contacts / Chats Sidebar */}
        <Card className="w-80 border-primary/10 flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-base">Xabarlar</CardTitle>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Yangi chat"
                onClick={() => setShowNewChat(!showNewChat)}
              >
                <Plus size={14} />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Qidirish..."
                className="h-9 pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingContacts ? (
              <div className="flex flex-col space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Kontakt topilmadi
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const existingChat = findExistingChat(contact)
                const isActive = activeContact?.id === contact.id
                return (
                  <div
                    key={contact.id}
                    className={cn(
                      'flex items-center p-3 rounded-lg cursor-pointer transition-all',
                      isActive
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-accent/20 border border-transparent'
                    )}
                    onClick={() => {
                      if (existingChat) {
                        handleSelectChat(existingChat)
                        setActiveContact(contact)
                      } else {
                        setActiveContact(contact)
                        setShowNewChat(true)
                      }
                    }}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                        {getInitials(contact.full_name)}
                      </div>
                      <div className={cn(
                        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
                        contact.role === 'admin' ? 'bg-yellow-500' :
                        contact.role === 'manager' ? 'bg-blue-500' : 'bg-green-500'
                      )} />
                    </div>
                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold truncate">{contact.full_name}</p>
                        {existingChat && (
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                            Chat bor
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground capitalize">{contact.role}</p>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Chat Main Area */}
        {activeChat && activeContact ? (
          <Card className="flex-1 border-primary/10 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <CardHeader className="border-b py-3 px-5 flex flex-row items-center justify-between flex-shrink-0">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {getInitials(activeContact.full_name)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-bold">{activeContact.full_name}</p>
                  <div className="flex items-center space-x-1">
                    {wsConnected ? (
                      <>
                        <Wifi size={10} className="text-green-500" />
                        <p className="text-[10px] text-green-500">Real-time ulangan</p>
                      </>
                    ) : (
                      <>
                        <WifiOff size={10} className="text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground">Ulanmoqda...</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={handleClearChat} title="Chatni tozalash">
                <Trash2 size={16} />
              </Button>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <MessageSquare size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">Hali xabar yo'q</p>
                  <p className="text-xs mt-1">Birinchi xabarni yuboring!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = isMyMessage(msg)
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex flex-col max-w-[70%] animate-in fade-in duration-200',
                        isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                      )}
                    >
                      {!isMine && (
                        <span className="text-[10px] text-muted-foreground mb-1 px-1">
                          {msg.sender_name}
                        </span>
                      )}
                      <div className={cn(
                        'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md'
                          : 'bg-accent/40 rounded-tl-sm'
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input Area */}
            <div className="px-4 py-3 border-t flex items-center space-x-2 bg-accent/5 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary flex-shrink-0">
                <Paperclip size={18} />
              </Button>
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Xabar yozing..."
                className="h-11 rounded-xl bg-background shadow-inner"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                size="icon"
                className="h-11 w-11 rounded-full shadow-lg flex-shrink-0"
                disabled={!message.trim() || sendingMsg}
                onClick={handleSend}
              >
                {sendingMsg ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} className="ml-0.5" />
                )}
              </Button>
            </div>
          </Card>
        ) : (
          /* Empty State / New Chat Panel */
          <Card className="flex-1 border-primary/10 flex flex-col items-center justify-center">
            {showNewChat && activeContact ? (
              <div className="w-full max-w-sm p-6 space-y-4">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl mx-auto mb-3">
                    {getInitials(activeContact.full_name)}
                  </div>
                  <h3 className="font-bold">{activeContact.full_name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{activeContact.role}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Yangi chat mavzusi:</p>
                  <Input
                    placeholder="Masalan: Ish haqida savol"
                    value={newChatTopic}
                    onChange={(e) => setNewChatTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateChat(activeContact)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setShowNewChat(false); setActiveContact(null) }}
                  >
                    <X size={14} className="mr-1" /> Bekor
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleCreateChat(activeContact)}
                    disabled={creatingChat || !newChatTopic.trim()}
                  >
                    {creatingChat ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                    Chat yaratish
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground space-y-3">
                <MessageSquare size={56} className="mx-auto opacity-20" />
                <p className="font-medium">Chat tanlang</p>
                <p className="text-sm">Chap tarafdagi kontaktni bosing</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

export default ChatInterface
