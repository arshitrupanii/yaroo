import { useChatStore } from "../store/useChatstore.js";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuhstore.js";
import { formatMessageTime } from "../lib/utils";
import { AlertTriangle, ArrowDown, Check, CheckCheck, Loader, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";

const ChatContainer = () => {
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [originalEditingText, setOriginalEditingText] = useState("");
  const [activeActionsMessageId, setActiveActionsMessageId] = useState(null);
  const [actionMenuPlacement, setActionMenuPlacement] = useState("up");
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const {
    deleteMessage,
    editMessage,
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messagesContainerRef = useRef(null);
  const messageEndRef = useRef(null);
  const editInputRef = useRef(null);
  const composerInputRef = useRef(null);
  const isNearLatestRef = useRef(true);
  const activeConversationRef = useRef(null);
  const isGroup = selectedUser.type === "group";

  const getSenderId = (message) => (
    typeof message.senderId === "object" ? message.senderId?._id : message.senderId
  );

  const getSenderName = (message) => (
    typeof message.senderId === "object"
      ? message.senderId.firstname || message.senderId.username
      : ""
  );

  const resizeEditInput = (input) => {
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
  };

  const scrollToLatest = (behavior = "smooth") => {
    messageEndRef.current?.scrollIntoView({ behavior, block: "end" });
    isNearLatestRef.current = true;
    setShowScrollToLatest(false);
  };

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromLatest = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearLatest = distanceFromLatest < 120;
    isNearLatestRef.current = isNearLatest;
    setShowScrollToLatest(!isNearLatest);
    setActiveActionsMessageId(null);
  };

  useEffect(() => {
    if (isMessagesLoading || !messageEndRef.current) return;

    const conversationChanged = activeConversationRef.current !== selectedUser._id;
    if (conversationChanged) {
      activeConversationRef.current = selectedUser._id;
      isNearLatestRef.current = true;
    }

    if (conversationChanged || isNearLatestRef.current) {
      const frame = requestAnimationFrame(() => scrollToLatest(conversationChanged ? "auto" : "smooth"));
      return () => cancelAnimationFrame(frame);
    }
  }, [isMessagesLoading, messages, selectedUser._id]);

  const startEditing = (message) => {
    setEditingMessageId(message._id);
    setEditingText(message.text || "");
    setOriginalEditingText(message.text || "");
    setActiveActionsMessageId(null);
  };

  useEffect(() => {
    if (!editingMessageId || !editInputRef.current) return;

    const input = editInputRef.current;
    const cursorPosition = input.value.length;
    input.focus({ preventScroll: true });
    input.setSelectionRange(cursorPosition, cursorPosition);
    resizeEditInput(input);
  }, [editingMessageId]);

  const saveEdit = async () => {
    const nextText = editingText.trim();
    if (!nextText || nextText === originalEditingText.trim() || isSavingEdit) return;

    setIsSavingEdit(true);
    const didSave = await editMessage(editingMessageId, nextText);
    setIsSavingEdit(false);

    if (didSave) cancelEdit();
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
    setOriginalEditingText("");
    composerInputRef.current?.focus({ preventScroll: true });
  };

  const confirmDelete = async () => {
    if (!messageToDelete || isDeleting) return;

    setIsDeleting(true);
    const didDelete = await deleteMessage(messageToDelete._id);
    setIsDeleting(false);

    if (didDelete) {
      setMessageToDelete(null);
      composerInputRef.current?.focus({ preventScroll: true });
    }
  };

  const renderStatus = (message) => {
    if (isGroup || getSenderId(message) !== authUser._id) return null;

    if (message.status === "seen") {
      return <span className="inline-flex items-center gap-1 text-[11px] opacity-70"><CheckCheck className="size-3" />Seen</span>;
    }

    return <span className="inline-flex items-center gap-1 text-[11px] opacity-60"><Check className="size-3" />{message.status || "sent"}</span>;
  };

  useEffect(() => {
    getMessages(selectedUser._id);
  }, [selectedUser._id, getMessages]);


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

      <div className="chat-wallpaper relative min-h-0 flex-1 overflow-hidden">
      <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="relative z-10 flex h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain px-2 py-3 scroll-smooth sm:px-6 sm:py-4">
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-center text-base-content/50">
            <div>
              <div className="font-medium text-base-content">No messages yet</div>
              <p className="text-sm mt-1">Start the conversation with {isGroup ? selectedUser.name : selectedUser.firstname}.</p>
            </div>
          </div>
        )}

        {messages.length > 0 && <div className="min-h-0 flex-1" aria-hidden="true" />}

        {messages.map((message) => {
          const isMine = getSenderId(message) === authUser._id;
          const senderName = getSenderName(message);

          return (
          <div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
            <div className={`group flex max-w-[92%] flex-col sm:max-w-[66%] lg:max-w-[56%] ${isMine ? "items-end" : "items-start"}`}>

              <div className="relative">
                {isMine && editingMessageId !== message._id && (
                  <div className="absolute -left-9 top-1/2 z-20 -translate-y-1/2">
                    <button
                      type="button"
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        const buttonTop = event.currentTarget.getBoundingClientRect().top;
                        setActionMenuPlacement(buttonTop < 140 ? "down" : "up");
                        setActiveActionsMessageId((current) => current === message._id ? null : message._id);
                      }}
                      className="btn btn-ghost btn-xs btn-circle text-base-content/50 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                      aria-label="Message actions"
                      aria-expanded={activeActionsMessageId === message._id}
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    {activeActionsMessageId === message._id && (
                      <div className={`absolute left-0 w-32 overflow-hidden rounded-xl border border-base-300 bg-base-100 p-1 shadow-xl ${actionMenuPlacement === "down" ? "top-full mt-1" : "bottom-full mb-1"}`}>
                        {message.text && (
                          <button type="button" onPointerDown={(event) => event.preventDefault()} onClick={() => startEditing(message)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-base-200">
                            <Pencil className="size-3.5" /> Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onPointerDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setMessageToDelete(message);
                            setActiveActionsMessageId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-error hover:bg-error/10"
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`min-w-10 rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm transition-transform duration-150 ${
                    isMine
                      ? "rounded-br-md bg-primary text-primary-content"
                      : "rounded-bl-md border border-base-300/70 bg-base-200 text-base-content"
                  }`}
                >
                  {isGroup && !isMine && senderName && (
                    <div className="mb-1 text-[11px] font-semibold text-primary">
                      {senderName}
                    </div>
                  )}
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
                    <div className="flex min-w-[min(14rem,78vw)] items-end gap-2">
                      <textarea
                        ref={editInputRef}
                        value={editingText}
                        onChange={(e) => {
                          setEditingText(e.target.value);
                          resizeEditInput(e.currentTarget);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void saveEdit();
                          }

                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="textarea textarea-bordered max-h-32 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto text-base-content focus:border-primary focus:outline-none"
                        rows={1}
                        maxLength={4000}
                        aria-label="Edit message"
                        disabled={isSavingEdit}
                      />
                      <button
                        type="button"
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={saveEdit}
                        className="btn btn-sm btn-primary btn-square flex-shrink-0 rounded-xl"
                        aria-label="Save edit"
                        disabled={!editingText.trim() || editingText.trim() === originalEditingText.trim() || isSavingEdit}
                      >
                        {isSavingEdit ? <Loader className="size-4 animate-spin" /> : <Check className="size-4" />}
                      </button>
                      <button type="button" onPointerDown={(event) => event.preventDefault()} onClick={cancelEdit} className="btn btn-sm btn-ghost btn-square flex-shrink-0 rounded-xl" aria-label="Cancel edit" disabled={isSavingEdit}>
                        <X className="size-4" />
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
        <div ref={messageEndRef} className="h-px" aria-hidden="true" />
      </div>

      {showScrollToLatest && (
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => scrollToLatest("smooth")}
          className="btn btn-circle btn-sm absolute bottom-3 right-3 z-30 border border-base-300 bg-base-100 text-base-content shadow-lg hover:bg-base-200 sm:bottom-4 sm:right-5"
          aria-label="Jump to latest message"
          title="Latest message"
        >
          <ArrowDown className="size-4" />
        </button>
      )}
      </div>

      <MessageInput ref={composerInputRef} />

      {messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-[2px] sm:items-center sm:p-3" role="dialog" aria-modal="true" aria-labelledby="delete-message-title" onPointerDown={(event) => event.preventDefault()} onClick={() => !isDeleting && setMessageToDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
                <AlertTriangle className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 id="delete-message-title" className="font-semibold">Delete this message?</h2>
                <p className="mt-1 text-sm text-base-content/60">This will remove it from the conversation for everyone.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn btn-ghost btn-sm rounded-xl" onPointerDown={(event) => event.preventDefault()} onClick={() => setMessageToDelete(null)} disabled={isDeleting}>Cancel</button>
              <button type="button" className="btn btn-error btn-sm min-w-24 rounded-xl" onPointerDown={(event) => event.preventDefault()} onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? <Loader className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {isDeleting ? "Deleting" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] bg-base-100/90"
            onClick={() => setPreviewImage(null)}
            aria-label="Close image preview"
          >
            <X className="size-4" />
          </button>
          <img
            src={previewImage}
            alt="Message attachment preview"
            className="max-h-[86dvh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
export default ChatContainer;
