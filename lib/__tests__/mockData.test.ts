import {
  generatePlatformCounts,
  generateMockPosts,
  generateMockTopics,
  formatNumber,
} from '../mockData'

test('generatePlatformCounts returns counts for all 4 platforms', () => {
  const counts = generatePlatformCounts('AI tools')
  expect(counts).toHaveProperty('instagram')
  expect(counts).toHaveProperty('twitter')
  expect(counts).toHaveProperty('youtube')
  expect(counts).toHaveProperty('reddit')
  expect(counts.instagram).toBeGreaterThan(0)
})

test('generatePlatformCounts is deterministic for same niche', () => {
  const a = generatePlatformCounts('crypto')
  const b = generatePlatformCounts('crypto')
  expect(a).toEqual(b)
})

test('generateMockPosts returns requested count', () => {
  const posts = generateMockPosts('fitness', 8)
  expect(posts).toHaveLength(8)
})

test('generateMockPosts posts have required fields', () => {
  const posts = generateMockPosts('AI', 1)
  expect(posts[0]).toHaveProperty('platform')
  expect(posts[0]).toHaveProperty('text')
  expect(posts[0]).toHaveProperty('views')
  expect(posts[0]).toHaveProperty('likes')
  expect(posts[0]).toHaveProperty('engagementRate')
})

test('generateMockTopics returns topics sorted by avgViews descending', () => {
  const topics = generateMockTopics('crypto')
  for (let i = 0; i < topics.length - 1; i++) {
    expect(topics[i].avgViews).toBeGreaterThanOrEqual(topics[i + 1].avgViews)
  }
})

test('formatNumber formats thousands correctly', () => {
  expect(formatNumber(315400)).toBe('315.4K')
  expect(formatNumber(500)).toBe('500')
})

test('formatNumber formats millions correctly', () => {
  expect(formatNumber(1980000)).toBe('2.0M') // 1.98M rounds to 2.0M with toFixed(1)
  const result = formatNumber(1980000)
  expect(result.endsWith('M')).toBe(true)
})
