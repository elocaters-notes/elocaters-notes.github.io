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
import ZoomableSvg from './zoomable_svg';

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

  /**
   * The multiplier used to scale the force applied by this link.
   * If not set, the simulation defaults to 1.
   */
  strengthMultiplier?: number;

  /**
   * How visible this link is. Values in the range [0.0, 1.0], defaults to 1.0.
   */
  opacity?: number;

  /**
   * How think the link should be. Defaults to 1.
   */
  lineWidth?: number;
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
        strokeWidth={link.lineWidth || 1.0}
        marker-end="url(#arrowhead)"
        opacity={link.opacity || 1.0}
      />
    </g>
  );
}

function truncate_string(str: string, len: number) {
  if (str.length <= len) {
    return str;
  }
  return str.slice(0, len) + '...';
}

/**
 * Render a GraphNode in an SVG.
 */
function render_graph_node(node: GraphNode, index: number) {
  const radius = node.radius || 6;
  const fontSize = radius * 1.75 + 'px';
  const text = (display: string, className: string): JSX.Element[] => {
    return [
      <text
        x={node.x}
        y={node.y}
        fill="none"
        fontSize={fontSize}
        textAnchor="middle"
        strokeWidth={3}
        stroke="#073642"
        className={className}
      >
        {display}
      </text>,
      <text
        x={node.x}
        y={node.y}
        fill="#93a1a1"
        fontSize={fontSize}
        textAnchor="middle"
        className={className}
      >
        {display}
      </text>,
    ];
  };
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
        {text(node.title, 'longTitle')}
        {text(truncate_string(node.title, 8), 'shortTitle')}
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
    const tick = () => {
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
        width: width * 1.25,
        height: height * 1.25,
        xmin: Math.floor(xmin) - width * 0.125,
        ymin: Math.floor(ymin) - height * 0.125,
      });
    };

    this.state.nodes.sort((lhs: GraphNode, rhs: GraphNode): number => {
      return lhs.id.localeCompare(rhs.id);
    });

    const links = forceLink<GraphNode, GraphLink>(this.state.links)
      .id((node: GraphNode) => node.id)
      .distance((link: GraphLink) => link.length || 100)
      .iterations(2);
    const defaultStrength = links.strength();
    links.strength((link: GraphLink, i: number, links: GraphLink[]) => {
      const multiplier = link.strengthMultiplier || 1.0;
      return defaultStrength(link, i, links) * multiplier;
    });

    this.sim = forceSimulation(this.state.nodes)
      .on('tick', tick)
      .force('charge', forceManyBody().strength(this.props.forceStrength))
      .force('links', links)
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(this.props.collisionDistance || 20));
  }

  componentWillUnmount() {
    if (this.sim) {
      this.sim.stop();
    }
  }

  render() {
    return (
      <ZoomableSvg
        viewBox={{
          xmin: this.state.xmin,
          ymin: this.state.ymin,
          width: this.state.width,
          height: this.state.height,
        }}
      >
        <style>
          {`svg g g:not(:hover) .longTitle { opacity: 0;}`}
          {`svg g g:hover .longTitle { opacity: 100; }`}
          {`svg g g:not(:hover) .shortTitle { opacity: 100;}`}
          {`svg g g:hover .shortTitle { opacity: 0;}`}
          {`svg g:hover > line { opacity: 1.0; stroke-width: 3.0; }`}
        </style>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="13"
            refY="3.5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#586e75"></polygon>
          </marker>
        </defs>
        {this.state.links.map(render_graph_link)}
        {this.state.nodes.map(render_graph_node)}
      </ZoomableSvg>
    );
  }
}

export default NetworkGraph;
