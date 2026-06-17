'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send, Sparkles, MessageCircle, Loader as Loader2, Volume2, Copy,
  ThumbsUp, ThumbsDown, Search, Bookmark, MapPin, FileText,
  ExternalLink, Landmark, BookOpen, Scale, ChevronRight,
  Brain, Lightbulb, Archive, Trash2, Edit3, Plus, X, Globe, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/app-layout';
import { supabase } from '@/lib/supabase';
import { audioSynth } from '@/lib/audio';

interface Citation {
  document_id: string;
  title: string;
  page_number: number;
  snippet: string;
  relevance_score: number;
  citation_number: number;
  is_primary: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  confidence_score: number;
  feedback: 'helpful' | 'not_helpful' | null;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
}

const STARTER_QUESTIONS = [
  'Show me land revenue records from Mysuru',
  'What court judgments are available for Belagavi?',
  'Find temple endowment grants in Hampi'
];

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state parameter for specific document context
  const documentIdLock = searchParams.get('document_id') || searchParams.get('doc') || '';
  const districtFilter = searchParams.get('district') || '';
  const categoryFilter = searchParams.get('category') || '';
  const [lockedDocTitle, setLockedDocTitle] = useState<string>('');

  // Authentication states
  const [user, setUser] = useState<any>(null);

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Conversation input state
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sidebar visibility
  const [showSidebar, setShowSidebar] = useState(true);

  // sound FX
  const soundEnabled = () => localStorage.getItem('neurive_sound_fx') === 'true';

  // 1. Fetch locked document title if loaded in document-specific mode
  useEffect(() => {
    if (documentIdLock) {
      const fetchDocTitle = async () => {
        try {
          const { data } = await supabase
            .from('documents')
            .select('title')
            .eq('id', documentIdLock)
            .maybeSingle();

          if (data) {
            setLockedDocTitle(data.title);
          } else {
            // fallback check in legacy archives
            const { data: legacyData } = await supabase
              .from('archives')
              .select('title')
              .eq('id', documentIdLock)
              .maybeSingle();
            if (legacyData) setLockedDocTitle(legacyData.title);
          }
        } catch (err) {
          console.warn('Failed to fetch locked document title:', err);
        }
      };
      fetchDocTitle();
    } else {
      setLockedDocTitle('');
    }
  }, [documentIdLock]);

  // 2. Initialize sessions and messages based on Authentication
  useEffect(() => {
    const initializeChat = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Logged-in user: Sync with Supabase
        await loadDatabaseSessions(currentUser.id);
      } else {
        // Guest user: Fallback to local storage
        loadLocalStorageSessions();
      }
    };
    initializeChat();
  }, []);

  // 3. Load DB Sessions for authenticated user
  const loadDatabaseSessions = async (userId: string) => {
    try {
      const { data: dbSessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (dbSessions && dbSessions.length > 0) {
        // For each session, fetch messages
        const formattedSessions: ChatSession[] = [];
        for (const sess of dbSessions) {
          const { data: messagesData } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sess.id)
            .order('created_at', { ascending: true });

          formattedSessions.push({
            id: sess.id,
            title: sess.title,
            messages: (messagesData || []).map(m => ({
              id: m.id,
              role: m.role,
              content: m.content,
              citations: m.citations || [],
              confidence_score: parseFloat(m.confidence_score || '0.0'),
              feedback: m.feedback || null,
              created_at: m.created_at
            })),
            created_at: sess.created_at
          });
        }
        setSessions(formattedSessions);
        setActiveSessionId(formattedSessions[0].id);
      } else {
        // Initialize default blank session in DB
        const newSessId = await createDatabaseSession(userId, 'Royal RAG Parchment I');
        if (newSessId) {
          setSessions([{
            id: newSessId,
            title: 'Royal RAG Parchment I',
            messages: [createAssistantWelcomeMessage()],
            created_at: new Date().toISOString()
          }]);
          setActiveSessionId(newSessId);
        }
      }
    } catch (err) {
      console.warn('Failed to load database chat sessions, falling back to local storage:', err);
      loadLocalStorageSessions();
    }
  };

  const createAssistantWelcomeMessage = (): ChatMessage => ({
    id: 'welcome',
    role: 'assistant',
    content: `Welcome to Neurive AI Chat! I'm your intelligent assistant for exploring Karnataka's digital archive.

You can ask me questions about land revenue records, court judgments, temple inscriptions, and historical maps. I answer only using indexed records and provide detailed citations.

What would you like to explore today?`,
    citations: [],
    confidence_score: 1.0,
    feedback: null,
    created_at: new Date().toISOString()
  });

  const createDatabaseSession = async (userId: string, title: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{ user_id: userId, title }])
        .select('id')
        .single();

      if (error) throw error;
      
      // Save initial welcome message
      const welcome = createAssistantWelcomeMessage();
      await supabase.from('chat_messages').insert([{
        session_id: data.id,
        user_id: userId,
        role: welcome.role,
        content: welcome.content,
        citations: welcome.citations,
        confidence_score: welcome.confidence_score,
        feedback: welcome.feedback
      }]);

      return data.id;
    } catch (err) {
      console.warn('Failed to insert new session in database:', err);
      return null;
    }
  };

  // 4. Guest Mode Local Storage Sessions Loader
  const loadLocalStorageSessions = () => {
    const saved = localStorage.getItem('neurive_guest_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      } catch {}
    }
    const defaultSess: ChatSession = {
      id: 'guest-default',
      title: 'Local Scroll I',
      messages: [createAssistantWelcomeMessage()],
      created_at: new Date().toISOString()
    };
    setSessions([defaultSess]);
    setActiveSessionId('guest-default');
    localStorage.setItem('neurive_guest_sessions', JSON.stringify([defaultSess]));
  };

  // Active messages
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentMessages = activeSession?.messages || [];

  // Create new session
  const handleCreateNewSession = async () => {
    if (soundEnabled()) audioSynth.playPaperRustle();
    const title = `Archival parchment scroll ${sessions.length + 1}`;
    
    if (user) {
      // Create session in database
      const newId = await createDatabaseSession(user.id, title);
      if (newId) {
        const newSess: ChatSession = {
          id: newId,
          title,
          messages: [createAssistantWelcomeMessage()],
          created_at: new Date().toISOString()
        };
        setSessions(prev => [newSess, ...prev]);
        setActiveSessionId(newId);
      }
    } else {
      // Guest mode
      const newId = `guest-${Date.now()}`;
      const newSess: ChatSession = {
        id: newId,
        title,
        messages: [createAssistantWelcomeMessage()],
        created_at: new Date().toISOString()
      };
      const updated = [newSess, ...sessions];
      setSessions(updated);
      setActiveSessionId(newId);
      localStorage.setItem('neurive_guest_sessions', JSON.stringify(updated));
    }
  };

  // Delete session
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (soundEnabled()) audioSynth.playPaperRustle();

    const filtered = sessions.filter(s => s.id !== id);

    if (user) {
      try {
        const { error } = await supabase
          .from('chat_sessions')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Failed to delete session from DB:', err);
      }
    }

    if (filtered.length === 0) {
      if (user) {
        const newId = await createDatabaseSession(user.id, 'Royal RAG Parchment I');
        if (newId) {
          setSessions([{
            id: newId,
            title: 'Royal RAG Parchment I',
            messages: [createAssistantWelcomeMessage()],
            created_at: new Date().toISOString()
          }]);
          setActiveSessionId(newId);
        }
      } else {
        loadLocalStorageSessions();
      }
    } else {
      setSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      if (!user) {
        localStorage.setItem('neurive_guest_sessions', JSON.stringify(filtered));
      }
    }
  };

  // Rename session
  const startRenameSession = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setRenameInput(currentTitle);
  };

  const handleSaveRename = async (id: string) => {
    if (!renameInput.trim()) return;

    if (user) {
      try {
        const { error } = await supabase
          .from('chat_sessions')
          .update({ title: renameInput.trim() })
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Failed to rename session in DB:', err);
      }
    }

    const updated = sessions.map(s => s.id === id ? { ...s, title: renameInput.trim() } : s);
    setSessions(updated);
    setEditingSessionId(null);

    if (!user) {
      localStorage.setItem('neurive_guest_sessions', JSON.stringify(updated));
    }
  };

  // 5. Submit feedback PATCH handler
  const handleFeedback = async (messageId: string, feedbackType: 'helpful' | 'not_helpful') => {
    if (soundEnabled()) audioSynth.playPaperRustle();

    // Optimistically update UI
    setSessions(prev => prev.map(sess => {
      if (sess.id === activeSessionId) {
        return {
          ...sess,
          messages: sess.messages.map(m => m.id === messageId ? { ...m, feedback: feedbackType } : m)
        };
      }
      return sess;
    }));

    if (user) {
      try {
        const response = await fetch('/api/archive-chat/feedback', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_id: messageId, feedback: feedbackType })
        });
        const resJson = await response.json();
        if (!resJson.success) throw new Error(resJson.error);
      } catch (err) {
        console.warn('Failed to log feedback securely on server:', err);
      }
    } else {
      // Sync guest feedback to localStorage
      const updated = sessions.map(sess => {
        if (sess.id === activeSessionId) {
          return {
            ...sess,
            messages: sess.messages.map(m => m.id === messageId ? { ...m, feedback: feedbackType } : m)
          };
        }
        return sess;
      });
      localStorage.setItem('neurive_guest_sessions', JSON.stringify(updated));
    }
  };

  // Narration Voice TTS Reader
  const handleReadAloud = (messageId: string, content: string) => {
    if (typeof window === 'undefined') return;

    if (speakingMsgId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop active speaking

    const cleanText = content.replace(/\[\d+\]/g, '').replace(/\*\*/g, '').replace(/- /g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose pleasant localized voice
    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('GB')) || voices[0];
    if (indVoice) utterance.voice = indVoice;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Link Builder preferring /documents dynamic route and falling back to /archive
  const getDocLink = (id: string) => {
    const isLegacyMock = id.startsWith('arch-') || id.startsWith('wiki-');
    return isLegacyMock ? `/archive/${id}` : `/documents/${id}`;
  };

  // 6. RAG Chat Submission Pipeline
  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;
    setInputValue('');
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      citations: [],
      confidence_score: 1.0,
      feedback: null,
      created_at: new Date().toISOString()
    };

    // Append user query to UI
    let currentSessId = activeSessionId;
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessId) {
        return { ...s, messages: [...s.messages, userMsg] };
      }
      return s;
    }));

    try {
      const response = await fetch('/api/archive-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: user ? currentSessId : undefined,
          document_id: documentIdLock || undefined,
          filters: {
            district: districtFilter || undefined,
            category: categoryFilter || undefined
          }
        })
      });

      if (!response.ok) {
        throw new Error('RAG search server endpoint responded with error status');
      }

      const resJson = await response.json();
      if (resJson.success) {
        const assistantMsgId = `assistant-${Date.now()}`;
        const assistantMsg: ChatMessage = {
          id: resJson.citations?.[0]?.message_id || assistantMsgId,
          role: 'assistant',
          content: resJson.answer,
          citations: resJson.citations || [],
          confidence_score: resJson.confidence_score || 0.0,
          feedback: null,
          created_at: new Date().toISOString()
        };

        // If new session was generated on the server (first query in DB)
        if (resJson.session_id && currentSessId !== resJson.session_id) {
          currentSessId = resJson.session_id;
          setActiveSessionId(resJson.session_id);
        }

        // Simulate typing animation streaming
        await streamTypingAnimation(assistantMsg, currentSessId);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an indexing timeout or generation failure. Please check your credentials and retry.',
        citations: [],
        confidence_score: 0.0,
        feedback: null,
        created_at: new Date().toISOString()
      };
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessId) {
          return { ...s, messages: [...s.messages, errMsg] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
      // Reload sessions to refresh names/titles from database
      if (user) {
        loadDatabaseSessions(user.id);
      }
    }
  };

  // Typing animation streamer with typing soundFX tick-tacking
  const streamTypingAnimation = async (msg: ChatMessage, sessionId: string) => {
    const chars = msg.content.split('');
    let runningContent = '';
    const typingSpeed = 10; // ms

    // Push initial empty assistant message card to block layout
    const initialPlaceholder: ChatMessage = {
      ...msg,
      content: ''
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: [...s.messages, initialPlaceholder]
        };
      }
      return s;
    }));
    setTypingMessageId(msg.id);

    for (let i = 0; i < chars.length; i++) {
      await new Promise(r => setTimeout(r, typingSpeed));
      runningContent += chars[i];

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: s.messages.map(m => m.id === msg.id ? { ...m, content: runningContent } : m)
          };
        }
        return s;
      }));

      if (i % 2 === 0 && soundEnabled()) {
        audioSynth.playTypewriterClick(false);
      }
    }

    if (soundEnabled()) {
      audioSynth.playTypewriterClick(true);
    }
    setTypingMessageId(null);

    // Sync guest messages to localStorage
    if (!user) {
      setSessions(prev => {
        localStorage.setItem('neurive_guest_sessions', JSON.stringify(prev));
        return prev;
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSessionId]);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto overflow-hidden font-sans bg-background border border-white/5 shadow-2xl relative">
        
        {/* Glassmorphic WALNUT sidebar */}
        {showSidebar && (
          <aside className="w-64 border-r border-white/10 bg-black/45 backdrop-blur-md shrink-0 h-full p-4 flex flex-col justify-between select-none relative z-20">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white font-serif flex items-center gap-1.5">
                  <Archive className="h-4 w-4 text-primary" />
                  Scroll History
                </span>
                <button
                  onClick={handleCreateNewSession}
                  className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                  title="Create New Scroll Session"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Scrolls navigation */}
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {sessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const isEditing = editingSessionId === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (!isEditing) {
                          setActiveSessionId(s.id);
                          if (soundEnabled()) audioSynth.playPaperRustle();
                        }
                      }}
                      className={`group w-full flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/15 border-primary/30 text-white font-semibold'
                          : 'border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 mr-2">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={renameInput}
                            onChange={(e) => setRenameInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(s.id);
                              else if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            className="h-5 text-xs w-full px-1 py-0 border border-primary/45 rounded bg-black text-white"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate">{s.title}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveRename(s.id); }}
                            className="p-0.5 hover:bg-white/5 rounded text-white"
                          >
                            ✓
                          </button>
                        ) : (
                          <button
                            onClick={(e) => startRenameSession(s.id, s.title, e)}
                            className="p-0.5 hover:bg-white/5 rounded text-muted-foreground hover:text-white"
                            title="Rename scroll"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="p-0.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 rounded"
                          title="Delete scroll"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cabinet User mode info */}
            <div className="border border-white/10 bg-white/5 p-3 rounded-lg flex flex-col gap-1 text-[10px] text-muted-foreground leading-normal">
              <span className="font-bold text-white tracking-wide block uppercase font-serif">Registry Session</span>
              <p>
                {user 
                  ? `Signed in as archivist cloud cabinet.` 
                  : `Guest Mode. Chat scrolls will reside in local storage browser memory.`}
              </p>
            </div>
          </aside>
        )}

        {/* Central Scriptorium desk */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 justify-between overflow-hidden relative z-10">
          
          {/* Header plate */}
          <div className="mb-4 border-b border-white/10 pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <MessageCircle className="h-5 w-5 text-primary animate-pulse" />
                <h1 className="text-lg font-bold text-white font-serif tracking-wide">Archival AI RAG Assistant</h1>
                {!user && (
                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                    Sandbox Guest Mode
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Inquire historical facts. AI will search vector chunks and ground answers strictly in documents evidence.
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-[10px] h-8 border-white/10 bg-white/5 text-foreground"
            >
              {showSidebar ? 'Hide Scrolls' : 'Show Scrolls'}
            </Button>
          </div>

          {/* Query context lock banner */}
          {documentIdLock && (
            <div className="mb-4 p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs text-muted-foreground animate-slide-up select-none">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 animate-pulse text-primary" />
                <span>
                  Query Context Locked: <strong className="text-white">&quot;{lockedDocTitle || 'Target Document'}&quot;</strong>
                </span>
              </div>
              <button 
                onClick={() => router.push('/chat')}
                className="text-[10px] uppercase font-bold text-muted-foreground hover:text-white flex items-center gap-0.5 transition-colors"
                title="Remove Document Lock"
              >
                <X className="h-3.5 w-3.5" />
                Unlock
              </button>
            </div>
          )}

          {/* District filter banner */}
          {districtFilter && (
            <div className="mb-4 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 flex items-center justify-between text-xs text-muted-foreground animate-slide-up select-none">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 animate-pulse text-rose-400" />
                <span>
                  Filtered by District: <strong className="text-white">&quot;{districtFilter}&quot;</strong>
                </span>
              </div>
              <button 
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('district');
                  router.push(`/chat?${params.toString()}`);
                }}
                className="text-[10px] uppercase font-bold text-muted-foreground hover:text-white flex items-center gap-0.5 transition-colors"
                title="Remove District Filter"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          )}

          {/* Category filter banner */}
          {categoryFilter && (
            <div className="mb-4 p-3 rounded-lg border border-teal-500/20 bg-teal-500/5 flex items-center justify-between text-xs text-muted-foreground animate-slide-up select-none">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 animate-pulse text-teal-400" />
                <span>
                  Filtered by Category: <strong className="text-white">&quot;{categoryFilter.replace(/-/g, ' ')}&quot;</strong>
                </span>
              </div>
              <button 
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('category');
                  router.push(`/chat?${params.toString()}`);
                }}
                className="text-[10px] uppercase font-bold text-muted-foreground hover:text-white flex items-center gap-0.5 transition-colors"
                title="Remove Category Filter"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          )}

          {/* Chat Messages scroll area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1 scrollbar-thin">
            {currentMessages.map((message) => {
              const isTyping = typingMessageId === message.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-xs sm:max-w-md lg:max-w-2xl px-4 py-3 rounded-lg relative overflow-hidden transition-all duration-300 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none shadow-md'
                        : 'bg-white/5 text-foreground rounded-bl-none border border-white/10 shadow-lg backdrop-blur-sm'
                    }`}
                  >
                    {/* Retro wax seal watermarked indicator */}
                    {message.role === 'assistant' && (
                      <div className="absolute -top-1.5 -right-1.5 p-2 bg-primary/5 rounded-full scale-75 select-none pointer-events-none opacity-20">
                        <Sparkles className="h-10 w-10 text-primary animate-spin-slow" />
                      </div>
                    )}

                    {/* Content text block formatting citations */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={i} className="font-bold mt-2.5 mb-1 text-white">{line.replace(/\*\*/g, '')}</p>;
                        }
                        if (line.startsWith('- ')) {
                          return <p key={i} className="pl-3.5 relative before:content-['•'] before:absolute before:left-0 before:top-0 before:text-primary before:opacity-70">{line.substring(2)}</p>;
                        }
                        if (line.trim() === '') return <br key={i} />;
                        
                        // Parse [1], [2] citation bracket references into clean highlights
                        let textNode: React.ReactNode = line.replace(/\*\*([^*]+)\*\*/g, '$1');
                        return <span key={i}>{textNode}{i < message.content.split('\n').length - 1 ? '\n' : ''}</span>;
                      })}
                    </div>

                    {/* Grounded Citation Cards Panel */}
                    {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2 select-none">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          retrieved evidence citations ({message.citations.length})
                        </span>
                        
                        <div className="grid grid-cols-1 gap-2.5 mt-1">
                          {message.citations.map((c) => (
                            <Card key={c.citation_number} className="border-white/5 bg-black/40 hover:border-primary/20 transition-all duration-300 overflow-hidden">
                              <CardContent className="p-3 space-y-2 text-xs">
                                <div className="flex justify-between items-center gap-2">
                                  <span className="font-serif font-bold text-white flex items-center gap-1">
                                    <span className="inline-flex items-center justify-center h-4 w-4 rounded bg-primary/10 border border-primary/20 text-[9px] font-mono text-primary mr-1">
                                      {c.citation_number}
                                    </span>
                                    {c.title} — Page {c.page_number}
                                  </span>
                                  
                                  <Badge className="bg-primary/15 text-primary border border-primary/25 text-[9px] shrink-0 font-mono">
                                    Relevance {Math.round(c.relevance_score * 100)}%
                                  </Badge>
                                </div>
                                
                                <p className="text-[11px] text-muted-foreground italic leading-relaxed border-l border-primary/25 pl-2 font-mono">
                                  &quot;{c.snippet}&quot;
                                </p>
                                
                                <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[10px]">
                                  <span className="text-[9px] text-muted-foreground">
                                    {c.is_primary ? 'Primary Evidence Source' : 'Secondary Context Source'}
                                  </span>
                                  
                                  <button
                                    onClick={() => router.push(getDocLink(c.document_id))}
                                    className="text-primary hover:text-primary-foreground font-semibold flex items-center gap-0.5"
                                  >
                                    View Cited Document
                                    <ExternalLink className="h-3 w-3 inline" />
                                  </button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action controllers footer */}
                    {message.role === 'assistant' && !isTyping && (
                      <div className="flex items-center gap-2.5 mt-3 pt-2 border-t border-white/10 select-none">
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                          title="Copy Answer Text"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleReadAloud(message.id, message.content)}
                          className={`p-1 rounded transition-colors ${
                            speakingMsgId === message.id
                              ? 'bg-primary/20 text-white'
                              : 'hover:bg-white/10 text-muted-foreground hover:text-white'
                          }`}
                          title="Read Answer Aloud"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                        
                        {message.confidence_score > 0 && (
                          <span className="text-[9px] font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            RAG Confidence: {Math.round(message.confidence_score * 100)}%
                          </span>
                        )}

                        <div className="ml-auto flex items-center gap-1.5">
                          {message.feedback === null ? (
                            <>
                              <button
                                onClick={() => handleFeedback(message.id, 'helpful')}
                                className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-green-400 transition-colors"
                                title="This response was helpful"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleFeedback(message.id, 'not_helpful')}
                                className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-rose-400 transition-colors"
                                title="This response was not helpful"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                              {message.feedback === 'helpful' ? (
                                <>
                                  <ThumbsUp className="h-3.5 w-3.5 text-green-500 fill-green-500/10" />
                                  Liked
                                </>
                              ) : (
                                <>
                                  <ThumbsDown className="h-3.5 w-3.5 text-rose-500 fill-rose-500/10" />
                                  Disliked
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Search index load progress animation spinner */}
            {isLoading && !typingMessageId && (
              <div className="flex justify-start animate-pulse select-none">
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 text-foreground rounded-bl-none border border-white/10 shadow-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-medium font-serif">Querying digital parchment catalog index...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Starter Stamps */}
          {currentMessages.length <= 1 && !isLoading && (
            <div className="mb-4 space-y-2 select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
                Select starter scroll inquiry
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 animate-slide-up">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="text-left text-xs p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/20 transition-all font-serif italic text-muted-foreground hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* central prompt input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="space-y-2 z-10 relative"
          >
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  documentIdLock 
                    ? "Inquire about this specific document..." 
                    : "Submit inquiry about lands, courts, temples... (Kannada, Hindi, English)"
                }
                disabled={isLoading}
                className="text-sm bg-black/45 border-white/10 focus:border-primary/50 text-white"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-primary text-primary-foreground font-bold px-5 shrink-0 shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

        </div>
      </div>
    </AppLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
