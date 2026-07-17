import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatstore";
import { ImagePlus, Loader, SendHorizontal, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [btnLoading, setbtnLoading] = useState(false);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const { emitStopTyping, emitTyping, sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    emitTyping();

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emitStopTyping();
    }, 900);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      setbtnLoading(true);

      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setbtnLoading(false);

      setText("");
      emitStopTyping();
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Refocus input to keep keyboard open on mobile
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Still refocus even on error
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className="sticky bottom-0 z-10 w-full flex-shrink-0 border-t border-base-300/70 bg-base-100 p-3">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 w-20 rounded-xl border border-base-300 object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-base-300"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2"
      >
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            ref={textInputRef}
            type="text"
            className="input input-bordered min-h-11 w-full rounded-xl text-sm"
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`btn btn-ghost btn-square flex min-h-11 w-11 flex-shrink-0 rounded-xl
                     ${imagePreview ? "text-emerald-500" : "text-base-content/45"}`}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
          >
            <ImagePlus className="size-5" />
          </button>
        </div>

        {btnLoading ? (
          <button type="button" className="btn btn-primary btn-square min-h-11 w-11 flex-shrink-0 rounded-xl" disabled aria-label="Sending">
            <Loader className="size-5 animate-spin" />
          </button>
        ) : (
          <button
            type="submit"
            className="btn btn-primary btn-square min-h-11 w-11 flex-shrink-0 rounded-xl"
            disabled={!text.trim() && !imagePreview}
          >
            <SendHorizontal className="size-5" />
          </button>
        )}
      </form>
    </div>
  );
};
export default MessageInput;
