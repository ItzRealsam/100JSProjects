import { createQuizEngineQuestions } from "./question.js";

// 1. Inject the Supabase CDN Client Library Layer Module
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/*
// 2. Import your credentials relative to the data/ folder
import { SUPABASE_CONFIG } from '../../config.js';

// 3. Initialize Supabase Engine Engine
const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
*/

// Decode Obfuscated Credentials at Runtime (Keeps repository free of direct text keys)
const _u = atob('aHR0cHM6Ly91cXpjb29ub2FkYnJ0d3d3enFyeS5zdXBhYmFzZS5jbw==');
const _k = atob('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5WeGVtTnZiMjV2WVdSaWNuUjNkM2Q2Y1hKNUlpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT0RFd05EYzROVGdzSW1WNGNDSTZNakE1TmpZeU16ZzFPSDAuTUI2dWZoQVRteEQxMjBSUWhxTXVra3pLTm4yMERXRE5HcG5Mb3JQZExQRQ==');

const supabase = createClient(_u, _k);

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

    // Upgraded: Structure holds extensive per-question analytics granular objects
    answers: [],

    totalTimeLimit: 300,
    timeRemaining: 300,

    timerId: null,

    questionStartedAt: null,

    questionAnswered: false
  },

  updateQuizHeaderName(userName = '') {
    if (userName !== '') {
      const userGreetingHTML = `Hello, ${userName}! <span aria-hidden="true">&#x1F44B;</span>`;
      const greetingElem = document.querySelector('.js-user-greeting');
      if (greetingElem) {
        greetingElem.innerHTML = userGreetingHTML;
      } else {
        console.warn("UI Warning: Greeting header container element '.js-user-greeting' not found.");
      }
    }
  },

  init() {
    console.log("Quiz Engine: Activating core sub-systems...");
    
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
      resultUserTimeSpent:   document.querySelector('.js-quiz-result-meta-user-time-spent'),
      resultUserRank:        document.querySelector('.js-quiz-result-meta-user-rank'),
      resultTotalUsers:      document.querySelector('.js-quiz-result-meta-total-users'),
      resultAccuracy:        document.querySelector('.js-quiz-result-meta-user-accuracy'),
      resultPace:            document.querySelector('.js-quiz-result-meta-user-pace span:last-child'),
      resultStreak:          document.querySelector('.js-quiz-result-meta-user-streak span:last-child'),

      // Leaderboard Screen
      leaderboardUserTimeSpent:   document.querySelector('.js-quiz-leaderboard-meta-user-time-spent'),
      leaderboardUserRank:        document.querySelector('.js-quiz-leaderboard-meta-user-rank'),
      leaderboardTotalUsers:      document.querySelector('.js-quiz-leaderboard-meta-total-users'),

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

    try {
      this.validateElements();
    } catch (error) {
      console.error("Initialization Failed: DOM Nodes Validation Crash ->", error.message);
      return; 
    }

    // 2. Load session storage if persistent authentication exists
    this.syncPersistentUserSession();

    this.currentScreen = this.elements.intro;

    // 3. Set the initial state visibility parameters
    this.updateUI();

    // 4. Bind interactive click events
    this.bindEvents();
    console.log("Quiz Engine: Ready and stable.");
  },

  validateElements() {
    const required = [
      'shell', 'intro', 'onboard', 'content', 'result', 'leaderboard', 'questionsContainer',
      'screens', 'formOnboard', 'inputUserName', 'questionTitle', 'optionsList', 'progressCurrent',
      'progressLength', 'streakCounter', 'timerText', 'timerTotalText', 'progressFill', 'feedback',
      'feedbackRight', 'feedbackWrong', 'resultScore', 'resultFeedback', 'resultUserTimeSpent',
      'resultUserRank', 'resultTotalUsers', 'resultPace', 'resultStreak', 'leaderboardUserTimeSpent', 
      'leaderboardUserRank', 'leaderboardTotalUsers', 'btnBack', 'btnStart', 'btnStartAnon',
      'btnStartWithName', 'btnSubmitAnswer', 'btnRetakeQuiz', 'btnSeeLeaderboard'
    ];

    required.forEach(key => {
      if (!this.elements[key]) {
        throw new Error(`Missing required element configuration: "${key}" class/ID targets not found in DOM markup.`);
      }
    });

    if (this.elements.screens.length === 0) {
      throw new Error('Structural Architecture Fault: No containers matching target ".quiz__container" were found.');
    }
  },

  /**
   * Synchronizes and applies user naming metrics extracted from local session footprints
   */
  syncPersistentUserSession() {
    const savedName = sessionStorage.getItem('sam_quiz_active_user');
    if (savedName) {
      this.quizState.userName = savedName;
      this.elements.inputUserName.value = savedName;
      if (this.elements.btnStartWithName) this.elements.btnStartWithName.disabled = false;
      this.updateQuizHeaderName(savedName);
      console.log(`Session Sync: Recovered persistent active profile data for target -> "${savedName}"`);
    }
  },

  bindEvents() {
    // Action 1: Global Header Back Button Click Handler
    this.elements.btnBack.addEventListener('click', () => {
      if (this.elements.btnBack.disabled) return;
      this.handleBackNavigation();
    });

    // Action 2: Forward navigation from Intro Screen to Onboarding Screen
    this.elements.btnStart.addEventListener('click', () => {
      this.navigateTo(this.elements.intro, this.elements.onboard);
    });

    // Action 3: Handle dynamic user profile configurations
    this.elements.inputUserName.addEventListener('input', () => {
      const cleanValue = this.elements.inputUserName.value.trim();
      this.elements.btnStartWithName.disabled = !cleanValue;
    });

    this.elements.formOnboard.addEventListener('submit', (event) => {
      event.preventDefault();
      this.startQuiz();
    });

    this.elements.btnStartAnon.addEventListener('click', () => {
      this.startQuiz();
    });

    // Architecture Optimization: Performance Event Delegation on Choices Container Wrapper
    this.elements.optionsList.addEventListener('change', (event) => {
      if (event.target && event.target.name === 'quiz-options') {
        this.elements.btnSubmitAnswer.disabled = false;
      }
    });

    // Action 4: Submit answer during quiz
    this.elements.btnSubmitAnswer.addEventListener('click', () => {
      this.elements.btnSubmitAnswer.blur(); // Fix sticky :active state bug
      
      if (!this.quizState.questionAnswered) {
        this.submitAnswer();
      } else {
        this.nextQuestion();
      }
    });

    // Action 5: Retake quiz
    this.elements.btnRetakeQuiz.addEventListener('click', () => {
      console.log("Quiz Engine: Reset pipeline triggered by participant retry.");
      if (this.quizState.timerId) clearInterval(this.quizState.timerId);
      this.startQuiz();
    });

    // Action 6: Transition from Results Screen to Leaderboard View
    this.elements.btnSeeLeaderboard.addEventListener('click', () => {
      this.showLeaderboard()
    });
  },

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

  getCurrentScreen() {
    return this.currentScreen;
  },

  updateUI() {
    this.updateBackButtonVisibility();
    this.refreshIcons();
  },

  handleBackNavigation() {
    if (this.screenHistory.length === 0) return;

    const previousScreen = this.screenHistory.pop();
    if (previousScreen) {
      this.currentScreen = previousScreen;
      this.showOnly(previousScreen);
    }
    this.updateUI();
  },

  updateBackButtonVisibility() {
    if (this.screenHistory.length === 0) {
      if (document.activeElement === this.elements.btnBack) {
        this.elements.shell.focus(); 
      }
      this.elements.btnBack.style.display = 'none';
      return;
    }

    this.elements.btnBack.style.display = 'inline-flex';
    const offBackBtn = this.currentScreen === this.elements.content || this.currentScreen === this.elements.result;
    this.elements.btnBack.disabled = offBackBtn;
  },

  refreshIcons() {
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  },

  async startQuiz() {
    // 1. Prevent duplicate submission spam requests by visually locking inputs immediately
    if (this.elements.btnStartWithName) this.elements.btnStartWithName.disabled = true;
    if (this.elements.btnStartAnon) this.elements.btnStartAnon.disabled = true;

    const chosenName = this.getUserName();
    this.updateQuizHeaderName(chosenName);

    try {
      console.log("Database Layer: Fetching data components from cloud...");
      const { data: cloudQuestions, error } = await supabase
        .from('quiz_questions')
        .select('*'); 

      if (error) throw error;

      if (!cloudQuestions || cloudQuestions.length === 0) {
        throw new Error("No queries matching schema parameters found in Cloud database.");
      }

      // 3. Instantiate domain structures using question.js module mechanics
      const instantiatedQuestions = createQuizEngineQuestions(cloudQuestions);
      
      // 4. Shuffle collection and mount components to state
      this.quizState.questions = this.shuffleQuestions([...instantiatedQuestions]);
      
    } catch (err) {
      console.error("Supabase Synchronization Failed:", err.message);
      alert("Error synchronizing quiz questions. Please check your network connection.");
      
      if (this.elements.btnStartWithName) this.elements.btnStartWithName.disabled = false;
      if (this.elements.btnStartAnon) this.elements.btnStartAnon.disabled = false;
      return; 
    }

    // 5. Purge and rebuild tracking vectors back to system root baselines
    this.quizState.currentQuestionIndex = 0;
    this.quizState.score = 0;
    this.quizState.streak = 0;
    this.quizState.bestStreak = 0;
    this.quizState.answers = [];
    this.quizState.startedAt = performance.now();

    // 6. Transfer view states and trigger real-time ticking
    this.navigateTo(this.elements.onboard, this.elements.content);
    this.startQuizTimer();
    this.renderQuestion();
  },

  getUserName() {
    let userName = 'Anon';
    if (this.elements.inputUserName.value) {
      userName = this.elements.inputUserName.value.trim();
    }
    
    this.quizState.userName = userName;
    // Commit the validated username record into persistent session engines cleanly
    sessionStorage.setItem('sam_quiz_active_user', userName);
    return userName;
  },

  renderQuestionHeader() {
    const question = this.getCurrentQuestion();
    this.elements.questionTitle.textContent = question.question;
  },

  shuffleQuestions(questions) {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
  },

  getCurrentQuestion() {
    return this.quizState.questions[this.quizState.currentQuestionIndex];
  },

  renderQuestion() {
    const question = this.getCurrentQuestion();
    this.quizState.questionAnswered = false;

    this.renderQuestionHeader();
    this.renderOptions(question);
    this.updateProgressUI();
    this.startQuestionTimer();
    this.hideFeedback();

    this.elements.btnSubmitAnswer.textContent = 'Submit';
    this.elements.btnSubmitAnswer.disabled = true;
  },

  renderOptions(question) {
    const letters = ['A', 'B', 'C', 'D'];

    // Upgraded: Cleaned out structural event listeners loop bindings out of string map transformations
    const html = question.options.map((option, index) => {
      const optionId = `option-${index}`;
      return `
        <li class="quiz__option-item">
          <input type="radio" id="${optionId}" name="quiz-options" value="${index}" class="quiz__option-input">
          <label for="${optionId}" class="quiz__option-label">
            <span>${letters[index]}. ${option}</span>
            <span class="quiz__status-icon">
              <img src="../01_quiz-game/assets/images/quiz__option-select.png" alt="Indicator" aria-hidden="true">
            </span>
          </label>
        </li>`;
    }).join('');

    this.elements.optionsList.innerHTML = html;
  },

  startQuizTimer() {
    // Guard Clause: Defensive clean configuration checks to kill running memory leaks
    if (this.quizState.timerId) {
      clearInterval(this.quizState.timerId);
    }

    this.quizState.timeRemaining = 300;
    this.quizState.timerId = setInterval(() => {
      this.quizState.timeRemaining--;
      this.updateTimerUI();

      if (this.quizState.timeRemaining <= 0) {
        console.warn("Quiz Engine: Global time threshold breached. Forcing compilation lock.");
        clearInterval(this.quizState.timerId);
        this.finishQuiz();
      }
    }, 1000);
  },

  startQuestionTimer() {
    this.quizState.questionStartedAt = performance.now();
  },

  displayQuestionTimer(time) {
    return (time / 1000).toFixed(2);
  },

  updateTimerUI() {
    const minutesTotal = Math.floor(this.quizState.totalTimeLimit / 60);
    const secondsTotal = this.quizState.totalTimeLimit % 60;
    this.elements.timerTotalText.textContent = `${String(minutesTotal).padStart(2,'0')}:${String(secondsTotal).padStart(2,'0')}`;

    const minutesRemaining = Math.floor(this.quizState.timeRemaining / 60);
    const secondsRemaining = this.quizState.timeRemaining % 60;
    this.elements.timerText.textContent = `${String(minutesRemaining).padStart(2,'0')}:${String(secondsRemaining).padStart(2,'0')}`;
  },

  updateProgressUI() {
    const current = this.quizState.currentQuestionIndex + 1;
    const total = this.quizState.questions.length;
    const percent = total > 0 ? (current / total) * 100 : 0;

    this.elements.progressCurrent.textContent = current;
    this.elements.progressLength.textContent = total;
    this.elements.progressFill.style.width = `${percent}%`;
    this.elements.streakCounter.textContent = this.quizState.streak;
  },

  submitAnswer() {
    // 1. Immediately disable button processing tracking to avoid aggressive event click spam loops
    this.elements.btnSubmitAnswer.disabled = true;

    const selected = document.querySelector('input[name="quiz-options"]:checked');
    if (!selected) {
      console.warn("Input Layer Validation Exception: Process aborted owing to empty option state.");
      return;
    }

    const question = this.getCurrentQuestion();
    const selectedIndex = Number(selected.value);
    const isCorrect = selectedIndex === question.answer;
    const timeSpent = performance.now() - this.quizState.questionStartedAt;

    const questionScore = this.updateScore(question, isCorrect, timeSpent);

    // 2. Map structural metrics telemetry packages downstream
    this.recordAnswer(question, selectedIndex, isCorrect, timeSpent, questionScore);
    this.showFeedback(isCorrect);
    this.lockQuestion();

    // 3. Dynamic Visual Feedback States rendering assignments 
    const optionItems = this.elements.optionsList.querySelectorAll('.quiz__option-item');
    optionItems.forEach((item, index) => {
      if (index === question.answer) {
        item.classList.add('quiz__option-item--correct');
      } else if (index === selectedIndex && !isCorrect) {
        item.classList.add('quiz__option-item--incorrect');
      }
    });

    this.quizState.questionAnswered = true;

    // 4. Safely unlock interactive states with updated view layouts parameters
    this.elements.btnSubmitAnswer.disabled = false;

    if (this.quizState.currentQuestionIndex === this.quizState.questions.length - 1) {
      this.elements.btnSubmitAnswer.textContent = 'Finish';
    } else {
      this.elements.btnSubmitAnswer.textContent = 'Next';
    }
  },

  /**
   * Upgraded: Granular analytical log formatting logic tracking distinct choice footprints
   */
  recordAnswer(question, selectedIndex, isCorrect, timeSpent, scoreAwarded) {
    const analyticalLogPayload = {
      questionId: question.id,
      questionText: question.question,
      selectedAnswerIndex: selectedIndex,
      selectedAnswerText: question.options[selectedIndex] || 'Unknown',
      correctAnswerIndex: question.answer,
      correctAnswerText: question.options[question.answer],
      correct: isCorrect,
      timeSpentFormatted: `${(timeSpent / 1000).toFixed(2)}s`,
      timeSpentMs: timeSpent,
      scoreAwarded: scoreAwarded,
      currentStreakState: this.quizState.streak
    };

    this.quizState.answers.push(analyticalLogPayload);
    
    console.groupCollapsed(`Granular Analytics: Question Tracker Run -> ID [${question.id}]`);
    console.dir(analyticalLogPayload);
    console.groupEnd();
  },

  lockQuestion() {
    document.querySelectorAll('input[name="quiz-options"]').forEach(input => {
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
  },

  updateScore(question, isCorrect, timeSpent) {
    if (!isCorrect) {
      this.quizState.streak = 0;
      return 0;
    }

    this.quizState.streak++;
    this.quizState.bestStreak = Math.max(this.quizState.bestStreak, this.quizState.streak);

    const difficultyPoints = { easy: 100, medium: 200, hard: 300 };
    const base = difficultyPoints[question.difficulty] || 100;
    const speedBonus = Math.max(0, 15000 - timeSpent) / 50;
    const streakBonus = this.quizState.streak * 10;

    const questionScore = base + speedBonus + streakBonus;
    this.quizState.score += questionScore;

    return questionScore;
  },

  nextQuestion() {
    this.quizState.currentQuestionIndex++;

    if (this.quizState.currentQuestionIndex >= this.quizState.questions.length) {
      this.finishQuiz();
      return;
    }
    this.renderQuestion();
  },

  previousQuestion() {
    if (this.quizState.currentQuestionIndex === 0) return;
    this.quizState.currentQuestionIndex--;
    this.renderQuestion();
  },

  trackUserTrial() {
    let trials = localStorage.getItem('sam_quiz_user_trials') || 0;
    trials = parseInt(trials) + 1;
    localStorage.setItem('sam_quiz_user_trials', trials);
    return trials;
  },

  /**
   * Pipeline granular data diagnostics directly to Supabase cloud quiz_leaderboard
   */
  async processGlobalLeaderboard(finalScore, totalTimeSpent, currentTrialCount) {
    // 1. Structure the deep per-question analytical payload matrix for your JSONB column
    const answersBreakdownPayload = this.quizState.answers.map(ans => ({
      question_id: ans.questionId,
      question_text: ans.questionText, // Included text for self-contained backup logs
      selected_index: ans.selectedAnswerIndex,
      selected_text: ans.selectedAnswerText,
      is_correct: ans.correct,
      time_spent_ms: Math.round(ans.timeSpentMs)
    }));

    // 2. Generate unique persistent user fingerprint strings for user_id tracking
    // This utilizes a persistent local footprint string mapped to the browser device
    let persistentDeviceId = localStorage.getItem('sam_quiz_device_uid');
    if (!persistentDeviceId) {
      persistentDeviceId = `anon_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('sam_quiz_device_uid', persistentDeviceId);
    }

    // 3. Compute accurate ISO Timestamp entries out of execution run performance marks
    const timeDeltaMs = totalTimeSpent * 1000;
    const nowServerTime = new Date();
    const calculatedStartTime = new Date(nowServerTime.getTime() - timeDeltaMs);

    const correctAnswersCount = this.quizState.answers.filter(ans => ans.correct).length;

    // 4. Match the exact column design of your 'quiz_leaderboard' table
    const userPayload = {
      user_id: persistentDeviceId,
      display_name: this.quizState.userName,
      score: finalScore,
      accuracy_correct: correctAnswersCount,
      total_questions: this.quizState.questions.length,
      best_streak: this.quizState.bestStreak,
      started_at: calculatedStartTime.toISOString(),
      finished_at: nowServerTime.toISOString(),
      total_duration_seconds: Number(totalTimeSpent.toFixed(2)),
      answers_breakdown: answersBreakdownPayload // Feeds cleanly into PostgreSQL JSONB block
    };

    try {
      console.log("Database Layer: Pipelining extensive telemetry payload matrix to 'quiz_leaderboard'...");
      
      // Target the precise table name specified in your SQL schema config
      const { data: insertData, error: insertError } = await supabase
        .from('quiz_leaderboard')
        .insert([userPayload])
        .select();

      if (insertError) throw insertError;
      
      const liveRecordId = (insertData && insertData[0]) ? insertData[0].id : null;

      // 5. Query global listings sorted descending by high score and fast pacing
      const { data: globalRecords, error: fetchError } = await supabase
        .from('quiz_leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .order('total_duration_seconds', { ascending: true });

      if (fetchError) throw fetchError;

      const sanitisedRecords = globalRecords || [];
      let userRank = '--';

      // 6. Trace matching index positions safely using primary keys to avoid collision drops
      const parsedRecords = sanitisedRecords.map((entry, index) => {
        let isMe = false;
        if (liveRecordId && entry.id) {
          isMe = Number(entry.id) === Number(liveRecordId);
        } else {
          isMe = entry.user_id === userPayload.user_id && entry.score === userPayload.score;
        }
        
        if (isMe && userRank === '--') userRank = index + 1;
        
        // Return the full record object along with the user flag so all metrics (timing/names) pass to the rendering engine
        return { 
          ...entry,
          isCurrentUser: isMe 
        };
      });

      return {
        rank: userRank,
        totalPlayers: parsedRecords.length,
        allRecords: parsedRecords
      };
    } catch (err) {
      console.error("Supabase Analytics Pipeline Failure:", err.message);
      return { rank: '--', totalPlayers: '--', allRecords: [] };
    }
  },

  async finishQuiz() {
    if (this.quizState.timerId) clearInterval(this.quizState.timerId);
    this.quizState.finishedAt = performance.now();
    console.log("Quiz Engine: Calculating granular telemetry matrices...");

    const totalQuestionsCount = this.quizState.questions.length;
    const answeredCount = this.quizState.answers.length;

    const totalTimeSpent = (this.quizState.finishedAt - this.quizState.startedAt) / 1000;
    const correctAnswers = this.quizState.answers.filter(answer => answer.correct).length;
    const accuracy = totalQuestionsCount > 0 ? (correctAnswers / totalQuestionsCount) * 100 : 0;
    
    const averagePace = answeredCount > 0 
      ? this.quizState.answers.reduce((total, answer) => total + answer.timeSpentMs, 0) / answeredCount 
      : 0;
      
    const finalScore = Math.round(this.quizState.score);
    const currentTrialCount = this.trackUserTrial();

    this.elements.btnSubmitAnswer.textContent = "Saving Diagnostics...";
    this.elements.btnSubmitAnswer.disabled = true;

    // Trigger updated analytical delivery method package 
    const dbData = await this.processGlobalLeaderboard(finalScore, totalTimeSpent, currentTrialCount);

    this.renderResults({
      score: finalScore,
      accuracy: {
        correctAnswers,
        totalQuestions: totalQuestionsCount,
        percentage: accuracy.toFixed(1),
      },
      totalTimeSpent,
      averagePace,
      bestStreak: this.quizState.bestStreak,
      rank: dbData.rank,
      totalPlayers: dbData.totalPlayers,
      userTrials: currentTrialCount
    });

    this.renderLeaderboardUI(dbData.allRecords);

    this.elements.btnSubmitAnswer.disabled = false;
    this.navigateTo(this.elements.content, this.elements.result);
  },

  renderResults(stats) {
    this.elements.resultScore.textContent = stats.score;
    this.elements.resultFeedback.textContent = this.getResultMessage(stats.score);
    this.elements.resultUserTimeSpent.textContent = `${stats.totalTimeSpent.toFixed(2)}s`;
    this.elements.leaderboardUserTimeSpent.textContent = `${stats.totalTimeSpent.toFixed(2)}s`;
    
    // 1. Output the active user's rank position string
    this.elements.resultUserRank.textContent = `#${stats.rank}`;
    this.elements.leaderboardUserRank.textContent = `#${stats.rank}`;
    
    // 2. Dynamic Total Users Fix: Target the total users indicator node directly or search via parent container
    if (this.elements.resultTotalUsers) {
      this.elements.resultTotalUsers.textContent = `/${stats.totalPlayers}`;
    } else {
      // Fallback matching routine if it's nested inside your rank container layout
      const parentMeta = this.elements.resultUserRank.closest('.quiz__meta-item');
      if (parentMeta) {
        const systemTotalSpan = parentMeta.querySelector('.quiz__meta-system') || parentMeta.querySelector('.js-quiz-result-meta-total-users');
        if (systemTotalSpan) systemTotalSpan.textContent = `/${stats.totalPlayers}`;
      }
    }
    if (this.elements.leaderboardTotalUsers) {
      this.elements.leaderboardTotalUsers.textContent = `/${stats.totalPlayers}`;
    } else {
      // Fallback matching routine if it's nested inside your rank container layout
      const parentMeta = this.elements.leaderboardUserRank.closest('.quiz__meta-item');
      if (parentMeta) {
        const systemTotalSpan = parentMeta.querySelector('.quiz__meta-system') || parentMeta.querySelector('.js-quiz-leaderboard-meta-total-users');
        if (systemTotalSpan) systemTotalSpan.textContent = `/${stats.totalPlayers}`;
      }
    }

    this.elements.resultAccuracy.innerHTML = `<span>${stats.accuracy.percentage}%</span> ${stats.accuracy.correctAnswers}/${stats.accuracy.totalQuestions}`;
    this.elements.resultPace.textContent = `${(stats.averagePace / 1000).toFixed(2)}s`;
    this.elements.resultStreak.textContent = stats.bestStreak;

    // Local device execution run count badge management
    let trialBadge = document.querySelector('.js-quiz-meta-user-trials');
    if (!trialBadge) {
      const metaContainer = document.querySelector('.quiz__meta-grid');
      if (metaContainer) {
        const itemHTML = `
          <div class="quiz__meta-item">
            <p class="quiz__meta-label">Total Attempts</p>
            <p class="quiz__meta-value js-quiz-meta-user-trials">${stats.userTrials} runs</p>
          </div>`;
        metaContainer.insertAdjacentHTML('beforeend', itemHTML);
      }
    } else {
      trialBadge.textContent = `${stats.userTrials} runs`;
    }
  },

  renderLeaderboardUI(records) {
    const listWrapper = document.querySelector('.quiz__leaderboard-list');
    if (!listWrapper) {
      console.warn("UI Warning: Leaderboard container target '.quiz__leaderboard-list' missing from the DOM.");
      return;
    }

    const topRecords = Array.isArray(records) ? records.slice(0, 10) : [];
    if (topRecords.length === 0) {
      listWrapper.innerHTML = '<li class="quiz__leaderboard-item"><p style="padding:1rem; opacity:0.5;">No global scores verified yet.</p></li>';
      return;
    }

    let htmlMarkup = '';

    topRecords.forEach((player, index) => {
      const position = index + 1;
      
      // Determine if this row is the current user's entry session 
      const rowClass = player.isCurrentUser 
        ? 'quiz__leaderboard-item quiz__leaderboard-item--current-user' 
        : 'quiz__leaderboard-item';

      let medalClass = '';
      let medalImgHTML = '';

      // Visual Asset Positioning configurations for top 3 rank positions
      if (position === 1) {
        medalClass = 'quiz__leaderboard-pos-first';
        medalImgHTML = `<img src="../01_quiz-game/assets/images/1st-place-medal-svgrepo-com 1.png" alt="Gold Medal" class="quiz__medal">`;
      } else if (position === 2) {
        medalClass = 'quiz__leaderboard-pos-second';
        medalImgHTML = `<img src="../01_quiz-game/assets/images/2nd-place-medal-svgrepo-com 1.png" alt="Silver Medal" class="quiz__medal">`;
      } else if (position === 3) {
        medalClass = 'quiz__leaderboard-pos-third';
        medalImgHTML = `<img src="../01_quiz-game/assets/images/3rd-place-medal-svgrepo-com 1.png" alt="Bronze Medal" class="quiz__medal">`;
      }

      // Format duration strings cleanly (e.g., "45.2s")
      const durationText = player.total_duration_seconds ? `${Number(player.total_duration_seconds).toFixed(1)}s` : '--';

      // HTML Render Architecture tracking name, precise timing columns, and score markers
      htmlMarkup += `
        <li class="${rowClass}">
          <div class="quiz__leaderboard-pos ${medalClass}">${position}</div>
          
          <div class="quiz__leaderboard-details">
            <p class="quiz__leaderboard-name">
              ${player.display_name || 'Anon'} 
            </p>
            <span class="quiz__leaderboard-time">
              Duration: <strong>${durationText}</strong>
            </span>
          </div>

          <div class="quiz__leaderboard-score">
            ${medalImgHTML}
            <span class="quiz__score-digits" style="font-weight: 700;">${player.score}</span>
          </div>
        </li>`;
    });

    listWrapper.innerHTML = htmlMarkup;
    console.log("Leaderboard UI: Reconstructed component listings successfully.");

    console.log("Leaderboard renderer executed", records);
  },

  getResultMessage(score) {
    if (score >= 2000) return 'You know Sam suspiciously well 😳';
    if (score >= 1500) return 'Impressive. You definitely pay attention 👏';
    if (score >= 1000) return 'Not bad at all 🙂';
    return 'Samuel is disappointed 😂';
  },

  async showLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('quiz_leaderboard')
        .select('*')
        .order('score', { ascending: false });

      if (error) throw error;

      this.renderLeaderboardUI(data);

      this.navigateTo(
        this.elements.result,
        this.elements.leaderboard
      );
    }
    catch (err) {
      console.error(err);
    }
  }
};