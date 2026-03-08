import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StatusBar, Platform, useWindowDimensions, FlatList,
  KeyboardAvoidingView, Animated, Pressable,
} from "react-native";
import { router } from "expo-router";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, Search, Send, Phone, Video,
  MoreVertical, Check, CheckCheck, Paperclip,
  Smile, Mic, Image as ImageIcon, MapPin,
  Clock, Star, Wrench, Zap, Droplets, Wind,
  ChevronRight, X,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
type MessageStatus = "sent" | "delivered" | "read";
type MessageType   = "text" | "quick_reply" | "location" | "service_card";

interface Message {
  id:        string;
  text:      string;
  sender:    "me" | "other";
  time:      string;
  status:    MessageStatus;
  type:      MessageType;
  reactions?: string[];
}

interface Conversation {
  id:          string;
  name:        string;
  avatar:      string;
  avatarColor: string;
  lastMessage: string;
  time:        string;
  unread:      number;
  online:      boolean;
  service:     string;
  serviceIcon: any;
  serviceColor:string;
  jobStatus:   "ongoing" | "completed" | "pending";
  rating?:     number;
}

/* ══════════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════════ */
const CONVERSATIONS: Conversation[] = [
  {
    id: "1", name: "Hassan El-Sayed", avatar: "HE", avatarColor: "#3B82F6",
    lastMessage: "I'll be there in 10 minutes ✅", time: "2m ago",
    unread: 2, online: true, service: "Plumbing", serviceIcon: Droplets,
    serviceColor: "#3B82F6", jobStatus: "ongoing",
  },
  {
    id: "2", name: "Mohamed Farouk", avatar: "MF", avatarColor: "#F59E0B",
    lastMessage: "Job completed! Please rate my service 🌟", time: "1h ago",
    unread: 0, online: false, service: "Electrical", serviceIcon: Zap,
    serviceColor: "#F59E0B", jobStatus: "completed", rating: 4.9,
  },
  {
    id: "3", name: "Ahmed Nasser", avatar: "AN", avatarColor: "#10B981",
    lastMessage: "Sure, I can come tomorrow morning", time: "3h ago",
    unread: 1, online: true, service: "AC Repair", serviceIcon: Wind,
    serviceColor: "#06B6D4", jobStatus: "pending",
  },
  {
    id: "4", name: "Karim Abdallah", avatar: "KA", avatarColor: "#8B5CF6",
    lastMessage: "The parts will arrive by Thursday", time: "Yesterday",
    unread: 0, online: false, service: "Carpentry", serviceIcon: Wrench,
    serviceColor: "#8B5CF6", jobStatus: "pending",
  },
  {
    id: "5", name: "Omar Sherif", avatar: "OS", avatarColor: "#EC4899",
    lastMessage: "Thank you for the 5-star rating! 🙏", time: "2d ago",
    unread: 0, online: false, service: "Painting", serviceIcon: Wrench,
    serviceColor: "#EC4899", jobStatus: "completed", rating: 5.0,
  },
];

const MOCK_MESSAGES: Message[] = [
  { id: "1",  text: "Hello! I'll be arriving soon for the plumbing repair.", sender: "other", time: "10:02 AM", status: "read",      type: "text" },
  { id: "2",  text: "Great! The kitchen sink has been leaking since last night.", sender: "me",    time: "10:03 AM", status: "read",      type: "text" },
  { id: "3",  text: "No worries, I have all the tools and parts needed. What floor are you on?", sender: "other", time: "10:03 AM", status: "read", type: "text" },
  { id: "4",  text: "4th floor, apartment 401. The building has an elevator.",  sender: "me",    time: "10:04 AM", status: "read",      type: "text" },
  { id: "5",  text: "Perfect, I'm 5 minutes away. See you soon! 🔧",           sender: "other", time: "10:08 AM", status: "read",      type: "text" },
  { id: "6",  text: "I've assessed the issue — it's a worn-out washer. Easy fix, around 15 mins.", sender: "other", time: "10:22 AM", status: "read", type: "text" },
  { id: "7",  text: "How much will it cost?",                                   sender: "me",    time: "10:23 AM", status: "read",      type: "text" },
  { id: "8",  text: "150 EGP for parts + labor. All included in the booking.",  sender: "other", time: "10:23 AM", status: "read",      type: "text" },
  { id: "9",  text: "Sounds fair, go ahead!",                                   sender: "me",    time: "10:24 AM", status: "read",      type: "text" },
  { id: "10", text: "I'll be there in 10 minutes ✅",                           sender: "other", time: "10:31 AM", status: "delivered", type: "text" },
];

