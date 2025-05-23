const proto = require("./protos/Message_pb");

function Connect(messageBus, demoName) {
  console.log("initializing websocket connection")
  console.log(demoName)

  let websocketServerUrl = `wss://${window.location.host}/ws`
  if (window.location.host.includes("localhost")) {
    websocketServerUrl = `ws://localhost:8080/ws`
  }

  let socket = new WebSocket(websocketServerUrl)
  socket.binaryType = 'arraybuffer';

  socket.onopen = function (e) {
    console.log("[open] Connection established");
    //const urlParams = new URLSearchParams(window.location.search);

    const demo = new proto.Demo()
      .setMatchid(demoName)
      .setPlatform(proto.Demo.DemoPlatformType["UPLOAD"]);

    const playRequestMessage = new proto.Message()
      .setMsgtype(proto.Message.MessageType.PLAYREQUESTTYPE)
      .setDemo(demo);
    socket.send(playRequestMessage.serializeBinary());
  };

  socket.onclose = function (event) {
    if (event.wasClean) {
      console.log(
          `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
      console.log('[close] Connection died');
    }
  };

  socket.onerror = function (error) {
    console.log(`[websocket error] ${error.message}`);
    alert(`websocket error. check console or ping sparko`)
  };

  socket.onmessage = function (event) {
    if (event.data instanceof ArrayBuffer) {
      const msg = proto.Message.deserializeBinary(new Uint8Array(event.data)).toObject()
      messageBus.emit(msg)
    } else {
      // text frame
      // console.log(event.data);
      console.log("[message] text data received from server, this is weird. We're using protobufs ?!?!?", event.data);
      messageBus.emit(JSON.parse(event.data))
    }

    // console.log(`[message] Data received from server: ${event.data}`);
    // let msg = JSON.parse(event.data)
    // messageBus.emit(msg)
  }
}

export default Connect
