/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/js/background.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/js/background.js":
/*!******************************!*\
  !*** ./src/js/background.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("let numWS = 0;\r\nlet numWSSent = 0;\r\nlet numWSReceived = 0;\r\nlet numBlockableWS = 0;\r\n\r\n//TODO: fix this\r\nfunction updatePopup(){\r\n  chrome.runtime.sendMessage({\r\n    type: \"POPUP_UPDATE\",\r\n    numWS: numWS,\r\n    numWSSent: numWSSent,\r\n    numWSReceived: numWSReceived,\r\n    numBlockableWS: numBlockableWS\r\n  });\r\n}\r\n\r\nfunction filterURL(wsURL){\r\n    let filterList = chrome.runtime.getURL('assets/filters/yoyo.txt');\r\n\r\n    fetch(filterList)\r\n      .then(response => response.text())\r\n      .then(filterListString => {\r\n          // Using indexOf to see if hostname present\r\n          // TODO: implement more efficient method\r\n          if(filterListString.indexOf(wsURL.hostname) > -1){\r\n            console.log(\"Found url in filter list\");\r\n            numBlockableWS++;\r\n          }\r\n          else if(filterListString.indexOf(wsURL.hostname) === -1){\r\n            console.log(\"Url not present in filter list\");\r\n          }\r\n      })\r\n      .catch(err => console.log(err));\r\n}\r\n\r\nfunction checkFirstPartyURL(wsURL){\r\n    return new Promise((resolve, reject) => {\r\n      console.log(\"Checking WS url: \" + wsURL);\r\n\r\n      //Fetch tab url\r\n      let tabURL;\r\n      chrome.tabs.query({'active': true, 'currentWindow': true}, function(tabs){\r\n        tabURL = tabs[0].url;\r\n        // Convert to URL object for easy parsing.\r\n        tabURL = new URL(tabURL);\r\n\r\n        console.log(\"wsURL.hostname: \" + wsURL.hostname);\r\n        console.log(\"tabURL.hostname: \" + tabURL.hostname);\r\n        if(wsURL.hostname != tabURL.hostname){\r\n          console.log(\"Third Party WS Connection. Caution!\");\r\n        }\r\n        else if (wsURL.hostname === tabURL.hostname){\r\n          console.log(\"First Party WS Connection. Safe to proceed.\");\r\n        }\r\n\r\n        resolve('End of tabs.query');\r\n      });\r\n    });\r\n}\r\n\r\nchrome.runtime.onMessage.addListener(\r\n  (message, sender, sendResponse) => {\r\n    // Checks if one of our messages.\r\n    if(message.type){\r\n      switch(message.type){\r\n        case \"NEW_WS\":\r\n          if(numWS === 0){\r\n            // Alter UI Badge\r\n            chrome.browserAction.setBadgeText({text: '!'});\r\n            chrome.browserAction.setBadgeBackgroundColor({color: '#2aa4ff'});\r\n          }\r\n          numWS++;\r\n          console.log(\"New WS opened.\");\r\n\r\n          // Convert to URL object for easy parsing.\r\n          let wsURL = new URL(message.url);\r\n          checkFirstPartyURL(wsURL)\r\n            .then(filterURL(wsURL));\r\n\r\n          break;\r\n\r\n        case \"WS_FRAME_SENT\":\r\n          numWSSent++;\r\n          // console.log(\"WS frame sent. #\" + numWSSent);\r\n          break;\r\n\r\n        case \"WS_FRAME_RECIEVED\":\r\n          numWSReceived++;\r\n          // console.log(\"WS frame received. #\" + numWSReceived);\r\n          break;\r\n\r\n        case \"WS_CLOSED\":\r\n          if(numWS === 1){\r\n            // Alter UI Badge\r\n            chrome.browserAction.setBadgeText({text: ''});\r\n          }\r\n          numWS--;\r\n          console.log(\"WS Closed.\");\r\n          break;\r\n\r\n        case \"UPDATE_POPUP\":\r\n          // Done by default in all cases so nothing to do here.\r\n          break;\r\n\r\n        default:\r\n          console.log(\"Uncaught message type in background: \" + message);\r\n      }\r\n      updatePopup();\r\n    }\r\n  }\r\n);\r\n\n\n//# sourceURL=webpack:///./src/js/background.js?");

/***/ })

/******/ });