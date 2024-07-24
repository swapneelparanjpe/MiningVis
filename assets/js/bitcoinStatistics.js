const margin = {left: 60, right: 60, top: 40, bottom: 40};
let chartWidth;
const chartHeight = 200;

let bitcoinStatisticsData;
let toolTip;

let startMilliseconds = new Date("2022-04-22T00:00:00Z").getTime();
let endMilliseconds = new Date("2024-04-21T00:00:00Z").getTime();

// TODO: Fix axes
export function bitcoinStatisticsChart() {

    Promise.all([
        d3.json('assets/datasets/market-price.json'),
        d3.json('assets/datasets/trade-volume.json'),
        d3.json('assets/datasets/miners-revenue.json'),
        d3.json('assets/datasets/estimated-transaction-volume-usd.json'),
    ])
        .then(function (values) {

            const data = [
                {chartName : "market-price", displayName : "Market Price (USD)", data : values[0]},
                {chartName : "trade-volume", displayName : "Exchage Trade Volume (USD)", data : values[1]},
                {chartName : "miners-revenue", displayName : "Miners Revenue (USD)", data : values[2]},
                {chartName : "estimated-transaction-volume-usd", displayName : "Estimated Transaction Volume (USD)", data : values[3]}
            ]

            preprocessData(data);

        });
        
}

function preprocessData(data) {
    
    bitcoinStatisticsData = data;

}

export function updateChartsByDateRange(startDate, endDate) {

    startMilliseconds = startDate.getTime();
    endMilliseconds = endDate.getTime();
    
    initializeElements();
}

export function initializeElements() {

    const numCharts = bitcoinStatisticsData.length;

    const svg = d3.select('#svgBitcoinStatistics')
        .attr('height', chartHeight * numCharts);
    
    chartWidth = svg.node().getBoundingClientRect().width;

    const selectStatistic = d3.select('#selectBitcoinStatistic');

    selectStatistic
        .selectAll('.bitcoinStatisticOptions')
        .data(bitcoinStatisticsData)
        .join('option')
            .classed('bitcoinStatisticOptions', true)
            .attr("value", d => d.chartName)
            .text(d => d.displayName);

    selectStatistic
        .on('change', function() {

            const selectedOptions = d3.selectAll('#selectBitcoinStatistic option:checked')
                .nodes()
                .map(option => option.value);

            let chartNum = 0;

            for(let i = 0; i < numCharts; i++) {
                
                if(selectedOptions.includes(bitcoinStatisticsData[i]['chartName'])) {
                    d3.select(`.g-v4-chart${i}`)
                        .style('display', 'block')
                        .attr('transform', `translate(${margin.left}, ${margin.top + (chartNum * chartHeight)})`);
                    chartNum++;
                } else {
                    d3.select(`.g-v4-chart${i}`)
                        .style('display', 'none');
                }
            }

            svg.attr('height', chartNum * chartHeight);

        });

    svg.selectAll('g').remove();

    for(let i = 0; i < numCharts; i++) {
        const g = svg.append('g')
            .classed(`g-v4-chart${i}`, true)
            .attr('transform', `translate(${margin.left}, ${margin.top + (i * chartHeight)})`);

        const data = bitcoinStatisticsData[i]['data'][bitcoinStatisticsData[i]['chartName']]
        const dateRangefilteredData = data.filter(d => d.x >= startMilliseconds && d.x <= endMilliseconds )
        createAreaChart(g, bitcoinStatisticsData[i]['displayName'], dateRangefilteredData);
    }

    // Tooltip
    toolTip = d3.select('body').append('div')
        .attr("id", "toolTip")
        .style('visibility', 'hidden')

    // Reset button
    d3.select('#btnBitcoinStatisticsReset')
        .on('click', () => {
            
            for(let i = 0; i < numCharts; i++) {
                d3.select(`.g-v4-chart${i}`)
                    .style('display', 'block')
                    .attr('transform', `translate(${margin.left}, ${margin.top + (i * chartHeight)})`);
            }

            svg.attr('height', numCharts * chartHeight);

            d3.selectAll('#selectBitcoinStatistic option:checked')
                .each(function() {
                    this.selected = false;
                });
            
            document.getElementsByClassName(`g-v4-chart0`)[0].scrollIntoView();

        })
    
}

function createAreaChart(g, displayName, data) {
    
    let innerWidth = chartWidth - margin.left - margin.right;
    let innerHeight = chartHeight - margin.top - margin.bottom;

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.x)))
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.y)])
        .range([innerHeight, 20]);

    const area = d3.area()
        .x(d => xScale(new Date(d.x)))
        .y0(innerHeight)
        .y1(d => yScale(d.y));

    const formatDate = d3.timeFormat("%Y-%m-%d");

    g.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area)
        .style('fill', '#808080')
        .on('mousemove', (event) => {
            const [mx, my] = d3.pointer(event);
            const date = xScale.invert(mx);
            const index = d3.bisector(d => new Date(d.x)).left(data, date) - 1;
            const d = data[index];

            toolTip
                .html(`<p>${formatDate(new Date(d.x))}<br>${displayName}: ${formatNumber(d.y)}</p>`)
                .style('visibility', 'visible')
                .style('left', `${event.pageX  + 10 }px`)
                .style('top', `${event.pageY - 40}px`);
        })
        .on('mouseout', (event, d) => {
            toolTip.style('visibility', 'hidden');
        });

    g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale));

    g.append('g')
        .call(d3.axisLeft(yScale).tickFormat(formatNumber).ticks(4));

    const headerRect = g.append('rect')
        .attr('y', -20)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('ry', 4)
        .style('fill', '#808080');

    const headerText = g.append('text')
        .attr('x', -margin.left + 20)
        .attr('y', -10)
        .style('font-size', '1.1em')
        .style('font-wight', '500')
        .style('fill', 'white')
        .style('dominant-baseline', 'middle')
        .text(displayName);

    const headerWidth = headerText.node().getBBox().width;

    headerRect
        .attr('x', -margin.left + 15)
        .attr('width', headerWidth + 10);

    g.append('line')
        .classed('chartHeader', true)
        .attr('x1', -margin.left + 5)
        .attr('y1', -margin.top)
        .attr('x2', innerWidth + margin.right - 5)
        .attr('y2', -margin.top)
        .style('stroke', 'black')
        .style('stroke-width', '0.5')
}

function formatNumber(number) {
    if (number >= 1e9) return (number / 1e9).toFixed(1) + 'B'; 
    else if (number >= 1e6) return (number / 1e6).toFixed(1) + 'M'; 
    else return number.toFixed(0); 
}