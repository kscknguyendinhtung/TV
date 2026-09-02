export type AppLanguage = "en" | "vi" | "zh";

export interface TranslationDictionary {
  appName: string;
  langName: string;
  langEn: string;
  langVi: string;
  langZh: string;
  selectLanguage: string;
  
  // Header
  apiKeyConfig: string;
  syncFromSheet: string;
  settings: string;
  aiQuotaWarning: string;
  onlyAiStudio: string;
  
  // Navigation
  navOcr: string;
  navVocab: string;
  navReading: string;
  navExplore: string;
  navGrammar: string;
  navChat: string;

  // OCR Tab
  ocrTitle: string;
  ocrSubtitle: string;
  ocrLangChinese: string;
  ocrLangVietnamese: string;
  ocrLangEnglish: string;
  ocrReadingImage: string;
  ocrReadDone: string;
  ocrSelectImage: string;
  ocrTakePhoto: string;
  ocrUploadPhoto: string;
  ocrDragDrop: string;
  ocrSupportFormats: string;
  ocrAutoSplit: string;
  ocrSaveHistory: string;
  ocrScanError: string;
  ocrFileError: string;

  // Vocab Tab
  vocabSearchPlaceholder: string;
  vocabFilterStatus: string;
  vocabFilterAll: string;
  vocabFilterMastered: string;
  vocabFilterUnmastered: string;
  vocabSortOrder: string;
  vocabSortNewest: string;
  vocabSortAlpha: string;
  vocabUploadToSheet: string;
  vocabWordType: string;
  vocabTopic: string;
  vocabNoWords: string;
  vocabNoWordsToLearn: string;
  vocabAddNew: string;
  vocabEdit: string;
  vocabSingleWord: string;
  vocabParagraph: string;
  vocabImage: string;
  vocabEnterChinese: string;
  vocabPasteParagraph: string;
  vocabClickToUploadImage: string;
  vocabAiAutoAnalyze: string;
  vocabScanningImage: string;
  vocabChineseChar: string;
  vocabPinyin: string;
  vocabAmBoi: string;
  vocabMeaning: string;
  vocabHanViet: string;
  vocabSaveChanges: string;
  vocabDeleteWord: string;
  vocabDeleteAll: string;
  vocabConfirmDeleteAll: string;
  vocabConfirmDelete: string;
  vocabFrontHanzi: string;
  vocabFrontMeaning: string;
  vocabAutoPlay: string;
  vocabShuffle: string;
  vocabErrorAnalyze: string;
  vocabErrorExtract: string;
  vocabErrorScan: string;

  // Reading Tab
  readingSpeed: string;
  readingGrammarAnalysis: string;
  readingGrammarTooltip: string;
  readingSaveToSheet: string;
  readingAddToVocab: string;
  readingAnalyzeGrammar: string;
  readingNoContent: string;
  readingConfirmDelete: string;
  readingGrammarError: string;

  // Grammar Tab
  grammarTitle: string;
  grammarSubtitle: string;
  grammarScanImage: string;
  grammarTakeQuiz: string;
  grammarStructure: string;
  grammarExample: string;
  grammarNoAnalysis: string;
  grammarScanning: string;
  grammarNeedTwoPoints: string;
  grammarQuizGenError: string;
  grammarQuestion: string;
  grammarCorrect: string;
  grammarOrderingInstruction: string;
  grammarNoWordsSelected: string;
  grammarExplanation: string;
  grammarFinish: string;
  grammarNext: string;
  grammarConfirmDelete: string;
  grammarScanError: string;

  // Chat Tab
  chatBotName: string;
  chatOnline: string;
  chatAutoOn: string;
  chatAutoOff: string;
  chatClearTooltip: string;
  chatYou: string;
  chatListen: string;
  chatInputPlaceholder: string;
  chatInitialMessage: {
    chinese: string;
    pinyin: string;
    meaning: string;
  };

  // Game / Explore Tab
  gameExploreTab: string;
  gameQuizTab: string;
  gameQuizTitle: string;
  gameQuizSubtitle: string;
  gameQuizMode: string;
  gameModeZhVi: string;
  gameModeViZh: string;
  gameThinkingTime: string;
  gameStart: string;
  gameBack: string;
  gameOver: string;
  gameStoppedAt: string;
  gamePlayAgain: string;
  gameBackToExplore: string;
  gamePrize: string;
  gameStreak: string;
  gameQuestionLabel: string;
  gameSelectHanzi: string;
  gameListenAgain: string;
  gameNeedFourWords: string;
  gameSearchPlaceholder: string;
  gameRandomOrder: string;
  gameSequentialOrder: string;
  gameExploring: string;
  gameEmptyTitle: string;
  gameEmptyDesc: string;
  gameStartExplore: string;
  gameNext: string;
  gameRelatedExpansion: string;
  gameAntonyms: string;
  gameCharAnalysisPrefix: string;
  gameInNotebook: string;
  gameMarkMasteredTooltip: string;
  gameAddToNotebookTooltip: string;

