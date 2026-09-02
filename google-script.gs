/**
 * GOOGLE APPS SCRIPT CODE
 * 
 * Instructions for the user:
 * 1. Open https://script.google.com/
 * 2. Create a new project.
 * 3. Paste this code.
 * 4. Deploy as "Web App".
 * 5. Set "Execute as: Me" and "Who has access: Anyone".
 * 6. Copy the Web App URL and paste it into the app.
 */

function doGet(e) {
  const sheetId = e.parameter.sheetId;
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(sheetId);
  
  if (action === 'getSheets') {
    const sheetNames = ss.getSheets().map(s => s.getName());
    return ContentService.createTextOutput(JSON.stringify(sheetNames)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getVocab') {
    const sheetName = e.parameter.vocabSheetName || 'từ vựng';
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getReading') {
    const sheetName = e.parameter.readingSheetName || 'luyện đọc';
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getGrammar') {
    const sheetName = e.parameter.grammarSheetName || 'ngữ pháp';
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getOCR') {
    const sheetName = e.parameter.ocrSheetName || 'OCR';
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getConfig') {
    const sheetName = e.parameter.configSheetName || 'cấu hình';
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
    }
    const data = sheet.getDataRange().getValues();
    const config = {};
    for (let i = 0; i < data.length; i++) {
      if (data[i][0]) {
        config[data[i][0]] = data[i][1] || '';
      }
    }
    return ContentService.createTextOutput(JSON.stringify(config)).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const sheetId = params.sheetId;
  const action = params.action;
  const ss = SpreadsheetApp.openById(sheetId);
  
  if (action === 'syncConfig') {
    const sheetName = params.configSheetName || 'cấu hình';
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    sheet.clear();
    const configObj = params.config || {};
    const rows = Object.entries(configObj).map(function(pair) { return [pair[0], pair[1]]; });
    if (rows.length > 0) {
      sheet.getRange(1, 1, rows.length, 2).setValues(rows);
    }
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  }
  
  if (action === 'saveOCR') {
    const sheetName = params.ocrSheetName || 'OCR';
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    sheet.appendRow([new Date(), params.text]);
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  }
  
  if (action === 'syncVocab') {
    const sheetName = params.vocabSheetName || 'từ vựng';
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    sheet.clear();
    const vocabData = params.data; 
    if (vocabData.length > 0) {
      sheet.getRange(1, 1, vocabData.length, vocabData[0].length).setValues(vocabData);
    }
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  }

  if (action === 'syncReading') {
    const sheetName = params.readingSheetName || 'luyện đọc';
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    sheet.clear();
    const readingData = params.data; 
    if (readingData.length > 0) {
      sheet.getRange(1, 1, readingData.length, readingData[0].length).setValues(readingData);
    }
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  }

  if (action === 'syncGrammar') {
    const sheetName = params.grammarSheetName || 'ngữ pháp';
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    sheet.clear();
    const grammarData = params.data; 
    if (grammarData.length > 0) {
      sheet.getRange(1, 1, grammarData.length, grammarData[0].length).setValues(grammarData);
    }
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  }
}