const QUICK_REPLIES = [
  "On my way 🚗", "15 mins away ⏰", "Job completed ✅",
  "Need more parts 🔧", "Can you share location? 📍", "Call me please 📞",
];

/* ══════════════════════════════════════════════════════════════════
   STATUS TICK
══════════════════════════════════════════════════════════════════ */
function StatusTick({ status }: { status: MessageStatus }) {
  if (status === "read")      return <CheckCheck size={13} color="#06B6D4" />;
  if (status === "delivered") return <CheckCheck size={13} color="#94A3B8" />;
  return <Check size={13} color="#94A3B8" />;
}

/* ══════════════════════════════════════════════════════════════════
   JOB STATUS BADGE
══════════════════════════════════════════════════════════════════ */
function JobBadge({ status }: { status: Conversation["jobStatus"] }) {
  const map = {
    ongoing:   { label: "Ongoing",   bg: "#ECFDF5", color: "#10B981" },
    completed: { label: "Completed", bg: "#EFF6FF", color: "#3B82F6" },
    pending:   { label: "Pending",   bg: "#FEF3C7", color: "#F59E0B" },
  };
  const s = map[status];
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 }}>
      <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 10, color: s.color }}>{s.label}</Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CONVERSATION LIST SCREEN
══════════════════════════════════════════════════════════════════ */
function ConversationList({ onOpen }: { onOpen: (c: Conversation) => void }) {
  const [search, setSearch] = useState("");
  const filtered = CONVERSATIONS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.service.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <LinearGradient
        colors={["#1E3A8A", "#2563EB", "#3B82F6"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 24, paddingHorizontal: 20, overflow: "hidden" }}
      >
        <View style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.05)" }} />
        <View style={{ position: "absolute", bottom: -10, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(6,182,212,0.1)" }} />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <View>
            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 26, color: "#fff" }}>Messages</Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
              {CONVERSATIONS.filter((c) => c.unread > 0).length} unread conversations
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <MoreVertical size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
          <Search size={17} color="rgba(255,255,255,0.6)" />
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search conversations..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 14, color: "#fff", padding: 0 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filter tabs */}
      <MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 350 }}
        style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 14 }}>
        {["All", "Ongoing", "Completed", "Pending"].map((tab, i) => (
          <TouchableOpacity key={tab}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: i === 0 ? "#1E3A8A" : "#fff", borderWidth: 1, borderColor: i === 0 ? "#1E3A8A" : "#E2E8F0" }}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: i === 0 ? "#fff" : "#64748B" }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </MotiView>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {filtered.map((conv, i) => (
          <MotiView key={conv.id}
            from={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: i * 60, type: "timing", duration: 350 }}>
            <TouchableOpacity onPress={() => onOpen(conv)} activeOpacity={0.85}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 20, padding: 14, marginBottom: 10, shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: conv.unread > 0 ? "#BFDBFE" : "#F1F5F9" }}>

              {/* Avatar */}
              <View style={{ position: "relative", marginRight: 14 }}>
                <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: conv.avatarColor + "20", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: conv.avatarColor + "40" }}>
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: conv.avatarColor }}>{conv.avatar}</Text>
                </View>
                {/* Online dot */}
                {conv.online && (
                  <View style={{ position: "absolute", bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: "#10B981", borderWidth: 2, borderColor: "#fff" }} />
                )}
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: Colors.text.primary }}>{conv.name}</Text>
                    <JobBadge status={conv.jobStatus} />
                  </View>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: Colors.text.secondary }}>{conv.time}</Text>
                </View>

                {/* Service tag */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 5 }}>
                  <conv.serviceIcon size={11} color={conv.serviceColor} />
                  <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 11, color: conv.serviceColor }}>{conv.service}</Text>
                  {conv.rating && (
                    <>
                      <Text style={{ color: "#CBD5E1", fontSize: 10 }}>·</Text>
                      <Star size={10} color="#F59E0B" fill="#F59E0B" />
                      <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#F59E0B" }}>{conv.rating}</Text>
                    </>
                  )}
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: conv.unread > 0 ? Typography.fonts.semibold : Typography.fonts.regular, fontSize: 13, color: conv.unread > 0 ? Colors.text.primary : Colors.text.secondary, flex: 1 }} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                  {conv.unread > 0 && (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center", marginLeft: 8 }}>
                      <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 11, color: "#fff" }}>{conv.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </MotiView>
        ))}
      </ScrollView>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CHAT ROOM SCREEN
