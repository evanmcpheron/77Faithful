import { OptionalPracticeId } from '@77/types/formation/practice.types';
import type { IPracticeDefinition } from '@77/types/formation/practice.types';

export const setupPractices = [
  {
    practiceId: OptionalPracticeId.Movement,
    name: 'Movement',
    purpose: 'Care for your body through suitable, intentional movement.',
    examples: ['A walk, gentle stretching, chair-based movement, or another appropriate activity.'],
    boundaries:
      'No universal distance, intensity, duration, weight target, or fitness comparison. Adapt to ability and circumstances.',
  },
  {
    practiceId: OptionalPracticeId.ServeOrEncourage,
    name: 'Serve or Encourage',
    purpose: 'Express love through practical help or sincere encouragement.',
    examples: [
      'Help with a task, encourage a discouraged person, write a thoughtful message, or offer attentive support.',
    ],
    boundaries:
      "Respect consent, personal safety, and the other person's boundaries. Do not collect proof or name the recipient.",
  },
  {
    practiceId: OptionalPracticeId.ScriptureMemorization,
    name: 'Scripture Memorization',
    purpose: 'Return to Scripture until its words and meaning become more familiar.',
    examples: [
      'Learn part of a passage, review an existing memory passage, or practice recalling it with help.',
    ],
    boundaries:
      'No required number of verses, perfect-recall test, or separate memory-course feature. The participant may select a suitable passage.',
  },
  {
    practiceId: OptionalPracticeId.Gratitude,
    name: 'Gratitude',
    purpose: "Intentionally acknowledge God's gifts and respond with thanks.",
    examples: ['Name something to thank God for, speak gratitude to someone, or write privately.'],
    boundaries:
      'No requirement to deny grief, minimize suffering, or produce a set number of positive statements. No separate gratitude journal is required.',
  },
  {
    practiceId: OptionalPracticeId.ChristianReading,
    name: 'Christian Reading',
    purpose: 'Engage with a suitable Christian book or other substantive Christian writing.',
    examples: ['Read a manageable section and consider how it relates to following Jesus.'],
    boundaries:
      'No purchase is required, no promoted book is privileged, and the devotional is not advertised as a substitute for all additional Christian reading.',
  },
  {
    practiceId: OptionalPracticeId.Worship,
    name: 'Worship',
    purpose: 'Intentionally honor God with attention, praise, and adoration.',
    examples: [
      'Sing, listen attentively to a hymn, speak praise, or spend focused time in worship.',
    ],
    boundaries:
      'No paid music access, mandatory performance, built-in music library, or assumption about one musical tradition.',
  },
  {
    practiceId: OptionalPracticeId.Generosity,
    name: 'Generosity',
    purpose: "Offer what you can for another person's good.",
    examples: ['Share time, attention, resources, hospitality, or money when appropriate.'],
    boundaries:
      'Money is never required. No amount is tracked. Giving to 77Faithful is never suggested as the expected fulfillment.',
  },
  {
    practiceId: OptionalPracticeId.FamilyOrHouseholdDevotion,
    name: 'Family or Household Devotion',
    purpose: 'Intentionally share a moment of faith with family or household members.',
    examples: ['Read a short passage together, pray together, or discuss an appropriate question.'],
    boundaries:
      'Not restricted to married parents. Do not pressure unwilling household members. Someone without a suitable household context should choose another practice.',
  },
  {
    practiceId: OptionalPracticeId.IntentionalDiscipline,
    name: 'Intentional Discipline',
    purpose:
      'Freely set aside a distraction or practice a suitable restraint to make space for attentiveness to God.',
    examples: [
      'Reduce nonessential scrolling, set aside entertainment for a chosen period, or practice another safe, appropriate restraint.',
    ],
    boundaries:
      'Food fasting is not required or the default example. No restriction of necessary food, water, medicine, or care is prescribed. No fasting-duration goals or competitive restraint.',
  },
  {
    practiceId: OptionalPracticeId.IntentionalWitness,
    name: 'Intentional Witness',
    purpose:
      'Reflect Jesus through respectful words and conduct and be open to appropriate opportunities to speak about faith.',
    examples: [
      'Share personal hope when invited, respond honestly to a sincere question, or make a deliberate, respectful expression of Christian faith.',
    ],
    boundaries:
      "No conversion quota, confrontational script, pressure on strangers, or claim that another person's response determines completion.",
  },
] satisfies readonly IPracticeDefinition[];

export const weeklyThemes = [
  'Abiding in Christ',
  'Scripture',
  'Prayer',
  'Renewal',
  'Identity',
  'Love',
  'Service',
  'Stewardship',
  'Christian Community',
  'Mission',
  'Perseverance',
];
