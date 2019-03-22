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

      // *** RECEIVED FRAME ***
      window.postMessage({type: "WS_FRAME_RECIEVED",
                          payload: event.data,
                          origin: event.origin,
                          webSocketURL: newWS.url,
                          tabURL: window.location.href
                         }, "*");
    });

    // TODO: Potentially need to *not* open the websocket here rather than terminate it later
    console.log(newWS);

    // *** NEW WEBSOCKET ***
    window.postMessage({ type: "NEW_WS",
                         text: "New web socket opened",
                         url: newWS.url,
                         tabURL: window.location.href
                        }, "*");

    // Simple helper function to add delays
    const delay = ms => new Promise(res => setTimeout(res, ms));

    window.addEventListener('message', function(event) {
      if(event.data.type === "CLOSE_WS" && event.data.wsURL === newWS.url){
        (async() => {
          console.log("Ready state: " + newWS.readyState);
          // if(newWS.readyState === 0){
          //   await delay(100);
          // }
          if(event.data.method === "polite"){
            console.log("Closing politely.");
            newWS.close();
          }
          else {
            console.log("Disabling send/receive.");
            ActualWebSocket.prototype.send = function() {};
            newWS.onmessage = null;
          }
        })();
      }
    }, true);

    return newWS;
  };

  // Patch WebSocket send function
  var sendWsFrame = ActualWebSocket.prototype.send;
  ActualWebSocket.prototype.send = function(data) {

    // *** SENT FRAME ***
    window.postMessage({type: "WS_FRAME_SENT",
                        payload: data,
                        webSocketURL: this.url,
                        tabURL: window.location.href
                       }, "*");
    return sendWsFrame.apply(this, arguments);
  };

  // Patch WebSocket close function
  var closeWS = ActualWebSocket.prototype.close;
  ActualWebSocket.prototype.close = function() {

    // *** WEBSOCKET CLOSED ***
    window.postMessage({type: "WS_CLOSED",
                        text: "WebSocket closed.",
                        wsURL: this.url
                       }, "*");
    return closeWS.apply(this, arguments);
  };
};

interceptWebSockets();
