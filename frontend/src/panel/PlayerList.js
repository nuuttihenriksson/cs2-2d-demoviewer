import {Component} from "react";
import PlayerListItem from "./PlayerListItem";

class PlayerList extends Component {
  constructor(props) {
    super(props);
    this.messageBus = this.props.messageBus
    this.messageBus.listen([1], this.update.bind(this))
    this.isCT = this.props.isCT
    this.state = {
      players: [],
    }
  }

  update(msg) {
    this.setState({
      players: msg.tickstate.playersList,
    })
  }

  render() {
    const players = {"T": [], "CT": []}
    if (this.state.players && this.state.players.length > 0) {
      this.state.players.forEach(p => {
        players[p.team].push(<PlayerListItem key={p.playerid} player={p} />)
      })
    }
    return <div className="w3-row" style={{width: "100%"}}>
      {!this.isCT &&
        <div className="w3-col l6" style={{width: "100%"}}>
          <div className="T w3-medium" id="TList" style={{width: "100%"}}>
            {players.T}
          </div>
        </div>
      }
      {this.isCT &&
        <div className="w3-col l6" style={{width: "100%"}}>
          <div className="CT w3-medium" id="CTList" style={{width: "100%"}}>
            {players.CT}
          </div>
        </div>
      }
    </div>
  }
}

export default PlayerList
