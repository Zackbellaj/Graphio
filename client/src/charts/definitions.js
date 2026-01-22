import * as d3 from 'd3';

// Available color schemes for the options panel
const SCHEMES = {
  tableau10: d3.schemeTableau10,
  viridis: d3.schemeViridis,
  magma: d3.schemeMagma,
};

/**
 * Helper to generate a color scale based on the selected scheme.
 */
const getColorScale = (data, key, schemeName = 'tableau10') => {
  const uniqueKeys = [...new Set(data.map(d => d[key]))].sort();
  
  if (schemeName === 'tableau10') {
    return d3.scaleOrdinal(SCHEMES.tableau10).domain(uniqueKeys);
  } else {
    // Sequential interpolation for categories
    return (value) => {
      const index = uniqueKeys.indexOf(value);
      const t = index / (uniqueKeys.length - 1 || 1); 
      const interpolator = d3[`interpolate${schemeName.charAt(0).toUpperCase() + schemeName.slice(1)}`];
      return interpolator ? interpolator(t) : SCHEMES[schemeName][Math.floor(t * (SCHEMES[schemeName].length - 1))];
    };
  }
};

// Helper: Check if a column is numeric
const isNumeric = (data, key) => {
  return data.every(d => !isNaN(parseFloat(d[key])) && isFinite(d[key]));
};

