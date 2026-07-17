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
      <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
      <ChatHeader />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-base-100 px-3 py-4 sm:px-6">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-base-content/50">
            <div>
              <div className="font-medium text-base-content">No messages yet</div>
              <p className="text-sm mt-1">Start the conversation with {selectedUser.firstname}.</p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isMine = message.senderId === authUser._id;

          return (
          <div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`} ref={messageEndRef}>
            <div className={`group flex max-w-[84%] flex-col sm:max-w-[66%] lg:max-w-[56%] ${isMine ? "items-end" : "items-start"}`}>

              <div className="relative">
                {isMine && editingMessageId !== message._id && (
                  <div className="absolute -top-8 right-0 hidden gap-1 group-hover:flex focus-within:flex">
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

                <div
                  className={`min-w-10 rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    isMine
                      ? "rounded-br-md bg-primary text-primary-content"
                      : "rounded-bl-md border border-base-300/70 bg-base-200/90 text-base-content"
                  }`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="mb-2 max-h-64 max-w-full rounded-lg object-cover"
                    />
                  )}

                  {editingMessageId === message._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="input input-sm input-bordered min-w-0 text-base-content"
                      />
                      <button onClick={saveEdit} className="btn btn-xs btn-primary" aria-label="Save edit">
                        <Check className="size-3" />
                      </button>
                      <button onClick={() => setEditingMessageId(null)} className="btn btn-xs" aria-label="Cancel edit">
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : message.text && (
                    <p className="whitespace-pre-wrap" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
                      {message.text}
                    </p>
                  )}
                </div>
              </div>

              <div className={`mt-1 flex items-center gap-1 px-1 text-[11px] text-base-content/40 ${isMine ? "justify-end text-right" : "justify-start text-left"}`}>
                <time>{formatMessageTime(message.createdAt)}</time>
                {message.editedAt && <span>edited</span>}
                {renderStatus(message)}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
