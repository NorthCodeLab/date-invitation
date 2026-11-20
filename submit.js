export async function onRequestPost({ request, env }) {
  const recipient = env.RECIPIENT_EMAIL || "moodyashour606@gmail.com";
  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Email service is not configured." }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }

  let data;
  try { data = await request.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid submission." }), {
      status: 400, headers: { "content-type": "application/json" }
    });
  }

  const clean = (value, max = 1500) => String(value || "").trim().slice(0, max);
  const food = clean(data.food, 120);
  const date = clean(data.date, 40);
  const time = clean(data.time, 20);
  const notes = clean(data.notes, 1500);
  if (!food || !date || !time) {
    return new Response(JSON.stringify({ error: "Food, date, and time are required." }), {
      status: 400, headers: { "content-type": "application/json" }
    });
  }

  const submittedAt = new Date().toLocaleString("en-GB", { timeZone: "Europe/Berlin" });
  const html = `
    <h2>❤️ She said yes — date details</h2>
    <p><strong>Food:</strong> ${escapeHtml(food)}</p>
    <p><strong>Preferred date:</strong> ${escapeHtml(date)}</p>
    <p><strong>Preferred time:</strong> ${escapeHtml(time)}</p>
    <p><strong>Extra message:</strong><br>${escapeHtml(notes || "—").replace(/\n/g, "<br>")}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)} (Europe/Berlin)</p>
  `;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || "Date Planner <onboarding@resend.dev>",
      to: [recipient],
      subject: "❤️ She said YES! — Date Invitation",
      html
    })
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Email provider rejected the request." }), {
      status: 502, headers: { "content-type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" }
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
