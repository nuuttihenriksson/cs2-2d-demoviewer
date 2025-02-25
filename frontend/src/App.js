import { Component } from "react";
import './App.css';
import ErrorBoundary from "./Error";
import MessageBus from "./MessageBus";
import Player from "./Player";
import Connect from "./Websocket";
import Map2d from "./map/Map2d";
import InfoPanel from "./panel/InfoPanel";
import Scoreboard from "./panel/Scoreboard";
import PlayerList from "./panel/PlayerList";
import RoundNav from "./panel/RoundNav";
import LandingPage from "./LandingPage";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDemo: "",
      width: window.innerWidth,
    }
    this.messageBus = new MessageBus()
    this.player = new Player(this.messageBus)
    this.messageBus.listen([13], function (msg) {
      alert(msg.message)
    })
    this.onSelectDemo = this.onSelectDemo.bind(this);
    this.connectToSocket = this.connectToSocket.bind(this);
    this.resetDemo = this.resetDemo.bind(this);
  }

  updateWidth = () => {
    this.setState({ width: window.innerWidth }); // Update state with new width
  };

  componentDidMount() {
    window.addEventListener("resize", this.updateWidth);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWidth);
  }

  connectToSocket() {
    Connect(this.messageBus, this.state.selectedDemo)
  }

  onSelectDemo(demoName) {
    this.setState(
      {
        selectedDemo: demoName
      },
      () => {
        this.connectToSocket()
      }
    )
  }

  resetDemo() {
    this.messageBus = new MessageBus()
    this.player = new Player(this.messageBus)
    this.setState(
      {
        selectedDemo: ""
      }
    )
  }
  
  render() {
    return (
      <ErrorBoundary>
        {this.state.selectedDemo === "" ? (
          <LandingPage onSelectDemo={this.onSelectDemo} />
        ) : (
          <div className="app-container" style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100vh",
            width: "100vw",
            position: "relative",
          }}>
            <button style={{
              position: "absolute",
              left: "10px",
              top: "10px"
            }}
            onClick={this.resetDemo}
            >Home</button>
            {/* Scoreboard - Centered on top */}
            <div style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              width: "10vw",
            }}>
              <Scoreboard messageBus={this.messageBus} />
            </div>

            {/* RoundNav - Centered Below Scoreboard */}
            {this.state.width > 1200 ?
            <div style={{
              position: "absolute",
              top: "4rem", // Adjust this based on Scoreboard's height
              left: "50%",
              transform: "translateX(-50%)",
              width: "60vw",
              zIndex: 9, // Lower z-index than Scoreboard
            }}>
              <RoundNav messageBus={this.messageBus} />
            </div>
            :
            <div style={{
              position: "absolute",
              top: "4rem", // Adjust this based on Scoreboard's height
              left: "50%",
              transform: "translateX(-50%)",
              width: "80vw",
              zIndex: 9, // Lower z-index than Scoreboard
            }}>
              <RoundNav messageBus={this.messageBus} />
            </div>
           }
    
            {/* Main Layout - Player Lists & TransformWrapper */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexGrow: 1,
              width: "100%",
              paddingTop: "10px", // To avoid overlap with scoreboard
            }}>
              {/* Left Player List */}
              { this.state.width > 1200 &&
              <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                className: "playerList",
              }}
              >
                <PlayerList messageBus={this.messageBus} isCT={false} />
              </div>
              }
              {/* TransformWrapper (Map) in the Center */}
              <div style={{
                flex: 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}>
                <TransformWrapper
                  wheel={{ disabled: false }} 
                  pinch={{ disabled: false }} 
                  touchPad={{ disabled: false, touchPadScrollSpeed: 30 }} 
                  pan={{ disabled: true }}
                  minScale={1}
                  maxScale={10}
                >
                  <TransformComponent>
                  { window.innerWidth > 1200 ?
                    <div style={{ height: "80vh", width: "60vw" }}>
                      <Map2d messageBus={this.messageBus} />
                    </div>
                    :
                    <div style={{ height: "80vh", width: "100vw" }}>
                      <Map2d messageBus={this.messageBus} />
                    </div>
                   }
                  </TransformComponent>
                </TransformWrapper>
              </div>
              
              {/* Right Player List */}
              { this.state.width > 1200 &&
              <div style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                className: "playerList",
              }}>
                <PlayerList messageBus={this.messageBus} isCT={true}/>
              </div>
              }
            </div>
    
            {/* InfoPanel - Centered at the Bottom */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              wdith: "50vw"
            }}
            className="infoPanel"
            >
              <InfoPanel messageBus={this.messageBus}/>
            </div>
          </div>
        )}
      </ErrorBoundary>
    );    
  }
}

export default App;
