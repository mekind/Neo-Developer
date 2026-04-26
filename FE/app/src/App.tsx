import { useState } from 'react'

import { AddAgentDialogSection } from '@/sections/dialog/AddAgentDialogSection'
import { AgentChatDialogSection } from '@/sections/dialog/AgentChatDialogSection'
import { MapSection } from '@/sections/map/MapSection'
import { SidebarSection } from '@/sections/sidebar/SidebarSection'
import { TitleSection } from '@/sections/title/TitleSection'
import { useAgentsPage } from '@/hooks/useAgentsPage'

export default function App() {
  const {
    agents,
    player,
    isLoading,
    errorMessage,
    interactionTarget,
    lastInteractionMessage,
    isDialogOpen,
    openDialog,
    closeDialog,
    handleCreateAgent,
  } = useAgentsPage()
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false)

  const handleOpenTestChat = () => {
    if (agents.length === 0) return
    setIsChatDialogOpen(true)
  }

  const activeChatAgent = agents[0] ?? null

  return (
    <main className="app-shell">
      <TitleSection liveCount={agents.length} onOpenTestChat={handleOpenTestChat} isChatDisabled={agents.length === 0} />

      <div className="app-body">
        <SidebarSection
          agents={agents}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onOpenDialog={openDialog}
        />
        <MapSection
          agents={agents}
          player={player}
          isLoading={isLoading}
          errorMessage={errorMessage}
          interactionTarget={interactionTarget}
          lastInteractionMessage={lastInteractionMessage}
        />
      </div>

      <AddAgentDialogSection isOpen={isDialogOpen} onClose={closeDialog} onCreateAgent={handleCreateAgent} />
      <AgentChatDialogSection
        agent={activeChatAgent}
        isOpen={isChatDialogOpen && activeChatAgent !== null}
        onClose={() => setIsChatDialogOpen(false)}
      />
    </main>
  )
}
