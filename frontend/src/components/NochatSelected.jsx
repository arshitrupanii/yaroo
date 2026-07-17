import { MessageCircleHeart } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center bg-base-100 p-8">
      <div className="max-w-xs space-y-3 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageCircleHeart className="size-6" />
        </div>

        <h2 className="text-lg font-semibold">Welcome to Yaroo</h2>
        <p className="text-sm text-base-content/60">
          Select a friend to chat, or search usernames to grow your contact list.
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
