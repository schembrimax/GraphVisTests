import { GraphCurveType, GraphNodeType } from "./cytoscape-graph.domain";

export default {
  style:[
    {
      selector: "node",
      style: {
        "background-color": "#43447a",
        "padding-top": "10px",
        shape: GraphNodeType.roundrectangle
      }
    },
    {
      selector: "node[label]",
      style: {
        label: "data(label)",
        "font-size": "20",
        color: "#000",
        "text-valign": "bottom",
        "text-halign": "center"
      },
    },
    {
      selector: "edge",
      style: {
        width: 1.5,
        'line-color': '#cecece',
        'target-arrow-color': 'green',
        "curve-style": GraphCurveType.unbundledBezier,
        'control-point-weights': '0.25 .65',
        'control-point-distances': 'data(controlPointDistances)'
      }
    },
    {
      selector: "edge[label]",
      style: {
        label: "data(label)",
        "font-size": "14",
        "text-background-color": "white",
        "text-background-opacity": 1,
        "text-background-padding": "2px",
        "text-margin-y": -4,
        "text-margin-x": -4,
        // so the transition is selected when its label/name is selected
        "text-events": "yes",
      }
    }
  ]
}