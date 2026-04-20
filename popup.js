const apiKeyInput = document.getElementById("apiKey");
const userTextInput = document.getElementById("userText");
const saveKeyBtn = document.getElementById("saveKey");
const clearKeyBtn = document.getElementById("clearKey");
const skimBtn = document.getElementById("skimBtn");
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");

const MODEL = "gpt-5.4";

const PROMPT_PREFIX =
  "I am studying and need help to skim the text I am about to provide. " +
  "When you provide the skimming, do not preface it by saying anything other than directly the summarized text. " +
  "Do not end it by saying anything about the text. " +
  "The text is the absolute only thing which is to be sent:";

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b00020" : "#333333";
}

function setLoading(isLoading) {
  skimBtn.disabled = isLoading;
  skimBtn.textContent = isLoading ? "Skimming..." : "Skim Text";
}

async function getStoredApiKey() {
  const result = await chrome.storage.local.get(["openai_api_key"]);
  return result.openai_api_key || "";
}

async function setStoredApiKey(key) {
  await chrome.storage.local.set({ openai_api_key: key });
}

async function clearStoredApiKey() {
  await chrome.storage.local.remove("openai_api_key");
}

async function loadSavedKey() {
  const savedKey = await getStoredApiKey();
  if (savedKey) {
    apiKeyInput.value = savedKey;
    setStatus("Saved API key loaded.");
  }
}

saveKeyBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();

  if (!key) {
    setStatus("Enter an API key first.", true);
    return;
  }

  await setStoredApiKey(key);
  setStatus("API key saved locally in the extension.");
});

clearKeyBtn.addEventListener("click", async () => {
  await clearStoredApiKey();
  apiKeyInput.value = "";
  setStatus("Saved API key cleared.");
});

skimBtn.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim();
  const pastedText = userTextInput.value.trim();

  outputEl.textContent = "";

  if (!apiKey) {
    setStatus("Please enter your OpenAI API key.", true);
    return;
  }

  if (!pastedText) {
    setStatus("Please paste some text to skim.", true);
    return;
  }

  const fullPrompt = `${PROMPT_PREFIX}${pastedText}`;

  setLoading(true);
  setStatus("Sending request...");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        input: fullPrompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data?.error?.message || "Request failed.";
      throw new Error(errorMessage);
    }

    const resultText =
      data.output_text ||
      "No text was returned.";

    outputEl.textContent = resultText;
    setStatus("Done.");
  } catch (error) {
    console.error(error);
    setStatus(`Error: ${error.message}`, true);
  } finally {
    setLoading(false);
  }
});

loadSavedKey();
