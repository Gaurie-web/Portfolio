import timeLineElements from "./timeline";
import { VerticalTimeline, VerticalTimelineElement } from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";

function App() {
  return (
    <div>
      <VerticalTimeline lineColor="#003049" layout="2-columns">
        {timeLineElements.map((element) => (
          <VerticalTimelineElement
            key={element.key}
            date={element.date}
            icon={element.icon}
            iconStyle={{ background: "#ee6c4d", color: "#fff" }}
          >
            <h3 className="vertical-timeline-element-title">{element.title}</h3>
            <h4 className="vertical-timeline-element-subtitle">{element.subtitle}</h4>
            <p>{element.description}</p>
          </VerticalTimelineElement>
        ))}
      </VerticalTimeline>
    </div>
  );
}

export default App;