export interface MockPost {
  platform: 'instagram' | 'twitter' | 'youtube' | 'reddit'
  text: string
  views: number
  likes: number
  comments: number
  engagementRate: number
}

export interface MockTopic {
  name: string
  postCount: number
  avgViews: number
  avgLikes: number
  avgComments: number
  signal: 'VIRAL' | 'HOT' | 'LOW'
}

export interface PlatformCounts {
  instagram: number
  twitter: number
  youtube: number
  reddit: number
}

// Deterministic pseudo-random based on numeric seed
function seededRandom(seed: number, offset: number): number {
  const x = Math.sin(seed + offset) * 10000
  return x - Math.floor(x)
}

export function generatePlatformCounts(niche: string): PlatformCounts {
  const seed = niche.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return {
    instagram: 500 + Math.floor(seededRandom(seed, 1) * 400),
    twitter:   900 + Math.floor(seededRandom(seed, 2) * 500),
    youtube:   600 + Math.floor(seededRandom(seed, 3) * 400),
    reddit:    400 + Math.floor(seededRandom(seed, 4) * 300),
  }
}

export function generateMockPosts(niche: string, count = 10): MockPost[] {
  const platforms: MockPost['platform'][] = ['instagram', 'twitter', 'youtube', 'reddit']
  const templates = [
    `Tired of guessing what ${niche} content to post? I automated the whole thing.`,
    `90% of creators don't realize you can do this with ${niche}.`,
    `This is what ${niche} content creation should feel like.`,
    `I spent 5 hours on ${niche} content. This agent does it in 10 minutes.`,
    `${niche} just changed forever — here's what most people missed.`,
    `The ${niche} strategy nobody talks about.`,
    `Most people spend 5 hours on ${niche}. This system does it in 10 minutes.`,
    `I gave 4 AI agents my ${niche} niche — and let them run. Here's what happened.`,
    `${niche} productivity unlocked — nobody told me this was possible.`,
    `Stop guessing ${niche} content. Let the data decide.`,
  ]

  return Array.from({ length: count }, (_, i) => {
    const views    = 50000 + Math.floor(seededRandom(i, 10) * 1500000)
    const likes    = Math.floor(views * (0.03 + seededRandom(i, 11) * 0.08))
    const comments = Math.floor(likes * (0.02 + seededRandom(i, 12) * 0.05))
    return {
      platform: platforms[i % 4],
      text: templates[i % templates.length],
      views,
      likes,
      comments,
      engagementRate: parseFloat(((likes / views) * 100).toFixed(1)),
    }
  })
}

export function generateMockTopics(niche: string): MockTopic[] {
  const seed = niche.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const names = [
    `${niche} Mistakes Everyone Makes`,
    `${niche} Secrets Nobody Talks About`,
    `How to Get Better at ${niche} Fast`,
    `The ${niche} Strategy That Actually Works`,
    `${niche} Hacks for Beginners`,
    `Why Most People Fail at ${niche}`,
    `${niche} Trends You Need to Know`,
    `The Truth About ${niche}`,
  ]

  return names
    .map((name, i) => {
      const avgViews    = 20000 + Math.floor(seededRandom(seed + i, 20) * 380000)
      const avgLikes    = Math.floor(avgViews * (0.04 + seededRandom(seed + i, 21) * 0.06))
      const avgComments = Math.floor(avgLikes * (0.02 + seededRandom(seed + i, 22) * 0.04))
      const postCount   = 3 + Math.floor(seededRandom(seed + i, 23) * 12)

      let signal: MockTopic['signal'] = 'LOW'
      if (avgViews >= 60000 && avgLikes >= 5000 && avgComments >= 500 && postCount >= 5) {
        signal = i < 2 ? 'VIRAL' : 'HOT'
      } else if (avgViews >= 30000) {
        signal = 'HOT'
      }

      return { name, postCount, avgViews, avgLikes, avgComments, signal }
    })
    .sort((a, b) => b.avgViews - a.avgViews)
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
