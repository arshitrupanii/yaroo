import { MessageCircleHeart, Pin, Search, UserPlus } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center bg-base-100 p-8">
      <div className="max-w-sm space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageCircleHeart className="size-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Welcome to Yaroo</h2>
          <p className="text-sm text-base-content/60">
            Select a friend to chat, search usernames, or pin important chats.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-base-content/60">
          <div className="rounded-xl border border-base-300/70 bg-base-200/40 p-3">
            <Search className="mx-auto mb-2 size-4 text-primary" />
            Search
          </div>
          <div className="rounded-xl border border-base-300/70 bg-base-200/40 p-3">
            <UserPlus className="mx-auto mb-2 size-4 text-primary" />
            Add
          </div>
          <div className="rounded-xl border border-base-300/70 bg-base-200/40 p-3">
            <Pin className="mx-auto mb-2 size-4 text-primary" />
            Pin
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
