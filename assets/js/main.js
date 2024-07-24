import { timeSelectionChart, showDateRange } from "./timeSelection.js"
import { miningDistributionChart } from "./miningDistribution.js"
import { bitcoinTweetsChart } from "./bitcoinTweets.js"
import { miningPoolChart, initializeElements as v4InitializeElements } from "./miningPool.js"
import { bitcoinStatisticsChart, initializeElements as v5InitializeElements  } from "./bitcoinStatistics.js"
import { crossPoolingChart } from "./crossPooling.js"
import { miningPoolFlowsChart, initializeElements as v7InitializeElements } from "./miningPoolFlows.js"


document.addEventListener("DOMContentLoaded", function () {

    timeSelectionChart();

    miningDistributionChart();

    bitcoinTweetsChart();

    miningPoolChart();

    bitcoinStatisticsChart();

    crossPoolingChart();

    miningPoolFlowsChart();

    setDefaults();

    interactions();

});

function setDefaults() {

    // V4-V5 Headers and Buttons
    d3.select('#divV4V5Header')
        .text("Mining Pool");
    d3.select('#btnMiningPool')
        .classed('disabled', true)
    d3.select('#btnBitcoinStatistics')
        .classed('disabled', false)
    d3.select('#divMiningPool')
        .style('display', 'block');
    d3.select('#divBitcoinStatistics')
        .style('display', 'none');

    // V6-V7s Headers and Buttons
    d3.select('#divV6V7Header')
        .text("Cross Pooling");
    d3.select('#btnCrossPooling')
        .classed('disabled', true)
    d3.select('#btnMiningPoolFlows')
        .classed('disabled', false)
    d3.select('#divCrossPooling')
        .style('display', 'block');
    d3.select('#divMiningPoolFlows')
        .style('display', 'none');
    
}

function interactions() {

    d3.select('#monthStartV1')
    .on('change', showDateRange);

    d3.select('#monthEndV1')
        .on('change', showDateRange);

    d3.select('#selectMeasure')
        .on('change', () => {
            miningDistributionChart();
            v4InitializeElements();
    });

    d3.select('#checkColorBlindPalette')
        .on('change', miningDistributionChart)

    d3.select('#btnMiningPool')
        .on('click', () => {
            d3.select('#divV4V5Header')
                .text("Mining Pool");
            d3.select('#btnMiningPool')
                .classed('disabled', true);
            d3.select('#btnBitcoinStatistics')
                .classed('disabled', false);
            d3.select('#divMiningPool')
                .style('display', 'block');
            d3.select('#divBitcoinStatistics')
                .style('display', 'none');
        });

    d3.select('#btnBitcoinStatistics')
        .on('click', () => {
            d3.select('#divV4V5Header')
                .text("Bitcoin Statistics");
            d3.select('#btnMiningPool')
                .classed('disabled', false);
            d3.select('#btnBitcoinStatistics')
                .classed('disabled', true);
            d3.select('#divBitcoinStatistics')
                .style('display', 'block');
            d3.select('#divMiningPool')
                .style('display', 'none');

            v5InitializeElements();
        });

    d3.select('#btnCrossPooling')
        .on('click', () => {
            d3.select('#divV6V7Header')
                .text("Cross Pooling");
            d3.select('#btnCrossPooling')
                .classed('disabled', true);
            d3.select('#btnMiningPoolFlows')
                .classed('disabled', false);
            d3.select('#divCrossPooling')
                .style('display', 'block');
            d3.select('#divMiningPoolFlows')
                .style('display', 'none');
        });

    d3.select('#btnMiningPoolFlows')
        .on('click', () => {
            d3.select('#divV6V7Header')
                .text("Mining Pool Flows");
            d3.select('#btnCrossPooling')
                .classed('disabled', false);
            d3.select('#btnMiningPoolFlows')
                .classed('disabled', true);
            d3.select('#divMiningPoolFlows')
                .style('display', 'block');
            d3.select('#divCrossPooling')
                .style('display', 'none');

            v7InitializeElements();
        });
}

