/**
 * Question Model Class representing an individual quiz question instance.
 */
export class Question {
  constructor(dbData) {
    this.id = dbData.id;
    this.category = dbData.category;
    this.difficulty = dbData.difficulty;
    this.question = dbData.question;
    this.options = dbData.options;
    this.answer = dbData.answer;
    this.explanation = dbData.explanation;
    
    // Map database snake_case field back to your application's camelCase structure
    this.feedbackMsgHTML = dbData.feedback_msg_html || { valid: '', invalid: '' };
    this.tags = dbData.tags || [];
  }

  /**
   * Helper method to check if a user selection index is correct
   */
  isCorrectOption(index) {
    return Number(index) === this.answer;
  }

  /**
   * Generates dynamic feedback HTML depending on correctness
   */
  getFeedbackMessage(isCorrect) {
    return isCorrect ? this.feedbackMsgHTML.valid : this.feedbackMsgHTML.invalid;
  }
}

/**
 * Factory function to transform raw Supabase rows into OOP Question instances
 * @param {Array} records - Raw data array from Supabase
 * @returns {Question[]} Array of instantiated Question objects
 */
export function createQuizEngineQuestions(records) {
  return records.map(row => new Question(row));
}