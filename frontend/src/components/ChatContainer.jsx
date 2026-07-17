import { useChatStore } from "../store/useChatstore.js";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuhstore.js";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, Pencil, Trash2, X } from "lucide-react";

const ChatContainer = () => {
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const {
    deleteMessage,
    editMessage,
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const startEditing = (message) => {
    setEditingMessageId(message._id);
    setEditingText(message.text || "");
  };

  const saveEdit = async () => {
    if (!editingText.trim()) return;
    await editMessage(editingMessageId, editingText.trim());
    setEditingMessageId(null);
    setEditingText("");
  };

  const renderStatus = (message) => {
    if (message.senderId !== authUser._id) return null;

    if (message.status === "seen") {
      return <span className="inline-flex items-center gap-1 text-[11px] opacity-70"><CheckCheck className="size-3" />Seen</span>;
    }

    return <span className="inline-flex items-center gap-1 text-[11px] opacity-60"><Check className="size-3" />{message.status || "sent"}</span>;
  };

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);


  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 space-y-4 bg-base-200/50">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-8 rounded-full border border-base-300">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePicture || "/avatar.png"
                      : selectedUser.profilePicture || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1 px-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
              {message.editedAt && <span className="text-xs opacity-40 ml-2">edited</span>}
            </div>
            <div className="group relative">
              {message.senderId === authUser._id && editingMessageId !== message._id && (
                <div className="absolute -top-8 right-0 hidden group-hover:flex focus-within:flex gap-1">
                  {message.text && (
                    <button onClick={() => startEditing(message)} className="btn btn-xs btn-circle" aria-label="Edit message">
                      <Pencil className="size-3" />
                    </button>
                  )}
                  <button onClick={() => deleteMessage(message._id)} className="btn btn-xs btn-circle" aria-label="Delete message">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              )}
              <div className={`chat-bubble flex flex-col max-w-[88vw] sm:max-w-[70%] md:max-w-[58%] break-words overflow-hidden shadow-sm ${
                message.senderId === authUser._id ? "chat-bubble-primary" : "bg-base-100 text-base-content border border-base-300"
              }`}>
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] w-full rounded-md mb-2"
                />
              )}
              {editingMessageId === message._id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="input input-sm input-bordered text-base-content min-w-0"
                  />
                  <button onClick={saveEdit} className="btn btn-xs btn-primary" aria-label="Save edit">
                    <Check className="size-3" />
                  </button>
                  <button onClick={() => setEditingMessageId(null)} className="btn btn-xs" aria-label="Cancel edit">
                    <X className="size-3" />
                  </button>
                </div>
              ) : message.text && (
                <p className="whitespace-pre-wrap leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {message.text}
                </p>
              )}
              </div>
              <div className={`mt-1 px-1 ${message.senderId === authUser._id ? "text-right" : "text-left"}`}>
                {renderStatus(message)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
