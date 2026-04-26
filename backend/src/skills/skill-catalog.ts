export interface SkillSeed {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  defaultParams?: Record<string, unknown>;
}

export const SKILL_CATALOG: SkillSeed[] = [
  {
    id: 'insane-search',
    name: 'Insane Search',
    description: '웹을 검색하고 핵심 결과를 요약해서 가져옵니다.',
    triggers: ['검색', '찾아', '알려줘', '확인'],
    defaultParams: { topK: 5 },
  },
  {
    id: 'rss-watcher',
    name: 'RSS Watcher',
    description: '지정한 RSS/블로그 새 글을 주기적으로 확인합니다.',
    triggers: ['새 글', '블로그', '뉴스', '업데이트'],
    defaultParams: { intervalMinutes: 60 },
  },
  {
    id: 'summarizer',
    name: 'Summarizer',
    description: '긴 글을 짧게 요약해줍니다.',
    triggers: ['요약', '간단히', '핵심만'],
  },
  {
    id: 'reminder',
    name: 'Reminder',
    description: '특정 시각에 알림을 보냅니다.',
    triggers: ['알려줘', '리마인드', '잊지마'],
  },
  {
    id: 'calendar-reader',
    name: 'Calendar Reader',
    description: '오늘/내일 일정을 가져옵니다.',
    triggers: ['일정', '오늘 회의', '내일 일정'],
  },
];
