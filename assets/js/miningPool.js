const margin = {left: 60, right: 60, top: 30, bottom: 30};
let chartWidth;
const chartHeight = 130;

let orderColorScale;

let miningPoolsData;
let toolTip;
let minDate, maxDate;
let svg, numCharts;

export function miningPoolChart() {

    Promise.all([d3.json('assets/datasets/pools-timeseries.json')])
        .then(function (values) {
            const data = values[0];

            preprocessData(data);

            initializeElements();

        });

    // Tooltip
    toolTip = d3.select('body').append('div')
        .attr("id", "toolTip")
        .style('visibility', 'hidden')
        
}

function preprocessData(data) {

    let intermediateData = {};

    const parseDate = d3.timeParse("%Y-%m");

    let dates = [];
    
    let orderingMap = {};

    for(const date in data["pools-timeseries"]) {
        for(const pool in data["pools-timeseries"][date]) {

            if(!orderingMap[parseDate(date.slice(0,7))])
                orderingMap[parseDate(date.slice(0,7))] = {};
            if(!orderingMap[parseDate(date.slice(0,7))][pool])
                orderingMap[parseDate(date.slice(0,7))][pool] = 0

            orderingMap[parseDate(date.slice(0,7))][pool] += data["pools-timeseries"][date][pool];
        }
    }

    for(const date in orderingMap) {
        const sortedOrder = Object.entries(orderingMap[date]).sort((a, b) => b[1] - a[1]);
        let i = 0;
        for(const row of sortedOrder) {
            orderingMap[date][row[0]] = i++;
        }
    }


    for(const date in data["pools-timeseries"]) {
        let sum = d3.sum(Object.values(data["pools-timeseries"][date]));
        for(const pool in data["pools-timeseries"][date]) {
            if(!intermediateData[pool])
                intermediateData[pool] = [];
            intermediateData[pool].push({
                'date' : parseDate(date.slice(0,7)),
                'value' : data["pools-timeseries"][date][pool],
                'percentage' : 100 * data["pools-timeseries"][date][pool] / sum,
                'order' : orderingMap[parseDate(date.slice(0,7))][pool]
            })

            dates.push({
                date : parseDate(date.slice(0,7))
            });
        }
    }

    minDate = d3.min(dates, d => d['date']);
    maxDate = d3.max(dates, d => d['date']);

    minDate.setMonth(minDate.getMonth() - 1)
    maxDate.setMonth(maxDate.getMonth() + 1)

    miningPoolsData = [];
    let index = 0;

    for(const pool in intermediateData) {
        miningPoolsData.push({
            'poolName' : pool,
            'poolData' : intermediateData[pool],
            'Minimum' : d3.min(intermediateData[pool], d => d.value),
            'Maximum' : d3.max(intermediateData[pool], d => d.value),
            'Average' : d3.mean(intermediateData[pool], d => d.value),
            'index' : index++
        });
    }

}

export function updateChartsByDateRange(startDate, endDate) {
    const parseDate = d3.timeParse("%Y-%m");
    minDate = parseDate(startDate);
    maxDate = parseDate(endDate);

    minDate.setMonth(minDate.getMonth() - 1)
    maxDate.setMonth(maxDate.getMonth() + 1)
    
    initializeElements();
}

export function initializeElements() {

    numCharts = miningPoolsData.length;

    svg = d3.select('#svgMiningPool')
        .attr('height', chartHeight * numCharts);
    
    chartWidth = svg.node().getBoundingClientRect().width;

    let colorScale = d3.scaleOrdinal()
        .domain(["Unknown", "AntPool", "F2Pool", "ViaBTC", "SlushPool", "Poolin", "SBI Crypto", "Binance Pool", "Foundry USA", "Mara Pool"])
        .range(d3.schemeCategory10);

    orderColorScale = d3.scaleOrdinal()
        .domain([0,1,2,3,4,5,6,7,8,9])
        .range(d3.schemeSet3)

    svg.selectAll('g').remove();

    for(let i = 0; i < numCharts; i++) {
        const g = svg.append('g')
            .classed(`g-v3-chart${i}`, true)
            .attr('transform', `translate(${margin.left}, ${margin.top + (i * chartHeight)})`);

        createHistogram(g, miningPoolsData[i]['poolName'], miningPoolsData[i]['poolData'], colorScale(miningPoolsData[i]['poolName']));
    }

    //TODO: Fix sorting logic
    d3.select('#selectSort')
        .on('change', function() {
            const sortingMetric = d3.select(this).node().value;

            miningPoolsData = miningPoolsData.sort((a, b) => b[sortingMetric] - a[sortingMetric]);

            for(let i = 0; i < numCharts; i++) {
                d3.select(`.g-v3-chart${miningPoolsData[i]['index']}`)
                    .attr('transform', `translate(${margin.left}, ${margin.top + (i * chartHeight)})`)
            }
        })

}

