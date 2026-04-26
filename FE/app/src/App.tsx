import { useMemo } from 'react'

import { useAgentsPage } from '@/hooks/useAgentsPage'
import { useLpcSpriteBundle } from '@/hooks/useLpcSpriteBundle'
import { AddAgentDialogSection } from '@/sections/dialog/AddAgentDialogSection'
import { AgentChatDialogSection } from '@/sections/dialog/AgentChatDialogSection'
import { MapSection } from '@/sections/map/MapSection'
import { SidebarSection } from '@/sections/sidebar/SidebarSection'
import { TitleSection } from '@/sections/title/TitleSection'

export default function App() {
  const {
    agents,
    isLoading,
    errorMessage,
    isDialogOpen,
    activeChatAgent,
    isChatOpen,
    chatMessages,
    isChatSubmitting,
    chatErrorMessage,
    openDialog,
    closeDialog,
    closeChatDialog,
    handleCreateAgent,
    handleAgentInteraction,
    handleOpenChat,
    handleSendChatMessage,
  } = useAgentsPage()
  const { catalog: lpcSpriteCatalog, creditsText: localCreditsText, errorMessage: lpcErrorMessage } = useLpcSpriteBundle()

  const combinedCreditsText = useMemo(() => {
    const parts = [localCreditsText, ...agents.map((agent) => agent.apiSprite?.creditsText ?? '').filter(Boolean)]
    return Array.from(new Set(parts.filter(Boolean))).join('\n\n')
  }, [agents, localCreditsText])

  return (
    <main className="app-shell">
      <TitleSection liveCount={agents.length} onOpenChat={handleOpenChat} isChatDisabled={agents.length === 0} />

      <div className="app-body">
        <SidebarSection
          agents={agents}
          isLoading={isLoading}
          errorMessage={errorMessage}
          lpcCreditsText={combinedCreditsText || null}
          lpcErrorMessage={lpcErrorMessage}
          onOpenDialog={openDialog}
        />
        <MapSection agents={agents} lpcSpriteCatalog={lpcSpriteCatalog} onAgentInteraction={handleAgentInteraction} />
      </div>

      <AddAgentDialogSection isOpen={isDialogOpen} onClose={closeDialog} onCreateAgent={handleCreateAgent} />
      <AgentChatDialogSection
        agent={activeChatAgent}
        isOpen={isChatOpen}
        onClose={closeChatDialog}
        messages={chatMessages}
        isSubmitting={isChatSubmitting}
        errorMessage={chatErrorMessage}
        onSendMessage={handleSendChatMessage}
      />
    </main>
  )
}