export const CHARTS = [
  // --------------------------------------------------------
  // 1. SCATTER PLOT
  // --------------------------------------------------------
  {
    id: 'scatterplot',
    name: 'Scatter Plot',
    description: 'Correlation between variables (supports Numbers & Categories).',
    thumb: '●',
    dimensions: [
      { id: 'x', name: 'X Axis', type: 'number', required: true },
      { id: 'y', name: 'Y Axis', type: 'number', required: true },
      { id: 'color', name: 'Color', type: 'string', required: false },
      { id: 'size', name: 'Size', type: 'number', required: false },
    ],
    render: (node, data, mapping, width, height, options) => {
      const margin = { top: 20, right: 20, bottom: 50, left: 60 };
      const w = width - margin.left - margin.right;
      const h = height - margin.top - margin.bottom;

      node.innerHTML = '';
      const svg = d3.select(node).append('svg')
        .attr('width', width).attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('style', 'background-color: white')
        .attr('xmlns', 'http://www.w3.org/2000/svg');

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const xKey = mapping.x?.[0];
      const yKey = mapping.y?.[0];
      const colorKey = mapping.color?.[0];
      const sizeKey = mapping.size?.[0];

      if (!xKey || !yKey) return;

      const xIsNum = isNumeric(data, xKey);
      const yIsNum = isNumeric(data, yKey);

      // Scales
      let xScale, yScale;
      if (xIsNum) {
        xScale = d3.scaleLinear().domain(d3.extent(data, d => +d[xKey])).nice().range([0, w]);
      } else {
        xScale = d3.scalePoint().domain(data.map(d => d[xKey])).range([0, w]).padding(0.5);
      }

      if (yIsNum) {
        yScale = d3.scaleLinear().domain(d3.extent(data, d => +d[yKey])).nice().range([h, 0]);
      } else {
        yScale = d3.scalePoint().domain(data.map(d => d[yKey])).range([h, 0]).padding(0.5);
      }

      const colorScale = colorKey ? getColorScale(data, colorKey, options?.colorScheme) : () => '#3b82f6';
      
      const rScale = sizeKey 
        ? d3.scaleSqrt().domain(d3.extent(data, d => +d[sizeKey])).range([3, (options?.baseRadius || 6) * 3])
        : () => (options?.baseRadius || 6);

      // Grid
      if (options?.showGrid) {
        g.append('g').attr('class', 'grid').attr('opacity', 0.1).attr('transform', `translate(0,${h})`)
          .call(d3.axisBottom(xScale).tickSize(-h).tickFormat('')).select('.domain').remove();
        g.append('g').attr('class', 'grid').attr('opacity', 0.1)
          .call(d3.axisLeft(yScale).tickSize(-w).tickFormat('')).select('.domain').remove();
      }

      // Axes
      const xAxis = g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xScale));
      if (!xIsNum) xAxis.selectAll("text").attr("transform", "translate(-10,0)rotate(-45)").style("text-anchor", "end");
      g.append('g').call(d3.axisLeft(yScale));

      // Dots
      g.selectAll('circle').data(data).join('circle')
        .attr('cx', d => xScale(d[xKey]))
        .attr('cy', d => yScale(d[yKey]))
        .attr('r', d => rScale(d))
        .attr('fill', d => colorKey ? colorScale(d[colorKey]) : '#3b82f6')
        .attr('opacity', 0.8).attr('stroke', 'white').attr('stroke-width', 1)
        .append('title').text(d => `${xKey}: ${d[xKey]}\n${yKey}: ${d[yKey]}`);
    }
  },

  // --------------------------------------------------------
  // 2. BAR CHART
  // --------------------------------------------------------
  {
    id: 'barchart',
    name: 'Bar Chart',
    description: 'Compare values across categories.',
    thumb: 'Il',
    dimensions: [
      { id: 'x', name: 'Category (X)', type: 'string', required: true },
      { id: 'y', name: 'Height (Y)', type: 'number', required: true },
      { id: 'color', name: 'Color', type: 'string', required: false },
    ],
    render: (node, data, mapping, width, height, options) => {
      const margin = { top: 20, right: 20, bottom: 60, left: 60 };
      const w = width - margin.left - margin.right;
      const h = height - margin.top - margin.bottom;

      node.innerHTML = '';
      const svg = d3.select(node).append('svg')
        .attr('width', width).attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('style', 'background-color: white')
        .attr('xmlns', 'http://www.w3.org/2000/svg');

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const xKey = mapping.x?.[0];
      const yKey = mapping.y?.[0];
      const colorKey = mapping.color?.[0];

      if (!xKey || !yKey) return;

      const rolledData = Array.from(
        d3.rollup(data, v => d3.sum(v, d => +d[yKey]), d => d[xKey]),
        ([key, value]) => ({ key, value })
      ).sort((a, b) => b.value - a.value);

      const xScale = d3.scaleBand().domain(rolledData.map(d => d.key)).range([0, w]).padding(0.2);
      const yScale = d3.scaleLinear().domain([0, d3.max(rolledData, d => d.value)]).nice().range([h, 0]);
      const colorScale = colorKey ? getColorScale(data, colorKey, options?.colorScheme) : () => '#3b82f6';

      if (options?.showGrid) {
        g.append('g').attr('class', 'grid').attr('opacity', 0.1).call(d3.axisLeft(yScale).tickSize(-w).tickFormat('')).select('.domain').remove();
      }

      const xAxis = g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xScale));
      if (rolledData.length > 10 || xScale.bandwidth() < 40) {
        xAxis.selectAll("text").attr("transform", "translate(-10,0)rotate(-45)").style("text-anchor", "end");
      }
      g.append('g').call(d3.axisLeft(yScale));

      g.selectAll('rect').data(rolledData).join('rect')
        .attr('x', d => xScale(d.key))
        .attr('y', d => yScale(d.value))
        .attr('width', xScale.bandwidth())
        .attr('height', d => h - yScale(d.value))
        .attr('fill', d => colorKey ? colorScale(d.key) : '#3b82f6')
        .attr('rx', 2)
        .append('title').text(d => `${d.key}: ${d.value}`);
    }
  },

  // --------------------------------------------------------
  // 3. LINE CHART (NEW)
  // --------------------------------------------------------
  {
    id: 'linechart',
    name: 'Line Chart',
    description: 'Track changes over time or continuous series.',
    thumb: '📈',
    dimensions: [
      { id: 'x', name: 'X Axis (Time/Num)', type: 'number', required: true },
      { id: 'y', name: 'Y Axis (Value)', type: 'number', required: true },
      { id: 'color', name: 'Group (Lines)', type: 'string', required: false },
    ],
    render: (node, data, mapping, width, height, options) => {
      const margin = { top: 20, right: 20, bottom: 50, left: 60 };
      const w = width - margin.left - margin.right;
      const h = height - margin.top - margin.bottom;

      node.innerHTML = '';
      const svg = d3.select(node).append('svg')
        .attr('width', width).attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('style', 'background-color: white')
        .attr('xmlns', 'http://www.w3.org/2000/svg');

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const xKey = mapping.x?.[0];
      const yKey = mapping.y?.[0];
      const colorKey = mapping.color?.[0];

      if (!xKey || !yKey) return;

      // Prepare Data: Convert X to numbers if possible, then Sort
      const xIsNum = isNumeric(data, xKey);
      let plotData = data.map(d => ({ ...d, _x: xIsNum ? +d[xKey] : d[xKey], _y: +d[yKey] }));
      
      // Sort is crucial for Line Chart
      if (xIsNum) {
        plotData.sort((a, b) => a._x - b._x);
      }

      // Grouping
      const groups = colorKey 
        ? Array.from(d3.group(plotData, d => d[colorKey]), ([key, values]) => ({ key, values }))
        : [{ key: 'default', values: plotData }];

      // Scales
      let xScale;
      if (xIsNum) {
        xScale = d3.scaleLinear().domain(d3.extent(plotData, d => d._x)).range([0, w]);
      } else {
        xScale = d3.scalePoint().domain(plotData.map(d => d._x)).range([0, w]);
      }
      
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d._y)]).nice() // Start at 0 usually better
        .range([h, 0]);

      const colorScale = colorKey ? getColorScale(data, colorKey, options?.colorScheme) : () => '#3b82f6';

      // Grid
      if (options?.showGrid) {
        g.append('g').attr('class', 'grid').attr('opacity', 0.1).call(d3.axisLeft(yScale).tickSize(-w).tickFormat('')).select('.domain').remove();
      }

      // Axes
      const xAxis = g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xScale));
      if (!xIsNum) xAxis.selectAll("text").attr("transform", "translate(-10,0)rotate(-45)").style("text-anchor", "end");
      g.append('g').call(d3.axisLeft(yScale));

      // Line Generator
      const line = d3.line()
        .x(d => xScale(d._x))
        .y(d => yScale(d._y))
        // .curve(d3.curveMonotoneX); // Optional: Smooth lines

      // Draw Lines
      g.selectAll('.line-path')
        .data(groups)
        .join('path')
        .attr('class', 'line-path')
        .attr('fill', 'none')
        .attr('stroke', d => colorKey ? colorScale(d.key) : '#3b82f6')
        .attr('stroke-width', 2.5)
        .attr('d', d => line(d.values));

      // Draw Dots
      g.selectAll('.dot-group')
        .data(groups)
        .join('g')
        .attr('fill', d => colorKey ? colorScale(d.key) : '#3b82f6')
        .selectAll('circle')
        .data(d => d.values)
        .join('circle')
        .attr('cx', d => xScale(d._x))
        .attr('cy', d => yScale(d._y))
        .attr('r', 3)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .append('title').text(d => `${xKey}: ${d._x}\n${yKey}: ${d._y}`);
    }
  },

  // --------------------------------------------------------
  // 4. PIE CHART (NEW)
  // --------------------------------------------------------
  {
    id: 'piechart',
    name: 'Pie Chart',
    description: 'Part-to-whole comparison.',
    thumb: '◑',
    dimensions: [
      { id: 'x', name: 'Category (Slices)', type: 'string', required: true },
      { id: 'y', name: 'Value (Size)', type: 'number', required: true },
    ],
    render: (node, data, mapping, width, height, options) => {
      const radius = Math.min(width, height) / 2 - 20;
      
      node.innerHTML = '';
      const svg = d3.select(node).append('svg')
        .attr('width', width).attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('style', 'background-color: white')
        .attr('xmlns', 'http://www.w3.org/2000/svg');

      const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      const catKey = mapping.x?.[0];
      const valKey = mapping.y?.[0];

      if (!catKey || !valKey) return;

      // Aggregation
      const rolledData = Array.from(
        d3.rollup(data, v => d3.sum(v, d => +d[valKey]), d => d[catKey]),
        ([key, value]) => ({ key, value })
      ).sort((a, b) => b.value - a.value); // Sort descending

      const colorScale = getColorScale(data, catKey, options?.colorScheme);

      const pie = d3.pie().value(d => d.value).padAngle(0.01);
      const arc = d3.arc().innerRadius(options?.baseRadius * 4 || 40).outerRadius(radius); // Donut style if radius > 0

      // Draw Slices
      g.selectAll('path')
        .data(pie(rolledData))
        .join('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.key))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .append('title').text(d => `${d.data.key}: ${d.data.value}`);
        
      // Add Labels (Simple centroid based)
      g.selectAll('text')
        .data(pie(rolledData))
        .join('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none')
        .text(d => (d.endAngle - d.startAngle > 0.25 ? d.data.key.toString().slice(0, 10) : '')); // Only label big slices
    }
  },

  // --------------------------------------------------------
  // 5. TREEMAP (NEW)
  // --------------------------------------------------------
  {
    id: 'treemap',
    name: 'Treemap',
    description: 'Hierarchical data as nested rectangles.',
    thumb: '🔲',
    dimensions: [
      { id: 'x', name: 'Group (Label)', type: 'string', required: true },
      { id: 'y', name: 'Size (Area)', type: 'number', required: true },
      { id: 'color', name: 'Color', type: 'string', required: false },
    ],
    render: (node, data, mapping, width, height, options) => {
      node.innerHTML = '';
      const svg = d3.select(node).append('svg')
        .attr('width', width).attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('style', 'background-color: white')
        .attr('xmlns', 'http://www.w3.org/2000/svg');

      const labelKey = mapping.x?.[0];
      const sizeKey = mapping.y?.[0];
      const colorKey = mapping.color?.[0];

      if (!labelKey || !sizeKey) return;

      // 1. Stratify/Hierarchy
      // Since input is flat CSV, we create a root node and attach data as children
      const root = d3.hierarchy({ children: data })
        .sum(d => +d[sizeKey]) // Sum values
        .sort((a, b) => b.value - a.value);

      // 2. Compute Layout
      d3.treemap()
        .size([width, height])
        .paddingInner(1)
        .paddingOuter(1)
        (root);

      const colorScale = colorKey 
        ? getColorScale(data, colorKey, options?.colorScheme)
        : getColorScale(data, labelKey, options?.colorScheme); // Fallback to label color

      // 3. Draw Leaves
      const leaves = svg.selectAll('g')
        .data(root.leaves())
        .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

      leaves.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => colorKey ? colorScale(d.data[colorKey]) : colorScale(d.data[labelKey]))
        .attr('rx', 2) // Rounded
        .append('title').text(d => `${d.data[labelKey]}: ${d.value}`);

      // 4. Labels (Clip if too small)
      leaves.append('text')
        .attr('x', 4)
        .attr('y', 14)
        .text(d => d.data[labelKey])
        .attr('font-size', '10px')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none')
        .style('display', d => (d.x1 - d.x0) > 30 && (d.y1 - d.y0) > 20 ? 'block' : 'none');
    }
  }
];