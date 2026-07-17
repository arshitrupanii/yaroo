import { useChatStore } from "../store/useChatstore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NochatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex items-center justify-center px-0 sm:px-3 md:px-5 py-0 sm:py-3 md:py-5">
        <div className="bg-base-100 border border-base-300 shadow-xl w-full max-w-7xl h-[calc(100vh-4rem)] sm:h-[calc(100vh-6rem)] rounded-none sm:rounded-lg overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar - hidden on mobile when chat is selected, always visible on desktop */}
            <div className={`${selectedUser ? 'hidden lg:block' : 'block w-full'} lg:w-auto lg:flex-shrink-0`}>
              <Sidebar />
            </div>

            {/* Chat area - hidden on mobile when no chat selected, always visible on desktop */}
            <div className={`${!selectedUser ? 'hidden lg:flex' : 'flex'} flex-1 flex-col min-w-0`}>
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
