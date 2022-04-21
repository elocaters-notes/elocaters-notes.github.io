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
}

/**
 * Dynamic simulation state for the NetworkGraph component.
 */
interface State {
  nodes: GraphNode[];
  links: GraphLink[];
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

  constructor(props: NetworkGraphProps) {
    super(props);

    this.state = {
      nodes: props.nodes,
      links: props.links,
    };
  }

  componentDidMount() {
    this.sim = forceSimulation(this.state.nodes)
      .force('charge', forceManyBody().strength(this.props.forceStrength))
      .force(
        'links',
        forceLink<GraphNode, GraphLink>(this.state.links)
          .id((node: GraphNode) => node.id)
          .distance((link) => 100),
      )
      .force(
        'center',
        forceCenter(NetworkGraph.WIDTH / 2, NetworkGraph.HEIGHT / 2),
      )
      .force('collide', forceCollide(20));

    this.sim.on('tick', () => {
      this.setState({
        nodes: this.state.nodes,
        links: this.state.links,
      });
    });
  }

  componentWillUnmount() {
    if (this.sim) {
      this.sim.stop();
    }
  }

  render() {
    return (
      <div
        className="svg-container"
        style={{
          display: 'inline-block',
          position: 'relative',
          width: '100%',
          paddingBottom:
            100.0 * (NetworkGraph.HEIGHT / NetworkGraph.WIDTH) + '%',
          verticalAlign: 'middle',
          overflow: 'hidden',
        }}
      >
        <svg
          version="1.1"
          viewBox={'0 0 ' + NetworkGraph.WIDTH + ' ' + NetworkGraph.HEIGHT}
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
