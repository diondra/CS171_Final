width = $("#cover").width();
height = 500;

var svg = d3.select("#cover").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("svg:image")
    .attr("x", 0)
    .attr("y", 0)
    .attr("class", "try")
    .attr("xlink:href", "img/superhero-kid.jpg");

svg.append("text")
    .text("The Power of Vaccination")
    .attr("x", width/2)
    .attr("text-anchor", "middle")
    .attr("y", height/3 - 40)
    .attr("fill", "black");


// Variables for the visualization instance
var herdImmunity;
var mapVis;
var stateVac;

var usaJson;
var mmrData = new Object();
var mmrPolicy = new Object;
var dtapData = new Object();
var hepaData = new Object();
var hepbData = new Object();
var polioData = new Object();
var vacObjects = [mmrData, dtapData, hepbData, polioData, hepaData];

// Start application by loading the data
loadData();

d3.queue()
    .defer(d3.csv,"data/contagious-diseases/disease_cases/measles.csv")
    .defer(d3.csv,"data/contagious-diseases/disease_cases/mumps.csv")
    .defer(d3.csv,"data/contagious-diseases/disease_cases/pertussis.csv")
    .defer(d3.csv,"data/contagious-diseases/disease_cases/rubella.csv")
    .defer(d3.csv,"data/vaccination/cdc.csv")
    .await(createChart1);

var measlesData = [];
var mumpsData = [];
var rubellaData = [];
var pertussisData = [];

var MMRVaccination = [];
var pertussisVaccination = [];
var mumpsVaccination = [];
var measlesVaccination = [];
var rubellaVaccination = [];


var parseTime = d3.timeParse("%Y%U");

var parseYear = d3.timeParse("%Y");

function loadData() {
    queue()
        .defer(d3.json, "data/us-states.json")
        .defer(d3.csv, "data/vaccination/mmr_19_35_months.csv")
        .defer(d3.csv, "data/vaccination/mmr_state_policy.csv")
        .defer(d3.csv, "data/vaccination/dtap_19_35_months.csv")
        .defer(d3.csv, "data/vaccination/hepa_19_35_months.csv")
        .defer(d3.csv, "data/vaccination/hepb_19_35_months.csv")
        .defer(d3.csv, "data/vaccination/polio_19_35_months.csv")
        .await(function(error, mapJson, mmrCsv, mmrPolicyCsv, dtapCsv, hepaCsv, hepbCsv, polioCsv) {
            if (error) return console.error(error);

            // process data
            var years = [];
            var yearsHepA = [];
            var startYear = 1995;
            var startYearHepA = 2002;
            var endYear = 2016;

            for (i = startYear; i <= endYear; i++) {
                years.push(i);
            }

            for (i = startYearHepA; i <= endYear; i++) {
                yearsHepA.push(i);
            }

            // convert numeric values into numbers
            var vacCsvs = [mmrCsv, dtapCsv, hepbCsv, polioCsv];

            vacCsvs.forEach(function(vacCsv) {
                vacCsv.forEach(function(region) {
                    years.forEach(function(year) {
                        region[year] = +region[year];

                        if (isNaN(region[year])) {
                            region[year] = null;
                        }
                    });
                });
            });

            // Hep A done separately because different start year
            hepaCsv.forEach(function(region) {
                yearsHepA.forEach(function(year) {
                    region[year] = +region[year];

                    if (isNaN(region[year])) {
                        region[year] = null;
                    }
                });
            });

            // add hepaCsv to vacCsvs
            vacCsvs.push(hepaCsv);

            // new objects for vaccination data with regions as indices
            vacCsvs.forEach(function(vacCsv, index) {
                vacCsv.forEach(function(d) {
                    vacObjects[index][d.Names] = d;
                })
            });

            usaJson = mapJson;

            mmrPolicyCsv.forEach(function(d) {
                mmrPolicy[d.State] = d;
            });

            // vacObjects.forEach(function(vacObject) {
            // });


            createVis();
        });
}

var mapEventHandler = {};

function createVis() {
    // event handlers
    $(mapEventHandler).bind("stateSelected", function(event, state, year, title){
        stateVac.onSelectionChange(state, year, title);
    });

    mapVis = new MapVis("map-vis", usaJson, mmrData, dtapData, hepaData, hepbData, polioData, mapEventHandler);
    stateVac = new StateVac("state-vac", mmrData, dtapData, hepaData, hepbData, polioData, mmrPolicy);
}

// Map Vis Interactivity
function changeSlider() {
    mapVis.changeSlider();
}

