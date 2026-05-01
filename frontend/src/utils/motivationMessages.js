export function getMotivationMessage({ fromStatus, toStatus, action }) {
  if (action === "created") {
    return "Great start! One more opportunity is now on your board.";
  }

  if (toStatus === "APPLIED") {
    return "Well done! You’ve taken action and submitted your application.";
  }

  if (toStatus === "INTERVIEWING") {
    return "Amazing — you’ve moved to interview stage! Tip: after the interview, consider sending a short thank-you email.";
  }

  if (toStatus === "OFFER") {
    return "Congratulations! You received an offer — this is a huge achievement.";
  }

  if (toStatus === "REJECTED") {
    return "This one didn’t work out, but every application builds experience.";
  }

  if (toStatus === "WITHDRAWN") {
    return "Good call. Choosing what is not right for you is also progress.";
  }

  return "Nice progress — keep going.";
}