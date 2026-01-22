import * as d3 from 'd3';

// --- CONFIGURATION & COULEURS ---
const SCHEMES = {
  tableau10: d3.schemeTableau10,
  viridis: d3.schemeViridis,
  magma: d3.schemeMagma,
};

// --- HELPERS ---

/**
 * Génère une échelle de couleur
 */
const getColorScale = (data, key, schemeName = 'tableau10') => {
  const uniqueKeys = [...new Set(data.map(d => d[key]))].sort();
  
  if (schemeName === 'tableau10') {
    return d3.scaleOrdinal(SCHEMES.tableau10).domain(uniqueKeys);
  } else {
    // Pour les schémas séquentiels (Viridis, Magma), on mappe l'index
    return d3.scaleOrdinal(
      uniqueKeys.map((_, i) => d3[`interpolate${schemeName.charAt(0).toUpperCase() + schemeName.slice(1)}`](i / (uniqueKeys.length - 1 || 1)))
    ).domain(uniqueKeys);
  }
};

/**
 * Vérifie si une colonne est numérique
 */
const isNumeric = (data, key) => {
  return data.every(d => !isNaN(parseFloat(d[key])) && isFinite(d[key]));
};

/**
 * Dessine les titres des axes
 */
const drawAxisTitles = (g, width, height, xTitle, yTitle) => {
  if (xTitle) {
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#475569")
      .text(xTitle);
  }
  if (yTitle) {
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -45)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#475569")
      .text(yTitle);
  }
};

/**
 * Dessine la légende automatiquement
 */
const drawLegend = (svg, colorScale, width, margin) => {
  if (!colorScale) return;
  const domain = colorScale.domain();
  if (domain.length === 0 || domain.length > 20) return; // Pas de légende si trop de catégories

  const legendG = svg.append("g")
    .attr("class", "chart-legend")
    .attr("transform", `translate(${width - margin.right + 15}, ${margin.top})`);

  // Titre légende (optionnel)
  // legendG.append("text").text("Légende").style("font-size", "10px").attr("y", -10).style("font-weight", "bold");

  domain.forEach((d, i) => {
    const row = legendG.append("g").attr("transform", `translate(0, ${i * 20})`);
    
    row.append("rect")
      .attr("width", 12).attr("height", 12).attr("rx", 2)
      .attr("fill", colorScale(d));
    
    row.append("text")
      .attr("x", 18).attr("y", 10)
      .style("font-size", "11px").style("font-family", "sans-serif").style("fill", "#334155")
      .text(d);
  });
};

// --- INTERACTIVITÉ ---

const getTooltip = () => {
  let tooltip = d3.select('body').select('.d3-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body').append('div').attr('class', 'd3-tooltip');
  }
  return tooltip;
};

const addInteractivity = (selection, getHtmlContent) => {
  const tooltip = getTooltip();
  
  selection
    .on('mouseover', function(event, d) {
      d3.select(this.parentNode).selectAll(this.tagName).attr('opacity', 0.2);
      d3.select(this).attr('opacity', 1).attr('stroke', 'black').attr('stroke-width', 2);
      tooltip.transition().duration(100).style('opacity', 1);
      tooltip.html(getHtmlContent(d));
    })
    .on('mousemove', function(event) {
      tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this.parentNode).selectAll(this.tagName).attr('opacity', 0.8).attr('stroke', 'white').attr('stroke-width', 1);
      tooltip.transition().duration(200).style('opacity', 0);
    });
};

// --- GRAPHIQUES ---

