import { quizQuestions } from "./question.js";

/**
 * ==========================================================================
 * QUIZ APP ARCHITECTURE ENGINE
 * ==========================================================================
 */
export const QuizApp = {
  // Centralized DOM cache storage registry
  elements: {},
  
  // Track the history of visited screen views for natural back-navigation
  screenHistory: [],

  currentScreen: null,
  
  quizState: {
    userName: 'Anon',

    questions: [],
    currentQuestionIndex: 0,

    score: 0,

    streak: 0,
    bestStreak: 0,

    startedAt: null,
    finishedAt: null,

    answers: [],

    totalTimeLimit: 300,
    timeRemaining: 300,

    timerId: null,

    questionStartedAt: null,

    questionAnswered: false
  },

  updateQuizHeaderName(userName='') {
    if (userName !== '') {
      const userGreetingHTML = `Hello, ${userName}! <span aria-hidden="true">&#x1F44B;</span>`
      document.querySelector('.js-user-greeting').innerHTML = userGreetingHTML;
    }
  },

  init() {
    // 1. Initialize and cache core view elements
    this.elements = {
      shell:                 document.querySelector('.js-quiz'),
      intro:                 document.querySelector('.js-quiz-intro'),
      onboard:               document.querySelector('.js-quiz-onboard'),
      content:               document.querySelector('.js-quiz-content'),
      result:                document.querySelector('.js-quiz-result'),
      leaderboard:           document.querySelector('.js-quiz-leaderboard'),
      questionsContainer:    document.querySelector('.js-quiz-questions'),
      
      screens:               document.querySelectorAll('.quiz__container'),
      
      // Onboard Screen
      formOnboard:           document.getElementById('quiz-onboard-form'),
      inputUserName:         document.getElementById('user-name-input'),

      // Question Screen
      questionTitle:         document.querySelector('.js-quiz-question'),
      optionsList:           document.querySelector('.js-quiz-options-list'),
      progressCurrent:       document.querySelector('.js-quiz-progress-current'),
      progressLength:        document.querySelector('.js-quiz-progress-length'),
      streakCounter:         document.querySelector('.js-quiz-streak span:last-child'),
      timerText:             document.querySelector('.js-quiz-timer-current'),
      timerTotalText:        document.querySelector('.js-quiz-timer-total'),
      progressFill:          document.querySelector('.js-quiz-progress-fill'),
      feedback:              document.querySelector('.js-quiz-feedback'),
      feedbackRight:         document.querySelector('.js-quiz-feedback-text-right'),
      feedbackWrong:         document.querySelector('.js-quiz-feedback-text-wrong'),

      // Result Screen
      resultScore:           document.querySelector('.js-quiz-user-score'),
      resultFeedback:        document.querySelector('.js-quiz-result-feedback'),
      resultUserTimeSpent:   document.querySelector('.js-quiz-meta-user-time-spent'),
      resultUserRank:        document.querySelector('.js-quiz-meta-user-rank'),
      resultAccuracy:        document.querySelector('.js-quiz-meta-user-accuracy'),
      resultPace:            document.querySelector('.js-quiz-meta-user-pace span:last-child'),
      resultStreak:          document.querySelector('.js-quiz-meta-user-streak span:last-child'),


      // Global Header Action Buttons
      btnBack:               document.getElementById('btn-prev-section'),
      
      // Screen Action Buttons
      btnStart:              document.getElementById('btn-start-quiz'),
      btnStartAnon:          document.getElementById('btn-start-quiz-anon'),
      btnStartWithName:      document.getElementById('btn-start-quiz-name'),
      btnSubmitAnswer:       document.getElementById('btn-submit-answer'),
      btnRetakeQuiz:         document.getElementById('btn-retake-quiz'),
      btnSeeLeaderboard:     document.getElementById('btn-see-leaderboard'),
      
    };

    this.validateElements();

    this.currentScreen = this.elements.intro;

    // 2. Set the initial state visibility parameters
    this.updateUI();

    // 3. Bind interactive click events
    this.bindEvents();
  },

  validateElements() {
    const required = [
      'shell',
      'intro',
      'onboard',
      'content',
      'result',
      'leaderboard',
      'questionsContainer',
      'screens',
      'formOnboard',
      'inputUserName',

      // Question Screen
      'questionTitle',
      'optionsList',
      'progressCurrent',
      'progressLength',
      'streakCounter',
      'timerText',
      'timerTotalText',
      'progressFill',
      'feedback',
      'feedbackRight',
      'feedbackWrong',

      // Result Screen
      'resultScore',
      'resultFeedback',
      'resultUserTimeSpent',
      'resultUserRank',
      'resultPace',
      'resultStreak', 

      // Buttons
      'btnBack',
      'btnStart',
      'btnStartAnon',
      'btnStartWithName',
      'btnSubmitAnswer',
      'btnRetakeQuiz',
      'btnSeeLeaderboard'
    ];

    required.forEach(key => {
      if (!this.elements[key]) {
        throw new Error(`Missing required element: ${key}`);
      }
    });

    if (this.elements.screens.length === 0) {
      throw new Error('No quiz screens found');
    }
  },

  bindEvents() {
    
    // Action 1: Global Header Back Button Click Handler
    this.elements.btnBack.addEventListener('click', () => {
      // Prevent action if the button is structurally disabled
      if (this.elements.btnBack.disabled) return;
      this.handleBackNavigation();
    });

    // Action 2: Forward navigation from Intro Screen to Onboarding Screen
    this.elements.btnStart.addEventListener('click', () => {
      this.navigateTo(this.elements.intro, this.elements.onboard);
    });

    // Action 3: Forward navigation from Onboarding Screen to Questions Screen
    this.elements.inputUserName.addEventListener('input', () => {
      this.elements.btnStartWithName.disabled =
        !this.elements.inputUserName.value.trim();
    });

    this.elements.formOnboard.addEventListener('submit', (event) => {
      event.preventDefault();

      this.startQuiz();
    });

    this.elements.btnStartAnon.addEventListener('click', () => {
      this.startQuiz();
    });

    // Action4: Submit answer during quiz
    this.elements.btnSubmitAnswer.addEventListener('click', () => {
      // Force the browser to reset the CSS :active state box
      this.elements.btnSubmitAnswer.blur();
      
      if (!this.quizState.questionAnswered) {
        this.submitAnswer();

      } 
      else {

        this.nextQuestion();
      }
    });

    //Action5: Retake quiz
    this.elements.btnRetakeQuiz.addEventListener('click', () => {
      clearInterval(this.quizState.timerId);
      this.startQuiz();
    });
  },

  /**
   * Core forward navigation routing mechanic
   */
  navigateTo(currentScreen, nextScreen) {
    if (currentScreen !== nextScreen) {
      this.screenHistory.push(currentScreen);
    }

    this.currentScreen = nextScreen;

    this.showOnly(nextScreen);

    this.updateUI();
  },

  showOnly(screen) {
    this.elements.screens.forEach(container => {
      container.classList.add('inactive');
    });

    screen.classList.remove('inactive');
  },

  //Get active screen
  getCurrentScreen() {
    return this.currentScreen;
  },

  //Update UI
  updateUI() {
    this.updateBackButtonVisibility();
    this.refreshIcons();
  },

  /**
   * Backward navigation stack controller
   */
  handleBackNavigation() {
    if (this.screenHistory.length === 0) return;

    const previousScreen = this.screenHistory.pop();

    if (previousScreen) {
      this.currentScreen = previousScreen;

      this.showOnly(previousScreen);
    }

    this.updateUI();
  },

  /**
   * Safely monitors visibility and interaction states of the header back button component
   */
  updateBackButtonVisibility() {
    
    // Completely hide the button if there is no screen history
    if (this.screenHistory.length === 0) {
      // 1. Safely redirect focus away if the user is currently on it
      if (document.activeElement === this.elements.btnBack) {
        this.elements.shell.focus(); 
      }
      this.elements.btnBack.style.display = 'none';
      return;
    }

    // Ensure it is visible when there is screen history
    this.elements.btnBack.style.display = 'inline-flex';

    // Disable back button if the active container is the Main Quiz Questions screen
    const offBackBtn = this.currentScreen === this.elements.content || this.currentScreen === this.elements.result;
    this.elements.btnBack.disabled = offBackBtn;

  },

  /**
   * Forces external rendering injection libraries to scan dynamic view nodes
   */
  refreshIcons() {
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  },

  startQuiz() {
    this.updateQuizHeaderName(
      this.getUserName()
    );

    this.quizState.questions =
      this.shuffleQuestions(
        [...quizQuestions]
      );

    this.quizState.currentQuestionIndex = 0;

    this.quizState.score = 0;

    this.quizState.streak = 0;

    this.quizState.bestStreak = 0;

    this.quizState.answers = [];

    this.quizState.startedAt =
      performance.now();

    this.navigateTo(
      this.elements.onboard,
      this.elements.content
    );

    this.startQuizTimer();

    this.renderQuestion();
  },

  getUserName() {
    if (this.elements.inputUserName.value) {
      const userName = this.elements.inputUserName.value.trim();
      return this.quizState.userName = userName;
    }

    return this.quizState.userName;
  },

  renderQuestionHeader() {
    const question =
      this.getCurrentQuestion();

    this.elements.questionTitle.innerHTML =
      question.question;
  },

  shuffleQuestions(questions) {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(
        Math.random() * (i + 1)
      );

      [questions[i], questions[j]] =
        [questions[j], questions[i]];
    }

    return questions;
  },

  getCurrentQuestion() {
    return this.quizState.questions[
      this.quizState.currentQuestionIndex
    ];
  },

  renderQuestion() {
    const question = this.getCurrentQuestion();

    // Clear the answer flag so the engine knows this is a fresh question
    this.quizState.questionAnswered = false;

    this.renderQuestionHeader();
    this.renderOptions(question);

    //this.renderProgress();
    this.updateProgressUI();

    this.startQuestionTimer();

    this.hideFeedback();

    this.elements.btnSubmitAnswer.textContent = 'Submit';
    // Disable until selection is made
    this.elements.btnSubmitAnswer.disabled = true;
  },

  renderOptions(question) {
    const letters =
      ['A', 'B', 'C', 'D'];

    const html =
      question.options
        .map((option, index) => {

          const optionId =
            `option-${index}`;

          return `
            <li class="quiz__option-item">

              <input
                type="radio"
                id="${optionId}"
                name="quiz-options"
                value="${index}"
                class="quiz__option-input">

              <label
                for="${optionId}"
                class="quiz__option-label">

                <span>
                  ${letters[index]}. ${option}
                </span>
                <span class="quiz__status-icon">
                  <img src="../01_quiz-game/assets/images/quiz__option-select.png" alt="Indicator" aria-hidden="true">
                </span>

              </label>

            </li>
          `;
        })
        .join('');

    this.elements.optionsList.innerHTML = html;

    // Listen for option changes to turn the Submit button on dynamically!
    this.elements.optionsList.querySelectorAll('input[name="quiz-options"]').forEach(input => {
      input.addEventListener('change', () => {
        this.elements.btnSubmitAnswer.disabled = false;
      });
    });
  },

  startQuizTimer() {
    this.quizState.timeRemaining = 300;

    this.quizState.timerId =
      setInterval(() => {

        this.quizState.timeRemaining--;

        this.updateTimerUI();

        if (
          this.quizState.timeRemaining <= 0
        ) {
          clearInterval(
            this.quizState.timerId
          );

          this.finishQuiz();
        }

      }, 1000);
  },

  startQuestionTimer() {
    this.quizState.questionStartedAt = performance.now();
  },

  // Display timer in minutes
  displayQuestionTimer(time) {
    return (time / 1000).toFixed(2)
  },

  updateTimerUI() {
    // Total Time
    const minutesTotal =
      Math.floor(
        this.quizState.totalTimeLimit / 60
      );

    const secondsTotal =
      this.quizState.totalTimeLimit % 60;

    this.elements.timerTotalText.textContent =
      `${String(minutesTotal).padStart(2,'0')}:${String(secondsTotal).padStart(2,'0')}`;

    // Remaining Time
    const minutesRemaining =
      Math.floor(
        this.quizState.timeRemaining / 60
      );

    const secondsRemaining =
      this.quizState.timeRemaining % 60;

    this.elements.timerText.textContent =
      `${String(minutesRemaining).padStart(2,'0')}:${String(secondsRemaining).padStart(2,'0')}`;
  },

  updateProgressUI() {

    const current = this.quizState.currentQuestionIndex + 1;

    const total = this.quizState.questions.length;

    const percent = (current / total) * 100;

    this.elements.progressCurrent.textContent = current;

    this.elements.progressLength.textContent = total;

    this.elements.progressFill.style.width = `${percent}%`;

    this.elements.streakCounter.textContent = this.quizState.streak;
  },

  submitAnswer() {
    const selected =
      document.querySelector(
        'input[name="quiz-options"]:checked'
      );

    if (!selected) {
      this.elements.btnSubmitAnswer.disabled;
      return;
    }

    const question =
      this.getCurrentQuestion();

    const selectedIndex =
      Number(selected.value);

    const isCorrect =
      selectedIndex === question.answer;

    const timeSpent =
      performance.now() -
      this.quizState.questionStartedAt;

    const questionScore = this.updateScore(
      question,
      isCorrect,
      timeSpent
    );

    this.recordAnswer(
      question,
      selectedIndex,
      isCorrect,
      timeSpent,
      questionScore
    );

    this.showFeedback(isCorrect);

    this.lockQuestion();

    // === 1. APPLY VISUAL STATES TO OPTIONS ===
    const optionItems = this.elements.optionsList.querySelectorAll('.quiz__option-item');
    
    optionItems.forEach((item, index) => {
      const radioInput = item.querySelector('input');
      
      if (index === question.answer) {
        // Always highlight the correct answer in green
        item.classList.remove('quiz__option-item--correct');
        item.classList.add('quiz__option-item--correct');
      } else if (index === selectedIndex && !isCorrect) {
        // If the user picked this one and it's wrong, highlight it in red
        item.classList.add('quiz__option-item--incorrect');
      }
    });

    this.quizState.questionAnswered = true;

    if (
      this.quizState.currentQuestionIndex ===
      this.quizState.questions.length - 1
    ) {

      this.elements.btnSubmitAnswer.textContent =
        'Finish';

    } else {

      this.elements.btnSubmitAnswer.textContent =
        'Next';
    }
  },

  recordAnswer(
    question,
    selectedIndex,
    isCorrect,
    timeSpent,
    scoreAwarded
  ) {

    this.quizState.answers.push({
      questionId: question.id,

      selectedAnswer: selectedIndex,

      correctAnswer: question.answer,

      correct: isCorrect,

      timeSpent,
      
      scoreAwarded
    });
  },

  lockQuestion() {

    document
      .querySelectorAll(
        'input[name="quiz-options"]'
      )
      .forEach(input => {

        input.disabled = true;
      });
  },

  showFeedback(isCorrect) {
    this.elements.feedback.style.display = 'block';
    this.elements.feedbackRight.style.display = isCorrect ? 'block' : 'none';
    this.elements.feedbackWrong.style.display = isCorrect ? 'none' : 'block';
  },

  hideFeedback() {
    this.elements.feedback.style.display = 'none';
    //this.elements.feedbackRight.style.display = 'none';
    //this.elements.feedbackWrong.style.display = 'none';
  },

  updateScore(
    question,
    isCorrect,
    timeSpent
  ) {

    if (!isCorrect) {
      this.quizState.streak = 0;
      return;
    }

    this.quizState.streak++;

    this.quizState.bestStreak =
      Math.max(
        this.quizState.bestStreak,
        this.quizState.streak
      );

    const difficultyPoints = {
      easy: 100,
      medium: 200,
      hard: 300
    };

    const base =
      difficultyPoints[
        question.difficulty
      ];

    const speedBonus =
      Math.max(
        0,
        15000 - timeSpent
      ) / 50;

    const streakBonus =
      this.quizState.streak * 10;

    const questionScore =
      base +
      speedBonus +
      streakBonus;

    this.quizState.score += questionScore;

    return questionScore;
  },

  nextQuestion() {
    this.quizState.currentQuestionIndex++;

    if (
      this.quizState.currentQuestionIndex >=
      this.quizState.questions.length
    ) {
      this.finishQuiz();
      return;
    }

    this.renderQuestion();
  },

  previousQuestion() {
    if (
      this.quizState.currentQuestionIndex === 0
    ) {
      return;
    }

    this.quizState.currentQuestionIndex--;

    this.renderQuestion();
  },

  finishQuiz() {

    clearInterval(
      this.quizState.timerId
    );

    this.quizState.finishedAt =
      performance.now();

    const totalTimeSpent =
      (
        this.quizState.finishedAt -
        this.quizState.startedAt
      ) / 1000;

    const correctAnswers =
      this.quizState.answers.filter(
        answer => answer.correct
      ).length;

    const accuracy =
      (
        correctAnswers /
        this.quizState.questions.length
      ) * 100;

    const averagePace =
      this.quizState.answers.reduce(
        (total, answer) =>
          total + answer.timeSpent,
        0
      ) /
      this.quizState.answers.length;

    this.renderResults({
      score:
        Math.round(
          this.quizState.score
        ),

      accuracy: {
        correctAnswers,
        totalQuestions: this.quizState.questions.length,
        percentage: accuracy.toFixed(1),
      },

      totalTimeSpent,

      averagePace,

      bestStreak:
        this.quizState.bestStreak
    });

    this.navigateTo(
      this.elements.content,
      this.elements.result
    );
  },

  renderResults(stats) {

    this.elements.resultScore.textContent = stats.score;
    this.elements.resultFeedback.textContent = this.getResultMessage(stats.score);
    this.elements.resultUserTimeSpent.textContent = `${stats.totalTimeSpent.toFixed(2)}`;
    this.elements.resultAccuracy.innerHTML = 
      `<span>${stats.accuracy.percentage}%</span> 
      ${stats.accuracy.correctAnswers}/${stats.accuracy.totalQuestions}`;
    this.elements.resultPace.textContent =
      `${(
        stats.averagePace / 1000
      ).toFixed(2)}s`;

    this.elements.resultStreak.textContent = stats.bestStreak;
  },

  getResultMessage(score) {

    if (score >= 2000)
      return 'You know Sam suspiciously well 😳';

    if (score >= 1500)
      return 'Impressive. You definitely pay attention 👏';

    if (score >= 1000)
      return 'Not bad at all 🙂';

    return 'Samuel is disappointed 😂';
  }
};
