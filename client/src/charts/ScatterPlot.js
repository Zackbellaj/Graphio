import * as d3 from 'd3';

export const ScatterPlot = {
  id: 'scatterplot',
  name: 'Scatter Plot',
  description: 'Standard scatter plot with X, Y, and Color dimensions.',
  // Define what data this chart accepts (The Drop Zones)
  dimensions: [
    { id: 'x', name: 'X Axis', type: 'number', multiple: false, required: true },
    { id: 'y', name: 'Y Axis', type: 'number', multiple: false, required: true },
    { id: 'color', name: 'Color', type: 'string', multiple: false, required: false },
  ],
  // The render function using D3
  render: (node, data, mapping, width, height) => {
    const svg = d3.select(node).append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(40, 20)`); // margins

    const innerWidth = width - 80;
    const innerHeight = height - 60;

    // Extract mapped keys
    const xKey = mapping.x ? mapping.x[0] : null;
    const yKey = mapping.y ? mapping.y[0] : null;
    const colorKey = mapping.color ? mapping.color[0] : null;

    if (!xKey || !yKey) return;

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => +d[xKey]))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => +d[yKey]))
      .range([innerHeight, 0]);
    
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));
    
    svg.append('g')
      .call(d3.axisLeft(yScale));

    // Dots
    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d[xKey]))
      .attr('cy', d => yScale(d[yKey]))
      .attr('r', 5)
      .attr('fill', d => colorKey ? colorScale(d[colorKey]) : '#69b3a2')
      .attr('opacity', 0.7);
  }
};