import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatstore";
import { ImagePlus, Loader, SendHorizontal, X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_IMAGE_SIZE_MB = 5;

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
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB`);
      e.target.value = "";
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

    textInputRef.current?.focus({ preventScroll: true });

    try {
      setbtnLoading(true);

      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      emitStopTyping();
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setbtnLoading(false);
    }
  };

  return (
    <div className="sticky bottom-0 z-10 w-full flex-shrink-0 border-t border-base-300/70 bg-base-100/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:p-3">
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
        className="flex items-center gap-1.5 sm:gap-2"
      >
        <div className="flex min-w-0 flex-1 gap-1.5 sm:gap-2">
          <input
            ref={textInputRef}
            type="text"
            className="input input-bordered min-h-10 w-full rounded-xl text-sm sm:min-h-11"
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
            className={`btn btn-ghost btn-square flex min-h-10 w-10 flex-shrink-0 rounded-xl sm:min-h-11 sm:w-11
                     ${imagePreview ? "text-success" : "text-base-content/45"}`}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
          >
            <ImagePlus className="size-5" />
          </button>
        </div>

        {btnLoading ? (
          <button type="button" className="btn btn-primary btn-square min-h-10 w-10 flex-shrink-0 rounded-xl sm:min-h-11 sm:w-11" disabled aria-label="Sending">
            <Loader className="size-5 animate-spin" />
          </button>
        ) : (
          <button
            type="submit"
            onPointerDown={(event) => event.preventDefault()}
            className="btn btn-primary btn-square min-h-10 w-10 flex-shrink-0 rounded-xl sm:min-h-11 sm:w-11"
            disabled={!text.trim() && !imagePreview}
            aria-label="Send message"
          >
            <SendHorizontal className="size-5" />
          </button>
        )}
      </form>
    </div>
  );
};
export default MessageInput;
