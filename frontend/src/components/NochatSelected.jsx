import { MessageSquare, Search, UserPlus } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-8 bg-base-100">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
            >
              <MessageSquare className="w-8 h-8 text-primary " />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold">Welcome to Yaroo</h2>
        <p className="text-base-content/60">
          Select a friend to chat, or search usernames to grow your contact list.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-base-300 p-3">
            <Search className="size-5 mx-auto mb-2 text-primary" />
            Search people
          </div>
          <div className="rounded-lg border border-base-300 p-3">
            <UserPlus className="size-5 mx-auto mb-2 text-primary" />
            Add friends
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
