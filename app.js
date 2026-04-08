const defaultVocabs = [
  { word: "Aesthetic", phonetic: "/esˈθet.ɪk/", englishDef: "of, relating to, or dealing with aesthetics or the beautiful", meaning: "(adj.) 美學的；(n.) 美學", examples: [{ en: "The new building has little aesthetic value.", zh: "這座新建築幾乎沒有什麼美學價值。" }] },
  { word: "Breathtaking", phonetic: "/ˈbreθˌteɪ.kɪŋ/", englishDef: "exciting or impressive", meaning: "(adj.) 令人驚豔的", examples: [{ en: "The view from the top of the mountain is breathtaking.", zh: "從山頂看下去的景色美得令人驚豔。" }] },
  { word: "Fascinate", phonetic: "/ˈfæs.ən.eɪt/", englishDef: "to transfix and hold spellbound by an irresistible power", meaning: "(v.) 深深吸引；迷住", examples: [{ en: "Science has always fascinated me.", zh: "科學一直深深吸引著我。" }] },
  { word: "Dazzling", phonetic: "/ˈdæz.əl.ɪŋ/", englishDef: "brilliantly or showily bright, colorful, or impressive", meaning: "(adj.) 耀眼的；令人驚嘆的", examples: [{ en: "It was a dazzling performance.", zh: "那是一場令人驚嘆的表演。" }] },
  { word: "Ambience", phonetic: "/ˈæm.bi.əns/", englishDef: "a feeling or mood associated with a particular place, person, or thing", meaning: "(n.) 氣氛；情調", examples: [{ en: "The restaurant has a very pleasant ambience.", zh: "這家餐廳的氣氛非常宜人。" }] }
];

let vocabs = [];
try {
  const stored = localStorage.getItem("lingo_vocabs");
  if (stored) {
    vocabs = JSON.parse(stored);
  } else {
    vocabs = [...defaultVocabs];
  }
} catch (e) {
  console.error("Local storage error:", e);
  vocabs = [...defaultVocabs];
}

// Migrate SRS schema
vocabs.forEach(v => {
  if (!v.srs) {
    v.srs = { interval: 0, repetition: 0, efactor: 2.5, nextReviewDate: Date.now() };
  }
});

function saveVocabs() {
  localStorage.setItem("lingo_vocabs", JSON.stringify(vocabs));
}

let currentIndex = 0; // Only used for direct jumps/edit tracking now
let currentWordSpeechCount = 0;
let currentExampleSpeechCount = 0;

let dueCards = [];
let currentSrsCard = null;

const viewHome = document.getElementById("view-home");
const viewFlashcard = document.getElementById("view-flashcard");
const viewAddVocab = document.getElementById("view-add-vocab");
const viewSettings = document.getElementById("view-settings");
const btnGoFlashcard = document.getElementById("btn-go-flashcard");
const btnGoAddVocab = document.getElementById("btn-go-add-vocab");
const btnGoSettings = document.getElementById("btn-go-settings");
const btnBackFlashcard = document.getElementById("btn-back-flashcard");
const btnBackAddVocab = document.getElementById("btn-back-add-vocab");
const btnBackSettings = document.getElementById("btn-back-settings");
const viewImportVocab = document.getElementById("view-import-vocab");
const btnGoImportVocab = document.getElementById("btn-go-import-vocab");
const btnBackImportVocab = document.getElementById("btn-back-import-vocab");
const inputImportWords = document.getElementById("input-import-words");
const btnStartImport = document.getElementById("btn-start-import");
const importProgressContainer = document.getElementById("import-progress-container");
const importProgressText = document.getElementById("import-progress-text");
const importLog = document.getElementById("import-log");

const inputApiKey = document.getElementById("input-api-key");
const btnSaveSettings = document.getElementById("btn-save-settings");

const inputSearchVocab = document.getElementById("input-search-vocab");
const searchResults = document.getElementById("search-results");

const inputSentence = document.getElementById("input-sentence");
const btnParseSentence = document.getElementById("btn-parse-sentence");
const parsedWordsContainer = document.getElementById("parsed-words-container");
const inputExampleTrans = document.getElementById("input-example-trans");
const wordChipsContainer = document.getElementById("word-chips");

const wordPreviewContainer = document.getElementById("word-preview-container");
const previewExampleSentence = document.getElementById("preview-example-sentence");
const previewExampleTrans = document.getElementById("preview-example-trans");
const btnGenerateExample = document.getElementById("btn-generate-example");
const previewWord = document.getElementById("preview-word");
const previewPhonetic = document.getElementById("preview-phonetic");
const previewEnglishDef = document.getElementById("preview-english-def");
const previewMeaning = document.getElementById("preview-meaning");
const previewTenses = document.getElementById("preview-tenses");
const btnConfirmAdd = document.getElementById("btn-confirm-add");
const btnToggleRoot = document.getElementById("btn-toggle-root");
const flashcard = document.getElementById("flashcard");
const cardFrontWord = document.getElementById("card-front-word");
const cardFrontPhonetic = document.getElementById("card-front-phonetic");
const cardBackMeaning = document.getElementById("card-back-meaning");
const cardBackTenses = document.getElementById("card-back-tenses");
const cardBackExample = document.getElementById("card-back-example");
const btnSpeak = document.getElementById("btn-speak");

