import { buildWorldAgents, buildWorldPlayer } from './agents'

describe('buildWorldAgents', () => {
  it('falls back to id when name is missing, uses the local lpc bundle when api png is absent, and appends the default dummy agent', () => {
    const worldAgents = buildWorldAgents([
      {
        id: 'mystery-agent',
        persona: null,
      },
    ])

    expect(worldAgents).toHaveLength(2)
    expect(worldAgents[0]?.label).toBe('mystery-agent')
    expect(worldAgents[0]?.imageSrc).toBe('/lpc-character-pipeline/.example/cafe-bot/character.png')
    expect(worldAgents[0]?.usesPlaceholder).toBe(false)
    expect(worldAgents[0]?.spriteBundleId).toBe('cafe-bot')
    expect(worldAgents[1]?.label).toBe('Noa')
  })

  it('prefers api-provided lpc sprite metadata when characterPngUrl/frameMap/creditsText are present', () => {
    const worldAgents = buildWorldAgents([
      {
        id: 'api-sprite-agent',
        name: 'Api Sprite Agent',
        characterPngUrl: 'https://cdn.example.com/agent.png',
        creditsText: 'api credits',
        frameMap: {
          frameSize: 64,
          animations: {
            walk_n: { y: 512, frames: [1, 2, 3], fps: 8 },
            walk_w: { y: 576, frames: [1, 2, 3], fps: 8 },
            walk_s: { y: 640, frames: [1, 2, 3], fps: 8 },
            walk_e: { y: 704, frames: [1, 2, 3], fps: 8 },
            idle_n: { y: 1408, frames: [0, 1], fps: 4 },
            idle_w: { y: 1472, frames: [0, 1], fps: 4 },
            idle_s: { y: 1536, frames: [0, 1], fps: 4 },
            idle_e: { y: 1600, frames: [0, 1], fps: 4 },
          },
        },
      },
    ])

    expect(worldAgents[0]?.apiSprite?.characterPngUrl).toBe('https://cdn.example.com/agent.png')
    expect(worldAgents[0]?.spriteBundleId).toBeNull()
    expect(worldAgents[0]?.usesPlaceholder).toBe(false)
  })

})

describe('buildWorldPlayer', () => {
  it('starts the player from a left-shifted spawn point', () => {
    expect(buildWorldPlayer()).toMatchObject({ xPercent: 38, yPercent: 50, spriteBundleId: 'cafe-bot' })
  })
})
