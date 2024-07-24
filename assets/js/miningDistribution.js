import { toggleMiningPoolVisibility } from "./miningPool.js"

let startDate = "2022-04-22T07:00:00.000Z";
let endDate = "2024-04-21T07:00:00.000Z";

export function updateChartsByDateRange(start, end) {

    const formatDate = d3.timeFormat("%Y-%m-%dT%H:%M:%SZ");

    startDate = formatDate(start)
    endDate = formatDate(end)
    
    miningDistributionChart();
}

export function miningDistributionChart() {
    
    // Tooltip
    let toolTip = d3.select('body').append('div')
        .attr("id", "toolTip")
        .style('visibility', 'hidden')

    function initializeMissingAttributes(data, attributes) {
        for (const key of Object.keys(data)) {
            for (const attr of attributes) {
                if (!(attr in data[key])) {
                    data[key][attr] = 0;
                }
            }
        }
        return data;
    }

    function filterDataByDate(data, startDate, endDate) {
        // Convert data object to an array
        const dataArray = Object.values(data);
        // Parse start and end dates
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        // Filter data based on date range
        const filteredData = [];
        for (const item of dataArray) {
            const itemDate = new Date(item.date);
            if (itemDate >= startDate && itemDate <= endDate) {
                filteredData.push(item);
            }
        }

        return filteredData;
    }

    let poolValues = {
        "Unknown": true,
        "AntPool": true,
        "F2Pool": true,
        "ViaBTC": true,
        "SlushPool": true,
        "Poolin": true,
        "SBI Crypto": true,
        "Binance Pool": true,
        "Foundry USA": true,
        "Luxor": true,
        "Braiins Pool": true,
        "Mara Pool": true,
        "BTC.com": true,
        "Titan": true,
        "Ultimus": true,
        "Kucoin": true,
        "BTC M4": true,
        "1THash": true,
        "Solo CKPool": true,
        "Pega Pool": true,
        "BTC M19": true,
        "CKPool": true,
        "mmpool": true,
        "KanoPool": true,
        "Zulu Pool": true
    }

    // Load the JSON data
    d3.json("../assets/datasets/pools-timeseries.json").then(function (data) {
        document.getElementById("svgMiningDistribution").innerHTML = '';
        if (document.getElementById("selectMeasure").value === "marketShare") {
            for (const date in data["pools-timeseries"]) {
                const pools = data["pools-timeseries"][date];
                let totalValue = 0;

                // Calculate the total value for the current date
                for (const pool in pools) {
                    totalValue += pools[pool];
                }

                // Calculate percentages for each attribute for the current date
                for (const pool in pools) {
                    pools[pool] = (pools[pool] / totalValue) * 100;
                }
            }
        }

        //console.log("% data", data);

        const uniqueAttributes = new Set();

        for (const date in data["pools-timeseries"]) {
            const attributes = Object.keys(data["pools-timeseries"][date]);
            attributes.forEach(attribute => uniqueAttributes.add(attribute));
        }
        const uniqueKeys = [...uniqueAttributes];
        initializeMissingAttributes(data['pools-timeseries'], uniqueKeys);
        //console.log(data);
        // Sorting the dates
        const sortedDates = Object.keys(data['pools-timeseries']).sort();

        // Creating a new object with sorted dates
        const sortedData = {
            "metric1": data["metric1"],
            "metric2": data["metric2"],
            "pools-timeseries": {}
        };

        sortedDates.forEach(date => {
            sortedData["pools-timeseries"][date] = data["pools-timeseries"][date];
        });
        //console.log("Sorted Data", sortedData);
        const usableData = [];
        let index = 0;
        //const parseDate = d3.utcParse("%Y-%m-%dT%H:%M:%SZ");
        const formatDate = d3.timeFormat("%Y-%m-%d");
        for (const [date, pools] of Object.entries(sortedData["pools-timeseries"])) {
            for (const [pool, value] of Object.entries(pools)) {
                usableData.push({
                    date: date,
                    pool: pool,
                    value: value
                });
            }
        }
        //console.log("Usable Data", usableData);

        const filteredData = filterDataByDate(usableData, startDate, endDate);

        const parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%SZ");
        filteredData.forEach(d => d.date = parseDate(d.date));

        const stackedData = d3.groups(filteredData, d => d.date)
            .map(([key, values]) => {
                const result = { date: key };
                values.forEach(v => {
                    result[v.pool] = v.value;
                });
                return result;
            });

        const svg = d3.select('#svgMiningDistribution')
        const dimensions = svg.node().getBoundingClientRect();
        const margin = { top: 10, right: 30, bottom: 20, left: 30 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const x = d3.scaleTime()
            .domain(d3.extent(stackedData, d => d.date))
            .range([0, width - 80]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(stackedData, d => d3.sum(Object.values(d).slice(1)))])
            .range([height, 0]);


        let color = d3.scaleOrdinal()
            .domain(uniqueKeys)
            .range(d3.schemeCategory10);


        if (document.getElementById("checkColorBlindPalette").checked) {
            // console.log("Colorblind ON")
            color = d3.scaleOrdinal()
                .domain(uniqueKeys)
                .range([

                    "#1f77b4", // blue
                    "#aec7e8", // light blue
                    "#ff7f0e", // orange
                    "#ffbb78", // light orange
                    "#2ca02c", // green
                    "#98df8a", // light green
                    "#d62728", // red
                    "#ff9896", // light red
                    "#9467bd", // purple
                    "#c5b0d5", // light purple
                    "#8c564b", // brown
                    "#c49c94", // light brown
                    "#e377c2", // pink
                    "#f7b6d2", // light pink
                    "#7f7f7f", // gray
                    "#c7c7c7", // light gray
                    "#bcbd22", // olive
                    "#dbdb8d", // light olive
                    "#17becf", // cyan
                    "#9edae5", // light cyan
                    "#1f78b4", // darker blue
                    "#6baed6", // medium blue
                    "#b2df8a", // medium green
                    "#33a02c", // darker green
                    "#e31a1c"  // darker red
                ]);
        }
        else {
            // console.log("Colorblind OFF");

        }

        svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);


        const area = d3.area()
            .x(d => x(d.data.date))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        const stack = d3.stack()
            .keys(uniqueKeys);

        const layers = stack(stackedData);


        g.selectAll(".layer")
            .data(layers)
            .enter().append("path")
            .attr("transform", `translate(100,0)`)
            .attr("class", d => "layer " + d.key.replace(/\s+/g, '_'))
            .attr("d", area)
            .style("fill", d => color(d))
            .on('mousemove', (event, d) => {
                toolTip
                    .html(`<p>${d['key']}</p>`)
                    .style('visibility', 'visible')
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 40}px`);
            })
            .on('mouseout', (event, d) => {
                toolTip.style('visibility', 'hidden');
            });

        g.append("g")
            .attr("transform", `translate(100,${height})`)
            .call(d3.axisBottom(x));

        g.append("g")
            .attr("transform", `translate(100,0)`)
            .call(d3.axisLeft(y));




        function toggleSelection(d) {
            const active = poolValues[d] ? false : true; // Toggle state
            poolValues[d] = active;
            d3.selectAll(".layer")
                .style("fill", function (dLayer) {
                    return dLayer.key === d ? (active ? color(dLayer.index) : "#fff") : d3.select(this).style("fill");
                });
            toggleMiningPoolVisibility(poolValues);
        }

        const legend = svg.selectAll(".legend")
            .data(uniqueKeys)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(7,${i * 17 + 10})`)
            .style("font", "10px sans-serif")
            .style("cursor", "pointer")
            .on("click", function (event, d) {
                toggleSelection(d);

                d3.select(this).select("rect")
                    .style("stroke", poolValues[d] ? "black" : "none")
                    .style('filter', poolValues[d] ? 'drop-shadow(0px 2px 2px)' : 'drop-shadow(0px 0px 0px)')

            });

        legend.append("rect")
            .attr("x", 5)
            .attr("y", 10)
            .attr("width", 18)
            .attr("height", 10)
            .style("stroke", "black")
            .style("filter","drop-shadow(0px 2px 2px)")
            .style("fill", d => {
                return color(uniqueKeys.indexOf(d))
            });

        legend.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .attr("dy", ".35em")
            .text(d => d);

        // Button actions
        d3.select("#selectAll").on("click", () => {
            for (let d in poolValues) {
                poolValues[d] = false; // Set all to active
                toggleSelection(d);
            };
            svg.selectAll(".legend rect").style("stroke", "black")
                .style('filter', 'drop-shadow(0px 2px 2px)')

        });

        d3.select("#unselectAll").on("click", () => {

            for (let d in poolValues) {
                poolValues[d] = true; // Set all to inactive
                toggleSelection(d);
            };
            svg.selectAll(".legend rect").style("stroke", "none")
                .style('filter', 'drop-shadow(0px 0px 0px)')

        });





    });

}