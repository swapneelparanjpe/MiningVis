import { updateChartsByDateRange as updateMiningDistributionChart } from "./miningDistribution.js"
import { updateChartsByDateRange as updateMiningPoolChart } from "./miningPool.js"
import { updateChartsByDateRange as updateBitcoinStatisticsChart } from "./bitcoinStatistics.js"
import { updateChartsByDateRange as updateBitcoinTweetsChart } from "./bitcoinTweets.js"

const margin = {left: 40, right: 40, top: 20, bottom: 20};

let optionsList;
let g;
let xScale, xAxisGroup, yScale, yAxisGroup;

let innerWidth, innerHeight;

let startMilliseconds = new Date("2022-04-22T00:00:00Z").getTime();
let endMilliseconds = new Date("2024-04-21T00:00:00Z").getTime();

let minDate = "2022-04";
let maxDate = "2024-04";

export function timeSelectionChart() {

    document.getElementById("monthStartV1").defaultValue = minDate;
    document.getElementById("monthEndV1").defaultValue = maxDate;

    document.getElementById("monthStartV1").min = minDate;
    document.getElementById("monthStartV1").max = maxDate;

    document.getElementById("monthEndV1").min = minDate;
    document.getElementById("monthEndV1").max = maxDate;
    
    const svg = d3.select('#svgTimeSelection');
    
    const dimensions = svg.node().getBoundingClientRect();
    const width = dimensions.width;
    const height = dimensions.height;

    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    
    g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    xScale = d3.scaleTime()
        .range([0, innerWidth]);

    xAxisGroup = g.append('g')
        .style('font-size', '75%')
        .attr('transform', `translate(0, ${innerHeight})`);

    yScale = d3.scaleLinear()
        .range([innerHeight, 0]);

    yAxisGroup = g.append('g')
        .style('font-size', '75%');

    const selectStatistic = d3.select('#selectStatisticsV1');

    optionsList = [
        {chartName : "market-price", displayName : "Market Price (USD)"},
        {chartName : "trade-volume", displayName : "Exchage Trade Volume (USD)"},
        {chartName : "miners-revenue", displayName : "Miners Revenue (USD)"},
        {chartName : "estimated-transaction-volume-usd", displayName : "Estimated Transaction Volume (USD)"}
    ]

    selectStatistic
        .selectAll('.statisticOptions')
        .data(optionsList)
        .join('option')
            .classed('statisticOptions', true)
            .attr("value", d => d.chartName)
            .text(d => d.displayName);
    
    selectStatistic
        .on('change', getDataset);

    getDataset();

    dragDateRange();
        
}

function getDataset() {

    const statistic = d3.select('#selectStatisticsV1').node().value;

    const {chartName, displayName} = optionsList.filter(d => d.chartName === statistic)[0];

    Promise.all([d3.json(`assets/datasets/${chartName}.json`)])
        .then(function (values) {
            const data = values[0];

            createTimeSelectionChart(chartName, displayName, data[chartName]);

        });

}

function createTimeSelectionChart(chartName, displayName, data) {

    const dateRangefilteredData = data.filter(d => d.x >= startMilliseconds && d.x <= endMilliseconds )

    xScale
        .domain(d3.extent(dateRangefilteredData, d => new Date(d.x)));

    yScale
        .domain([0, d3.max(dateRangefilteredData, d => d.y)]);

    const halvingDates = [
        {index : "1st", date : "2012-11-28"},
        {index : "2nd", date : "2016-07-09"},
        {index : "3rd", date : "2020-05-11"}
    ]

    g.selectAll('.halvingDateLines')
        .data(halvingDates)
        .join('line')
            .classed('halvingDateLines', true)
            .attr('x1', d => xScale(new Date(d.date)))
            .attr('y1', 0)
            .attr('x2', d => xScale(new Date(d.date)))
            .attr('y2', innerHeight)
            .style('stroke', 'grey')
            .style('stroke-width', '0.5')

    g.selectAll('.halvingDateText')
        .data(halvingDates)
        .join('text')
            .classed('halvingDateText', true)
            .attr('x', d => xScale(new Date(d.date)))
            .attr('y', -5)
            .style('text-anchor', 'middle')
            .style('fill', 'grey')
            .text(d => `${d.index} halving day`)

    // TODO: Line chart going out of bounds on month change

    g.selectAll('.line')
        .data([dateRangefilteredData])
        .join('path')
            .classed('line', true)
            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('d', d3.line()
                .x(d => xScale(new Date(d.x)))
                .y(d => yScale(d.y))
            );
    
    
    xAxisGroup
        .transition()
        .duration(500)
        .ease(d3.easeLinear)
        .call(d3.axisBottom(xScale));
    yAxisGroup
        .transition()
        .duration(500)
        .ease(d3.easeLinear)
        .call(
            d3.axisLeft(yScale)
            .ticks(4)
            .tickFormat(formatNumber)
        );

    d3.select('#btnResetV1')
        .on('click', () => {

            g.selectAll('.dateRangeSelection').remove();

            const startDate = new Date("2022-04-22T00:00:00Z")
            const endDate = new Date("2024-04-21T00:00:00Z");

            const startDateFormatted = formatDate(startDate);
            document.getElementById("monthStartV1").value = startDateFormatted;
            const endDateFormatted = formatDate(endDate);
            document.getElementById("monthEndV1").value = endDateFormatted;

            updateMiningDistributionChart(startDate, endDate);
            updateMiningPoolChart(startDateFormatted, endDateFormatted);
            updateBitcoinStatisticsChart(startDate, endDate);
            updateBitcoinTweetsChart(startDate, endDate);

        })

}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function formatNumber(number) {
    if (number >= 1e9) return (number / 1e9).toFixed(1) + 'B'; 
    else if (number >= 1e6) return (number / 1e6).toFixed(1) + 'M'; 
    else return number.toFixed(0); 
}

