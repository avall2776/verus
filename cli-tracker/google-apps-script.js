function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Tarefas");
    if (!sheet) {
      sheet = ss.getActiveSheet();
    }
    
    var data = JSON.parse(e.postData.contents);
    
    // Procura o nome exato da tarefa na Coluna B
    var textFinder = sheet.getRange("B2:B42").createTextFinder(data.title);
    var cell = textFinder.findNext();
    
    if (cell) {
      var row = cell.getRow();
      // Atualiza a Coluna G (Coluna 7: Status) para "Concluído"
      sheet.getRange(row, 7).setValue("Concluído");
      
      return ContentService.createTextOutput(JSON.stringify({ 
        result: "success", 
        rowUpdated: row, 
        task: data.title 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      result: "not_found", 
      message: "Tarefa não encontrada entre B2 e B42" 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      result: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
