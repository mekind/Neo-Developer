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
    focusRequest,
    openDialog,
    closeDialog,
    closeChatDialog,
    handleCreateAgent,
    handleAgentInteraction,
    handleOpenChat,
    handleSendChatMessage,
    handleFocusAgent,
    ambientSpeechByAgentId,
  } = useAgentsPage()
  const { catalog: lpcSpriteCatalog } = useLpcSpriteBundle()

  return (
    <main className="app-shell">
      <TitleSection liveCount={agents.length} onOpenChat={handleOpenChat} isChatDisabled={agents.length === 0} />

      <div className="app-body">
        <SidebarSection
          agents={agents}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onOpenDialog={openDialog}
          onFocusAgent={handleFocusAgent}
        />
        <MapSection
          agents={agents}
          lpcSpriteCatalog={lpcSpriteCatalog}
          onAgentInteraction={handleAgentInteraction}
          focusRequest={focusRequest}
          ambientSpeechByAgentId={ambientSpeechByAgentId}
        />
      </div>

      <AddAgentDialogSection isOpen={isDialogOpen} onClose={closeDialog} onCreateAgent={handleCreateAgent} />
      <AgentChatDialogSection
        agent={activeChatAgent}
        isOpen={isChatOpen}
        lpcSpriteCatalog={lpcSpriteCatalog}
        onClose={closeChatDialog}
        messages={chatMessages}
        isSubmitting={isChatSubmitting}
        errorMessage={chatErrorMessage}
        onSendMessage={handleSendChatMessage}
      />
    </main>
  )
}
