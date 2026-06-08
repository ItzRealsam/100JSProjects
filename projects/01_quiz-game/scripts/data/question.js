export const quizQuestions = [
  {
    id: 'sam-middle-name',
    category: 'personal',
    difficulty: 'easy',
    question: "What is Samuel's middle name?",
    options: [
      'John',
      'Chibueze',
      'Chiwendu',
      'Ifeanyi'
    ],
    answer: 3,
    explanation:
      "Samuel's middle name is Chiwendu.",
    feedbackMsgHTML: {
      valid: `Oops! What you mean?! <span aria-hidden="true">&#x1F602; &#x1F972;</span>`,
      invalid: `<span aria-hidden="true">&#x1F642;</span>`
    },
    tags: [
      'name'
    ]
  },
  {
    id: 'sam-sibling-count',
    category: 'personal',
    difficulty: 'easy',
    question: "How many siblings does Samuel's have?",
    options: [
      '4',
      '3',
      '2',
      '1'
    ],
    answer: 4,
    explanation:
      "Samuel has just one sibling",
    feedbackMsgHTML: {
      valid: `Oops! What you mean?! <span aria-hidden="true">&#x1F602; &#x1F972;</span>`,
      invalid: `<span aria-hidden="true">&#x1F642;</span>`
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
    question: "What is Samuel's brother's name?",
    options: [
      'Onyekachi',
      'Wisdom',
      'Ifeanyi',
      'Liberty'
    ],
    answer: 2,
    explanation:
      "Samuel's brother's name is Wisdom.",
    feedbackMsgHTML: {
      valid: `Oops! What you mean?! <span aria-hidden="true">&#x1F602; &#x1F972;</span>`,
      invalid: `<span aria-hidden="true">&#x1F642;</span>`
    },
    tags: [
      'name',
      'sibling'
    ]
  }
];