const flashcardCompleteMsg = document.getElementById("flashcard-complete-msg");
const flashcardWrapper = document.getElementById("flashcard-wrapper");
const srsControls = document.getElementById("srs-controls");
const srsButtonsContainer = document.getElementById("srs-buttons-container");
const btnSrsAgain = document.getElementById("btn-srs-again");
const btnSrsHard = document.getElementById("btn-srs-hard");
const btnSrsEasy = document.getElementById("btn-srs-easy");
const btnReviewRandom = document.getElementById("btn-review-random");

const btnEditCard = document.getElementById("btn-edit-card");
const editModal = document.getElementById("edit-modal");
const editWord = document.getElementById("edit-word");
const editPhonetic = document.getElementById("edit-phonetic");
const editEnglishDef = document.getElementById("edit-english-def");
const editMeaning = document.getElementById("edit-meaning");
const editTenses = document.getElementById("edit-tenses");
const editExamplesContainer = document.getElementById("edit-examples-container");
const btnSaveEdit = document.getElementById("btn-save-edit");
const btnDeleteCard = document.getElementById("btn-delete-card");
const btnCloseEdit = document.getElementById("btn-close-edit");

// Setup SRS Due Cards
function initSrsSession() {
  const now = Date.now();
  dueCards = vocabs.filter(v => v.srs && v.srs.nextReviewDate <= now);
  // shuffle dueCards
  for (let i = dueCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dueCards[i], dueCards[j]] = [dueCards[j], dueCards[i]];
  }
  nextSrsCard();
}

function nextSrsCard() {
  if (dueCards.length === 0) {
    flashcardWrapper.classList.add("hidden");
    srsControls.style.display = "none";
    flashcardCompleteMsg.classList.remove("hidden");
    btnEditCard.style.display = "none";
    return;
  }

  flashcardCompleteMsg.classList.add("hidden");
  flashcardWrapper.classList.remove("hidden");
  srsControls.style.display = "flex";

  currentSrsCard = dueCards[0];
  // Sync currentIndex for edit modal compatibility
  currentIndex = vocabs.findIndex(v => v.word === currentSrsCard.word);

  renderCurrentCard();
}

btnReviewRandom.addEventListener("click", () => {
  // Force all cards to be due randomly
  dueCards = [...vocabs];
  for (let i = dueCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dueCards[i], dueCards[j]] = [dueCards[j], dueCards[i]];
  }
  nextSrsCard();
});

function renderCurrentCard() {
  currentWordSpeechCount = 0;
  currentExampleSpeechCount = 0;
  flashcard.classList.remove("is-flipped");
  srsButtonsContainer.classList.remove("srs-buttons-active"); // hide buttons

  setTimeout(() => {
    const currentVocab = vocabs[currentIndex];
    if (!currentVocab) return;

    cardFrontWord.textContent = currentVocab.word;
    cardFrontPhonetic.textContent = currentVocab.phonetic;

    if (currentVocab.example && !currentVocab.examples) {
      currentVocab.examples = [{ en: currentVocab.example, zh: currentVocab.exampleTranslation }];
    }

    let examplesHTML = `<div class="example-header">例句：</div>`;
    const examplesToRender = currentVocab.examples || [];

    examplesToRender.forEach((ex, idx) => {
      examplesHTML += `
      <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 5px;">
        <span>${ex.en}</span>
        <button class="icon-button small-icon btn-speak-example" data-idx="${idx}" title="播放例句">🔊</button>
      </div>
      <div class="translation" style="margin-bottom:10px;">${ex.zh}</div>
      `;
    });

    const engDefHTML = currentVocab.englishDef && currentVocab.englishDef !== '查無此字義' ? `<div class="english-def">${currentVocab.englishDef}</div>` : '';
    cardBackMeaning.innerHTML = `${engDefHTML}${currentVocab.meaning}`;
    if (currentVocab.tensesAndPhrases) {
      cardBackTenses.style.display = "block";
      cardBackTenses.textContent = currentVocab.tensesAndPhrases;
    } else {
      cardBackTenses.style.display = "none";
      cardBackTenses.textContent = "";
    }
    cardBackExample.innerHTML = examplesHTML;

    btnEditCard.style.display = "inline-block";
  }, 150);
}

// Function wrapper for jumping directly
function updateCard() {
  renderCurrentCard();
}

