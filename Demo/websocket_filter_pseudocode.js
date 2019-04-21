if(websocketURL.domain = webpageURL.domain){
  firstParty = true;
}

if(firstParty) {
  checkAgainstLists(websocketURL);

  if(hitFilterLists){
    closeWebsocket();
  }
}
