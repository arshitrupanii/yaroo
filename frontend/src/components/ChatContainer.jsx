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
  const [previewImage, setPreviewImage] = useState(null);
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

  const cancelEdit = () => {
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

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-base-100 px-3 py-4 scroll-smooth sm:px-6">
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
                  <div className="absolute -top-8 right-0 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
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
                  className={`min-w-10 rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm transition-transform duration-150 ${
                    isMine
                      ? "rounded-br-md bg-primary text-primary-content"
                      : "rounded-bl-md border border-base-300/70 bg-base-200 text-base-content"
                  }`}
                >
                  {message.image && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(message.image)}
                      className="mb-2 block overflow-hidden rounded-lg border border-base-300/50 text-left"
                      aria-label="Open image preview"
                    >
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="max-h-64 max-w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </button>
                  )}

                  {editingMessageId === message._id ? (
                    <div className="flex min-w-[14rem] items-end gap-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            saveEdit();
                          }

                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="textarea textarea-bordered min-h-10 min-w-0 flex-1 resize-none text-base-content"
                        rows={1}
                        autoFocus
                      />
                      <button onClick={saveEdit} className="btn btn-xs btn-primary" aria-label="Save edit">
                        <Check className="size-3" />
                      </button>
                      <button onClick={cancelEdit} className="btn btn-xs" aria-label="Cancel edit">
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

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle absolute right-4 top-4 bg-base-100/90"
            onClick={() => setPreviewImage(null)}
            aria-label="Close image preview"
          >
            <X className="size-4" />
          </button>
          <img
            src={previewImage}
            alt="Message attachment preview"
            className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
export default ChatContainer;
