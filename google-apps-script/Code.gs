// Paperthreads CRM → Google Sheets connector
// 1. Create a Google Sheet and open Extensions → Apps Script.
// 2. Paste this file, save, then Deploy → New deployment → Web app.
// 3. Execute as: Me. Who has access: Anyone.
// 4. Copy the /exec URL into CRM → Settings → Google Apps Script URL.

const SPREADSHEET_ID = ''; // Leave empty when this script is bound to the destination Sheet.
const SHEET_NAMES = { customer: 'Customers', invoice: 'Orders', bank: 'Bank Accounts', reminder: 'Reminders', review: 'Reviews' };

function workbook_() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, app: 'Paperthreads CRM' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const type = payload.type || 'record';
    const record = payload.record || {};
    const ss = workbook_();
    const name = SHEET_NAMES[type] || 'CRM Data';
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    const flat = flatten_(record);
    const keys = Object.keys(flat);
    if (sheet.getLastRow() === 0) sheet.appendRow(['Saved At'].concat(keys));
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    keys.forEach(key => {
      if (headers.indexOf(key) === -1) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(key);
        headers.push(key);
      }
    });
    const row = headers.map(h => h === 'Saved At' ? new Date() : (flat[h] !== undefined ? flat[h] : ''));
    sheet.appendRow(row);
    return output_({ ok: true, sheet: name });
  } catch (error) {
    return output_({ ok: false, error: String(error) });
  }
}

function flatten_(record) {
  const result = {};
  Object.keys(record).forEach(key => {
    result[key] = typeof record[key] === 'object' ? JSON.stringify(record[key]) : record[key];
  });
  return result;
}

function output_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once to install a daily email-reminder check.
function installDailyReminderTrigger() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'sendDueEmailReminders').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendDueEmailReminders').timeBased().everyDays(1).atHour(9).create();
}

// Reminders sheet must contain columns named date, customer, message and email.
function sendDueEmailReminders() {
  const sheet = workbook_().getSheetByName('Reminders');
  if (!sheet || sheet.getLastRow() < 2) return;
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  values.forEach((row, rowIndex) => {
    const item = {}; headers.forEach((h, i) => item[h] = row[i]);
    const date = item.date instanceof Date ? Utilities.formatDate(item.date, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(item.date);
    if (date === today && item.email && !item['Email Sent']) {
      MailApp.sendEmail({ to: item.email, subject: 'A friendly reminder from Paperthreads', htmlBody: String(item.message || '').replace(/\n/g, '<br>') });
      let sentCol = headers.indexOf('Email Sent') + 1;
      if (!sentCol) { sentCol = sheet.getLastColumn() + 1; sheet.getRange(1, sentCol).setValue('Email Sent'); }
      sheet.getRange(rowIndex + 2, sentCol).setValue(new Date());
    }
  });
}