function processSrsReview(quality) {
  // SM-2 Algorithm mapping: 0 (Again), 1 (Hard), 2 (Easy) => sm2 qualities: 0, 3, 5
  if (!vocabs[currentIndex]) return;
  const sm2q = [0, 3, 5][quality];
  const card = vocabs[currentIndex].srs;

  if (sm2q < 3) {
    card.repetition = 0;
    card.interval = 0; // review again today if possible
    const failed = dueCards.shift();
    if (failed) dueCards.push(failed);
  } else {
    if (card.repetition === 0) {
      card.interval = 1;
    } else if (card.repetition === 1) {
      card.interval = 6;
    } else {
      card.interval = Math.round(card.interval * card.efactor);
    }
    card.repetition++;
    dueCards.shift(); // Remove from queue
  }

  card.efactor = card.efactor + (0.1 - (5 - sm2q) * (0.08 + (5 - sm2q) * 0.02));
  if (card.efactor < 1.3) card.efactor = 1.3;

  if (card.interval > 0) {
    card.nextReviewDate = Date.now() + (card.interval * 24 * 60 * 60 * 1000);
  }

  saveVocabs();
  nextSrsCard();
}

btnSrsAgain.addEventListener("click", () => processSrsReview(0));
btnSrsHard.addEventListener("click", () => processSrsReview(1));
btnSrsEasy.addEventListener("click", () => processSrsReview(2));

function playAudio(text, rate = 1.0) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;

    // Attempt to use a native English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.includes('en'));
    if (englishVoice) utterance.voice = englishVoice;

    window.speechSynthesis.speak(utterance);
  } else {
    alert("您的瀏覽器尚不支援語音發音功能。");
  }
}

flashcard.addEventListener("click", () => {
  flashcard.classList.toggle("is-flipped");
  if (flashcard.classList.contains("is-flipped") && flashcardCompleteMsg.classList.contains("hidden")) {
    srsButtonsContainer.classList.add("srs-buttons-active");
  } else {
    srsButtonsContainer.classList.remove("srs-buttons-active");
  }
});

btnSpeak.addEventListener("click", (e) => {
  e.stopPropagation(); // Stop the card from flipping

  // click 1 (count 0) -> normal, click 2 (count 1) -> 0.6, click 3 (count 2) -> normal ...
  const rate = currentWordSpeechCount % 2 === 0 ? 1.0 : 0.6;
  playAudio(vocabs[currentIndex].word, rate);

  currentWordSpeechCount++;
});

cardBackExample.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-speak-example");
  if (btn) {
    e.stopPropagation(); // Stop the card from flipping
    const idx = btn.getAttribute("data-idx");
    if (vocabs[currentIndex].examples && vocabs[currentIndex].examples[idx]) {
      playAudio(vocabs[currentIndex].examples[idx].en, 0.9);
    }
  }
});

// UI Keybind logic for SRS
function handleKeydown(e) {
  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === " ") {
    e.preventDefault();
    if (!flashcard.classList.contains("is-flipped")) {
      flashcard.click(); // Flip it via click to trigger CSS class properly
    }
  } else if (flashcard.classList.contains("is-flipped")) {
    if (e.key === "1") processSrsReview(0);
    if (e.key === "2") processSrsReview(1);
    if (e.key === "3") processSrsReview(2);
  }
}

// --- Edit Modal Logic ---

btnEditCard.addEventListener("click", () => {
  if (vocabs.length === 0) return;
  const currentVocab = vocabs[currentIndex];
  editWord.value = currentVocab.word;
  editPhonetic.value = currentVocab.phonetic || "";
  editEnglishDef.value = currentVocab.englishDef || "";
  editMeaning.value = currentVocab.meaning || "";
  let tenses = currentVocab.tensesAndPhrases;
  if (!tenses && currentVocab.tenses) tenses = currentVocab.tenses;
  editTenses.value = tenses || "";

  editExamplesContainer.innerHTML = "";
  const examplesToRender = currentVocab.examples || [];
  examplesToRender.forEach((ex, idx) => {
    addExampleToForm(ex.en, ex.zh);
  });

  // Provide an Add Example button
  const addExBtn = document.createElement("button");
  addExBtn.type = "button";
  addExBtn.className = "submit-btn";
  addExBtn.style.background = "#0984e3";
  addExBtn.style.padding = "5px";
  addExBtn.style.fontSize = "0.9rem";
  addExBtn.textContent = "➕ 手動新增空白例句";
  addExBtn.onclick = () => addExampleToForm("", "");

  // Add random example button
  const addRandomExBtn = document.createElement("button");
  addRandomExBtn.type = "button";
  addRandomExBtn.className = "submit-btn";
  addRandomExBtn.style.background = "#00b894";
  addRandomExBtn.style.padding = "5px";
  addRandomExBtn.style.fontSize = "0.9rem";
  addRandomExBtn.textContent = "🎲 隨機產生例句";
  addRandomExBtn.onclick = async () => {
    addRandomExBtn.disabled = true;
    addRandomExBtn.textContent = "⏳ 產生中...";
    try {
      const { examplesPool } = await fetchWordData(currentVocab.word);
      const res = await requestExampleData(currentVocab.word, examplesPool);
      if (res.en) {
        addExampleToForm(res.en, res.zh);
      } else {
        alert("目前無法從字典庫中找到可用的例句。");
      }
    } catch(e) {
      alert("隨機產生例句失敗，請檢查網路連線或 API。");
    } finally {
      addRandomExBtn.disabled = false;
      addRandomExBtn.textContent = "🎲 隨機產生例句";
    }
  };

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "10px";
  btnRow.appendChild(addExBtn);
  btnRow.appendChild(addRandomExBtn);

  editExamplesContainer.appendChild(btnRow);

  editModal.classList.remove("hidden");
});

