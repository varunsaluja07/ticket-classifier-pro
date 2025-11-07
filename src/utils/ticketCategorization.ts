/**
 * Rule-based ticket categorization utility
 * Categorizes tickets based on keyword matching in subject and description
 */

interface CategorizationResult {
  category: string;
  priority: string;
  sla: string;
  confidence: number;
}

const categoryKeywords = {
  "Login issues": [
    "login", "sign in", "signin", "password", "forgot password", "reset password",
    "can't login", "cannot login", "unable to login", "authentication", "auth",
    "credentials", "locked out", "access denied", "2fa", "two factor"
  ],
  "Account Access": [
    "account", "access", "permission", "role", "privileges", "can't access",
    "cannot access", "unable to access", "restricted", "blocked", "suspended",
    "deactivated", "profile", "settings", "verify", "verification"
  ],
  "Technical": [
    "error", "bug", "crash", "broken", "not working", "doesn't work", "issue",
    "problem", "slow", "loading", "timeout", "500", "404", "failure", "failed",
    "exception", "technical", "system", "server", "database", "api", "code"
  ],
  "Feedback": [
    "suggestion", "feature request", "improvement", "enhance", "would like",
    "could you", "please add", "feedback", "recommend", "love", "great",
    "awesome", "thank", "appreciate", "idea", "proposal"
  ]
};

const priorityKeywords = {
  high: [
    "urgent", "critical", "emergency", "immediately", "asap", "broken",
    "not working", "can't", "cannot", "unable", "blocked", "down",
    "production", "clients", "customers", "security", "data loss"
  ],
  medium: [
    "important", "soon", "need", "issue", "problem", "affecting",
    "multiple", "several", "experiencing", "intermittent"
  ],
  low: [
    "minor", "small", "typo", "cosmetic", "suggestion", "enhancement",
    "future", "eventually", "nice to have", "when possible"
  ]
};

const slaMap: Record<string, string> = {
  high: "1 day",
  medium: "2 days",
  low: "3 days"
};

/**
 * Calculate keyword match score for a category
 */
function calculateCategoryScore(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      score += matches.length;
    }
  });
  
  return score;
}

/**
 * Determine priority based on keyword matching
 */
function determinePriority(text: string): string {
  const lowerText = text.toLowerCase();
  
  const highScore = calculateCategoryScore(lowerText, priorityKeywords.high);
  const mediumScore = calculateCategoryScore(lowerText, priorityKeywords.medium);
  const lowScore = calculateCategoryScore(lowerText, priorityKeywords.low);
  
  // High priority indicators are weighted more
  if (highScore > 0) return "high";
  if (mediumScore > lowScore) return "medium";
  if (lowScore > 0) return "low";
  
  // Default to medium if no clear indicators
  return "medium";
}

/**
 * Categorize a ticket based on subject and description
 */
export function categorizeTicket(subject: string, description: string): CategorizationResult {
  const combinedText = `${subject} ${description}`;
  
  // Calculate scores for each category
  const scores: Record<string, number> = {};
  let maxScore = 0;
  let bestCategory = "Technical"; // Default category
  
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    const score = calculateCategoryScore(combinedText, keywords);
    scores[category] = score;
    
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  });
  
  // Calculate confidence (0-1 scale)
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.25;
  
  // If no keywords matched, default to Technical with low confidence
  if (maxScore === 0) {
    bestCategory = "Technical";
  }
  
  // Determine priority
  const priority = determinePriority(combinedText);
  
  return {
    category: bestCategory,
    priority,
    sla: slaMap[priority],
    confidence
  };
}

/**
 * Get a human-readable explanation of the categorization
 */
export function getCategorizationExplanation(result: CategorizationResult): string {
  const confidenceLevel = result.confidence > 0.6 ? "high" : result.confidence > 0.3 ? "medium" : "low";
  
  return `Categorized as "${result.category}" with ${confidenceLevel} confidence based on keyword analysis.`;
}
