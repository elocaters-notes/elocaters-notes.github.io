import * as React from 'react';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceCenter,
  SimulationNodeDatum,
  SimulationLinkDatum,
  Simulation,
} from 'd3-force';
import { Link } from 'gatsby';

/**
 * Each node is rendered as a colored circle with a label on the graph.
 */
export interface GraphNode extends SimulationNodeDatum {
  /** A unique (within this graph) identifier for the node. */
  id: string;

  /** The displayed text. */
  title: string;

  /** The color used for the circle. */
  color?: string;

  /** The radius of the circle in the graph. */
  radius?: number;
}

/**
 * A directional link between nodes in the graph.
 */
export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  /** The node (or id string for the node) where this link starts. */
  source: string | GraphNode;

  /** The node (or id string for the node) where this link ends. */
  target: string | GraphNode;

  /** The length of the link. Defaults to 100. */
  length?: number;
}

/**
 * All properties required by the NetworkGraph component.
 */
export interface NetworkGraphProps {
  /** The collection of all nodes in the graph. */
  nodes: GraphNode[];

  /** The collection of all links between nodes in the graph. */
  links: GraphLink[];

  /**
   * How much force is exerted between nodes. Negative forces nodes apart,
   * while positive pulls them together.
   */
  forceStrength: number;

  /**
   * How close any two nodes should be allowed.
   */
  collisionDistance?: number;
}

/**
 * Dynamic simulation state for the NetworkGraph component.
 */
interface State {
  nodes: GraphNode[];
  links: GraphLink[];
  width: number;
  height: number;
  xmin: number;
  ymin: number;
}

/**
 * Render a GraphLink in an SVG.
 */
function render_graph_link(link: GraphLink, index: number) {
  const source: GraphNode = link.source as GraphNode;
  const target: GraphNode = link.target as GraphNode;
  return (
    <g>
      <line
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        key={`line-${index}`}
        stroke="#586e75"
        marker-end="url(#arrowhead)"
      />
    </g>
  );
}

function truncate_string(str: string, len: number) {
  if (str.length < len) {
    return str;
  }
  return str.slice(0, len) + '...';
}

/**
 * Render a GraphNode in an SVG.
 */
function render_graph_node(node: GraphNode, index: number) {
  const radius = node.radius || 6;
  return (
    <g>
      <title>{node.title}</title>
      <Link to={node.id}>
        <circle
          r={node.radius || 6}
          cx={node.x}
          cy={node.y}
          fill={node.color || '#268bd2'}
          key={index}
        />
        <text
          x={node.x}
          y={node.y}
          fill="#93a1a1"
          fontSize={radius * 1.75 + 'px'}
          textAnchor="middle"
        >
          {truncate_string(node.title, 10)}
        </text>
      </Link>
    </g>
  );
}

/**
 * This component renders a directed network graph using the D3-force library
 * to lay out nodes.
 */
export class NetworkGraph extends React.Component<NetworkGraphProps, State> {
  static WIDTH = 500;
  static HEIGHT = 250;

  sim: Simulation<GraphNode, GraphLink> | undefined;
  state: State = {
    nodes: [],
    links: [],
    width: NetworkGraph.WIDTH,
    height: NetworkGraph.HEIGHT,
    xmin: 0,
    ymin: 0,
  };

  constructor(props: NetworkGraphProps) {
    super(props);
    this.state.nodes = props.nodes;
    this.state.links = props.links;
  }

  componentDidMount() {
    this.sim = forceSimulation(this.state.nodes)
      .force('charge', forceManyBody().strength(this.props.forceStrength))
      .force(
        'links',
        forceLink<GraphNode, GraphLink>(this.state.links)
          .id((node: GraphNode) => node.id)
          .distance((link) => link.length || 100),
      )
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(this.props.collisionDistance || 20));

    this.sim.on('tick', () => {
      let xmin = 0,
        ymin = 0,
        xmax = 0,
        ymax = 0;

      for (let node of this.state.nodes) {
        let x = node.x || 0;
        let y = node.y || 0;
        if (xmin > x) {
          xmin = x;
        }
        if (xmax < x) {
          xmax = x;
        }
        if (ymin > y) {
          ymin = y;
        }
        if (ymax < y) {
          ymax = y;
        }
      }

      const width = Math.max(Math.abs(xmax - xmin), 200);
      const height = Math.max(Math.abs(ymax - ymin), 200);

      this.setState({
        nodes: this.state.nodes,
        links: this.state.links,
        width: width * 1.5,
        height: height * 1.5,
        xmin: Math.floor(xmin) - width * 0.25,
        ymin: Math.floor(ymin) - height * 0.25,
      });
    });
  }

  componentWillUnmount() {
    if (this.sim) {
      this.sim.stop();
    }
  }

  render() {
    const viewBox = `${this.state.xmin} ${this.state.ymin} ${this.state.width} ${this.state.height}`;

    return (
      <div
        className="svg-container"
        style={{
          display: 'inline-block',
          position: 'relative',
          width: '100%',
          paddingBottom: 100.0 * (this.state.height / this.state.width) + '%',
          verticalAlign: 'middle',
          overflow: 'hidden',
        }}
      >
        <svg
          version="1.1"
          viewBox={viewBox}
          preserveAspectRatio="xMinYMin meet"
          style={{
            display: 'inline-block',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="13"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#586e75"></polygon>
            </marker>
          </defs>
          {this.state.links.map(render_graph_link)}
          {this.state.nodes.map(render_graph_node)}
        </svg>
      </div>
    );
  }
}

export default NetworkGraph;
