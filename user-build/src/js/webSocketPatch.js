function interceptWebSockets() {
  const ALLOW_WS_BY_DEFAULT = true;
  // Preserve actual WebSocket object as we will be altering it
  var ActualWebSocket = window.WebSocket;

  // Create new WebSocket constructor function
  window.WebSocket = function WebSocket(url, protocols){
    function createSocket(url, protocols) {
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

      return newWS;
    }

    console.log("Construct socket: ", url);

    // *** NEW WEBSOCKET ***
    window.postMessage({ type: "NEW_WS",
                         text: "New web socket opened",
                         url: url,
                         tabURL: window.location.href
                        }, "*");

    let boundCreateSocket = createSocket.bind(this, url, protocols);
    if(ALLOW_WS_BY_DEFAULT){
      // Listen for close event
      window.addEventListener('message', function(event) {
        // ** CLOSE WS **
        if(event.data.type === "CLOSE_WS" && event.data.wsURL === url){
          if(event.data.method === "polite"){
            console.log("Closing politely. ", url);
            newWS.close();
          }
          else {
            console.log("Disabling send/receive.");
            ActualWebSocket.prototype.send = function() {};
            newWS.onmessage = null;
          }
        }
      }, true);

      // Create the socket - this may be closed shortly if it hits our filter.
      let newWS =  boundCreateSocket();
      return newWS;
    }

    // ****** ! ALLOW_WS_BY_DEFAULT *******

    // Listen for updates from url checking (allow/block).
    let newWS;
    window.addEventListener('message', function(event) {
      // ** ALLOW WS **
      if(event.data.type === "ALLOW_WS" && event.data.wsURL === url){
        console.log("Received an allow message for: ", url);
        newWS = boundCreateSocket();
      }
      // ** BLOCK WS **
      else if(event.data.type === "BLOCK_WS" && event.data.wsURL === url){
        console.log("Received a block message for: ", url);
        //TODO: Implement void path.
        newWS = null;
      }
    }, true);

    // TODO: This object usually returns undefined as Event Listener happens async
    // Need to find a way to wait for either allow/block message.
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
                        wsURL: this.url,
                        readyState: this.readyState
                       }, "*");
    return closeWS.apply(this, arguments);
  };
};

interceptWebSockets();