function addExampleToForm(enText, zhText) {
  const div = document.createElement("div");
  div.className = "edit-example-item";
  div.innerHTML = `
    <textarea class="edit-ex-en" rows="2" placeholder="英文例句">${enText}</textarea>
    <hr style="border:0; border-top:1px solid rgba(0,0,0,0.1); margin: 5px 0;">
    <textarea class="edit-ex-zh" rows="2" placeholder="中文翻譯">${zhText}</textarea>
    <button type="button" class="btn-remove-example" onclick="this.parentElement.remove()" title="刪除此例句">✕</button>
  `;
  editExamplesContainer.insertBefore(div, editExamplesContainer.lastElementChild); // Insert before the Add Button!
}

btnCloseEdit.addEventListener("click", () => {
  editModal.classList.add("hidden");
});

btnSaveEdit.addEventListener("click", () => {
  const currentVocab = vocabs[currentIndex];
  currentVocab.phonetic = editPhonetic.value.trim();
  currentVocab.englishDef = editEnglishDef.value.trim();
  currentVocab.meaning = editMeaning.value.trim();
  currentVocab.tensesAndPhrases = editTenses.value.trim();

  const exampleItems = document.querySelectorAll(".edit-example-item");
  const newExamples = [];
  exampleItems.forEach(item => {
    const en = item.querySelector(".edit-ex-en").value.trim();
    const zh = item.querySelector(".edit-ex-zh").value.trim();
    if (en) newExamples.push({ en, zh });
  });
  currentVocab.examples = newExamples;

  saveVocabs();
  updateCard();
  editModal.classList.add("hidden");
});

btnDeleteCard.addEventListener("click", () => {
  if (confirm(`確定要刪除「${vocabs[currentIndex].word}」這張卡片嗎？此動作無法復原！`)) {
    // remove from dueCards if present
    const tWord = vocabs[currentIndex].word;
    dueCards = dueCards.filter(d => d.word !== tWord);

    vocabs.splice(currentIndex, 1);
    saveVocabs();

    editModal.classList.add("hidden");

    nextSrsCard(); // proceed to next naturally!
  }
});

// Navigation logic
function showView(viewToShow) {
  viewHome.classList.add("hidden");
  viewFlashcard.classList.add("hidden");
  viewAddVocab.classList.add("hidden");
  viewSettings.classList.add("hidden");
  viewImportVocab.classList.add("hidden");
  viewToShow.classList.remove("hidden");
}

btnGoFlashcard.addEventListener("click", () => {
  initSrsSession();
  showView(viewFlashcard);
  document.addEventListener("keydown", handleKeydown); // Enable keys only in flashcard view
});
btnGoAddVocab.addEventListener("click", () => {
  showView(viewAddVocab);
});
btnGoSettings.addEventListener("click", () => {
  showView(viewSettings);
});
btnGoImportVocab.addEventListener("click", () => {
  showView(viewImportVocab);
});

btnBackFlashcard.addEventListener("click", () => {
  showView(viewHome);
  document.removeEventListener("keydown", handleKeydown);
});
btnBackAddVocab.addEventListener("click", () => showView(viewHome));
btnBackSettings.addEventListener("click", () => showView(viewHome));
btnBackImportVocab.addEventListener("click", () => showView(viewHome));

// --- Settings Logic ---
let mwaApiKey = localStorage.getItem("mwa_api_key") || "";
inputApiKey.value = mwaApiKey;

btnSaveSettings.addEventListener("click", () => {
  mwaApiKey = inputApiKey.value.trim();
  localStorage.setItem("mwa_api_key", mwaApiKey);
  alert("✅ API Key 已安全儲存！");
  showView(viewHome);
});

// --- Sentence Parsing Logic ---
let currentExample = "";
let originalExampleTrans = "";
let mwExamplesPool = [];
let lastTranslatedExampleText = "";

