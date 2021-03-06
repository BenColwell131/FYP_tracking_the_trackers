function interceptWebSockets() {
  // Preserve actual WebSocket object as we will be altering it
  var ActualWebSocket = window.WebSocket;

  // Create new WebSocket constructor function
  window.WebSocket = function WebSocket(url, protocols){
    var newWS;
    if(!(this instanceof WebSocket)) {
        // This catches error calls to constructor.
        // Need browser to throw an error so we call constructor without 'new'
        newWS = ActualWebSocket.apply(this, arguments);
    } else if (arguments.length === 1){
        // No optional protocols specified
        newWS = new ActualWebSocket(url);
    } else if (arguments.length >= 2){
        // Optional protocols have been specified
        newWS = new ActualWebSocket(url, protocols);
    } else {
        newWS = new ActualWebSocket();
    }

    // Attach listener for incoming messages.
    newWS.addEventListener('message', (event) => {
      // ***RECEIVED FRAMES***
      window.postMessage({type: "WS_FRAME_RECIEVED",
                          payload: event.data,
                          origin: event.origin,
                          webSocketURL: newWS.url,
                          tabURL: window.location.href
                         }, "*");
      // console.log(event);
      // console.log(newWS.url);
    });

    // TODO: Potentially need to *not* open the websocket here rather than terminate it later
    console.log(newWS);
    window.postMessage({ type: "NEW_WS", text: "New web socket opened", url: newWS.url, tabURL: window.location.href}, "*");
    return newWS;
  };

  // Patch WebSocket send function
  var sendWsFrame = ActualWebSocket.prototype.send;
  ActualWebSocket.prototype.send = function(data) {
    // ***SENT FRAMES***
    window.postMessage({type: "WS_FRAME_SENT",
                        payload: data,
                        webSocketURL: this.url,
                        tabURL: window.location.href
                       }, "*");
    // console.log(arguments);
    return sendWsFrame.apply(this, arguments);
  };

  // Patch websocket close function
  var closeWS = ActualWebSocket.prototype.close;
  ActualWebSocket.prototype.close = function() {
    // ***WEBSOCKET CLOSED***
    // console.log("WebSocket closed.");
    window.postMessage({type: "WS_CLOSED", text: "WebSocket closed."}, "*");
    return closeWS.apply(this, arguments);
  };
};

interceptWebSockets();