export function showDateRange() {

    const startDate = d3.select('#monthStartV1').node().value;
    const endDate = d3.select('#monthEndV1').node().value;

    document.getElementById('monthEndV1').min = startDate;

    const x0 = Math.min(xScale(new Date(startDate)), xScale(new Date(endDate)));
    const x1 = Math.max(xScale(new Date(startDate)), xScale(new Date(endDate)));

    g.selectAll('.dateRangeSelection')
        .data([0])
        .join('rect')
        .classed('dateRangeSelection', true)
        .attr('x', x0)
        .attr('y', 0)
        .attr('width', x1 - x0)
        .attr('height', innerHeight)
        .style('fill', '#fff157')
        .style('opacity', '0.5');

    const dateStart = xScale.invert(x0);
    const dateEnd = xScale.invert(x1);

    dateEnd.setMonth(dateEnd.getMonth() + 1)
    dateEnd.setDate(dateEnd.getDate() - 1)

    const dateStartFormatted = formatDate(dateStart);
    const dateEndFormatted = formatDate(dateEnd);

    updateMiningDistributionChart(dateStart, dateEnd);
    updateMiningPoolChart(dateStartFormatted, dateEndFormatted);
    updateBitcoinStatisticsChart(dateStart, dateEnd);
    updateBitcoinTweetsChart(dateStart, dateEnd);

    return [startDate, endDate]
}

function dragDateRange() {
    
    let startDate, endDate;
    let startDateFormatted, endDateFormatted;
    let startX, dragX, endX;

    let isDragActive

    const lasso = d3.drag()
        .on('start', (event) => {
            startX = event.x - margin.left;
            startDate = formatDate(xScale.invert(startX));
            document.getElementById("monthStartV1").value = startDate;

            isDragActive = false;
        })
        .on('drag', (event) => {
            dragX = event.x - margin.left;

            const x0 = Math.min(startX, dragX);
            const x1 = Math.max(startX, dragX);

            g.selectAll('.dateRangeSelection')
                .data([0])
                .join('rect')
                .classed('dateRangeSelection', true)
                .attr('x', x0)
                .attr('y', 0)
                .attr('width', x1 - x0)
                .attr('height', innerHeight)
                .style('fill', '#fff157')
                .style('opacity', '0.5');

            startDate = formatDate(xScale.invert(x0));
            document.getElementById("monthStartV1").value = startDate;
            endDate = formatDate(xScale.invert(x1));
            document.getElementById("monthEndV1").value = endDate;

            isDragActive = true;
        })
        .on('end', (event) => {
            endX = event.x - margin.left;

            const x0 = Math.min(startX, endX);
            const x1 = Math.max(startX, endX);

            g.selectAll('.dateRangeSelection')
                .data([0])
                .join('rect')
                .classed('dateRangeSelection', true)
                .attr('x', x0)
                .attr('y', 0)
                .attr('width', x1 - x0)
                .attr('height', innerHeight)
                .style('fill', '#fff157')
                .style('opacity', '0.5');

            startDate = xScale.invert(x0)
            endDate = xScale.invert(x1)

            if(!isDragActive) {
                startDate = new Date("2022-04-22T00:00:00Z")
                endDate = new Date("2024-04-21T00:00:00Z")
            }

            startDateFormatted = formatDate(startDate);
            document.getElementById("monthStartV1").value = startDateFormatted;
            endDateFormatted = formatDate(endDate);
            document.getElementById("monthEndV1").value = endDateFormatted;

            updateMiningDistributionChart(startDate, endDate);
            updateMiningPoolChart(startDateFormatted, endDateFormatted);
            updateBitcoinStatisticsChart(startDate, endDate);
            updateBitcoinTweetsChart(startDate, endDate);

        });

    d3.select('#svgTimeSelection').call(lasso);
}