btnParseSentence.addEventListener("click", async () => {
  currentExample = inputSentence.value.trim();
  if (!currentExample) return alert("請輸入例句！");

  // Extract words (letters, apostrophes, hyphens)
  const words = currentExample.match(/\b([a-zA-Z\-']+)\b/g);
  if (!words) return alert("找不到有效的單字！");

  // Unique lowercase words
  const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];

  wordChipsContainer.innerHTML = "";
  uniqueWords.forEach(word => {
    const btn = document.createElement("button");
    btn.className = "word-chip";
    if (vocabs.some(v => v.word.toLowerCase() === word.toLowerCase())) {
      btn.classList.add("already-in-db");
    }
    btn.textContent = word;
    btn.onclick = () => selectWord(word, btn);
    wordChipsContainer.appendChild(btn);
  });

  parsedWordsContainer.classList.remove("hidden");
  wordPreviewContainer.classList.add("hidden");

  // Fetch Example Translation Once
  inputExampleTrans.value = "翻譯整個例句中...";
  try {
    const trRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(currentExample)}&langpair=en|zh-TW`);
    const trData = await trRes.json();
    originalExampleTrans = trData.responseData ? trData.responseData.translatedText : "翻譯失敗";
  } catch (err) {
    originalExampleTrans = "";
  }
  inputExampleTrans.value = originalExampleTrans;
});
let lastClickedChipWord = "";

async function selectWord(clickedWord, btnElement) {
  if (!mwaApiKey) {
    alert("請先返回首頁點擊右上角 ⚙️ 設定 Merriam-Webster API Key！");
    return;
  }
  lastClickedChipWord = clickedWord;
  let word = clickedWord;
  let extractedRoot = "";

  // Morphological Lemmatization using Compromise NLP (For Verbs & Plural Nouns)
  if (typeof nlp !== 'undefined' && currentExample) {
    let doc = nlp(currentExample);
    let ms = doc.match(clickedWord);

    if (ms.has('#Verb')) {
      const rootForm = ms.verbs().toInfinitive().text();
      if (rootForm && rootForm.toLowerCase() !== clickedWord.toLowerCase()) {
        extractedRoot = rootForm;
        convertedType = "原型";
      }
    } else if (ms.has('#Plural')) {
      const rootForm = ms.nouns().toSingular().text();
      if (rootForm && rootForm.toLowerCase() !== clickedWord.toLowerCase()) {
        extractedRoot = rootForm;
        convertedType = "單數";
      }
    }
  }

  document.querySelectorAll(".word-chip").forEach(b => b.classList.remove("selected"));
  btnElement.classList.add("selected");
  wordPreviewContainer.classList.remove("hidden");

  if (extractedRoot) {
    btnToggleRoot.classList.remove("hidden");
    btnToggleRoot.textContent = `轉為${convertedType}`;
    btnToggleRoot.dataset.original = clickedWord;
    btnToggleRoot.dataset.root = extractedRoot;
    btnToggleRoot.dataset.type = convertedType;
    btnToggleRoot.dataset.state = "original";
    btnToggleRoot.style.background = "rgba(255,255,255,0.4)";
    btnToggleRoot.style.color = "var(--c)";
  } else {
    btnToggleRoot.classList.add("hidden");
  }

  const existingVocab = vocabs.find(v => v.word.toLowerCase() === word.toLowerCase());
  previewWord.value = word;

  if (existingVocab) {
    btnConfirmAdd.textContent = `✅ 單字已在庫 (合併更新)`;
  } else {
    btnConfirmAdd.textContent = "✅ 確認加入字卡";
  }
  previewExampleSentence.value = currentExample;
  previewExampleTrans.value = originalExampleTrans;

  await lookupDictionary(word);
}

async function lookupDictionary(wordToLookup) {
  const existingVocab = vocabs.find(v => v.word.toLowerCase() === wordToLookup.toLowerCase());
  if (existingVocab) {
    previewPhonetic.value = existingVocab.phonetic || "";
    previewEnglishDef.value = existingVocab.englishDef || "";
    previewMeaning.value = existingVocab.meaning || "";
    previewTenses.value = existingVocab.tensesAndPhrases || existingVocab.tenses || "";
    btnConfirmAdd.disabled = false;
    return;
  }

  previewTenses.value = "";
  previewPhonetic.value = "查詢中...";
  previewEnglishDef.value = "查詢中...";
  previewMeaning.value = "翻譯中...";
  btnConfirmAdd.disabled = true;

  mwExamplesPool = [];

  try {
    // 1. MW API Fetch
    const mwRes = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${wordToLookup}?key=${mwaApiKey}`);
    const mwData = await mwRes.json();

    let phoneticAndPos = "";
    let englishDef = "";

    if (mwData && mwData.length > 0 && mwData[0].meta) {
      const entry = mwData[0];
      const fl = entry.fl ? `(${entry.fl})` : "";
      const prs = entry.hwi && entry.hwi.prs && entry.hwi.prs.length > 0 ? `/${entry.hwi.prs[0].mw}/` : "";
      phoneticAndPos = `${prs} ${fl}`.trim();
      englishDef = entry.shortdef && entry.shortdef.length > 0 ? entry.shortdef[0] : "";

      // Extract MW Examples
      mwData.forEach(e => {
        if (e.def) {
          e.def.forEach(d => {
            if (d.sseq) {
              d.sseq.forEach(s => {
                s.forEach(arr => {
                  if (arr[1] && arr[1].dt) {
                    arr[1].dt.forEach(dt => {
                      if (dt[0] === 'vis' && Array.isArray(dt[1])) {
                        dt[1].forEach(visObj => {
                          if (visObj.t) {
                            let cleanText = visObj.t.replace(/\{[^}]+\}/g, '');
                            mwExamplesPool.push(cleanText.trim());
                          }
                        });
                      }
                    });
                  }
                });
              });
            }
          });
        }
      });
    } else {
      phoneticAndPos = "找不到音標與詞性";
      englishDef = "查無此字義";
    }

    previewPhonetic.value = phoneticAndPos;
    previewEnglishDef.value = englishDef || "查無此字義";

    // 2. Translate API Fetch
    if (wordToLookup) {
      try {
        const trRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(wordToLookup)}&langpair=en|zh-TW`);
        const trData = await trRes.json();
        previewMeaning.value = trData.responseData ? trData.responseData.translatedText : "翻譯失敗";
      } catch (e) {
        previewMeaning.value = "翻譯失敗";
      }
    } else {
      previewMeaning.value = "查無對應翻譯";
    }

  } catch (err) {
    console.error(err);
    previewPhonetic.value = "查詢失敗 (檢查API)";
    previewEnglishDef.value = "查詢失敗";
    previewMeaning.value = "翻譯失敗";
  } finally {
    btnConfirmAdd.disabled = false;
  }
}

btnGenerateExample.addEventListener("click", async () => {
  btnGenerateExample.disabled = true;
  btnGenerateExample.textContent = "⏳";

  previewExampleSentence.value = "隨機產生例句中...";
  previewExampleTrans.value = "翻譯句子中...";

  try {
    let foundExample = "";
    const currentText = previewExampleSentence.value.trim();

    if (mwExamplesPool.length > 0) {
      const candidates = mwExamplesPool.filter(ex => ex !== currentText);
      if (candidates.length > 0) {
        foundExample = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    if (!foundExample) {
      const word = previewWord.value.trim();
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await res.json();

      if (Array.isArray(data) && data[0].meanings) {
        for (const meaning of data[0].meanings) {
          for (const def of meaning.definitions) {
            if (def.example && def.example !== currentText) {
              foundExample = def.example;
              break;
            }
          }
          if (foundExample) break;
        }
      }
    }

    if (foundExample) {
      foundExample = foundExample.charAt(0).toUpperCase() + foundExample.slice(1);
      previewExampleSentence.value = foundExample;
      const trRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(foundExample)}&langpair=en|zh-TW`);
      const trData = await trRes.json();
      previewExampleTrans.value = trData.responseData ? trData.responseData.translatedText : "翻譯失敗";
      lastTranslatedExampleText = foundExample;
    } else {
      previewExampleSentence.value = "目前在字典皆無更多可用例句，請手動輸入";
      previewExampleTrans.value = "";
    }
  } catch (err) {
    console.error(err);
    previewExampleSentence.value = "無法取得例句";
    previewExampleTrans.value = "";
  } finally {
    btnGenerateExample.disabled = false;
    btnGenerateExample.textContent = "🎲";
  }
});

