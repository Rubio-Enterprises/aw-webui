<template lang="pug">
div#forcegraph
</template>

<style>
#forcegraph > svg {
  border: 1px solid #555;
  box-sizing: border-box;
}
</style>

<script lang="ts">
import * as d3 from 'd3';
import { defineComponent, type PropType } from 'vue';

// What the caller passes: links refer to nodes by id.
type GNodeInput = {
  id: string;
  color: string;
  value: number;
};

type GLinkInput = {
  source: string;
  target: string;
  value: number;
};

type GraphData = { nodes: GNodeInput[]; links: GLinkInput[] };

// The simulation adds x/y/index to the nodes, and replaces link ends by the nodes.
type GNode = d3.SimulationNodeDatum & GNodeInput & { radius: number };
type GLink = d3.SimulationLinkDatum<GNode> & { value: number };

export default defineComponent({
  name: 'ForceGraph',
  props: {
    data: {
      type: Object as PropType<GraphData>,
      required: true,
    },
  },
  data: () => ({
    cancelPromise: null as (() => void) | null,
    drawnWidth: 0,
    resizeObserver: null as ResizeObserver | null,
  }),
  watch: {
    // Watch for changes in the data and update the graph
    data() {
      this.drawGraph(this.data);
    },
  },
  mounted() {
    this.drawGraph(this.data);
    // Redraw at the new width when the container is resized (e.g. window resize or
    // rotating a phone), otherwise the old drawing gets scaled down again.
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        if (this.graphWidth() !== this.drawnWidth) this.drawGraph(this.data);
      });
      this.resizeObserver = observer;
      observer.observe(this.$el);
    }
  },
  beforeDestroy() {
    this.resizeObserver?.disconnect();
    this.cancelPromise?.();
  },
  methods: {
    graphWidth(): number {
      return Math.min(640, this.$el.clientWidth || 640);
    },
    drawGraph({ nodes, links }: GraphData) {
      console.log('rendering...');
      this.cancelPromise?.();
      const promise = new Promise<void>((resolve) => {
        this.cancelPromise = resolve;
      });

      // Draw at the container's width (up to the default 640px) instead of scaling
      // a 640px-wide drawing down, which made nodes tiny on narrow screens.
      const width = this.graphWidth();
      this.drawnWidth = width;
      const svgEl = ForceGraph({ nodes, links }, { width, invalidation: promise });
      const svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, undefined> =
        d3.select('#forcegraph');
      //clear
      svg.selectAll('*').remove();
      //append
      if (svgEl) svg.node()?.appendChild(svgEl);
      console.log('drawn!');
    },
  },
});

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
function ForceGraph(
  { nodes: inputNodes, links: inputLinks }: GraphData,
  {
    nodeFill = 'currentColor', // node stroke fill
    nodeStroke = '#fff', // node stroke color
    nodeStrokeWidth = 1.5, // node stroke width, in pixels
    nodeStrokeOpacity = 1, // node stroke opacity
    nodeRadius = 4, // node radius, in pixels
    linkStroke = '#999', // link stroke color
    linkStrokeOpacity = 0.6, // link stroke opacity
    linkStrokeLinecap = 'round', // link stroke linecap
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    invalidation, // when this promise resolves, stop the simulation
  }: {
    nodeFill?: string;
    nodeStroke?: string;
    nodeStrokeWidth?: number;
    nodeStrokeOpacity?: number;
    nodeRadius?: number;
    linkStroke?: string;
    linkStrokeOpacity?: number;
    linkStrokeLinecap?: string;
    width?: number;
    height?: number;
    invalidation?: Promise<void>;
  } = {},
): SVGSVGElement | null {
  // Replace the input nodes and links with mutable objects for the simulation.
  // Scale so that the area of each node is ~proportional to the time value.
  const nodes: GNode[] = inputNodes.map((node) => ({
    id: node.id,
    color: node.color,
    value: node.value,
    radius: nodeRadius + 5 * Math.sqrt(node.value / 60 / 60),
  }));
  const links: GLink[] = inputLinks.map(({ source, target, value }) => ({ source, target, value }));

  // Link strength: if low value, link should push nodes apart,
  // if high value, link should pull nodes together
  const linkStrength = (d: GLink) => (d.value < 10 ? 0.01 : Math.sqrt(1 / (2 + d.value)));
  const linkStrokeWidth = (d: GLink) => 1.5 * Math.sqrt(d.value);

  // Construct the forces.
  const forceNode = d3.forceManyBody<GNode>();
  const forceLink = d3.forceLink<GNode, GLink>(links).id((d) => d.id);
  forceLink.strength(linkStrength);

  const simulation = d3
    .forceSimulation(nodes)
    .force('link', forceLink)
    .force('charge', forceNode)
    .force('center', d3.forceCenter())
    .force(
      'collision',
      d3.forceCollide<GNode>((d) => d.radius),
    )
    .on('tick', ticked);

  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;');

  const link = svg
    .append('g')
    .attr('stroke', linkStroke)
    .attr('stroke-opacity', linkStrokeOpacity)
    .attr('stroke-linecap', linkStrokeLinecap)
    .selectAll<SVGLineElement, GLink>('line')
    .data(links)
    .join('line')
    .attr('stroke-width', linkStrokeWidth);

  const node = svg
    .append('g')
    .attr('fill', nodeFill)
    .attr('stroke', nodeStroke)
    .attr('stroke-opacity', nodeStrokeOpacity)
    .attr('stroke-width', nodeStrokeWidth)
    .selectAll<SVGCircleElement, GNode>('circle')
    .data(nodes)
    .join('circle')
    .attr('r', (d) => d.radius)
    .attr('fill', (d) => d.color)
    .call(drag(simulation));

  node.append('title').text((d) => d.id);

  // Label each node with the last segment of its category (ids look like "Work>Programming"),
  // since titles only show on hover, which isn't available on touch devices.
  const label = svg
    .append('g')
    .attr('fill', 'currentColor')
    .attr('font-size', 10)
    .attr('pointer-events', 'none')
    .selectAll<SVGTextElement, GNode>('text')
    .data(nodes)
    .join('text')
    .attr('dy', '0.35em')
    .text((d) => String(d.id).split('>').pop() ?? '');
  invalidation?.then(() => simulation.stop());

  // After the first tick the link force has replaced the ids by the nodes
  function endpoint(end: GLink['source'] | GLink['target']): GNode | undefined {
    return typeof end === 'object' ? end : undefined;
  }

  function ticked() {
    link
      .attr('x1', (d) => endpoint(d.source)?.x ?? 0)
      .attr('y1', (d) => endpoint(d.source)?.y ?? 0)
      .attr('x2', (d) => endpoint(d.target)?.x ?? 0)
      .attr('y2', (d) => endpoint(d.target)?.y ?? 0);

    node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);
    // Put each label on the side of its node facing the center, so labels of nodes
    // near the left/right edge stay inside the graph.
    label
      .attr('text-anchor', (d) => ((d.x ?? 0) > 0 ? 'end' : 'start'))
      .attr('x', (d) => (d.x ?? 0) + ((d.x ?? 0) > 0 ? -1 : 1) * (d.radius + 3))
      .attr('y', (d) => d.y ?? 0);
  }

  function drag(_simulation: d3.Simulation<GNode, undefined>) {
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GNode, GNode>) {
      if (!event.active) _simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, GNode, GNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, GNode, GNode>) {
      if (!event.active) _simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag<SVGCircleElement, GNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  return svg.node();
}
</script>
