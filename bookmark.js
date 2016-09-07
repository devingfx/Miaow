var win = window.open(null,`cat://${document.location.host}`,'menubar=no,location=no,resizable=yes,scrollbars=no,status=no'); 
win.parentWindow = window;
win.document.write(`<script src="https://devingfx.github.io/Miaow/DataStore.js?${Math.random()}"></script>`);