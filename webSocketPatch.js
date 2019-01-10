function interceptWebSockets() {
  // Preserve actual WebSocket object as we will be altering it
  var ActualWebSocket = window.WebSocket;

  var addWebSocketListener = ActualWebSocket.prototype.addEventListener;

  // Create new WebSocket constructor function
  window.WebSocket = function WebSocket(url, protocols){
    var newWS;
    if(!(this instanceof WebSocket)) {
        // This catches error calls to constructor.
        // Need browser to throw an error so we call constructor without 'new'
        newWS = actualWebSocket.apply(this, arguments);
    } else if (arguments.length === 1){
        // No optional protocols specified
        newWS = new ActualWebSocket(url);
    } else if (arguments.length >= 2){
        // Optional protocols have been specified
        newWS = new ActualWebSocket(url, protocols);
    } else {
        newWS = new ActualWebSocket();
    }

    // Attach listener
    addWebSocketListener.call(newWS, 'message', function(event){
      // ***RECEIVED FRAMES***
      console.log(event.data);
      alert(event.data);
    });

    console.log("New WebSocket opened");
    window.postMessage({ type: "NEW_WS", text: "New web socket opened"}, "*");
    return newWS;
  };

  // Update window.WebSocket to have our altered prototype.
  window.WebSocket.prototype = ActualWebSocket.prototype;
  // But swap out constructor for our modified one.
  window.WebSocket.prototype.constructor = window.WebSocket;

  // Preserve WebSocket send function
  var sendWsFrame = ActualWebSocket.prototype.send;
  ActualWebSocket.prototype.send = function(data) {
    // ***SENT FRAMES***
    console.log(data);
    alert(event.data);
    return sendWsFrame.apply(this, arguments);
  }
};

interceptWebSockets();
