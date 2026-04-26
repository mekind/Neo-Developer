import { AddAgentDialogSection } from '@/sections/dialog/AddAgentDialogSection'
import { AgentChatDialogSection } from '@/sections/dialog/AgentChatDialogSection'
import { MapSection } from '@/sections/map/MapSection'
import { SidebarSection } from '@/sections/sidebar/SidebarSection'
import { TitleSection } from '@/sections/title/TitleSection'
import { useAgentsPage } from '@/hooks/useAgentsPage'

export default function App() {
  const {
    agents,
    isLoading,
    errorMessage,
    isDialogOpen,
    activeChatAgent,
    isChatOpen,
    openDialog,
    closeDialog,
    closeChatDialog,
    handleCreateAgent,
    handleAgentInteraction,
    handleOpenTestChat,
  } = useAgentsPage()

  return (
    <main className="app-shell">
      <TitleSection liveCount={agents.length} onOpenTestChat={handleOpenTestChat} isChatDisabled={agents.length === 0} />

      <div className="app-body">
        <SidebarSection agents={agents} isLoading={isLoading} errorMessage={errorMessage} onOpenDialog={openDialog} />
        <MapSection agents={agents} onAgentInteraction={handleAgentInteraction} />
      </div>

      <AddAgentDialogSection isOpen={isDialogOpen} onClose={closeDialog} onCreateAgent={handleCreateAgent} />
      <AgentChatDialogSection agent={activeChatAgent} isOpen={isChatOpen} onClose={closeChatDialog} />
    </main>
  )
}
