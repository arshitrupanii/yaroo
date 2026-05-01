import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatstore";
import { Image, Loader, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [btnLoading, setbtnLoading] = useState(false);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
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
    <div className="p-2 sm:p-3 md:p-4 w-full flex-shrink-0 bg-base-100 border-t border-base-300 sticky bottom-0 z-10">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 sm:gap-2 md:gap-3"
      >
        <div className="flex-1 flex gap-2 sm:gap-2 md:gap-3 min-w-0">
          <input
            ref={textInputRef}
            type="text"
            className="w-full input input-bordered rounded-lg text-sm sm:text-base py-2 sm:py-3 min-h-[44px] sm:min-h-[48px]"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
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
            className={`flex btn btn-circle min-h-[44px] sm:min-h-[48px] w-11 sm:w-12
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
          >
            <Image className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {btnLoading ? (
          <Loader className="animate-spin text-primary w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0" />
        ) : (
          <button
            type="submit"
            className="btn btn-circle min-h-[44px] sm:min-h-[48px] w-11 sm:w-12 flex-shrink-0"
            disabled={!text.trim() && !imagePreview}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </form>
    </div>
  );
};
export default MessageInput;