══════════════════════════════════════════════════════════════════ */
function ChatRoom({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const [messages,       setMessages]       = useState<Message[]>(MOCK_MESSAGES);
  const [inputText,      setInputText]      = useState("");
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [isTyping,       setIsTyping]       = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  /* simulate provider typing */
  useEffect(() => {
    const t = setTimeout(() => setIsTyping(true),  2000);
    const t2 = setTimeout(() => setIsTyping(false), 5000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const newMsg: Message = {
      id:     String(Date.now()),
      text:   text.trim(),
      sender: "me",
      time:   new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
      type:   "text",
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setShowQuickReply(false);

    // Simulate reply
    setTimeout(() => setIsTyping(true), 800);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id:     String(Date.now() + 1),
          text:   "Got it! I'll handle it right away 👍",
          sender: "other",
          time:   new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "delivered",
          type:   "text",
        },
      ]);
    }, 2400);
  };

  /* group messages by date */
  const now = new Date();
  const formatDate = () => `Today, ${now.toLocaleDateString("en-EG", { day: "numeric", month: "short" })}`;

  return (
    <View style={{ flex: 1, backgroundColor: "#F0F4F8" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* ── CHAT HEADER ── */}
      <LinearGradient
        colors={["#1E3A8A", "#2563EB"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ paddingTop: Platform.OS === "android" ? 44 : 56, paddingBottom: 16, paddingHorizontal: 16, overflow: "hidden" }}
      >
        <View style={{ position: "absolute", top: -20, right: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.05)" }} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={onBack} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={{ position: "relative" }}>
            <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: conversation.avatarColor + "30", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>{conversation.avatar}</Text>
            </View>
            {conversation.online && (
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: "#10B981", borderWidth: 2, borderColor: "#1E3A8A" }} />
            )}
          </View>

          {/* Name + status */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#fff" }}>{conversation.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
              <conversation.serviceIcon size={11} color="rgba(255,255,255,0.7)" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                {conversation.service} · {conversation.online ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Phone size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Video size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <MoreVertical size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* ── JOB STATUS BANNER ── */}
      {conversation.jobStatus === "ongoing" && (
        <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 400 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#ECFDF5", paddingHorizontal: 16, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: "#A7F3D0" }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" }} />
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#065F46", flex: 1 }}>
              Job in progress · Estimated arrival: 10 min
            </Text>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MapPin size={13} color="#10B981" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#10B981" }}>Track</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      )}

      {/* ── MESSAGES ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 8 }}
        >
          {/* Date separator */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
            <View style={{ backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0" }}>
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 11, color: "#94A3B8" }}>{formatDate()}</Text>
            </View>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
          </View>

          {messages.map((msg, i) => {
            const isMe      = msg.sender === "me";
            const isFirst   = i === 0 || messages[i - 1].sender !== msg.sender;
            const isLast    = i === messages.length - 1 || messages[i + 1].sender !== msg.sender;

            return (
              <MotiView
                key={msg.id}
                from={{ opacity: 0, translateY: 10, scale: 0.96 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: "spring", damping: 18, delay: i < 8 ? 0 : 0 }}
                style={{
                  alignSelf:    isMe ? "flex-end" : "flex-start",
                  maxWidth:     "78%",
                  marginBottom: isLast ? 12 : 3,
                  marginTop:    isFirst ? 4 : 0,
                }}
              >
                {/* Avatar for other — only on last in group */}
                {!isMe && isLast && (
                  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: conversation.avatarColor + "25", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 10, color: conversation.avatarColor }}>{conversation.avatar}</Text>
                    </View>
                    <View>
                      <View style={{
                        backgroundColor:     "#fff",
                        borderRadius:        18,
                        borderBottomLeftRadius: 4,
                        paddingHorizontal:   14,
                        paddingVertical:     10,
                        shadowColor:         "#1E3A8A",
                        shadowOffset:        { width: 0, height: 1 },
                        shadowOpacity:       0.07,
                        shadowRadius:        6,
                        elevation:           2,
                      }}>
                        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#1E293B", lineHeight: 20 }}>{msg.text}</Text>
                      </View>
                      <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 10, color: "#94A3B8", marginTop: 4, marginLeft: 4 }}>{msg.time}</Text>
                    </View>
                  </View>
                )}

                {/* Other messages (not last in group) */}
                {!isMe && !isLast && (
                  <View style={{ marginLeft: 36 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 }}>
                      <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#1E293B", lineHeight: 20 }}>{msg.text}</Text>
                    </View>
                  </View>
                )}

                {/* My messages */}
                {isMe && (
                  <View style={{ alignItems: "flex-end" }}>
                    <LinearGradient
                      colors={["#2563EB", "#1E3A8A"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 18, borderBottomRightRadius: isLast ? 4 : 18, paddingHorizontal: 14, paddingVertical: 10 }}
                    >
                      <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#fff", lineHeight: 20 }}>{msg.text}</Text>
                    </LinearGradient>
                    {isLast && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, marginRight: 2 }}>
                        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 10, color: "#94A3B8" }}>{msg.time}</Text>
                        <StatusTick status={msg.status} />
                      </View>
                    )}
                  </View>
                )}
              </MotiView>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "timing", duration: 250 }}
              style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: conversation.avatarColor + "25", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 10, color: conversation.avatarColor }}>{conversation.avatar}</Text>
              </View>
              <View style={{ backgroundColor: "#fff", borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12, shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 }}>
                <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map((dot) => (
                    <MotiView
                      key={dot}
                      from={{ translateY: 0 }}
                      animate={{ translateY: [-4, 0] }}
                      transition={{ loop: true, delay: dot * 150, type: "timing", duration: 500 }}
                      style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#94A3B8" }}
                    />
                  ))}
                </View>
              </View>
            </MotiView>
          )}
        </ScrollView>

        {/* ── QUICK REPLIES ── */}
        {showQuickReply && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 250 }}
            style={{ backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingVertical: 12 }}
          >
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#64748B", letterSpacing: 0.8, paddingHorizontal: 16, marginBottom: 10 }}>
              QUICK REPLIES
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {QUICK_REPLIES.map((reply) => (
                <TouchableOpacity key={reply} onPress={() => sendMessage(reply)}
                  style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#BFDBFE" }}>
                  <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#1E3A8A" }}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </MotiView>
        )}

        {/* ── INPUT BAR ── */}
        <View style={{
          flexDirection:    "row",
          alignItems:       "flex-end",
          paddingHorizontal: 12,
          paddingVertical:  10,
          paddingBottom:    Platform.OS === "ios" ? 28 : 12,
          backgroundColor:  "#fff",
          borderTopWidth:   1,
          borderTopColor:   "#F1F5F9",
          gap:              8,
        }}>
          {/* Attachment */}
          <TouchableOpacity
            onPress={() => setShowQuickReply((p) => !p)}
            style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: showQuickReply ? "#1E3A8A" : "#F1F5F9", alignItems: "center", justifyContent: "center" }}
          >
            {showQuickReply
              ? <X size={18} color="#fff" />
              : <Paperclip size={18} color="#64748B" />
            }
          </TouchableOpacity>

          {/* Text input */}
          <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", backgroundColor: "#F8FAFC", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#E2E8F0", gap: 8, minHeight: 44 }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#CBD5E1"
              multiline
              style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 14, color: Colors.text.primary, padding: 0, maxHeight: 100 }}
            />
            <TouchableOpacity>
              <Smile size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Send / Mic */}
          {inputText.trim().length > 0 ? (
            <MotiView from={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
              <TouchableOpacity onPress={() => sendMessage(inputText)}
                style={{ width: 44, height: 44, borderRadius: 15, overflow: "hidden" }}>
                <LinearGradient colors={["#2563EB", "#1E3A8A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Send size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </MotiView>
          ) : (
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
              <Mic size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT — toggles between list and chat room
══════════════════════════════════════════════════════════════════ */
export default function ChatScreen() {
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);

  if (activeConv) {
    return (
      <MotiView from={{ opacity: 0, translateX: 40 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: "timing", duration: 280 }} style={{ flex: 1 }}>
        <ChatRoom conversation={activeConv} onBack={() => setActiveConv(null)} />
      </MotiView>
    );
  }

  return (
    <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: "timing", duration: 300 }} style={{ flex: 1 }}>
      <ConversationList onOpen={setActiveConv} />
    </MotiView>
  );
}