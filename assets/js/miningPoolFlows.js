const margin = {left: 60, right: 60, top: 20, bottom: 20};
let chartWidth;
const chartHeight = 260;

let poolHoppingData;

let flowData, nodesList;

let toolTip;

export function miningPoolFlowsChart() {

    Promise.all([d3.csv('assets/datasets/pool_hopping.csv')])
        .then(function (values) {
            poolHoppingData = values[0];

            preprocessData();

        });
}

function preprocessData() {
    
    let countFlows = {};
    
    poolHoppingData.forEach(d => {
        const key = `${d['miner']}-${d['to_miner']}`;
        countFlows[key] = (countFlows[key] || 0) + 1;
    });

    flowData = Object.keys(countFlows).map(key => {
        const [from, to] = key.split("-");
        return { from, to, value: countFlows[key] };
    });

    nodesList = [...new Set(flowData.flatMap(d => [d['from'], d['to']]))];

}

export function initializeElements() {

    let numNodes = nodesList.length;
    
    const svg = d3.select('#svgMiningPoolFlows')
        .attr('height', chartHeight * numNodes);
    
    chartWidth = svg.node().getBoundingClientRect().width;

    const selectMiningPool = d3.select('#selectMiningPool');

    selectMiningPool
        .selectAll('.miningPoolOptions')
        .data(nodesList)
        .join('option')
            .classed('miningPoolOptions', true)
            .attr("value", d => d)
            .text(d => d);

    selectMiningPool
        .on('change', function() {

            const selectedOptions = d3.selectAll('#selectMiningPool option:checked')
                .nodes()
                .map(option => option.value);

            let chartNum = 0;

            for(let i = 0; i < numNodes; i++) {
                
                if(selectedOptions.includes(nodesList[i])) {
                    d3.select(`.g-v7-chart${i}`)
                        .style('display', 'block')
                        .attr('transform', `translate(${margin.left}, ${margin.top + (chartNum * chartHeight)})`);
                    chartNum++;
                } else {
                    d3.select(`.g-v7-chart${i}`)
                        .style('display', 'none');
                }
            }

            svg.attr('height', chartNum * chartHeight);

        });

    svg.selectAll('g').remove();

    for(let i = 0; i < numNodes; i++) {
        const g = svg.append('g')
            .classed(`g-v7-chart${i}`, true)
            .attr('transform', `translate(${margin.left}, ${margin.top + (i * chartHeight)})`);

        createSankeyChart(g, nodesList[i]);
    }

    // Tooltip
    toolTip = d3.select('body').append('div')
        .attr("id", "toolTip")
        .style('visibility', 'hidden')

    // Reset button
    d3.select('#btnMiningPoolFlowsReset')
        .on('click', () => {
            for(let i = 0; i < numNodes; i++) {
                d3.select(`.g-v7-chart${i}`)
                    .style('display', 'block')
                    .attr('transform', `translate(${margin.left}, ${margin.top + (i * chartHeight)})`);
            }

            svg.attr('height', numNodes * chartHeight);

            d3.selectAll('#selectMiningPool option:checked')
                .each(function() {
                    this.selected = false;
                });
            
            document.getElementsByClassName(`g-v7-chart0`)[0].scrollIntoView();

        })
    
}

