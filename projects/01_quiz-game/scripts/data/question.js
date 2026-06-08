export const quizQuestions = [
  {
    id: 'sam-middle-name',
    category: 'personal',
    difficulty: 'easy',
    question: `What is Samuel&apos;s middle name?`,
    options: [
      'John',
      'Chibueze',
      'Chiwendu',
      'Ifeanyi'
    ],
    answer: 2,
    explanation:
      `Samuel&apos;s middle name is Chiwendu.`,
    feedbackMsgHTML: {
      valid: `Okay, okay. I see you! <span aria-hidden="true">&#x1F642;</span>`,
      invalid: `Oops! What you mean?! <span aria-hidden="true">&#x1F602; &#x1F972;</span>`
    },
    tags: [
      'name'
    ]
  },
  {
    id: 'sam-sibling-count',
    category: 'personal',
    difficulty: 'easy',
    question: `How many siblings does Samuel have?`,
    options: [
      '4',
      '3',
      '2',
      '1'
    ],
    answer: 3,
    explanation:
      "Samuel has just one sibling",
    feedbackMsgHTML: {
      valid: `Okay, okay. I see you! <span aria-hidden="true">&#x1F642;</span>`,
      invalid: `Oops! What you mean?! <span aria-hidden="true">&#x1F602; &#x1F972;</span>`
    },
    tags: [
      'family',
      'sibling'
    ]
  },
  {
    id: 'sam-brother-name',
    category: 'personal',
    difficulty: 'easy',
    question: `What is Samuel&apos;s brother&apos;s name?`,
    options: [
      'Onyekachi',
      'Wisdom',
      'Ifeanyi',
      'Liberty'
    ],
    answer: 1,
    explanation:
      `Samuel&apos;s brother&apos;s name is Wisdom.`,
    feedbackMsgHTML: {
      valid: 'Okay, okay. I see you! <span aria-hidden="true">&#x1F642;</span>',
      invalid: 'Oops! What you mean?! <span aria-hidden="true">&#x1F602; &#x1F972;</span>'
    },
    tags: [
      'name',
      'sibling'
    ]
  }
];