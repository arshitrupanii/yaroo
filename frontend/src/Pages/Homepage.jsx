import { useChatStore } from "../store/useChatstore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NochatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <main className={`${selectedUser ? 'h-[var(--app-height)] lg:h-[calc(var(--app-height)-3.5rem)]' : 'h-[calc(var(--app-height)-3.5rem)]'} overflow-hidden bg-base-100`}>
      <div className="flex h-full min-h-0">
        <div className="w-full min-w-0">
          <div className="flex h-full min-h-0">
            {/* Sidebar - hidden on mobile when chat is selected, always visible on desktop */}
            <div className={`${selectedUser ? 'hidden lg:block' : 'block w-full'} h-full min-h-0 lg:w-auto lg:flex-shrink-0`}>
              <Sidebar />
            </div>

            {/* Chat area - hidden on mobile when no chat selected, always visible on desktop */}
            <div className={`${!selectedUser ? 'hidden lg:flex' : 'flex'} min-h-0 flex-1 flex-col min-w-0`}>
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
export default HomePage;
