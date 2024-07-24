const margin = { left: 5, right: 5, top: 5, bottom: 5 };

export function crossPoolingChart() {
    const svg = d3
        .select("#svgCrossPooling")
        .attr("width", 376)
        .attr("height", 300);

    const dimensions = svg.node().getBoundingClientRect();
    const width = dimensions.width;
    const height = dimensions.height;

    var chordSvg = d3
        .select("#svgCrossPooling")
        .append("svg")
        .attr("width", width)
        .attr("height", height + 100)
        .append("g")
        .attr(
            "transform",
            "translate(" + width / 2 + "," + (height + 25) / 2 + ")"
        )
        .style("margin", "0 auto");

    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;

    var chordTooltip = d3.select('body').append('div')
    .attr("id", "toolTip")
    .style('display', 'none');

    Promise.all([
        d3.csv("../assets/datasets/pool_hopping.csv", d3.autoType),
    ]).then((files) => {
        // Get input from different graph
        const startDate = new Date("2011-02-01");
        const endDate = new Date("2021-08-01");

        const csv = createPivotTable(files[0], startDate, endDate);
        var barData = createBarTable(files[0], startDate, endDate);
        var names = Object.keys(csv);
        const hop_data = [];
        const data = [];

        Object.values(csv).forEach((d) => {
            data.push(Object.values(d));
        });

        Object.keys(barData).forEach((d) => {
            let pool = {};
            pool[d] = { ...barData[d] };
            hop_data.push(pool);
        });

        drawChord(chordSvg, data, hop_data, names);
    });

    function drawChord(svg, data, hop_data, names) {
        const outerRadius = Math.min(width, height - 70) * 0.5 - 50;
        const innerRadius = outerRadius - 10;
        const tickStep = d3.tickStep(0, d3.sum(data.flat()), 100);
        const formatValue = d3.format(".1~%");
        const colors = [
            d3.schemeCategory10[4],
            d3.schemeCategory10[2],
            d3.schemeCategory10[1],
            d3.schemeCategory10[3],
            d3.schemeCategory10[5],
            d3.schemeCategory10[7],
            d3.schemeCategory10[8],
        ];
        const color = d3.scaleOrdinal(names, colors);

        const arcGenerator1 = d3
            .arc()
            .innerRadius(outerRadius + 5)
            .outerRadius(outerRadius + 10);

        const arcGenerator2 = d3
            .arc()
            .innerRadius(outerRadius + 12)
            .outerRadius(outerRadius + 17);

        const arcGenerator3 = d3
            .arc()
            .innerRadius(outerRadius + 19)
            .outerRadius(outerRadius + 24);

        const chord = d3
            .chord()
            .padAngle(5 / innerRadius)
            .sortSubgroups(d3.descending)
            .sortChords(d3.descending);

        const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

        const ribbon = d3
            .ribbon()
            .radius(innerRadius - 1)
            .padAngle(1 / innerRadius);

        const chords = chord(data);

        const group = svg.append("g").selectAll().data(chords.groups).join("g");

        const arcData1 = structuredClone(chords.groups);
        const arcData2 = structuredClone(chords.groups);
        const arcData3 = structuredClone(chords.groups);

        group
            .append("path")
            .attr("fill", (d) => color(d.index))
            .attr("d", arc);

        group
            .append("title")
            .text((d) => `${names[d.index]}\n${formatValue(d.value)}`);

        const groupTick = group
            .append("g")
            .selectAll()
            .data((d) => groupTicks(d, tickStep))
            .join("g")
            .attr(
                "transform",
                (d) =>
                    `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${
                        outerRadius + 25
                    },0)`
            );

        groupTick.append("line").attr("stroke", "currentColor").attr("x2", 6);

        groupTick
            .append("text")
            .attr("x", 8)
            .attr("dy", "0.35em")
            .attr("transform", (d) =>
                d.angle > Math.PI ? "rotate(180) translate(-16)" : null
            )
            .attr("text-anchor", (d) => (d.angle > Math.PI ? "end" : null));

        group
            .select("text")
            .attr("font-weight", "bold")
            .text(function (d) {
                return this.getAttribute("text-anchor") === "end"
                    ? `↑ ${names[d.index]}`
                    : `${names[d.index]} ↓`;
            });

        const chordDiag = svg
            .append("g")
            .attr("fill-opacity", 0.5)
            .selectAll("path")
            .data(chords)
            .join("path")
            .style("mix-blend-mode", "multiply")
            .attr(
                "id",
                (d) => `${names[d.source.index]}_${names[d.target.index]}`
            )
            .attr("fill", (d) => color(d.source.index))
            .attr("d", ribbon);

        chordDiag
            .on("mouseover", (e, d) => {
                chordTooltip.style("display", "block");
            })
            .on("mousemove", (e, d) => {
                d3.select(
                    "#" + names[d.source.index] + "_" + names[d.target.index]
                ).attr("fill-opacity", 0.9);

                chordTooltip
                    .html(
                        `<p>${d.source.value} ${names[d.target.index]} → ${
                            names[d.source.index]
                        } <br>${
                            d.source.index === d.target.index
                                ? ""
                                : `\n${d.target.value} ${
                                      names[d.source.index]
                                  } → ${names[d.target.index]}`
                        }</p>`
                    )
                    .style("left", e.pageX + 2 + "px")
                    .style("top", e.pageY - 60 + "px");
            })
            .on("mouseout", (e, d) => {
                d3.select(
                    "#" + names[d.source.index] + "_" + names[d.target.index]
                ).attr("fill-opacity", 0.5);
                chordTooltip.style("display", "none");
            });

        const arcs1 = svg
            .selectAll("mySlicesArc1")
            .data(arcData1, (d) => {
                let pool = Object.values(hop_data[d.index])[0];
                let ratio = pool["CROSS"] / d.value;
                let angleDiff = (d.endAngle - d.startAngle) * ratio;
                let ea = d.endAngle - d.startAngle;
                d.endAngle =
                    d.startAngle + angleDiff * 2 > ea
                        ? d.startAngle + angleDiff
                        : d.startAngle + angleDiff * 2;
            })
            .join("path")
            .attr("d", arcGenerator1)
            .attr("fill", (d) => color(d.index))
            .style("opacity", 0.8)
            .on("mouseover", (e, d) => {
                chordTooltip.style("display", "block");
            })
            .on("mousemove", (e, d) => {
                let pool = Object.values(hop_data[d.index])[0];
                chordTooltip
                    .html(
                        `<p><strong>${pool["Row Labels"]}</strong><br><p>NEW: ${pool["NEW"]} | HOP IN: ${pool["HOPPING IN"]} <br> DROP: ${pool["DROPOUT"]} | HOP OUT: ${pool["HOPPING OUT"]} <br> <strong>CROSS: ${pool["HOPPING OUT"]}</strong></p>`
                    )
                    .style("left", e.pageX + 2 + "px")
                    .style("top", e.pageY - 105 + "px")
                    .style("font-size", "12px");
            })
            .on("mouseout", (e, d) => {
                chordTooltip.style("display", "none");
            });

        const arcs2 = svg
            .selectAll("mySlicesArc1")
            .data(arcData2, (d) => {
                let pool = Object.values(hop_data[d.index])[0];
                let ratio = (pool["DROPOUT"] + pool["HOPPING OUT"]) / d.value;
                let angleDiff = (d.endAngle - d.startAngle) * ratio;
                d.endAngle = d.startAngle + angleDiff * 2;
            })
            .join("path")
            .attr("d", arcGenerator2)
            .attr("fill", (d) => color(d.index))
            .style("opacity", 0.8)
            .on("mouseover", (e, d) => {
                chordTooltip.style("display", "block");
            })
            .on("mousemove", (e, d) => {
                let pool = Object.values(hop_data[d.index])[0];
                chordTooltip
                    .html(
                        `<p><strong>${pool["Row Labels"]}</strong><br><p>NEW: ${pool["NEW"]} | HOP IN: ${pool["HOPPING IN"]} <br> <strong>DROP: ${pool["DROPOUT"]} | HOP OUT: ${pool["HOPPING OUT"]}</strong> <br> CROSS: ${pool["HOPPING OUT"]}</p>`
                    )
                    .style("left", e.pageX + 2 + "px")
                    .style("top", e.pageY - 105 + "px")
                    .style("font-size", "12px");
            })
            .on("mouseout", (e, d) => {
                chordTooltip.style("display", "none");
            });

        const arcs3 = svg
            .selectAll("mySlicesArc1")
            .data(arcData3, (d) => {
                let pool = Object.values(hop_data[d.index])[0];
                let ratio = (pool["NEW"] + pool["HOPPING IN"]) / d.value;
                let angleDiff = (d.endAngle - d.startAngle) * ratio;
                d.endAngle = d.startAngle + angleDiff * 2;
            })
            .join("path")
            .attr("d", arcGenerator3)
            .attr("fill", function (d) {
                return color(d.index);
            })
            .style("opacity", 0.8)
            .on("mouseover", (e, d) => {
                chordTooltip.style("display", "block");
            })
            .on("mousemove", (e, d) => {
                let pool = Object.values(hop_data[d.index])[0];
                chordTooltip
                    .html(
                        `<p><strong>${pool["Row Labels"]}</strong><br><p><strong>NEW: ${pool["NEW"]} | HOP IN: ${pool["HOPPING IN"]}</strong> <br> DROP: ${pool["DROPOUT"]} | HOP OUT: ${pool["HOPPING OUT"]} <br> CROSS: ${pool["HOPPING OUT"]}</p>`
                    )
                    .style("left", e.pageX + 2 + "px")
                    .style("top", e.pageY - 105 + "px")
                    .style("font-size", "12px");
            })
            .on("mouseout", (e, d) => {
                chordTooltip.style("display", "none");
            });
    }

    function groupTicks(d, step) {
        const k = (d.endAngle - d.startAngle) / d.value;
        return d3.range(0, d.value, step).map((value) => {
            return { value: value, angle: value * k + d.startAngle };
        });
    }

    function createPivotTable(data, startDate, endDate) {
        const filteredData = data.filter(
            (d) => new Date(d.date) >= startDate && new Date(d.date) <= endDate
        );

        const uniqueValues = new Set();
        //prettier-ignore
        var list = ["AntPool", "Binance Pool", "Foundry USA", "F2Pool", "Poolin", "SlushPool", "ViaBTC"];

        for (const obj of filteredData) {
            if (list.includes(obj["miner"])) {
                uniqueValues.add(obj["miner"]);
            }
        }

        const matrix = {};
        for (var item of uniqueValues) {
            var dict = {};
            uniqueValues.forEach((d) => {
                dict[d] = 0;
            });
            matrix[item] = dict;
        }

        for (let item of filteredData) {
            if (
                Array.from(uniqueValues).includes(item["miner"]) &&
                Array.from(uniqueValues).includes(item["to_miner"])
            ) {
                matrix[item["miner"]][item["to_miner"]] += item.value;
            } else if (
                Array.from(uniqueValues).includes(item["miner"]) &&
                item["to_miner"] === "SAME"
            ) {
                matrix[item["miner"]][item["miner"]] += item.value;
            }
        }

        return matrix;
    }

    function createBarTable(data, startDate, endDate) {
        const filteredData = data.filter(
            (d) => new Date(d.date) >= startDate && new Date(d.date) <= endDate
        );

        const uniqueValues = new Set();
        //prettier-ignore
        var list = ["AntPool", "Binance Pool", "Foundry USA", "F2Pool", "Poolin", "SlushPool", "ViaBTC"];
        // prettier-ignore
        var columns = [ "CROSS", "DROPOUT", "HOPPING IN", "HOPPING OUT", "NEW", "SAME"];

        for (const obj of filteredData) {
            if (list.includes(obj["miner"])) {
                uniqueValues.add(obj["miner"]);
            }
        }

        const matrix = {};
        for (var item of uniqueValues) {
            var dict = {};
            columns.forEach((d) => {
                dict[d] = 0;
                dict["Row Labels"] = item;
            });
            matrix[item] = dict;
        }

        for (let item of filteredData) {
            if (
                Array.from(uniqueValues).includes(item["miner"]) &&
                Array.from(columns).includes(item["to_miner"])
            ) {
                matrix[item["miner"]][item["to_miner"]] += item.value;
            }
        }

        return matrix;
    }
}