function stopSlider() {
    mapVis.stopSlider();
}

function playSlider() {
    mapVis.yearAdvance();
}

function changeVac() {
    mapVis.changeVac();
}

// Variable for the visualization instance
var herdImmunityGood;
var herdImmunityBad;
var lineChart;

// Start application by loading the data
loadDisneyData();
createHerdVis();


function loadDisneyData() {
    d3.csv("data/disney_data.csv", function(data) {
        createLineChartVis(data);
    });
}

function createHerdVis() {
    d3.csv("data/state_info.csv", function(data) {
        herdImmunityGood = new HerdImmunity("herd-vis-good", data);
        herdImmunityBad = new HerdImmunity("herd-vis-bad", data);
    });
}

function createLineChartVis(disneyData) {
    lineChart = new LineChart("line-chart", disneyData);
}

function createChart1(error, measles, mumps, pertussis, rubella, vaccination) {
    vaccination.forEach(function(d) {
        MMRVaccination.push({"year": +d.Year, "percentage": +d.MMR});
        pertussisVaccination.push({"year": +d.Year, "percentage": +d["DTP 3+"]});
    });

    measlesVaccination = MMRVaccination;
    rubellaVaccination = MMRVaccination;
    mumpsVaccination = MMRVaccination;

    measlesVaccination = measlesVaccination.filter(function(d) {
        return d.percentage !== 0 && d.year >= 1966 &&  d.year <= 2002;
    });

    console.log();

    measles.forEach(function(d) {
        d.cases = +d.cases;
        d.incidence_per_capita = +d.incidence_per_capita;
    });

    measles.reduce(function(index, value) {
        if(!index[value.week]) {
            index[value.week] = {
                "week" : value.week,
                "cases": 0,
                "incidence_per_capita": 0
            };
            measlesData.push(index[value.week])
        }
        index[value.week].cases += value.cases;
        index[value.week].incidence_per_capita += value.incidence_per_capita;
        return index;
    }, {});

    measlesData.forEach(function(d) {
        d.week = parseTime(d.week);
    });

    measlesData = measlesData.filter(function(d) {
        return d.week > parseTime("196701");
    });

    mumpsVaccination = mumpsVaccination.filter(function(d) {
        return d.percentage !== 0 && d.year >= 1968 && d.year <= 2002;
    });


    mumps.forEach(function(d) {
        d.cases = +d.cases;
        d.incidence_per_capita = +d.incidence_per_capita;
    });

    mumps.reduce(function(index, value) {
        if(!index[value.week]) {
            index[value.week] = {
                "week" : value.week,
                "cases": 0,
                "incidence_per_capita": 0
            };
            mumpsData.push(index[value.week])
        }
        index[value.week].cases += value.cases;
        index[value.week].incidence_per_capita += value.incidence_per_capita;
        return index;
    }, {});

    mumpsData.forEach(function(d) {
        d.week = parseTime(d.week);
    });

    rubellaVaccination = rubellaVaccination.filter(function(d) {
        return d.percentage !== 0 && d.year >= 1966 && d.year <= 2002;
    });

    rubella.forEach(function(d) {
        d.cases = +d.cases;
        d.incidence_per_capita = +d.incidence_per_capita;
    });

    rubella.reduce(function(index, value) {
        if(!index[value.week]) {
            index[value.week] = {
                "week" : value.week,
                "cases": 0,
                "incidence_per_capita": 0
            };
            rubellaData.push(index[value.week])
        }
        index[value.week].cases += value.cases;
        index[value.week].incidence_per_capita += value.incidence_per_capita;
        return index;
    }, {});

    rubellaData.forEach(function(d) {
        d.week = parseTime(d.week);
    });

    pertussisVaccination = pertussisVaccination.filter(function(d) {
        return d.percentage !== 0 && d.year >= 1974;
    });

    pertussis.forEach(function(d) {
        d.cases = +d.cases;
        d.incidence_per_capita = +d.incidence_per_capita;
    });

    pertussis.reduce(function(index, value) {
        if(!index[value.week]) {
            index[value.week] = {
                "week" : value.week,
                "cases": 0,
                "incidence_per_capita": 0
            };
            pertussisData.push(index[value.week])
        }
        index[value.week].cases += value.cases;
        index[value.week].incidence_per_capita += value.incidence_per_capita;
        return index;
    }, {});

    pertussisData.forEach(function(d) {
        d.week = parseTime(d.week);
    });

    pertussisData = pertussisData.filter(function(d) {
        return d.week > parseTime("196201");
    });

    var margin = {top: 30, right: 50, bottom: 70, left: 70};

    var width = 1000 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var svg = d3.select("#chart1").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var minDate = d3.min(measlesData, function(d) {
        return d.week;
    });

    var maxDate = d3.max(measlesData, function(d) {
        return d.week;
    });

    var minCases = d3.min(measlesData, function(d) {
        return d.cases;
    });

    var maxCases = d3.max(measlesData, function(d) {
        return d.cases;
    });

    var caseScale = d3.scaleLinear()
        .domain([minCases, maxCases])
        .range([height, 0]);

    var dateScale = d3.scaleTime()
        .domain([minDate, maxDate])
        .range([0, width]);

    var area = d3.area()
        .x(function(d) {
            return dateScale(d.week);
        })
        .y0(height)
        .y1(function(d) {
            return caseScale(d.cases);
        });

    svg.append("path")
        .datum(measlesData)
        .attr("class", "area")
        .attr("d", area);

    var formatTime = d3.timeFormat("%Y");

    var xAxis = d3.axisBottom()
        .scale(dateScale)
        .tickFormat(formatTime)
        .ticks(25);

    var yAxisCase = d3.axisLeft()
        .scale(caseScale)
        .ticks(10);

    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-12")
        .attr("dy", "1")
        .attr("transform", "rotate(-65)");

    svg.append("g")
        .attr("class", "axis y-axis case-axis")
        .call(yAxisCase);

    var percentageScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    var line = d3.line()
        .x(function(d) {
            return dateScale(parseYear(d.year));
        })
        .y(function(d) {
            return percentageScale(d.percentage);
        });

    svg.append("path")
        .datum(measlesVaccination)
        .attr("class", "line")
        .attr("d", line);

    var yAxisVaccination = d3.axisRight()
        .scale(percentageScale)
        .ticks(10)
        .tickFormat(function(d) {
            return d + "%";
        });

    svg.append("g")
        .attr("class", "axis y-axis vaccination-axis")
        .attr("transform", "translate(" + width + ",0)")
        .call(yAxisVaccination);

    svg.append("text")
        .text("Cases")
        .attr("class", "label")
        .attr("x", -29)
        .attr("y", -10);

    svg.append("text")
        .text("Vaccination Rate")
        .attr("class", "label")
        .attr("x", width - 58)
        .attr("y", -10);

    function initVis(data, vaccination) {

        var minDate = d3.min(data, function(d) {
            return d.week;
        });

        var maxDate = d3.max(data, function(d) {
            return d.week;
        });

        var minCases = d3.min(data, function(d) {
            return d.cases;
        });

        var maxCases = d3.max(data, function(d) {
            return d.cases;
        });

        var caseScale = d3.scaleLinear()
            .domain([minCases, maxCases])
            .range([height, 0]);

        var dateScale = d3.scaleTime()
            .domain([minDate, maxDate])
            .range([0, width]);

        var area = d3.area()
            .x(function(d) {
                return dateScale(d.week);
            })
            .y0(height)
            .y1(function(d) {
                return caseScale(d.cases);
            });

        svg.select(".area")
            .datum(data)
            .transition()
            .duration(800)
            .attr("d", area);

        var xAxis = d3.axisBottom()
            .scale(dateScale)
            .tickFormat(formatTime)
            .ticks(25);

        svg.select(".axis.x-axis")
            .transition()
            .duration(800)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-12")
            .attr("dy", "1")
            .attr("transform", "rotate(-65)");

        var yAxisCase = d3.axisLeft()
            .scale(caseScale)
            .ticks(10);

        svg.select(".axis.y-axis.case-axis")
            .transition()
            .duration(800)
            .call(yAxisCase);

        var percentageScale = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        var line = d3.line()
            .x(function(d) {
                return dateScale(parseYear(d.year));
            })
            .y(function(d) {
                return percentageScale(d.percentage);
            });

        svg.select(".line")
            .datum(vaccination)
            .transition()
            .duration(800)
            .attr("d", line);
    }

    d3.select("#disease-type").on("change", function() {
        var disease = d3.select("#disease-type").property("value");
        if (disease == "MEASLES") {
            initVis(measlesData, measlesVaccination);
        } else if (disease == "MUMPS") {
            initVis(mumpsData, mumpsVaccination);
        } else if (disease == "RUBELLA") {
            initVis(rubellaData, rubellaVaccination);
        } else {
            initVis(pertussisData, pertussisVaccination);
        }

    });

}
