// Writes go to the FastAPI backend. Failures are ignored on purpose: the UI behaves
// exactly like the prototype whether or not the backend is running.

const post = (path, body) =>
  fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});

export const sendContact = (ans) =>
  post("/api/contact-submissions", {
    name: ans[0] || "", email: ans[1] || "", company: ans[2] || "",
    project: ans[3] || "", timeline: ans[4] || "", notes: ans[5] || "",
  });

export const sendPollVote = (i) => post("/api/poll-votes", { option_index: +i });
