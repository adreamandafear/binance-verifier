// Parses file change event.
// This is a generic wrapper around any XSLX file.
const ParseXSLX = function(callback, e) {
  let files = e.target.files;
  if (!files || files.length == 0) {
    console.error("No file on event change.")
    return;
  }
  let file = files[0];
  let fileReader = new FileReader();
  fileReader.onload = function (e) {
    // Pre-process stage.
    let binary = "";
    let bytes = new Uint8Array(e.target.result);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Read the file using XLSX API.
    let oFile = XLSX.read(binary, {type: 'binary', cellDates:true, cellStyles:true});
    console.log(oFile);
    callback(oFile);
  };
  fileReader.readAsArrayBuffer(file);
};