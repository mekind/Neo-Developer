import { useMemo, useState } from 'react'

import { AddAgentDialogSection } from '@/sections/dialog/AddAgentDialogSection'
import { AgentChatDialogSection } from '@/sections/dialog/AgentChatDialogSection'
import { MapSection } from '@/sections/map/MapSection'
import { SidebarSection } from '@/sections/sidebar/SidebarSection'
import { TitleSection } from '@/sections/title/TitleSection'
import { PLACEHOLDER_AGENT_IMAGE, type WorldAgent } from '@/game/agents'
import { useAgentsPage } from '@/hooks/useAgentsPage'

const MOCK_CHAT_AGENT: WorldAgent = {
  id: 'mock-chat-agent',
  label: 'Noa',
  imageSrc: PLACEHOLDER_AGENT_IMAGE,
  usesPlaceholder: true,
  xPercent: 50,
  yPercent: 50,
}

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

  const activeChatAgent = useMemo(() => agents[0] ?? MOCK_CHAT_AGENT, [agents])

  const handleOpenTestChat = () => {
    setIsChatDialogOpen(true)
  }

  return (
    <main className="app-shell">
      <TitleSection liveCount={agents.length} onOpenTestChat={handleOpenTestChat} isChatDisabled={false} />

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
        isOpen={isChatDialogOpen}
        onClose={() => setIsChatDialogOpen(false)}
      />
    </main>
  )
}
