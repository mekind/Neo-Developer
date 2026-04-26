import { buildWorldAgents, PLACEHOLDER_AGENT_IMAGE } from './agents'

describe('buildWorldAgents', () => {
  it('falls back to id when name is missing, uses the placeholder for missing image assets, and appends the default dummy agent', () => {
    const worldAgents = buildWorldAgents([
      {
        id: 'mystery-agent',
        imageAsset: null,
      },
    ])

    expect(worldAgents).toHaveLength(2)
    expect(worldAgents[0]?.label).toBe('mystery-agent')
    expect(worldAgents[0]?.imageSrc).toBe(PLACEHOLDER_AGENT_IMAGE)
    expect(worldAgents[0]?.usesPlaceholder).toBe(true)
    expect(worldAgents[1]?.label).toBe('Noa')
  })

  it('assigns positions once per build and allows a different random placement on the next build', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.15)
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0.65)
      .mockReturnValueOnce(0.75)

    const firstBuild = buildWorldAgents([
      { id: 'alpha', name: 'Alpha', imageAsset: null },
      { id: 'beta', name: 'Beta', imageAsset: null },
    ])

    const secondBuild = buildWorldAgents([
      { id: 'alpha', name: 'Alpha', imageAsset: null },
      { id: 'beta', name: 'Beta', imageAsset: null },
    ])

    expect(firstBuild[0]?.xPercent).not.toBe(secondBuild[0]?.xPercent)
    expect(firstBuild[0]?.yPercent).not.toBe(secondBuild[0]?.yPercent)
    expect(firstBuild[1]?.xPercent).not.toBe(secondBuild[1]?.xPercent)
    expect(firstBuild[1]?.yPercent).not.toBe(secondBuild[1]?.yPercent)
  })
})
