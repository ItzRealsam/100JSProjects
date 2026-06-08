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

  updateQuizHeaderName(userName='') {
    if (userName !== '') {
      const userGreetingHTML = `Hello, ${userName}! <span aria-hidden="true">&#x1F44B;</span>`
      document.querySelector('.js-user-greeting').innerHTML = userGreetingHTML;
    }
  },

  init() {
    // 1. Initialize and cache core view elements
    this.elements = {
      shell:       document.querySelector('.js-quiz'),
      intro:       document.querySelector('.js-quiz-intro'),
      onboard:     document.querySelector('.js-quiz-onboard'),
      content:     document.querySelector('.js-quiz-content'),
      result:      document.querySelector('.js-quiz-result'),
      leaderboard: document.querySelector('.js-quiz-leaderboard'),
      
      screens:     document.querySelectorAll('.quiz__container'),
      
      formOnboard:          document.getElementById('quiz-onboard-form'),
      inputUserName:        document.getElementById('user-name-input'),

      // Global Header Action Buttons
      btnBack:              document.getElementById('btn-prev-section'),
      
      // Screen Action Buttons
      btnStart:             document.getElementById('btn-start-quiz'),
      btnStartAnon:         document.getElementById('btn-start-quiz-anon'),
      btnStartWithName:     document.getElementById('btn-start-quiz-name'),
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
      'screens',
      'formOnboard',
      'inputUserName',
      'btnBack',
      'btnStart',
      'btnStartWithName',
      'btnStartAnon'
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

      this.startQuizWithName();
    });
    this.elements.btnStartAnon.addEventListener('click', () => {
      this.updateQuizHeaderName('Anon');
      this.navigateTo(this.elements.onboard, this.elements.content);
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
    const isQuestionScreen = this.currentScreen === this.elements.content;
    this.elements.btnBack.disabled = isQuestionScreen;
  },

  /**
   * Forces external rendering injection libraries to scan dynamic view nodes
   */
  refreshIcons() {
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  },

  startQuizWithName() {
    const userName =
      this.elements.inputUserName.value.trim();

    this.updateQuizHeaderName(userName);

    this.navigateTo(
      this.elements.onboard,
      this.elements.content
    );
  }
};