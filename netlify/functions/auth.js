import fetch from "node-fetch";

export async function handler(event) {
  const { code } = event.queryStringParameters;

  const response = await fetch("https://YOUR_AUTH0_DOMAIN/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: "YOUR_CLIENT_ID",
      client_secret: "YOUR_CLIENT_SECRET",
      code,
      redirect_uri: "https://kul-trade.netlify.app/admin/"
    })
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
}
