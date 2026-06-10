import { QuizApp } from "./data/quiz.js";

// Safe lifecycle app bootstrapper
document.addEventListener('DOMContentLoaded', () => {
  QuizApp.updateQuizHeaderName();
  QuizApp.init();
});