export const CHARTS = [
  // 1. SCATTER PLOT
  {
    id: 'scatterplot',
    name: 'Scatter Plot',
    description: 'Corrélation avec Zoom & Pan.',
    thumb: '●',
    dimensions: [
      { id: 'x', name: 'Axe X', type: 'number', required: true },
      { id: 'y', name: 'Axe Y', type: 'number', required: true },
      { id: 'color', name: 'Couleur', type: 'string', required: false },
      { id: 'size', name: 'Taille', type: 'number', required: false },
    ],
    render: (node, data, mapping, width, height, options) => {
      // Marge droite augmentée pour la légende
      const margin = { top: 20, right: 120, bottom: 50, left: 60 };
      const w = width - margin.left - margin.right;
      const h = height - margin.top - margin.bottom;

      node.innerHTML = '';
      const svg = d3.select(node).append('svg')
        .attr('width', width).attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('style', 'background-color: white; cursor: crosshair;')
        .attr('xmlns', 'http://www.w3.org/2000/svg');

      svg.append("defs").append("clipPath").attr("id", "clip").append("rect").attr("width", w).attr("height", h);

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const xKey = mapping.x?.[0];
      const yKey = mapping.y?.[0];
      const colorKey = mapping.color?.[0];
      const sizeKey = mapping.size?.[0];
      if (!xKey || !yKey) return;

      const xIsNum = isNumeric(data, xKey);
      const yIsNum = isNumeric(data, yKey);

      let xScale = xIsNum ? d3.scaleLinear().domain(d3.extent(data, d => +d[xKey])).nice().range([0, w]) : d3.scalePoint().domain(data.map(d => d[xKey])).range([0, w]).padding(0.5);
      let yScale = yIsNum ? d3.scaleLinear().domain(d3.extent(data, d => +d[yKey])).nice().range([h, 0]) : d3.scalePoint().domain(data.map(d => d[yKey])).range([h, 0]).padding(0.5);
      
      const colorScale = colorKey ? getColorScale(data, colorKey, options?.colorScheme) : null;
      const rScale = sizeKey ? d3.scaleSqrt().domain(d3.extent(data, d => +d[sizeKey])).range([3, (options?.baseRadius || 6) * 3]) : () => (options?.baseRadius || 6);

      const xAxisG = g.append('g').attr('transform', `translate(0,${h})`);
      const yAxisG = g.append('g');
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      xAxisG.call(xAxis);
      yAxisG.call(yAxis);
      if (!xIsNum) xAxisG.selectAll("text").attr("transform", "translate(-10,0)rotate(-45)").style("text-anchor", "end");

      if (options?.showGrid) {
        g.append('g').attr('class', 'grid').attr('opacity', 0.1).attr('transform', `translate(0,${h})`).call(xAxis.tickSize(-h).tickFormat('')).select('.domain').remove();
        g.append('g').attr('class', 'grid').attr('opacity', 0.1).call(yAxis.tickSize(-w).tickFormat('')).select('.domain').remove();
      }

      drawAxisTitles(g, w, h, options?.xTitle || xKey, options?.yTitle || yKey);
      if (colorKey) drawLegend(svg, colorScale, width, margin);

      const pointsG = g.append('g').attr("clip-path", "url(#clip)");
      const circles = pointsG.selectAll('circle').data(data).join('circle')
        .attr('cx', d => xScale(d[xKey])).attr('cy', d => yScale(d[yKey]))
        .attr('r', d => rScale(d))
        .attr('fill', d => colorKey ? colorScale(d[colorKey]) : '#3b82f6')
        .attr('opacity', 0.8).attr('stroke', 'white');

      addInteractivity(circles, d => `<strong>${d[xKey]}</strong><br>${yKey}: ${d[yKey]}`);

      if (xIsNum && yIsNum) {
        const zoom = d3.zoom().scaleExtent([0.5, 20]).extent([[0, 0], [w, h]]).on('zoom', (event) => {
          const newX = event.transform.rescaleX(xScale);
          const newY = event.transform.rescaleY(yScale);
          xAxisG.call(xAxis.scale(newX));
          yAxisG.call(yAxis.scale(newY));
          circles.attr('cx', d => newX(d[xKey])).attr('cy', d => newY(d[yKey]));
        });
        svg.call(zoom);
      }
    }
  },

  

  // 3. BAR CHART
  {
    id: 'barchart',
    name: 'Bar Chart',
    description: 'Comparaison de catégories.',
    thumb: 'Il',
    dimensions: [
      { id: 'x', name: 'Catégorie (X)', type: 'string', required: true },
      { id: 'y', name: 'Hauteur (Y)', type: 'number', required: true },
      { id: 'color', name: 'Couleur', type: 'string', required: false },
    ],
    render: (node, data, mapping, width, height, options) => {
      const margin = { top: 20, right: 120, bottom: 60, left: 60 };
      const w = width - margin.left - margin.right;
      const h = height - margin.top - margin.bottom;

      node.innerHTML = '';
      const svg = d3.select(node).append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`).attr('style', 'background-color: white').attr('xmlns', 'http://www.w3.org/2000/svg');
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const xKey = mapping.x?.[0]; const yKey = mapping.y?.[0]; const colorKey = mapping.color?.[0];
      if (!xKey || !yKey) return;

      const rolledData = Array.from(d3.rollup(data, v => d3.sum(v, d => +d[yKey]), d => d[xKey]), ([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);

      const xScale = d3.scaleBand().domain(rolledData.map(d => d.key)).range([0, w]).padding(0.2);
      const yScale = d3.scaleLinear().domain([0, d3.max(rolledData, d => d.value)]).nice().range([h, 0]);
      const colorScale = colorKey ? getColorScale(data, colorKey, options?.colorScheme) : null;

      const xAxis = g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xScale));
      if (rolledData.length > 10 || xScale.bandwidth() < 40) xAxis.selectAll("text").attr("transform", "translate(-10,0)rotate(-45)").style("text-anchor", "end");
      g.append('g').call(d3.axisLeft(yScale));
      
      if (options?.showGrid) g.append('g').attr('opacity', 0.1).call(d3.axisLeft(yScale).tickSize(-w).tickFormat('')).select('.domain').remove();

      drawAxisTitles(g, w, h, options?.xTitle || xKey, options?.yTitle || yKey);
      if (colorKey) drawLegend(svg, colorScale, width, margin);

      const bars = g.selectAll('rect').data(rolledData).join('rect')
        .attr('x', d => xScale(d.key)).attr('y', d => yScale(d.value))
        .attr('width', xScale.bandwidth()).attr('height', d => h - yScale(d.value))
        .attr('fill', d => colorKey ? colorScale(d.key) : '#3b82f6').attr('rx', 2).attr('opacity', 0.8);

      addInteractivity(bars, d => `<strong>${d.key}</strong><br>Total: ${d.value}`);
    }
  },

  // 4. LINE CHART
  {
    id: 'linechart',
    name: 'Line Chart',
    description: 'Évolution temporelle ou continue.',
    thumb: '📈',
    dimensions: [
      { id: 'x', name: 'Axe X (Temps)', type: 'number', required: true },
      { id: 'y', name: 'Axe Y (Valeur)', type: 'number', required: true },
      { id: 'color', name: 'Groupe', type: 'string', required: false },
    ],
    render: (node, data, mapping, width, height, options) => {
      const margin = { top: 20, right: 120, bottom: 50, left: 60 };
      const w = width - margin.left - margin.right;
      const h = height - margin.top - margin.bottom;

      node.innerHTML = '';
      const svg = d3.select(node).append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`).attr('style', 'background-color: white').attr('xmlns', 'http://www.w3.org/2000/svg');
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const xKey = mapping.x?.[0]; const yKey = mapping.y?.[0]; const colorKey = mapping.color?.[0];
      if (!xKey || !yKey) return;

      const xIsNum = isNumeric(data, xKey);
      let plotData = data.map(d => ({ ...d, _x: xIsNum ? +d[xKey] : d[xKey], _y: +d[yKey] }));
      if (xIsNum) plotData.sort((a, b) => a._x - b._x);

      const groups = colorKey 
        ? Array.from(d3.group(plotData, d => d[colorKey]), ([key, values]) => ({ key, values }))
        : [{ key: 'default', values: plotData }];

      let xScale = xIsNum ? d3.scaleLinear().domain(d3.extent(plotData, d => d._x)).range([0, w]) : d3.scalePoint().domain(plotData.map(d => d._x)).range([0, w]);
      const yScale = d3.scaleLinear().domain([0, d3.max(plotData, d => d._y)]).nice().range([h, 0]);
      const colorScale = colorKey ? getColorScale(data, colorKey, options?.colorScheme) : null;

      const xAxis = g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xScale));
      if (!xIsNum) xAxis.selectAll("text").attr("transform", "translate(-10,0)rotate(-45)").style("text-anchor", "end");
      g.append('g').call(d3.axisLeft(yScale));

      if (options?.showGrid) g.append('g').attr('opacity', 0.1).call(d3.axisLeft(yScale).tickSize(-w).tickFormat('')).select('.domain').remove();
      drawAxisTitles(g, w, h, options?.xTitle || xKey, options?.yTitle || yKey);
      if (colorKey) drawLegend(svg, colorScale, width, margin);

      const line = d3.line().x(d => xScale(d._x)).y(d => yScale(d._y));

      g.selectAll('.line-path').data(groups).join('path')
        .attr('class', 'line-path').attr('fill', 'none').attr('stroke', d => colorKey ? colorScale(d.key) : '#3b82f6')
        .attr('stroke-width', 2.5).attr('d', d => line(d.values)).attr('opacity', 0.8);

      const dots = g.selectAll('.dot-group').data(groups).join('g')
        .attr('fill', d => colorKey ? colorScale(d.key) : '#3b82f6')
        .selectAll('circle').data(d => d.values).join('circle')
        .attr('cx', d => xScale(d._x)).attr('cy', d => yScale(d._y)).attr('r', 3)
        .attr('stroke', 'white').attr('stroke-width', 1).attr('opacity', 0.8);

      addInteractivity(dots, d => `<strong>${d._x}</strong><br>${d._y}`);
    }
  },

  // 5. PIE CHART
  {
    id: 'piechart',
    name: 'Pie Chart',
    description: 'Comparaison partie-ensemble.',
    thumb: '◑',
    dimensions: [
      { id: 'x', name: 'Catégorie', type: 'string', required: true },
      { id: 'y', name: 'Valeur', type: 'number', required: true },
    ],
    render: (node, data, mapping, width, height, options) => {
      const radius = Math.min(width, height) / 2 - 20;
      node.innerHTML = '';
      const svg = d3.select(node).append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`).attr('style', 'background-color: white').attr('xmlns', 'http://www.w3.org/2000/svg');
      const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

      const catKey = mapping.x?.[0]; const valKey = mapping.y?.[0];
      if (!catKey || !valKey) return;

      const rolledData = Array.from(d3.rollup(data, v => d3.sum(v, d => +d[valKey]), d => d[catKey]), ([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);

      const colorScale = getColorScale(data, catKey, options?.colorScheme);
      const pie = d3.pie().value(d => d.value).padAngle(0.01);
      const arc = d3.arc().innerRadius(options?.baseRadius * 4 || 40).outerRadius(radius);
      const arcHover = d3.arc().innerRadius(options?.baseRadius * 4 || 40).outerRadius(radius + 10);

      const path = g.selectAll('path').data(pie(rolledData)).join('path')
        .attr('d', arc).attr('fill', d => colorScale(d.data.key))
        .attr('stroke', 'white').attr('stroke-width', 2);

      const tooltip = getTooltip();
      path.on('mouseover', function(event, d) {
          d3.select(this).transition().duration(200).attr('d', arcHover).attr('opacity', 1);
          g.selectAll('path').filter(n => n !== d).transition().attr('opacity', 0.3);
          tooltip.transition().style('opacity', 1);
          tooltip.html(`<strong>${d.data.key}</strong>${d.data.value}`);
        })
        .on('mousemove', (event) => tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 10) + 'px'))
        .on('mouseleave', function() {
          d3.select(this).transition().duration(200).attr('d', arc);
          g.selectAll('path').transition().attr('opacity', 1);
          tooltip.transition().style('opacity', 0);
        });

      g.selectAll('text').data(pie(rolledData)).join('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle').attr('font-size', '10px').attr('fill', 'white').attr('font-weight', 'bold').attr('pointer-events', 'none')
        .text(d => (d.endAngle - d.startAngle > 0.25 ? d.data.key.toString().slice(0, 10) : ''));
    }
  },

  // 6. TREEMAP
  {
    id: 'treemap',
    name: 'Treemap',
    description: 'Hiérarchie sous forme de rectangles.',
    thumb: '🔲',
    dimensions: [
      { id: 'x', name: 'Groupe', type: 'string', required: true },
      { id: 'y', name: 'Taille', type: 'number', required: true },
      { id: 'color', name: 'Couleur', type: 'string', required: false },
    ],
    render: (node, data, mapping, width, height, options) => {
      node.innerHTML = '';
      const svg = d3.select(node).append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`).attr('style', 'background-color: white').attr('xmlns', 'http://www.w3.org/2000/svg');

      const labelKey = mapping.x?.[0]; const sizeKey = mapping.y?.[0]; const colorKey = mapping.color?.[0];
      if (!labelKey || !sizeKey) return;

      const root = d3.hierarchy({ children: data }).sum(d => +d[sizeKey]).sort((a, b) => b.value - a.value);
      d3.treemap().size([width, height]).paddingInner(1).paddingOuter(1)(root);
      
      // Ici on utilise soit la couleur mappée, soit le label si pas de couleur
      const colorScale = colorKey 
        ? getColorScale(data, colorKey, options?.colorScheme)
        : getColorScale(data, labelKey, options?.colorScheme);

      const nodes = svg.selectAll('g').data(root.leaves()).join('g').attr('transform', d => `translate(${d.x0},${d.y0})`);

      const rects = nodes.append('rect').attr('width', d => d.x1 - d.x0).attr('height', d => d.y1 - d.y0)
        .attr('fill', d => colorKey ? colorScale(d.data[colorKey]) : colorScale(d.data[labelKey]))
        .attr('rx', 2).attr('opacity', 0.8);

      nodes.append('text').attr('x', 4).attr('y', 14).text(d => d.data[labelKey])
        .attr('font-size', '10px').attr('fill', 'white').attr('font-weight', 'bold').attr('pointer-events', 'none')
        .style('display', d => (d.x1 - d.x0) > 30 && (d.y1 - d.y0) > 20 ? 'block' : 'none');
      
      addInteractivity(rects, d => `<strong>${d.data[labelKey]}</strong><br>Val: ${d.value}`);
    }
  }
];