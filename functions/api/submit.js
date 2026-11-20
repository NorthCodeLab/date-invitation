
export async function onRequestPost({ request, env }) {
  const jsonHeaders = {
    "Content-Type": "application/json",
  };

  try {
    if (!env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Email service is not configured in Cloudflare.",
        }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const body = await request.json();

    const recipient = "moodyash77@gmail.com";

    const safe = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const details = Object.entries(body)
      .filter(([key, value]) =>
        !["email", "recipient-email", "recipientEmail"].includes(
          key.toLowerCase()
        ) &&
        ["string", "number", "boolean"].includes(typeof value)
      )
      .map(
        ([key, value]) =>
          `<p><strong>${safe(key)}:</strong> ${safe(value)}</p>`
      )
      .join("");

    if (!details) {
      return new Response(
        JSON.stringify({ error: "No invitation answers were provided." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Date Invitation <onboarding@resend.dev>",
          to: [recipient],
          subject: "❤️ She said YES! – Date Invitation",
          html: `
            <h2>New Date Invitation Response ❤️</h2>
            ${details}
          `,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend email error:", response.status, result);

      return new Response(
        JSON.stringify({
          error: "Email provider rejected the request.",
          details: result,
        }),
        { status: 502, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("Invitation submission error:", error);

    return new Response(
      JSON.stringify({
        error: "Unable to process the invitation.",
      }),
      { status: 500, headers: jsonHeaders }
    );
  }
}
