
/*
 *  MapVis - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _mapData            -- Data of map json
 *  @param _mmrData            -- Data of state-specific MMR vaccination information
 *  @param _dtapData            -- Data of state-specific DTaP vaccination information
 *  @param _hepaData            -- Data of state-specific Hep A vaccination information
 *  @param _hepbData            -- Data of state-specific Hep B vaccination information
 *  @param _polioData            -- Data of state-specific Polio vaccination information
 *  @param _handler            -- Event handler
 */

MapVis = function(_parentElement, _mapData, _mmrData, _dtapData, _hepbData, _polioData, _handler) {

	this.parentElement = _parentElement;
	this.mapData = _mapData;
	this.mmrData = _mmrData;
	this.dtapData = _dtapData;
	this.hepbData = _hepbData;
	this.polioData = _polioData;
	this.handler = _handler;
    this.startingYear = 1995;
    this.curYear = this.startingYear;
    this.endYear = 2016;
    this.currentState = "Massachusetts";

	this.initVis();
}


/*
 *  Initialize station map
 */

MapVis.prototype.initVis = function() {
	var vis = this;

	// intialize svg
    vis.margin = { top: 100, right: 0, bottom: 60, left: 60 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // colors for choropleth from color brewer (green single hue 8-class scale)
    vis.green_colors = ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#005a32'];

    vis.fillScale = d3.scaleQuantize()
        .domain([82.5, 100])
        .range(vis.green_colors);

    // highest data value
    // vis.legend_values = [82.5,85,87.5,90,92.5,95,97.5];

    // initialize map projection/path
    vis.projection = d3.geoAlbersUsa()
        .scale(4 * vis.width / 3)
        .translate([vis.width / 2, vis.height / 2]);

    vis.path = d3.geoPath()
        .projection(vis.projection);

    // current vac data
    vis.vacData = vis.mmrData;

    //
    vis.titleTexts = new Object();

    // make legend
    vis.svg.append("g")
        .attr("class", "legend")
        .selectAll("rect")
        .data(vis.green_colors)
        .enter().append("rect")
        .attr("x", function(d, index) {
            return index * 15 + 7 * vis.width/12;
        })
        .attr("y", vis.height + vis.margin.bottom / 2)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", function(d) {
            return d;
        })
        .attr("stroke", "black");

    // labels/titles
    vis.svg.append("text")
        .attr("class", "label")
        .text("82.5%")
        .attr("x", -5 + 7 * vis.width/12)
        .attr("y", vis.height + vis.margin.bottom/2 + 10)
        .attr("text-anchor", "end");

    vis.svg.append("text")
        .attr("class", "label")
        .text("100%")
        .attr("x", function() {
            return (vis.green_colors.length * 15 + 5 + 7 * vis.width/12);
        })
        .attr("y", vis.height + vis.margin.bottom/2 + 10)
        .attr("text-anchor", "start");

    vis.titleText = "Measles, Mumps, and Rubella (MMR)";

    vis.title = vis.svg.append("text")
        .attr("class", "title")
        .attr("x", -5)
        .attr("y", -vis.margin.top + 20);


    // render USA using a path generator
    vis.usaMap = vis.svg.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(vis.mapData.features)
        .enter().append("path")
        .attr("d", vis.path)
        .attr("stroke", "black")
        .attr("class", "states")
        .on("click", function(d){
            var state = d.properties.name;
            vis.currentState = state;
            $(vis.handler).trigger("stateSelected", [vis.currentState, vis.curYear, vis.titleText]);
        })
        .on("mouseover", function(d) {
            d3.select(this).style("fill", "yellow");
        })
        .on("mouseout", function(d) {
            d3.select(this).style("fill", function(d) {
                var state = d.properties.name;
                var rate = vis.vacData[state][vis.curYear];
                return vis.fillScale(rate);
            });
        })
        .attr("fill", function(d) {
            var state = d.properties.name;
            var rate = vis.vacData[state][vis.curYear];
            return vis.fillScale(rate);
        });

    vis.wrangleData();
};

/*
 *  Data wrangling
 */

MapVis.prototype.wrangleData = function() {
	var vis = this;

	// Currently no data wrangling/filtering needed
	// vis.displayData = vis.data;

    vis.yearAdvance();
};

/*
 *  The drawing function
 */

MapVis.prototype.updateVis = function() {
    var vis = this;

    // update line graph via handler
    $(vis.handler).trigger("stateSelected", [vis.currentState, vis.curYear, vis.titleText]);

    // update slider
    vis.updateSlider();

    // update title
    vis.title.text(vis.titleText);

    // change map coloring based on selection
    vis.usaMap
        .transition()
        .duration(400)
        .style("fill", function(d) {
            var state = d.properties.name;
            var rate = vis.vacData[state][vis.curYear];
            return vis.fillScale(rate);
        });

};

MapVis.prototype.yearAdvance = function(restart) {
    var vis = this;
    if(restart == true) {
        console.log("true");
        vis.curYear = vis.startingYear;
    }
    else {
        console.log("false")
        vis.curYear;
    }
    // Update the visualization
    vis.interval = setInterval(function() {
        if(vis.curYear <= vis.endYear) {
            vis.updateVis();
            vis.curYear += 1;
        }
        else {
            vis.curYear = vis.startingYear;
            vis.updateVis();
            return;
        }
    }, 1200);
};

MapVis.prototype.changeSlider = function() {
    var vis = this;

    // stop changing map
    clearInterval(vis.interval);

    // change slider value
    range.value = d3.select("#map-slider").property("value");

    // update visualization
    vis.curYear = d3.select("#map-slider").property("value");
    vis.updateVis();
};

MapVis.prototype.updateSlider = function() {
    var vis = this;

    // change slider value
    $("#map-slider").val(vis.curYear);
    range.value = d3.select("#map-slider").property("value");
};

MapVis.prototype.stopSlider = function() {
    var vis = this;

    clearInterval(vis.interval);
};

MapVis.prototype.changeVac = function() {
    var vis = this;

    var vacData = d3.select("#vaccination-type").property("value");
    var vacDatasStrings = ["vis.mmrData", "vis.hepbData", "vis.dtapData", "vis.polioData"];
    var vacDatas = [vis.mmrData, vis.hepbData, vis.dtapData, vis.polioData];
    var titleTexts = ["Measles, Mumps, and Rubella (MMR)", "Hepatitis B", "Diphtheria toxoid, Tetanus toxoid, acellular Pertussis (DTaP)", "Polio"];
    var index = vacDatasStrings.indexOf(vacData);

    vis.titleText = titleTexts[index];
    vis.vacData = vacDatas[index];

    vis.stopSlider();

    vis.yearAdvance(true);

}




