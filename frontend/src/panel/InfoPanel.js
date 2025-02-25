import {Component} from "react";
import LoadingProgressBar from "./LoadingProgressBar";
import Controls from "./Controls";
import Timer from "./Timer";

class InfoPanel extends Component {
  constructor(props) {
    super(props);
    this.messageBus = props.messageBus
  }

  render() {
    return <div className="w3-row" style={{paddingBottom: "5px"}}>
      <LoadingProgressBar messageBus={this.messageBus}/>
      <Controls messageBus={this.messageBus}/>
      <Timer messageBus={this.messageBus}/>
    </div>
  }
}

export default InfoPanel
