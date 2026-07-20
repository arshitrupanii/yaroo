import { useChatStore } from "../store/useChatstore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NochatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <main className="min-h-0 flex-1 overflow-hidden bg-base-100">
      <div className="flex h-full min-h-0 w-full min-w-0">
        <div className={`${selectedUser ? 'hidden lg:block' : 'block w-full'} h-full min-h-0 lg:w-auto lg:flex-shrink-0`}>
          <Sidebar />
        </div>

        <div className={`${!selectedUser ? 'hidden lg:flex' : 'flex'} min-h-0 min-w-0 flex-1 flex-col`}>
          {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
        </div>
      </div>
    </main>
  );
};
export default HomePage;
