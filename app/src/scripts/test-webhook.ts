import { createHmac } from "crypto";

export async function testWebhook() {
  const secret = "test_secret";
  const payload = JSON.stringify({
    depositId: "dep_test_123",
    status: "COMPLETED"
  });

  const signature = createHmac("sha256", secret).update(payload).digest("hex");

  console.log("Testing pawaPay Webhook Simulation...");
  console.log("Payload:", payload);
  console.log("Signature:", signature);

  const response = await fetch("http://localhost:3000/api/webhooks/pawapay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pawapay-signature": signature
    },
    body: payload
  });

  const data = await response.json();
  console.log("Response Status:", response.status);
  console.log("Response Body:", data);
}

// In a real environment, we'd need to set PAWAPAY_WEBHOOK_SECRET=test_secret
// and have a local server running.
// testWebhook();