function getOrderDateRangeData(data) {

    const sortedData = data.sort((a, b) => a['date'] - b['date']);

    let orderDateRangeData = [];
    
    let fromDate = sortedData[0]['date']
    let lastOrder = sortedData[0]['order'];

    data.forEach(d => {
        if(lastOrder !== d['order']) {
            orderDateRangeData.push({
                order : lastOrder,
                from : fromDate,
                to : d['date']
            })

            fromDate = d['date'];

            lastOrder = d['order']
        }
    })

    orderDateRangeData.push({
        order : lastOrder,
        from : fromDate,
        to : sortedData[sortedData.length - 1]['date']
    });

    return orderDateRangeData;
    
}

function createHistogram(g, poolName, poolData, color) {

    const measure = d3.select('#selectMeasure').node().value;

    const key = (measure === "marketShare") ? "percentage" : "value";

    let innerWidth = chartWidth - margin.left - margin.right;
    let innerHeight = chartHeight - margin.top - margin.bottom;

    const parseDate = d3.timeParse("%Y-%m");

    const xScale = d3.scaleTime()
        .domain([minDate, maxDate])
        .range([0, innerWidth]);

    const yScaleLeft = d3.scaleLinear()
        .domain([0, d3.max(poolData, d => d[key])])
        .range([innerHeight, 20]);


    const filteredPoolData = poolData.filter(d => d.date > minDate && d.date < maxDate);

    // let data = [
    //     {from : "2023-04", to : "2023-12", value : 'kept'},
    //     {from : "2023-12", to : "2024-03", value : 'shared'},
    // ];

    const orderDateRangeData = getOrderDateRangeData(filteredPoolData);

    g.selectAll('.txFeeRect')
        .data(orderDateRangeData)
        .join('rect')
        .classed('txFeeRect', true)
        .attr('x', d => xScale(d.from))
        .attr('y', 20)
        .attr('width', d => xScale(d.to) - xScale(d.from))
        .attr('height', innerHeight - 20)
        .style('fill', d => orderColorScale(d.order))
        .style('opacity', '0.5');

    const formatDate = d3.timeFormat("%Y-%m");

    g.selectAll('.histBar')
        .data(filteredPoolData)
        .join('rect')
        .classed('histBar', true)
        .attr('x', d => xScale(d.date) - 6)
        .attr('y', d => yScaleLeft(d[key]))
        .attr('width', 12)
        .attr('height', d => innerHeight - yScaleLeft(d[key]))
        .style('fill', color)
        .on('mousemove', (event, d) => {
            const line2 = (key === "value") ? `Hash rate (TH/s): ${d[key]}` : `Market share (%): ${d[key].toFixed(2)}`
            toolTip
                .html(`<p>${formatDate(d.date)}<br>${line2}</p>`)
                .style('visibility', 'visible')
                .style('left', `${event.pageX  + 10 }px`)
                .style('top', `${event.pageY - 40}px`);
        })
        .on('mouseout', (event, d) => {
            toolTip.style('visibility', 'hidden');
        });
    
    const xAxisGroup = g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale)
            .ticks(8)
            .tickFormat(d3.timeFormat('%Y-%m'))
        );

    const yAxisGroupLeft = g.append('g')
        .call(d3.axisLeft(yScaleLeft).tickValues([0, d3.max(poolData, d => d[key])]));

    yAxisGroupLeft.append('text')
        .attr('x', 0)
        .attr('y', 10)
        .style('fill', 'black')
        .style('text-anchor', 'middle')
        .style('font-weight', '500')
        .text((key === "value") ? "Hash rate (TH/s)" : "Market share (%)")

    xAxisGroup.selectAll('text').style('font-size', '0.8em')
    yAxisGroupLeft.selectAll('text').style('font-size', '0.8em')

    const headerRect = g.append('rect')
        .attr('y', -20)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('ry', 4)
        .style('fill', color);

    const headerText = g.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .style('font-size', '1.1em')
        .style('font-wight', '500')
        .style('fill', 'white')
        .style('text-anchor', 'end')
        .style('dominant-baseline', 'middle')
        .text(poolName);

    const headerWidth = headerText.node().getBBox().width;

    headerRect
        .attr('x', -headerWidth - 5)
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

export function toggleMiningPoolVisibility(poolVisibility) {

    let chartNum = 0;

    for(let i = 0; i < numCharts; i++) {

        let poolName = miningPoolsData[i]['poolName'];
        
        if(poolVisibility[poolName]) {
            d3.select(`.g-v3-chart${i}`)
                .style('display', 'block')
                .attr('transform', `translate(${margin.left}, ${margin.top + (chartNum * chartHeight)})`);
            chartNum++;
        } else {
            d3.select(`.g-v3-chart${i}`)
                .style('display', 'none');
        }
    }

    svg.attr('height', chartNum * chartHeight);

}