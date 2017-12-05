/**
 * Created by dorbaruch on 11/26/17.
 */

LineChart = function(_parentElement, _disneyData) {

    this.parentElement = _parentElement;
    this.data = _disneyData;
    this.parseTime = d3.timeParse("%m/%d/%y");
    this.formatTime = d3.timeFormat("%m/%d/%y");


    this.parseData();
    this.initVis();
};

LineChart.prototype.parseData = function() {
    var vis = this;
    vis.data[0]["number"] = +vis.data[0]["number"];
    vis.data[0]["date"] = vis.parseTime(vis.data[0]["date"]);
    for(var i = 1; i < vis.data.length; i++) {
        vis.data[i]["number"] = +vis.data[i]["number"] + vis.data[i-1]["number"];
        vis.data[i]["date"] = vis.parseTime(vis.data[i]["date"]);
    }
};

LineChart.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 20, right: 80, bottom: 50, left: 10};

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = 460 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // define scales and axes
    vis.x = d3.scaleTime()
        .domain([d3.min(vis.data, function(d) { return d.date; }),
            d3.max(vis.data, function(d) { return d.date; })])
        .range([40, vis.width]);

    vis.y = d3.scaleLinear()
        .domain([0, d3.max(vis.data, function(d) { return d.number; })])
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .ticks(11)
        .tickFormat(vis.formatTime)
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    // draw the line chart
    vis.line = d3.line()
        .x(function(d) { return vis.x(d.date); })
        .y(function(d) { return vis.y(d.number); });

    vis.svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(vis.xAxis)
        .selectAll("text")
        .style("text-anchor", "middle");
        // .attr("transform", function(d) {
        //     return "rotate(40)"
        // });

    vis.svg.append("g")
        .attr("class", "axis y-axis")
        .attr("transform", "translate(" + 39 + ", 0)")
        .call(vis.yAxis);

    vis.svg.append("text")
        .attr("transform",
            "translate(" + (vis.width / 2 + 32) + " ," +
            (vis.height + vis.margin.top + 15) + ")")
        .style("text-anchor", "middle")
        .text("Date of rash onset");

    vis.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -10)
        .attr("x", -(vis.height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("No. of confirmed measles cases");

    // tooltip code
    var bisectDate = d3.bisector(function(d) { return d.date; }).left;

    // var lineSvg = vis.svg.append("g");

    var focus = vis.svg.append("g")
        .style("display", "none");
    //
    // lineSvg.append("path")
    //     .attr("class", "line")
    //     .attr("d", vis.line(vis.data));

    vis.svg.append("path")
        .datum(vis.data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", vis.line);

    // append the x line
    focus.append("line")
        .attr("class", "x")
        .style("stroke", "1D1F6C")
        .style("stroke-dasharray", "3,3")
        .attr("y1", 0)
        .attr("y2", vis.height);

    // place the value at the intersection
    focus.append("text")
        .attr("class", "y2")
        .attr("dx", 8)
        .attr("dy", "-.3em");

    // place the date at the intersection
    focus.append("text")
        .attr("class", "y4")
        .attr("dx", 8)
        .attr("dy", "1em");

    vis.svg.append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    var formatDate = d3.timeFormat("%d-%m-%Y");
    var formatNumber = d3.format(",");

    function mousemove() {
        var x0 = vis.x.invert(d3.mouse(this)[0]),
            i = bisectDate(vis.data, x0, 1),
            d0 = vis.data[i - 1],
            d1 = vis.data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        focus.select("text.y2")
            .attr("transform",
                "translate(" + vis.x(d.date) + "," +
                10 + ")")
            .text(formatNumber(d.number));

        focus.select("text.y4")
            .attr("transform",
                "translate(" + vis.x(d.date) + "," +
                11 + ")")
            .text(formatDate(d.date));

        focus.select(".x")
            .attr("transform",
                "translate(" + vis.x(d.date) + "," +
                0 + ")")
            .attr("y2", vis.height);
    }
};
