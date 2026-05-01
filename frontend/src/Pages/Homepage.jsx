import { useChatStore } from "../store/useChatstore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NochatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex items-center justify-center pt-1 sm:pt-2 md:pt-4 lg:pt-6 xl:pt-10 px-1 sm:px-2 md:px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-7xl h-[calc(100vh-0.5rem)] sm:h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] xl:h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
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