previewExampleSentence.addEventListener("change", async () => {
  const text = previewExampleSentence.value.trim();
  if (!text || text === lastTranslatedExampleText) return;

  previewExampleTrans.value = "重新翻譯手動輸入的例句中...";
  try {
    const trRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-TW`);
    const trData = await trRes.json();
    previewExampleTrans.value = trData.responseData ? trData.responseData.translatedText : "翻譯失敗";
    lastTranslatedExampleText = text;
  } catch (err) {
    previewExampleTrans.value = "翻譯失敗";
  }
});

btnToggleRoot.addEventListener("click", () => {
  if (btnToggleRoot.dataset.state === "original") {
    previewWord.value = btnToggleRoot.dataset.root;
    btnToggleRoot.dataset.state = "root";
    btnToggleRoot.textContent = "還原拆解字";
    btnToggleRoot.style.background = "var(--c)";
    btnToggleRoot.style.color = "white";
  } else {
    previewWord.value = btnToggleRoot.dataset.original;
    btnToggleRoot.dataset.state = "original";
    btnToggleRoot.textContent = `轉為${btnToggleRoot.dataset.type}`;
    btnToggleRoot.style.background = "rgba(255,255,255,0.4)";
    btnToggleRoot.style.color = "var(--c)";
  }

  // Update the confirm button dynamically
  const w = previewWord.value.trim().toLowerCase();
  const existingVocab = vocabs.find(v => v.word.toLowerCase() === w);
  if (existingVocab) {
    btnConfirmAdd.textContent = "✅ 單字已在庫 (合併更新)";
  } else {
    btnConfirmAdd.textContent = "✅ 確認加入字卡";
  }

  // Automatically re-fetch dictionary/translation info for the new form!
  lookupDictionary(previewWord.value.trim());
});

btnConfirmAdd.addEventListener("click", () => {
  btnConfirmAdd.disabled = true;

  const newWordText = previewWord.value.trim();
  const existingIndex = vocabs.findIndex(v => v.word.toLowerCase() === newWordText.toLowerCase());

  const finalExampleText = previewExampleSentence.value.trim();
  const exampleTransText = previewExampleTrans.value.trim();
  const newExampleObj = { en: finalExampleText, zh: exampleTransText };

  if (existingIndex >= 0) {
    let existingVocab = vocabs[existingIndex];
    if (existingVocab.example && !existingVocab.examples) {
      existingVocab.examples = [{ en: existingVocab.example, zh: existingVocab.exampleTranslation }];
    }
    if (!existingVocab.examples) existingVocab.examples = [];

    // Update to whatever user edited in the box
    existingVocab.englishDef = previewEnglishDef.value.trim();
    existingVocab.meaning = previewMeaning.value.trim();
    existingVocab.tensesAndPhrases = previewTenses.value.trim();

    const isDuplicateExample = existingVocab.examples.some(ex => ex.en.toLowerCase() === finalExampleText.toLowerCase());

    if (!isDuplicateExample && finalExampleText) {
      existingVocab.examples.push(newExampleObj);
      alert("✨ 已儲存您的修改，並將新例句補充至現有的單字卡中！");
    } else {
      alert("✨ 單字的修改已儲存更新！");
    }
  } else {
    // ... (new word handling remains similar, will be correctly pulled)
    const newVocab = {
      word: newWordText,
      phonetic: previewPhonetic.value.trim(),
      englishDef: previewEnglishDef.value.trim(),
      meaning: previewMeaning.value.trim(),
      tensesAndPhrases: previewTenses.value.trim(),
      examples: finalExampleText ? [newExampleObj] : []
    };
    vocabs.push(newVocab);
    alert("✨ 新單字與例句已成功加入字庫！");
  }

  saveVocabs();

  // Update chips state dynamically
  document.querySelectorAll(".word-chip").forEach(chip => {
    // Check if it matches the ORIGINAL typed word OR the newly resolved root word
    if ((chip.textContent.toLowerCase() === lastClickedChipWord.toLowerCase() || chip.textContent.toLowerCase() === newWordText.toLowerCase()) && !chip.classList.contains("already-in-db")) {
      chip.classList.add("already-in-db");
    }
  });

  wordPreviewContainer.classList.add("hidden");
  btnConfirmAdd.disabled = false;
  btnConfirmAdd.textContent = "✅ 確認加入字卡";

  updateCard();
});

// --- Search Vocab Logic ---
inputSearchVocab.addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase();

  if (!query) {
    searchResults.style.display = "none";
    searchResults.innerHTML = "";
    return;
  }

  const results = [];
  vocabs.forEach((v, index) => {
    if (v.word.toLowerCase().includes(query) || (v.meaning && v.meaning.includes(query))) {
      results.push({ vocab: v, index });
    }
  });

  if (results.length === 0) {
    searchResults.innerHTML = `<div style="padding: 15px 20px; color: #636e72; text-align: center;">字庫中找不到相符的結果</div>`;
    searchResults.style.display = "block";
    return;
  }

  searchResults.innerHTML = "";
  results.forEach(res => {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.innerHTML = `
      <span class="search-result-word">${res.vocab.word}</span>
      <span class="search-result-meaning">${res.vocab.meaning}</span>
    `;
    item.onclick = () => {
      // Direct jump sets it as the ONLY due card in this mini-session for immediate rating.
      dueCards = [vocabs[res.index]];
      currentIndex = res.index;

      showView(viewFlashcard);
      document.addEventListener("keydown", handleKeydown);

      flashcardCompleteMsg.classList.add("hidden");
      flashcardWrapper.classList.remove("hidden");
      srsControls.style.display = "flex";
      renderCurrentCard();

      inputSearchVocab.value = "";
      searchResults.style.display = "none";
    };
    searchResults.appendChild(item);
  });

  searchResults.style.display = "block";
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    searchResults.style.display = "none";
  }
});
inputSearchVocab.addEventListener("focus", () => {
  if (inputSearchVocab.value.trim()) {
    searchResults.style.display = "block";
  }
});

// Initial load
showView(viewHome);

// --- Shared Pure API Functions ---
async function fetchWordData(wordToLookup) {
  let phoneticAndPos = "找不到音標與詞性";
  let englishDef = "查無此字義";
  let meaning = "查無對應翻譯";
  let examplesPool = [];

  try {
    const mwRes = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${wordToLookup}?key=${mwaApiKey}`);
    const mwData = await mwRes.json();

    if (mwData && mwData.length > 0 && mwData[0].meta) {
      const entry = mwData[0];
      const fl = entry.fl ? `(${entry.fl})` : "";
      const prs = entry.hwi && entry.hwi.prs && entry.hwi.prs.length > 0 ? `/${entry.hwi.prs[0].mw}/` : "";
      phoneticAndPos = `${prs} ${fl}`.trim();
      englishDef = entry.shortdef && entry.shortdef.length > 0 ? entry.shortdef[0] : "";

      mwData.forEach(e => {
        if (e.def) {
          e.def.forEach(d => {
            if (d.sseq) {
              d.sseq.forEach(s => {
                s.forEach(arr => {
                  if (arr[1] && arr[1].dt) {
                    arr[1].dt.forEach(dt => {
                      if (dt[0] === 'vis' && Array.isArray(dt[1])) {
                        dt[1].forEach(visObj => {
                          if (visObj.t) {
                            let cleanText = visObj.t.replace(/\{[^}]+\}/g, '');
                            examplesPool.push(cleanText.trim());
                          }
                        });
                      }
                    });
                  }
                });
              });
            }
          });
        }
      });
    }
  } catch (e) {
    console.error("MW API Error:", e);
    phoneticAndPos = "查詢失敗";
    englishDef = "查詢失敗";
  }

  if (wordToLookup) {
    try {
      const trRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(wordToLookup)}&langpair=en|zh-TW`);
      const trData = await trRes.json();
      meaning = trData.responseData ? trData.responseData.translatedText : "翻譯失敗";
    } catch (e) {
      meaning = "翻譯失敗";
    }
  }

  return { phoneticAndPos, englishDef, meaning, examplesPool };
}

async function requestExampleData(word, mwPool, currentExampleText = "") {
  let foundExample = "";
  if (mwPool && mwPool.length > 0) {
    const candidates = mwPool.filter(ex => ex.toLowerCase() !== currentExampleText.toLowerCase());
    if (candidates.length > 0) {
      foundExample = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  if (!foundExample) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0].meanings) {
        for (const meaning of data[0].meanings) {
          for (const def of meaning.definitions) {
            if (def.example && def.example.toLowerCase() !== currentExampleText.toLowerCase()) {
              foundExample = def.example;
              break;
            }
          }
          if (foundExample) break;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  let exampleTrans = "";
  if (foundExample) {
    foundExample = foundExample.charAt(0).toUpperCase() + foundExample.slice(1);
    try {
      const trRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(foundExample)}&langpair=en|zh-TW`);
      const trData = await trRes.json();
      exampleTrans = trData.responseData ? trData.responseData.translatedText : "翻譯失敗";
    } catch (e) {
      exampleTrans = "翻譯失敗";
    }
  }

  return { en: foundExample, zh: exampleTrans };
}

