import timeline_simple from '~/visualizations/timeline-simple';

function render() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  timeline_simple.create(svg);
  timeline_simple.update(
    svg,
    [
      { timestamp: '2026-09-16T10:00:00Z', duration: 60, data: { app: 'Firefox' } },
      { timestamp: '2026-09-16T10:05:00Z', duration: 60, data: { app: 'Code' } },
    ],
    'currentwindow',
  );
  return svg;
}

function fire(rect: Element, type: 'mouseover' | 'mouseout') {
  rect.dispatchEvent(new MouseEvent(type, { bubbles: true }));
}

describe('timeline-simple hover', () => {
  // d3 v7 calls listeners as (event, datum). The old handlers took (event, index, nodes) and
  // read `nodes[index]`, which threw on every hover and never changed the colour.
  let reported: unknown[];
  const onError = (e: ErrorEvent) => {
    reported.push(e.error ?? e.message);
    e.preventDefault();
  };

  beforeEach(() => {
    reported = [];
    window.addEventListener('error', onError);
  });
  afterEach(() => {
    window.removeEventListener('error', onError);
  });

  test('mouseover highlights the hovered event and mouseout restores it', () => {
    const svg = render();
    const rects = Array.from(svg.querySelectorAll('rect'));
    expect(rects).toHaveLength(2);

    const base = (rects[0] as SVGRectElement).style.fill;
    fire(rects[0] as Element, 'mouseover');
    const hovered = (rects[0] as SVGRectElement).style.fill;
    expect(hovered).not.toBe(base);
    // only the hovered bar changes
    expect((rects[1] as SVGRectElement).style.fill).not.toBe(hovered);

    fire(rects[0] as Element, 'mouseout');
    expect((rects[0] as SVGRectElement).style.fill).toBe(base);
  });

  test('hovering does not raise an error', () => {
    const svg = render();
    const rect = svg.querySelector('rect') as Element;
    fire(rect, 'mouseover');
    fire(rect, 'mouseout');
    expect(reported).toEqual([]);
  });
});
