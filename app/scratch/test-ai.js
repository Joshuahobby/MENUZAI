// Using native fetch in Node 24
async function testAI() {
  const apiKey = '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';
  const systemPrompt = 'You are a waiter';
  const messages = [{ role: 'user', content: 'hi' }];
  const models = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "google/gemma-3-12b-it:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "openai/gpt-oss-20b:free",
  ];

  for (const model of models) {
    console.log(`Trying ${model}...`);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://menuzaai.com",
          "X-Title": "MENUZAI Assistant",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
        }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`Success: ${JSON.stringify(data.choices[0].message)}`);
        return;
      } else {
        console.log(`Error: ${JSON.stringify(data)}`);
      }
    } catch (e) {
      console.log(`Fetch error: ${e.message}`);
    }
  }
}

testAI();
