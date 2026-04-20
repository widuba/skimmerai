const userTextInput = document.getElementById("userText");
const skimBtn = document.getElementById("skimBtn");
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");

// Paste your Hugging Face token here
const HF_API_KEY = "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";

// Recommended summarization model
const MODEL_ID = "facebook/bart-large-cnn";

// Router endpoint for HF Inference
const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

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

async function skimText() {
  const pastedText = userTextInput.value.trim();
  outputEl.textContent = "";

  if (!HF_API_KEY || HF_API_KEY === "PASTE_YOUR_HF_TOKEN_HERE") {
    setStatus("Paste your Hugging Face token into popup.js first.", true);
    return;
  }

  if (!pastedText) {
    setStatus("Please paste some text first.", true);
    return;
  }

  const fullPrompt = `${PROMPT_PREFIX}${pastedText}`;

  setLoading(true);
  setStatus("Sending request...");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_length: 180,
          min_length: 40,
          do_sample: false
        },
        options: {
          wait_for_model: true
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        data?.error ||
        data?.message ||
        "Request failed.";
      throw new Error(message);
    }

    let resultText = "";

    if (Array.isArray(data) && data[0]?.summary_text) {
      resultText = data[0].summary_text;
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      resultText = data[0].generated_text;
    } else if (data?.summary_text) {
      resultText = data.summary_text;
    } else if (typeof data === "string") {
      resultText = data;
    } else {
      resultText = JSON.stringify(data, null, 2);
    }

    outputEl.textContent = resultText.trim();
    setStatus("Done.");
  } catch (error) {
    console.error(error);
    setStatus(`Error: ${error.message}`, true);
  } finally {
    setLoading(false);
  }
}

skimBtn.addEventListener("click", skimText);