function createSankeyChart(g, centerPool) {

    let flow = {
        "nodes" : [],
        "links" : [],
    };
    
    flow['nodes'].push({"node" : 0, "name" : centerPool});

    let nodeNum = 1;

    let hasLeading = false;
    let hasTrailing = false;

    flowData.forEach(f => {

        if(f['from'] === centerPool) {
            flow['nodes'].push({"node" : nodeNum, "name" : f['to']});
            flow['links'].push({"source" : 0, "target" : nodeNum++, "value" : f['value']});
            hasTrailing = true;
        }
        if(f['to'] == centerPool) {
            flow['nodes'].push({"node" : nodeNum, "name" : f['from']});
            flow['links'].push({"source" : nodeNum++, "target" : 0, "value" : f['value']});
            hasLeading = true;
        }
    });

    let innerWidth = chartWidth - margin.left - margin.right;
    let innerHeight = chartHeight - margin.top - margin.bottom;

    let sankeyWidth = innerWidth;
    let nodeWidth = 30;

    // Adjust group width for no leading/trailing cases
    if(!hasLeading || !hasTrailing)
        sankeyWidth = (innerWidth + nodeWidth) / 2;

    if(!hasLeading)
        g.attr('transform',`translateY(${(chartWidth - nodeWidth)/2})`);

    // Initialize Sankey Chart
    const {nodes, links} = d3.sankey()
        .nodeWidth(nodeWidth)
        .nodePadding(5)
        .size([sankeyWidth, innerHeight])
        (flow);

    // Draw Sankey Paths
    g.selectAll('.sankeyPath')
        .data(links)
        .join('path')
            .classed('sankeyPath', true)
            .attr('d', d3.sankeyLinkHorizontal())
            .style('stroke', '#D3D3D3')
            .style('stroke-width', '2')
            .style('fill', 'none')
            .on('mousemove', (event, d) => {
                d3.select(event.target)
                    .style('stroke', '#838383').raise();
            })
            .on('mouseout', (event, d) => {
                d3.select(event.target)
                    .style('stroke', '#D3D3D3');
            });

    // Draw Sankey Nodes
    g.selectAll('.sankeyNode')
        .data(nodes)
        .join('rect')
            .classed('sankeyNode', true)
            .attr('x', d => {
                return (!hasLeading && !hasTrailing) ? 0 : d.x0;
            })
            .attr('y', d => {
                return (!hasLeading && !hasTrailing) ? 0 : d.y0;
            })
            .attr('width', d => {
                return (!hasLeading && !hasTrailing) ? nodeWidth : d.x1 - d.x0;
            })
            .attr('height', d => {
                return (!hasLeading && !hasTrailing) ? innerHeight : d.y1 - d.y0;
            })
            .style('stroke', 'black')
            .style('stroke-width', '1')
            .style('rx','3')
            .style('ry','3')
            .style('fill', d => {
                if(d.depth === 0) return '#1f77b4';
                else if(d.depth === 1) return '#ff7f0e';
                else if(d.depth === 2) return '#2ca02c';
            })
            .on('mousemove', (event, d) => {
                // Display Tooltip
                toolTip
                    .html(text => {
                        if(d.depth === 0)
                            return `<p>${d.sourceLinks[0].value} miners flow from Mining Pool '${d.sourceLinks[0].source.name}' to Mining Pool '${d.sourceLinks[0].target.name}'</p>`
                        else if(d.depth === 1)
                            return `<p>${d.value} people move to and out of Mining Pool '${d.name}'</p>`
                        else if(d.depth === 2)
                            return `<p>${d.targetLinks[0].value} miners flow from Mining Pool '${d.targetLinks[0].source.name}' to Mining Pool '${d.targetLinks[0].target.name}'</p>`
                    })
                    .style('visibility', 'visible')
                    .style('left', `${event.pageX  + 10 }px`)
                    .style('top', `${event.pageY - 40}px`);

                // Highlight Hovered Sankey Node
                d3.select(event.target)
                    .style('stroke-width', '3');
            })  
            .on('mouseout', (event, d) => {

                // Hide Tooltip
                toolTip.style('visibility', 'hidden');

                // Reset Hovered Sankey Node
                d3.select(event.target)
                    .style('stroke-width', '1');
            })
            .on('click', (event, d) => {
                const index = nodesList.indexOf(d.name);
                document.getElementsByClassName(`g-v7-chart${index}`)[0].scrollIntoView();
            })

    // Draw Sankey Text
    g.selectAll('.sankeyText')
    .data(nodes)
    .join('text')
        .classed('sankeyText', true)
        .attr('x', d => {
            if(d.depth === 0)
                return (!hasLeading && !hasTrailing) ? -30 : d.x0 - 30;
            else if(d.depth === 1)
                return (!hasLeading && !hasTrailing) ? 15 : d.x0 + 15;
            else if(d.depth === 2)
                return (!hasLeading && !hasTrailing) ? 60 : d.x0 + 60;  
        })
        .attr('y', d => {
            return (!hasLeading && !hasTrailing) ? innerHeight/2 : d.y0 + (d.y1 - d.y0)/2;
        })
        .style('fill', d => {
            if(d.depth === 1) return 'white';
            else return 'black';
        })
        .style('text-anchor', 'middle')
        .style('font-size', '0.75em')
        .style('dominant-baseline', 'middle')
        .text(d => d.name);

    g.append('line')
        .classed('sankeyHeader', true)
        .attr('x1', -margin.left + 5)
        .attr('y1', -margin.top)
        .attr('x2', innerWidth + margin.right - 5)
        .attr('y2', -margin.top)
        .style('stroke', 'black')
        .style('stroke-width', '2')

}