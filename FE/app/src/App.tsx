import { AddAgentDialogSection } from '@/sections/dialog/AddAgentDialogSection'
import { MapSection } from '@/sections/map/MapSection'
import { SidebarSection } from '@/sections/sidebar/SidebarSection'
import { TitleSection } from '@/sections/title/TitleSection'
import { useAgentsPage } from '@/hooks/useAgentsPage'

export default function App() {
  const { agents, isLoading, errorMessage, isDialogOpen, openDialog, closeDialog, handleCreateAgent } = useAgentsPage()

  return (
    <main className="app-shell">
      <TitleSection liveCount={agents.length} />

      <div className="app-body">
        <SidebarSection agents={agents} isLoading={isLoading} errorMessage={errorMessage} onOpenDialog={openDialog} />
        <MapSection agents={agents} isLoading={isLoading} errorMessage={errorMessage} />
      </div>

      <AddAgentDialogSection isOpen={isDialogOpen} onClose={closeDialog} onCreateAgent={handleCreateAgent} />
    </main>
  )
}