  // Config Screen
  configTitle: string;
  configSubtitle: string;
  configSheetUrlLabel: string;
  configScriptUrlLabel: string;
  configWorksheetPanel: string;
  configAutoScanTabs: string;
  configTabsLoaded: string;
  configVocabTabLabel: string;
  configReadingTabLabel: string;
  configGrammarTabLabel: string;
  configOcrTabLabel: string;
  configSelectTabOption: string;
  configSaveButton: string;
  configResetDefault: string;
  configApiKeyButton: string;
  configQuotaWarning: string;
  configGuideTitle: string;
  configGuideStep1: string;
  configGuideStep2: string;
  configGuideStep3: string;
  configGuideStep4: string;
  configGuideStep5: string;
  configGuideStep6: string;
  configGuideStep7: string;
  configScanError: string;
  configScriptError: string;
  configSyncFailed: string;
  configSyncNetworkError: string;
}

export const translations: Record<AppLanguage, TranslationDictionary> = {
  en: {
    appName: "VietnameseAI",
    langName: "English",
    langEn: "English",
    langVi: "Tiếng Việt",
    langZh: "中文 (China)",
    selectLanguage: "Interface Language",

    // Header
    apiKeyConfig: "Configure Personal API Key",
    syncFromSheet: "Sync from Sheet",
    settings: "Settings",
    aiQuotaWarning: "You have exceeded the free AI quota. Please select a Personal (Paid) API Key to continue.",
    onlyAiStudio: "This feature is only available within Google AI Studio.",

    // Navigation
    navOcr: "Scan",
    navVocab: "Vocabulary",
    navReading: "Reading",
    navExplore: "Explore",
    navGrammar: "Grammar",
    navChat: "AI Chat",

    // OCR Tab
    ocrTitle: "AI Photo Scanner",
    ocrSubtitle: "Take a photo or upload an image to recognize Vietnamese text and learning materials.",
    ocrLangChinese: "Chinese",
    ocrLangVietnamese: "Vietnamese",
    ocrLangEnglish: "English",
    ocrReadingImage: "Scanning image...",
    ocrReadDone: "Scanning complete!",
    ocrSelectImage: "Select Image / Camera",
    ocrTakePhoto: "Take Photo (Camera)",
    ocrUploadPhoto: "Choose from Photos / Files",
    ocrDragDrop: "Drag & drop image here or browse files",
    ocrSupportFormats: "Supports JPG, PNG, WEBP",
    ocrAutoSplit: "Auto sentence & compound word segmentation",
    ocrSaveHistory: "Save history to Google Sheet",
    ocrScanError: "An error occurred while scanning the image. Please try again.",
    ocrFileError: "An error occurred while reading the file.",

    // Vocab Tab
    vocabSearchPlaceholder: "Search Vietnamese vocabulary, topics, meanings...",
    vocabFilterStatus: "Status filter",
    vocabFilterAll: "All",
    vocabFilterMastered: "Mastered",
    vocabFilterUnmastered: "Learning",
    vocabSortOrder: "Sort",
    vocabSortNewest: "Newest",
    vocabSortAlpha: "A-Z",
    vocabUploadToSheet: "To Sheet",
    vocabWordType: "Word type:",
    vocabTopic: "Topic:",
    vocabNoWords: "No vocabulary items yet.",
    vocabNoWordsToLearn: "No vocabulary items to learn.",
    vocabAddNew: "Add New Vocabulary",
    vocabEdit: "Edit Vocabulary",
    vocabSingleWord: "Single Word",
    vocabParagraph: "Paragraph",
    vocabImage: "Image",
    vocabEnterChinese: "Enter Vietnamese word(s)...",
    vocabPasteParagraph: "Paste Vietnamese paragraph here for AI auto-extraction...",
    vocabClickToUploadImage: "Click to select an image",
    vocabAiAutoAnalyze: "AI Auto Analysis",
    vocabScanningImage: "Scanning image...",
    vocabChineseChar: "Vietnamese Word",
    vocabPinyin: "Pronunciation / Tone",
    vocabAmBoi: "Phonetic / Tone Guide",
    vocabMeaning: "Meaning",
    vocabHanViet: "Sino-Vietnamese / Origin",
    vocabSaveChanges: "Save Changes",
    vocabDeleteWord: "Delete this word",
    vocabDeleteAll: "Delete all",
    vocabConfirmDeleteAll: "Are you sure you want to delete ALL vocabulary?",
    vocabConfirmDelete: "Delete word",
    vocabFrontHanzi: "Word",
    vocabFrontMeaning: "Meaning",
    vocabAutoPlay: "Auto-play",
    vocabShuffle: "Shuffle cards",
    vocabErrorAnalyze: "An error occurred while analyzing vocabulary.",
    vocabErrorExtract: "An error occurred while extracting vocabulary.",
    vocabErrorScan: "An error occurred while scanning the image.",

    // Reading Tab
    readingSpeed: "Speed:",
    readingGrammarAnalysis: "Grammar",
    readingGrammarTooltip: "Analyze Vietnamese grammar for all sentences",
    readingSaveToSheet: "Save to Sheet",
    readingAddToVocab: "Add to vocabulary",
    readingAnalyzeGrammar: "Analyze grammar",
    readingNoContent: "No reading content yet. Scan a Vietnamese image or text to get started.",
    readingConfirmDelete: "Delete this sentence?",
    readingGrammarError: "An error occurred while analyzing grammar.",

    // Grammar Tab
    grammarTitle: "Vietnamese Grammar",
    grammarSubtitle: "AI in-depth analysis of Vietnamese sentence structures and rules.",
    grammarScanImage: "Scan grammar image",
    grammarTakeQuiz: "Take quiz test",
    grammarStructure: "Structure",
    grammarExample: "Example",
    grammarNoAnalysis: "No grammar analysis yet.\nTap the grammar icon in the Reading tab\nor scan a grammar image.",
    grammarScanning: "Scanning grammar image...",
    grammarNeedTwoPoints: "At least 2 grammar points are required to generate a quiz.",
    grammarQuizGenError: "Unable to generate quiz at this moment.",
    grammarQuestion: "Question",
    grammarCorrect: "Correct",
    grammarOrderingInstruction: "Rearrange the words into a correct Vietnamese sentence:",
    grammarNoWordsSelected: "No words selected yet",
    grammarExplanation: "Explanation & Answer",
    grammarFinish: "Finish",
    grammarNext: "Next",
    grammarConfirmDelete: "Delete this grammar point?",
    grammarScanError: "An error occurred while scanning the grammar image.",

    // Chat Tab
    chatBotName: "Minh (AI Tutor)",
    chatOnline: "Online",
    chatAutoOn: "Auto On",
    chatAutoOff: "Auto Off",
    chatClearTooltip: "Clear chat history",
    chatYou: "You",
    chatListen: "Listen to pronunciation",
    chatInputPlaceholder: "Type in Vietnamese, English, or Chinese...",
    chatInitialMessage: {
      chinese: "Xin chào! Mình là người bạn Việt Nam của bạn. Hãy cùng nhau trò chuyện bằng tiếng Việt nhé!",
      pinyin: "Xin chào! Mình là người bạn Việt Nam của bạn.",
      meaning: "Hello! I am your Vietnamese practice friend Minh. Let's chat in Vietnamese together!"
    },

    // Game / Explore Tab
    gameExploreTab: "Explore",
    gameQuizTab: "Millionaire",
    gameQuizTitle: "Who is the Millionaire?",
    gameQuizSubtitle: "Reaction challenge with",
    gameQuizMode: "Game Mode",
    gameModeZhVi: "Vietnamese → Meaning",
    gameModeViZh: "Meaning → Vietnamese",
    gameThinkingTime: "Thinking time limit",
    gameStart: "Start Game",
    gameBack: "Back",
    gameOver: "Game Over!",
    gameStoppedAt: "You reached the milestone of",
    gamePlayAgain: "Play Again",
    gameBackToExplore: "Return to Explore",
    gamePrize: "Prize",
    gameStreak: "Win Streak",
    gameQuestionLabel: "Question",
    gameSelectHanzi: "Select the corresponding Vietnamese word",
    gameListenAgain: "Listen again",
    gameNeedFourWords: "Need at least 4 words in the filtered list to start the quiz.",
    gameSearchPlaceholder: "Enter a Vietnamese word to explore...",
    gameRandomOrder: "Random",
    gameSequentialOrder: "Notebook Order",
    gameExploring: "Exploring Vietnamese vocabulary network...",
    gameEmptyTitle: "Explore Vietnamese Vocabulary",
    gameEmptyDesc: "Smart suggestions for compound words, antonyms, and morphemes to expand your Vietnamese vocabulary quickly.",
    gameStartExplore: "Start Exploring",
    gameNext: "Next Word",
    gameRelatedExpansion: "Compound Words",
    gameAntonyms: "Antonyms",
    gameCharAnalysisPrefix: "Syllable Analysis for",
    gameInNotebook: "Mastered",
    gameMarkMasteredTooltip: "Mark as mastered",
    gameAddToNotebookTooltip: "Add to vocabulary",

    // Config Screen
    configTitle: "Connection Settings",
    configSubtitle: "Connect to Google Sheet to synchronize your Vietnamese learning database.",
    configSheetUrlLabel: "Google Sheet Link",
    configScriptUrlLabel: "Apps Script Web App URL",
    configWorksheetPanel: "Select Worksheets (Tabs)",
    configAutoScanTabs: "Auto Scan Tabs",
    configTabsLoaded: "Loaded tabs from Google Sheet!",
    configVocabTabLabel: "Vocabulary Tab",
    configReadingTabLabel: "Reading Tab",
    configGrammarTabLabel: "Grammar Tab",
    configOcrTabLabel: "OCR Log Tab",
    configSelectTabOption: "-- Select tab --",
    configSaveButton: "Save Configuration",
    configResetDefault: "Reset to Default Links",
    configApiKeyButton: "Configure Personal API Key",
    configQuotaWarning: "If you encounter 'Quota Exceeded', please configure a Personal API Key from a Google Cloud Project with billing enabled.",
    configGuideTitle: "Detailed Setup Instructions:",
    configGuideStep1: "Create a new Google Sheet.",
    configGuideStep2: "In Google Sheet, open Extensions > Apps Script.",
    configGuideStep3: "Paste the complete content from google-script.gs into the editor.",
    configGuideStep4: "Click Deploy > New Deployment, select Web App.",
    configGuideStep5: "Set access: 'Execute as: Me' and 'Who has access: Anyone'.",
    configGuideStep6: "Copy the generated Web App URL and paste it into the field above.",
    configGuideStep7: "Click 'Select Worksheets' to inspect the tabs in your sheet.",
    configScanError: "Unable to retrieve tabs list. Please check Google Sheet sharing permissions ('Anyone with link') and Apps Script URL.",
    configScriptError: "Connection error to Google Apps Script. Please verify the URL.",
    configSyncFailed: "Unable to load or sync data. Please ensure the Apps Script Web App URL and sheet columns are valid.",
    configSyncNetworkError: "Sync failed due to a network connection error."
  },

  vi: {
    appName: "HocTiengViet AI",
    langName: "Tiếng Việt",
    langEn: "English",
    langVi: "Tiếng Việt",
    langZh: "中文 (Trung Quốc)",
    selectLanguage: "Ngôn ngữ giao diện",

    // Header
    apiKeyConfig: "Cấu hình API Key cá nhân",
    syncFromSheet: "Đồng bộ từ Sheet",
    settings: "Cài đặt",
    aiQuotaWarning: "Bạn đã hết hạn mức sử dụng AI miễn phí. Vui lòng chọn API Key cá nhân (Paid) để tiếp tục.",
    onlyAiStudio: "Tính năng này chỉ khả dụng trong môi trường AI Studio.",

    // Navigation
    navOcr: "Quét tài liệu",
    navVocab: "Từ vựng",
    navReading: "Luyện đọc",
    navExplore: "Khám phá",
    navGrammar: "Ngữ pháp",
    navChat: "Trò chuyện AI",

    // OCR Tab
    ocrTitle: "Quét ảnh & Nhận diện tiếng Việt",
    ocrSubtitle: "Chụp ảnh hoặc tải lên tài liệu để AI nhận diện câu, từ ghép và ngữ pháp tiếng Việt.",
    ocrLangChinese: "Tiếng Trung",
    ocrLangVietnamese: "Tiếng Việt",
    ocrLangEnglish: "Tiếng Anh",
    ocrReadingImage: "Đang đọc tài liệu tiếng Việt...",
    ocrReadDone: "Đã phân tích xong!",
    ocrSelectImage: "Chọn ảnh / Máy ảnh",
    ocrTakePhoto: "Chụp ảnh (Máy ảnh)",
    ocrUploadPhoto: "Chọn ảnh từ Thư viện",
    ocrDragDrop: "Kéo thả ảnh vào đây hoặc chọn từ thiết bị",
    ocrSupportFormats: "Hỗ trợ JPG, PNG, WEBP",
    ocrAutoSplit: "Tự động tách câu & trích xuất từ ghép",
    ocrSaveHistory: "Lưu lịch sử vào Google Sheet",
    ocrScanError: "Có lỗi xảy ra khi quét ảnh. Vui lòng thử lại.",
    ocrFileError: "Có lỗi xảy ra khi đọc file.",

    // Vocab Tab
    vocabSearchPlaceholder: "Tìm kiếm từ vựng tiếng Việt, chủ đề, nghĩa...",
    vocabFilterStatus: "Lọc trạng thái",
    vocabFilterAll: "Tất cả",
    vocabFilterMastered: "Đã thuộc",
    vocabFilterUnmastered: "Đang học",
    vocabSortOrder: "Sắp xếp",
    vocabSortNewest: "Mới nhất",
    vocabSortAlpha: "A-Z",
    vocabUploadToSheet: "Lên Sheet",
    vocabWordType: "Loại từ:",
    vocabTopic: "Chủ đề:",
    vocabNoWords: "Chưa có từ vựng tiếng Việt nào.",
    vocabNoWordsToLearn: "Chưa có từ vựng để học.",
    vocabAddNew: "Thêm từ vựng mới",
    vocabEdit: "Sửa từ vựng",
    vocabSingleWord: "Từ vựng",
    vocabParagraph: "Đoạn văn",
    vocabImage: "Hình ảnh",
    vocabEnterChinese: "Nhập từ / cụm từ tiếng Việt...",
    vocabPasteParagraph: "Dán đoạn văn tiếng Việt vào đây để AI tự trích xuất từ vựng...",
    vocabClickToUploadImage: "Nhấn để chọn ảnh",
    vocabAiAutoAnalyze: "AI Tự động phân tích",
    vocabScanningImage: "Đang quét ảnh...",
    vocabChineseChar: "Từ tiếng Việt",
    vocabPinyin: "Phát âm / Thanh điệu",
    vocabAmBoi: "Hướng dẫn ngữ âm",
    vocabMeaning: "Nghĩa dịch",
    vocabHanViet: "Gốc từ / Hán Việt",
    vocabSaveChanges: "Lưu thay đổi",
    vocabDeleteWord: "Xóa từ vựng này",
    vocabDeleteAll: "Xóa tất cả",
    vocabConfirmDeleteAll: "Bạn có chắc chắn muốn xóa TẤT CẢ từ vựng?",
    vocabConfirmDelete: "Xóa từ",
    vocabFrontHanzi: "Từ gốc",
    vocabFrontMeaning: "Nghĩa",
    vocabAutoPlay: "Tự động phát",
    vocabShuffle: "Trộn thẻ",
    vocabErrorAnalyze: "Có lỗi xảy ra khi phân tích từ vựng.",
    vocabErrorExtract: "Có lỗi xảy ra khi trích xuất từ vựng.",
    vocabErrorScan: "Có lỗi xảy ra khi quét ảnh.",

    // Reading Tab
    readingSpeed: "Tốc độ đọc:",
    readingGrammarAnalysis: "Ngữ pháp",
    readingGrammarTooltip: "Phân tích ngữ pháp tiếng Việt cho toàn bài",
    readingSaveToSheet: "Lưu lên Sheet",
    readingAddToVocab: "Thêm vào sổ từ vựng",
    readingAnalyzeGrammar: "Phân tích ngữ pháp",
    readingNoContent: "Chưa có nội dung luyện đọc. Hãy quét ảnh tài liệu để bắt đầu.",
    readingConfirmDelete: "Xóa câu này?",
    readingGrammarError: "Có lỗi xảy ra khi phân tích ngữ pháp.",

    // Grammar Tab
    grammarTitle: "Ngữ pháp tiếng Việt",
    grammarSubtitle: "AI phân tích chuyên sâu các cấu trúc ngữ pháp và mẫu câu tiếng Việt.",
    grammarScanImage: "Quét ảnh ngữ pháp",
    grammarTakeQuiz: "Luyện trắc nghiệm",
    grammarStructure: "Cấu trúc ngữ pháp",
    grammarExample: "Ví dụ minh họa",
    grammarNoAnalysis: "Chưa có phân tích ngữ pháp.\nHãy nhấn vào biểu tượng ngữ pháp ở tab Luyện đọc\nhoặc quét ảnh tài liệu ngữ pháp.",
    grammarScanning: "Đang quét ảnh ngữ pháp...",
    grammarNeedTwoPoints: "Cần ít nhất 2 cấu trúc ngữ pháp để tạo bài test.",
    grammarQuizGenError: "Không thể tạo bài test lúc này.",
    grammarQuestion: "Câu hỏi",
    grammarCorrect: "Chính xác",
    grammarOrderingInstruction: "Sắp xếp các từ thành câu tiếng Việt hoàn chỉnh:",
    grammarNoWordsSelected: "Chưa chọn từ nào",
    grammarExplanation: "Giải thích & Đáp án",
    grammarFinish: "Hoàn thành",
    grammarNext: "Câu tiếp theo",
    grammarConfirmDelete: "Xóa cấu trúc này?",
    grammarScanError: "Có lỗi xảy ra khi quét ảnh ngữ pháp.",

    // Chat Tab
    chatBotName: "Minh (Gia sư AI)",
    chatOnline: "Đang trực tuyến",
    chatAutoOn: "Tự động đọc",
    chatAutoOff: "Tắt đọc",
    chatClearTooltip: "Xoá lịch sử trò chuyện",
    chatYou: "Bạn",
    chatListen: "Nghe phát âm chuẩn",
    chatInputPlaceholder: "Nhập tin nhắn tiếng Việt, tiếng Anh hoặc tiếng Trung...",
    chatInitialMessage: {
      chinese: "Xin chào! Mình là người bạn Việt Nam của bạn. Hãy cùng nhau trò chuyện bằng tiếng Việt nhé!",
      pinyin: "Xin chào! Mình là người bạn Việt Nam của bạn.",
      meaning: "Xin chào! Mình là người bạn Việt Nam của bạn. Hãy cùng nhau trò chuyện bằng tiếng Việt nhé!"
    },

    // Game / Explore Tab
    gameExploreTab: "Mở rộng từ",
    gameQuizTab: "Triệu phú",
    gameQuizTitle: "Ai là Triệu phú?",
    gameQuizSubtitle: "Thử thách phản xạ với mốc",
    gameQuizMode: "Chế độ chơi",
    gameModeZhVi: "Tiếng Việt → Nghĩa",
    gameModeViZh: "Nghĩa → Tiếng Việt",
    gameThinkingTime: "Thời gian suy nghĩ",
    gameStart: "Bắt đầu",
    gameBack: "Quay lại",
    gameOver: "GameOver!",
    gameStoppedAt: "Bạn đã dừng chân tại mốc",
    gamePlayAgain: "Chơi lại ngay",
    gameBackToExplore: "Về màn hình chính",
    gamePrize: "Tiền thưởng",
    gameStreak: "Chuỗi thắng",
    gameQuestionLabel: "Câu hỏi",
    gameSelectHanzi: "Chọn từ tiếng Việt tương ứng",
    gameListenAgain: "Đọc lại",
    gameNeedFourWords: "Cần ít nhất 4 từ trong danh sách lọc để bắt đầu trò chơi.",
    gameSearchPlaceholder: "Nhập từ tiếng Việt để khám phá...",
    gameRandomOrder: "Ngẫu nhiên",
    gameSequentialOrder: "Cố định (Sổ tay)",
    gameExploring: "Đang phân tích cấu tạo & từ liên quan...",
    gameEmptyTitle: "Khám phá từ vựng tiếng Việt",
    gameEmptyDesc: "Gợi ý từ ghép liên quan, từ trái nghĩa và cấu tạo tiếng để bạn mở rộng vốn từ nhanh chóng.",
    gameStartExplore: "Bắt đầu thám hiểm",
    gameNext: "Tiếp theo",
    gameRelatedExpansion: "Từ ghép liên quan",
    gameAntonyms: "Từ trái nghĩa",
    gameCharAnalysisPrefix: "Phân tích tiếng cấu thành",
    gameInNotebook: "Đã thuộc",
    gameMarkMasteredTooltip: "Đánh dấu đã thuộc",
    gameAddToNotebookTooltip: "Thêm vào sổ tay",

    // Config Screen
    configTitle: "Cấu hình kết nối",
    configSubtitle: "Kết nối với Google Sheet để đồng bộ kho dữ liệu học tiếng Việt của bạn.",
    configSheetUrlLabel: "Link Google Sheet",
    configScriptUrlLabel: "Link Script (Web App URL)",
    configWorksheetPanel: "Chọn Tab (Worksheet) tương tác",
    configAutoScanTabs: "Dò tìm danh sách tab tự động",
    configTabsLoaded: "Đã tải tab từ file Google Sheet!",
    configVocabTabLabel: "Tab Từ vựng",
    configReadingTabLabel: "Tab Luyện đọc",
    configGrammarTabLabel: "Tab Ngữ pháp",
    configOcrTabLabel: "Tab Nhật ký OCR",
    configSelectTabOption: "-- Chọn tab --",
    configSaveButton: "Lưu cấu hình",
    configResetDefault: "Khôi phục Sheet & Script mặc định",
    configApiKeyButton: "Cấu hình API Key cá nhân",
    configQuotaWarning: "Nếu bạn gặp lỗi \"Quota Exceeded\", hãy sử dụng API Key cá nhân từ Google Cloud Project có bật Billing.",
    configGuideTitle: "Hướng dẫn chi tiết:",
    configGuideStep1: "Tạo một file Google Sheet mới.",
    configGuideStep2: "Tại Google Sheet, mở Extensions > Apps Script.",
    configGuideStep3: "Dán toàn bộ nội dung trong file google-script.gs vào trình soạn thảo.",
    configGuideStep4: "Nhấp Deploy > New Deployment, chọn loại là Web App.",
    configGuideStep5: "Đặt quyền truy cập: \"Execute as: Me\" và \"Who has access: Anyone\".",
    configGuideStep6: "Sao chép URL Web App vừa sinh ra dán vào ô trên.",
    configGuideStep7: "Click mở panel \"Chọn Tab tương tác\" để kiểm tra dải sheet có trong file.",
    configScanError: "Không thể tải được danh sách tab. Vui lòng kiểm tra quyền chia sẻ của Google Sheet (Bất kỳ ai có liên kết) và URL Apps Script.",
    configScriptError: "Lỗi kết nối đến Google Apps Script. Vui lòng kiểm tra kỹ URL.",
    configSyncFailed: "Không thể tải hoặc đồng bộ dữ liệu. Hãy đảm bảo bạn đã điền đúng link Apps Script Web App và file Google Sheet có cột tương ứng.",
    configSyncNetworkError: "Đồng bộ thất bại do lỗi kết nối."
  },

  zh: {
    appName: "越南语学习 AI",
    langName: "中文",
    langEn: "English",
    langVi: "Tiếng Việt",
    langZh: "中文 (中国)",
    selectLanguage: "界面语言",

    // Header
    apiKeyConfig: "配置个人 API Key",
    syncFromSheet: "从表格同步",
    settings: "设置",
    aiQuotaWarning: "免费 AI 配额已用尽。请选择个人（付费）API Key 继续使用。",
    onlyAiStudio: "此功能仅在 Google AI Studio 环境中可用。",

    // Navigation
    navOcr: "扫描识别",
    navVocab: "生词表",
    navReading: "阅读训练",
    navExplore: "探索拓展",
    navGrammar: "语法解析",
    navChat: "AI 对话",

    // OCR Tab
    ocrTitle: "AI 越南语图片扫描",
    ocrSubtitle: "拍照或上传图片，AI 自动识别越南语文段、句子与词汇。",
    ocrLangChinese: "中文",
    ocrLangVietnamese: "越南语",
    ocrLangEnglish: "英语",
    ocrReadingImage: "正在读取越南语教材/文段...",
    ocrReadDone: "扫描识别完成！",
    ocrSelectImage: "选择图片 / 相机拍摄",
    ocrTakePhoto: "相机拍照",
    ocrUploadPhoto: "相册 / 文件选择",
    ocrDragDrop: "拖拽图片至此处或浏览本地文件",
    ocrSupportFormats: "支持 JPG, PNG, WEBP",
    ocrAutoSplit: "自动断句分词与复合词提取",
    ocrSaveHistory: "自动记录到 Google 表格",
    ocrScanError: "扫描图片时出错，请重试。",
    ocrFileError: "读取文件时发生错误。",

    // Vocab Tab
    vocabSearchPlaceholder: "搜索越南语词汇、主题、释义...",
    vocabFilterStatus: "状态筛选",
    vocabFilterAll: "全部",
    vocabFilterMastered: "已掌握",
    vocabFilterUnmastered: "学习中",
    vocabSortOrder: "排序",
    vocabSortNewest: "最新",
    vocabSortAlpha: "字母序 (A-Z)",
    vocabUploadToSheet: "上传表格",
    vocabWordType: "词性:",
    vocabTopic: "主题:",
    vocabNoWords: "暂无生词记录。",
    vocabNoWordsToLearn: "暂无生词可供背诵。",
    vocabAddNew: "添加新生词",
    vocabEdit: "编辑生词",
    vocabSingleWord: "单个词",
    vocabParagraph: "段落文本",
    vocabImage: "图片扫描",
    vocabEnterChinese: "请输入越南语词汇...",
    vocabPasteParagraph: "在此粘贴越南语段落，AI 将自动提取核心生词...",
    vocabClickToUploadImage: "点击选择图片",
    vocabAiAutoAnalyze: "AI 智能自动分析",
    vocabScanningImage: "正在扫描图片...",
    vocabChineseChar: "越南语词汇",
    vocabPinyin: "发音 / 声调",
    vocabAmBoi: "发音指南",
    vocabMeaning: "释义 / 翻译",
    vocabHanViet: "词根 / 汉越词",
    vocabSaveChanges: "保存更改",
    vocabDeleteWord: "删除此词",
    vocabDeleteAll: "清空全部",
    vocabConfirmDeleteAll: "您确定要删除所有生词吗？",
    vocabConfirmDelete: "删除词语",
    vocabFrontHanzi: "原词",
    vocabFrontMeaning: "释义",
    vocabAutoPlay: "自动播放",
    vocabShuffle: "随机洗牌",
    vocabErrorAnalyze: "分析生词时出错。",
    vocabErrorExtract: "提取生词时出错。",
    vocabErrorScan: "扫描图片时出错。",

    // Reading Tab
    readingSpeed: "语速:",
    readingGrammarAnalysis: "语法解析",
    readingGrammarTooltip: "全文语法深度分析",
    readingSaveToSheet: "保存到表格",
    readingAddToVocab: "加入生词本",
    readingAnalyzeGrammar: "分析语法",
    readingNoContent: "暂无阅读内容。扫描越南语教材或图片即可开始学习。",
    readingConfirmDelete: "删除这个句子？",
    readingGrammarError: "分析语法时发生错误。",

    // Grammar Tab
    grammarTitle: "越南语语法解析",
    grammarSubtitle: "AI 深度解析越南语核心语法结构与句型。",
    grammarScanImage: "扫描语法图片",
    grammarTakeQuiz: "开始测验",
    grammarStructure: "句型结构",
    grammarExample: "例句",
    grammarNoAnalysis: "暂无语法分析。\n点击阅读训练中的语法图标\n或扫描语法图片。",
    grammarScanning: "正在扫描语法图片...",
    grammarNeedTwoPoints: "至少需要 2 个语法点才能生成测验题目。",
    grammarQuizGenError: "当前无法生成测验。",
    grammarQuestion: "题目",
    grammarCorrect: "正确",
    grammarOrderingInstruction: "请将词语按正确越南语语序排列成句：",
    grammarNoWordsSelected: "尚未选择任何词语",
    grammarExplanation: "解析与正确答案",
    grammarFinish: "完成测验",
    grammarNext: "下一题",
    grammarConfirmDelete: "删除此语法点？",
    grammarScanError: "扫描语法图片时出错。",

    // Chat Tab
    chatBotName: "小明 (AI 越南语外教)",
    chatOnline: "在线",
    chatAutoOn: "自动朗读",
    chatAutoOff: "关闭朗读",
    chatClearTooltip: "清空聊天记录",
    chatYou: "你",
    chatListen: "朗读发音",
    chatInputPlaceholder: "输入越南语、中文或英语...",
    chatInitialMessage: {
      chinese: "Xin chào! Mình là người bạn Việt Nam của bạn. Hãy cùng nhau trò chuyện bằng tiếng Việt nhé!",
      pinyin: "Xin chào! Mình là người bạn Việt Nam của bạn.",
      meaning: "你好！我是你的越南语陪练朋友小明。让我们一起用越南语聊天吧！"
    },

    // Game / Explore Tab
    gameExploreTab: "探索拓展",
    gameQuizTab: "百万富翁",
    gameQuizTitle: "谁是百万富翁？",
    gameQuizSubtitle: "反应挑战 限时",
    gameQuizMode: "游戏模式",
    gameModeZhVi: "越南语 → 释义",
    gameModeViZh: "释义 → 越南语",
    gameThinkingTime: "思考时间",
    gameStart: "开始游戏",
    gameBack: "返回",
    gameOver: "游戏结束！",
    gameStoppedAt: "你的最终成绩为",
    gamePlayAgain: "再玩一次",
    gameBackToExplore: "返回探索页面",
    gamePrize: "奖金",
    gameStreak: "连胜",
    gameQuestionLabel: "题目",
    gameSelectHanzi: "选择对应的越南语词汇",
    gameListenAgain: "重新朗读",
    gameNeedFourWords: "生词表中至少需要 4 个词汇才能开始游戏。",
    gameSearchPlaceholder: "输入越南语词汇进行探索...",
    gameRandomOrder: "随机词汇",
    gameSequentialOrder: "生词本顺序",
    gameExploring: "正在探索越南语词汇关联网络...",
    gameEmptyTitle: "探索越南语词汇网络",
    gameEmptyDesc: "智能推荐复合词、反义词和字音拆解，助你快速扩充越南语词汇量。",
    gameStartExplore: "开始探索",
    gameNext: "下一个词",
    gameRelatedExpansion: "复合词拓展",
    gameAntonyms: "反义词",
    gameCharAnalysisPrefix: "音节构成拆解",
    gameInNotebook: "已掌握",
    gameMarkMasteredTooltip: "标记已掌握",
    gameAddToNotebookTooltip: "加入生词本",

    // Config Screen
    configTitle: "连接配置",
    configSubtitle: "连接到 Google 表格以同步您的越南语学习词库与笔记。",
    configSheetUrlLabel: "Google 表格链接",
    configScriptUrlLabel: "Apps Script 网页应用网址 (Web App URL)",
    configWorksheetPanel: "选择互动的子表格 (Worksheets)",
    configAutoScanTabs: "自动扫描子表格",
    configTabsLoaded: "成功从 Google 表格载入子表！",
    configVocabTabLabel: "生词表 Tab",
    configReadingTabLabel: "阅读训练 Tab",
    configGrammarTabLabel: "语法解析 Tab",
    configOcrTabLabel: "OCR 记录 Tab",
    configSelectTabOption: "-- 选择子表 --",
    configSaveButton: "保存配置",
    configResetDefault: "恢复默认表格与脚本链接",
    configApiKeyButton: "配置个人 API Key",
    configQuotaWarning: "如果遇到“配额超限 (Quota Exceeded)”错误，请配置已启用结算的个人 Google Cloud API Key。",
    configGuideTitle: "详细配置步骤：",
    configGuideStep1: "新建一个 Google 表格文件。",
    configGuideStep2: "在表格菜单中打开 扩展程序 (Extensions) > Apps Script。",
    configGuideStep3: "将项目中的 google-script.gs 代码完整粘贴至编辑器中。",
    configGuideStep4: "点击 部署 (Deploy) > 新建部署，选择 Web 应用 (Web App)。",
    configGuideStep5: "设置权限：“执行身份：我”与“谁有访问权限：所有人 (Anyone)”。",
    configGuideStep6: "复制生成的 Web 应用网址并粘贴至上方输入框。",
    configGuideStep7: "展开“选择子表”面板核对各工作表对应关系。",
    configScanError: "无法获取子表列表。请检查 Google 表格分享权限（知道链接的任何人）及 Apps Script URL。",
    configScriptError: "连接 Apps Script 失败，请检查网址是否正确。",
    configSyncFailed: "无法载入或同步数据。请确保 Apps Script 链接正确且表格具有对应列结构。",
    configSyncNetworkError: "网络连接错误导致同步失败。"
  }
};
