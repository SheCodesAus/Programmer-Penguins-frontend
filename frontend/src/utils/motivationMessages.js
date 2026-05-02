const messages = {
  created: [
    "Great start! One more opportunity is now on your board.",
    "Nice work — tracking this role will help you stay organised.",
    "You’ve added a new opportunity. Small steps lead to big outcomes.",
  ],

  APPLIED: [
    "Well done! You’ve submitted your application.",
    "Application sent — that’s a real step forward.",
    "Great progress! Keep an eye on this role and prepare for the next step.",
  ],

  INTERVIEWING: [
    "Amazing — you’ve moved to interview stage!",
    "Interview stage unlocked. Time to prepare and shine.",
    "Great news! After the interview, consider sending a short thank-you email.",
  ],

  OFFER: [
    "Congratulations! You received an offer!",
    "Amazing work — this is a huge achievement.",
    "You did it! Take your time to review the offer carefully.",
  ],

  REJECTED: [
    "This one didn’t work out, but every application builds experience.",
    "Not this time — but you’re still moving forward.",
    "Take a moment, then keep going. The right opportunity is still ahead.",
  ],

  WITHDRAWN: [
    "Good choice. You’re focusing on what matters.",
    "Choosing what is not right for you is also progress.",
    "You’re staying intentional with your search — that matters.",
  ],
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function getMotivationMessage({ toStatus, action }) {
  if (action === "created") {
    return pickRandom(messages.created);
  }

  return pickRandom(messages[toStatus] || ["Nice progress — keep going."]);
}