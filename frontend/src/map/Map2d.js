import { Component } from "react";
import { MSG_PLAY_CHANGE } from "../constants";
import KillFeed from "./KillFeed";
import './Map.css';
import MapBomb from "./MapBomb";
import MapNade from "./MapNade";
import MapPlayer from "./MapPlayer";
import MapShot from "./MapShot";

class Map2d extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mapName: "de_dust2",
      players: [],
      shots: [],
      nades: [],
      nadeExplosions: [],
      bomb: {x: -100, y: -100},
    }

    props.messageBus.listen([4], this.onMessage.bind(this))
    props.messageBus.listen([1], this.tickUpdate.bind(this))
    props.messageBus.listen([9], this.handleShot.bind(this))
    props.messageBus.listen([MSG_PLAY_CHANGE], function () {
      this.setState({
        shots: [],
        nadeExplosions: [],
      })
    }.bind(this))
    props.messageBus.listen([14], this.handleNadeExplosion.bind(this))
  }

  tickUpdate(message) {
    if (message.tickstate.playersList) {
      this.setState({
        players: message.tickstate.playersList,
        nades: message.tickstate.nadesList,
        bomb: message.tickstate.bomb,
      })
    }
  }

  handleShot(msg) {
    this.setState({
      shots: [...this.state.shots, msg.shot]
    })
  }

  handleNadeExplosion(msg) {
    this.setState({
      nadeExplosions: [...this.state.nadeExplosions, msg.grenadeevent]
    })
  }

  onMessage(message) {
    switch (message.msgtype) {
      case 4:
        this.setMapName(message.init.mapname)
        break;
      default:
        console.log("unknown message [Map2d.js]", message)
    }
  }

  setMapName(name) {
    this.setState({
          mapName: name,
        }
    )
  }

  removeNade(index) {
    const newState = this.state.nadeExplosions
    newState[index] = null
    this.setState({
      nadeExplosions: newState,
    })
  }

  removeShot(index) {
    const newState = this.state.shots
    newState[index] = null
    this.setState({
      shots: newState,
    })
  }

  render() {
    const style = {
      backgroundImage: `url(assets/maps/${this.state.mapName}.png) `,
    }
    const playerComponents = []
    if (this.state.players && this.state.players.length > 0) {
      this.state.players.forEach(p => {
        playerComponents.push(<MapPlayer
            key={p.playerid}
            player={p}/>)
      })
    }
    const shots = this.state.shots.map((s, i) => {
      if (s === null) {
        return null
      }
      return <MapShot key={i} shot={s} removeCallback={this.removeShot.bind(this)} index={i}/>
    })
    const nadeComponents = []
    if (this.state.nades && this.state.nades.length > 0) {
      this.state.nades.forEach(n => {
        nadeComponents.push(<MapNade key={n.id} nade={n}/>)
      })
    }
    const nadeExplosions = this.state.nadeExplosions.map((n, i) => {
      if (n != null && n.id) {
        return <MapNade key={n.id} nade={n} hide={true} removeCallback={this.removeNade.bind(this)} index={i}/>
      }
      return null
    })
    return (
        <div className="map-container" id="map" style={style}>
          <KillFeed messageBus={this.props.messageBus}/>
              {playerComponents}
              {nadeComponents}
              {shots}
              {nadeExplosions}
          <MapBomb bomb={this.state.bomb}/>
        </div>
    )
  }
}

export default Map2d
