
/*
 * AgeVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data
 */

StateVac = function(_parentElement, _mmrData, _dtapData, _hepaData, _hepbData, _polioData, _policyData){
    this.parentElement = _parentElement;
    this.mmrData = _mmrData;
    this.dtapData = _dtapData;
    this.hepaData = _hepaData;
    this.hepbData = _hepbData;
    this.polioData = _polioData;
    this.policyData = _policyData;

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

StateVac.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 60, right: 20, bottom: 40, left: 60 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + (vis.margin.top) + ")");



    // Scales and axes
    vis.x = d3.scaleLinear()
        .range([0, vis.width]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x)
        .tickFormat(d3.format("d"))
        .ticks(5);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);


    // Append a path for the area function, so that it is later behind the brush overlay
    vis.linePath = vis.svg.append("path")
        .attr("class", "area area-age");

    // Define the D3 path generator
    vis.line = d3.line();

    vis.line.curve(d3.curveLinear);

    // Append circle on line chart
    vis.circle = vis.svg.append("circle")
        .attr("class", "circle")
        .attr("r", 4)
        .attr("fill", "red")
        .attr("stroke", "black");


    // Append axes
    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    // Axis titles
    vis.svg.append("text")
        .attr("x", -2 * vis.height/3)
        .attr("y", -30)
        .attr("transform", "rotate(270)")
        .text("Percentage");
    vis.svg.append("text")
        .attr("x", vis.width - 15)
        .attr("y", vis.height + 35)
        .text("Year");

    vis.title = vis.svg.append("text")
        .attr("class", "title")
        .attr("x", -20)
        .attr("y", -10);

    // process data
    vis.yearsnotHepA = [];
    var startYear = 1995;
    var endYear = 2016;

    for (i = startYear; i <= endYear; i++) {
        vis.yearsnotHepA.push(i);
    }

    vis.yearsHepA = [];
    var startYearHepA = 2002;

    for (i = startYearHepA; i <= endYear; i++) {
        vis.yearsHepA.push(i);
    }

    // initialize years
    vis.years = vis.yearsnotHepA;

    // initialize current state
    vis.currentState = "Massachusetts";

    // current data
    vis.data = vis.mmrData;

    // initialize current state
    vis.year = startYear;

    // initialize y domain
    vis.yDomain = [0, 100];

    // (Filter, aggregate, modify data)
    vis.wrangleData();
};



/*
 * Data wrangling
 */

StateVac.prototype.wrangleData = function(){

    var vis = this;

    vis.displayData = [];

    vis.years.forEach(function (year) {
        vis.displayData.push(vis.data[vis.currentState][year]);
    });

    // Update the visualization
    vis.updateVis();
};



/*
 * The drawing function
 */

StateVac.prototype.updateVis = function(){
    var vis = this;

    // Update domains
    vis.x.domain(d3.extent(vis.years));
    vis.y.domain(vis.yDomain);

    // Update title
    vis.title.text(vis.currentState + " Vaccination Rates");

    // Update recommendation
    //$("#policy-recommendation").html("<b> State Policy: </b>"+ vis.policyData[vis.currentState]["Details"]);


    // Call the area function and update the path
    // D3 uses each data point and passes it to the area function.
    // The area function translates the data into positions on the path in the SVG.
    vis.line
        .x(function(d,index) {
            return vis.x(vis.years[index]);
        })
        .y(function(d) {
            return vis.y(d);
        });

    vis.linePath
        .datum(vis.displayData)
        .transition()
        .attr("d", vis.line)
        .attr("stroke", "black")
        .attr("fill", "none");

    vis.circle
        .datum(vis.displayData)
        .transition()
        .attr("cx", function() {
            return vis.x(vis.year);
        })
        .attr("cy", function(d) {
            var index = vis.years.indexOf(vis.year);
            if (index >= 0) {
                return vis.y(d[index]);
            }
            else return vis.height;
        });



    // Call axis function with the new domain
    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);
};

StateVac.prototype.onSelectionChange = function(state, year, title){
    var vis = this;

    vis.currentState = state;
    vis.year = +year;

    var titleTexts = ["Measles, Mumps, and Rubella (MMR)", "Hepatitis A", "Hepatitis B", "Diphtheria toxoid, Tetanus toxoid, acellular Pertussis (DTaP)", "Polio"];
    var vacDatas = [vis.mmrData, vis.hepaData, vis.hepbData, vis.dtapData, vis.polioData];
    var index = titleTexts.indexOf(title);

    vis.data = vacDatas[index];

    if (index == 1) {
        vis.years = vis.yearsHepA;
    }
    else {
        vis.years = vis.yearsnotHepA;
    }

    vis.wrangleData();
};