// --- Bulk Import Logic ---
btnStartImport.addEventListener("click", async () => {
  if (!mwaApiKey) {
    alert("請先返回首頁點擊右上角 ⚙️ 設定 Merriam-Webster API Key！");
    return;
  }

  const rawText = inputImportWords.value;
  const rawWords = rawText.split(/[\n,]+/).map(w => w.trim()).filter(Boolean);
  const uniqueWords = [...new Set(rawWords)];

  if (uniqueWords.length === 0) {
    alert("未偵測到任何單字！");
    return;
  }

  btnStartImport.disabled = true;
  importProgressContainer.classList.remove("hidden");
  importLog.value = "開始匯入...\n";
  let count = 0;

  for (let i = 0; i < uniqueWords.length; i++) {
    const word = uniqueWords[i];
    importProgressText.textContent = `進度：${i + 1} / ${uniqueWords.length} (處理中：${word})`;

    const exists = vocabs.find(v => v.word.toLowerCase() === word.toLowerCase());
    if (exists) {
      importLog.value += `[略過] ${word} 已存在字庫中\n`;
      importLog.scrollTop = importLog.scrollHeight;
      continue;
    }

    try {
      const { phoneticAndPos, englishDef, meaning, examplesPool } = await fetchWordData(word);
      const { en, zh } = await requestExampleData(word, examplesPool);

      const newVocab = {
        word: word,
        phonetic: phoneticAndPos,
        englishDef: englishDef,
        meaning: meaning,
        tensesAndPhrases: "",
        examples: en ? [{ en, zh }] : []
      };
      
      vocabs.push(newVocab);
      saveVocabs();
      count++;
      importLog.value += `[成功] ${word} 已匯入\n`;
    } catch (e) {
      importLog.value += `[失敗] ${word} 發生錯誤\n`;
    }
    
    importLog.scrollTop = importLog.scrollHeight;
    
    if (i < uniqueWords.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  importProgressText.textContent = `🎉 匯入完成！共成功新增 ${count} 個單字。`;
  btnStartImport.disabled = false;
  inputImportWords.value = "";
});