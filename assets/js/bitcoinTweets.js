let sampleSize = 100
let dataGlobal

let startDate = new Date("2022-04-22 11:16:55")
let endDate = new Date("2024-12-25 05:36:40")

document.getElementById('totalTweets').innerHTML = 655837
document.getElementById('fraction').innerHTML = `${(sampleSize / 655837 * 100).toFixed(3)}%`;

function sampleData(data, sampleSize) {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
}

document.getElementById('sampleSize').addEventListener('input', function () {
    sampleSize = +this.value;
    document.getElementById('sliderValue').innerHTML = sampleSize
    document.getElementById('fraction').innerHTML = `${(sampleSize / 655837 * 100).toFixed(3)}%`;

    if (dataGlobal) bitcoinTweetsChart()
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function loadData() {
    dataGlobal = await d3.csv("assets/datasets/tweets.csv")
    return null;
}

export function updateChartsByDateRange(start, end) {

    startDate = start;
    endDate = end;
    
    bitcoinTweetsChart();
}

export async function bitcoinTweetsChart() {
    if (!dataGlobal) await loadData()
    let svg = d3.select('#svgBitcoinTweets');
    const dimensions = svg.node().getBoundingClientRect();
    const width = dimensions.width;
    const height = dimensions.height;

    d3.selectAll('.XTweets').remove();
    d3.selectAll('.circleTweets').remove();
    let data = sampleData(dataGlobal, sampleSize);

    data.forEach(function (d) {
        d.date = new Date(d.date);
    });

    console.log(data);
    console.log(startDate);

    data.sort(function (a, b) {
        return a.date - b.date;
    });

    data = data.filter(d => d.date > startDate && d.date < endDate);

    const margin = ({ top: 20, right: 30, bottom: 30, left: 40 })
    const categories = ['btc', 'binance', 'usdt', 'defi', 'nft', 'crypto', 'eth', 'doge'];

    const rScale = d3.scaleLog()
        .domain([5000, d3.max(data, d => +d.user_followers)])
        .range([3, 11])
        .clamp(true);

    var x = (d3.scaleTime()
        .domain(d3.extent(data, function (d) {
            return new Date(d.date);
        }))
        .range([margin.left, width - margin.right - 50])).nice()

    const colorScale = d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemeTableau10);

    svg = d3.select('#svgBitcoinTweets')
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-margin.left, -margin.top, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
        .attr("text-anchor", "middle");

    const tooltip = d3.select('body').append('div')
        .attr("id", "toolTip")
        .style('visibility', 'hidden')

    const legend = svg.selectAll(".legend")
        .data(categories)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => "translate(-18," + i * 17 + ")");

    legend.append("rect")
        .attr("x", -10)
        .attr("width", 18)
        .attr("height", 10)
        .style("fill", colorScale)
        .style("cursor", "pointer")
        .on('mouseover', function (event, d) {
            d3.select(this).style('filter', 'drop-shadow(0px 2px 2px)')
            d3.select(this).style("stroke", "black")
            d3.selectAll('circle')
                .style('opacity', e => { return findHashTag(e) === d ? 1 : 0 })
        })
        .on('mouseout', function () {
            d3.select(this).style('filter', 'drop-shadow(0px 0px)')
            d3.select(this).style('stroke', 'none')
            d3.selectAll('circle')
                .style('opacity', 1)
        });
    legend.append("text")
        .attr("x", 15)
        .attr("y", 5)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => capitalizeFirstLetter(d));
    svg.append('g')
        .classed('XTweets', true)
        .attr("transform", `translate(0,${height - 50})`)
        .call(d3.axisBottom(x).ticks(5));

    const simulation = d3.forceSimulation(data)
        .force('x', d3.forceX(d => {
            return x(d.date)
        }).strength(1))
        .force('y', d3.forceY(height / 3))
        .force('collide', d3.forceCollide(d => rScale(+d['user_followers'])))


    svg.append('g')
        .selectAll('circle')
        .data(data)
        .enter().append('circle')
        .attr('class', 'circleTweets')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => rScale(+d['user_followers']))
        .style('fill', d => colorScale(findHashTag(d)))
        .on('mouseover', function (event, d) {
            d3.select(this).style('filter', 'drop-shadow(0px 2px 2px)')
            d3.select(this).style('stroke', 'aliceblue')
            tooltip.html(`<p>${d['text'].replaceAll('\n', '<br>')}</p><hr/><p>${new Date(d['date']).toDateString()}</p>`)
                .style('visibility', 'visible')
        })
        .on('mousemove', function (event) {
            tooltip.style('top', (event.pageY - 60) + 'px')
                .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function () {
            d3.select(this).style('filter', 'drop-shadow(0px 0px)')
            d3.select(this).style('stroke', 'none')
            tooltip.style('visibility', 'hidden');
        });

    simulation.on('tick', () => {
        svg.selectAll('.circleTweets')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    });


    function findHashTag(e) {
        if (!e['hashtags']) {
            return 'Unknown';
        }
        let arr;
        try {
            arr = JSON.parse(e['hashtags'].toLowerCase().replace(/'/g, '"'));
        } catch (error) {
            console.error('Failed to parse hashtags:', error);
            return 'Parse Error';
        }
        if (arr.includes('defi')) {
            return 'defi';
        } else if (arr.includes('binance')) {
            return 'binance';
        } else if (arr.includes('usdt')) {
            return 'usdt';
        } else if (arr.includes('nft')) {
            return 'nft';
        } else if (arr.includes('doge')) {
            return 'doge';
        } else if (arr.includes('ethereum') || arr.includes('eth')) {
            return 'eth';
        } else if (arr.includes('bitcoin') || arr.includes('btc')) {
            return 'btc';
        } else if (arr.includes('cryptocurrency') || arr.includes('crypto')) {
            return 'crypto';
        } else {
            return 'other';
        }
    }
}

