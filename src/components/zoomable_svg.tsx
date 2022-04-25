import * as React from 'react';
import * as d3Zoom from 'd3-zoom';
import * as d3Selection from 'd3-selection';

interface ZoomableSvgProps {
  /** A standard SVG zoom box string. */
  viewBox: {
    xmin: number;
    ymin: number;
    width: number;
    height: number;
  };
}

interface State {
  zoomTransform: d3Zoom.ZoomTransform;
}

class ZoomableSvg extends React.Component<ZoomableSvgProps, State> {
  zoom: d3Zoom.ZoomBehavior<SVGSVGElement, unknown>;
  state: State = {
    zoomTransform: d3Zoom.zoomIdentity,
  };
  svgRef: React.RefObject<SVGSVGElement>;

  constructor(props: ZoomableSvgProps) {
    super(props);
    this.svgRef = React.createRef<SVGSVGElement>();
    this.zoom = d3Zoom
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([-5, 5])
      .on('zoom', this.zoomed.bind(this));
  }

  componentDidMount() {
    d3Selection.select(this.svgRef.current!).call(this.zoom);
  }

  componentDidUpdate() {
    d3Selection.select(this.svgRef.current!).call(this.zoom);
  }

  zoomed(event: d3Zoom.D3ZoomEvent<SVGSVGElement, unknown>) {
    this.setState({
      zoomTransform: event.transform,
    });
  }

  viewBox(): string {
    const scale = this.state.zoomTransform.k;
    const w = this.props.viewBox.width;
    const h = this.props.viewBox.height;
    const x = this.props.viewBox.xmin;
    const y = this.props.viewBox.ymin;
    return `${x} ${y} ${w} ${h}`;
  }

  aspect(): number {
    return this.props.viewBox.height / this.props.viewBox.width;
  }

  transform(): string {
    const scale = this.state.zoomTransform.k;
    const x = this.state.zoomTransform.x;
    const y = this.state.zoomTransform.y;
    return `translate(${x}, ${y}) scale(${scale})`;
  }

  render(): JSX.Element {
    return (
      <div
        style={{
          display: 'inline-block',
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          paddingBottom: 100.0 * this.aspect() + '%',
          verticalAlign: 'middle',
          overflow: 'hidden',
          border: '0.1rem solid var(--background-highlight)',
          margin: '2rem',
          borderRadius: '1rem',
        }}
      >
        <svg
          version="1.1"
          viewBox={this.viewBox()}
          preserveAspectRatio="xMinYMin meet"
          style={{
            display: 'inline-block',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          ref={this.svgRef}
        >
          <g transform={this.transform()}>{this.props.children}</g>
        </svg>
      </div>
    );
  }
}

export default ZoomableSvg;
