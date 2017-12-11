width = $("#cover").width();
height = $( window ).height();

var svg = d3.select("#cover").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("svg:image")
    .attr("x", 0)
    .attr("y", 0)
    .attr("class", "try")
    .attr("xlink:href", "img/red-triangles.jpg");

svg.append("text")
    .attr("class", "title-text")
    .text("The Truth about Vaccinations")
    .attr("x", width/2)
    .attr("text-anchor", "middle")
    .attr("y", height/2)
    .attr("fill", "black");

// change all fullscreen divs
$(".fullscreen").css("height", height);


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

var info = {
    "MEASLES" : "<b>Measles</b></br></br>Measles is a highly contagious, serious disease caused by a virus. Before the introduction of measles vaccine in 1963 and widespread vaccination, major epidemics occurred approximately every 2–3 years and measles caused an estimated 2.6 million deaths each year. The disease remains one of the leading causes of death among young children globally, despite the availability of a safe and effective vaccine. Measles is caused by a virus in the paramyxovirus family and it is normally passed through direct contact and through the air. The virus infects the respiratory tract , then spreads throughout the body.</br></br> Source: https://www.cdc.gov/measles/about/index.html",
    "MUMPS" : "<b>Mumps</b></br></br>Mumps is a contagious disease that is caused by a virus. Mumps typically starts with fever, headache, muscle aches, tiredness, and loss of appetite. Then, most people will have swelling of their salivary glands. This is what causes the puffy cheeks and a tender, swollen jaw. Mumps likely spreads before the salivary glands begin to swell and up to five days after the swelling begins. Before the U.S. mumps vaccination program started in 1967, mumps was a universal disease of childhood. Since the pre-vaccine era, there has been a more than 99% decrease in mumps cases in the United States. </br></br> Source: https://www.cdc.gov/mumps/about/index.html",
    "RUBELLA" : "<b>Rubella</b></br></br>Rubella is a contagious disease caused by a virus. It is also called German measles, but it is caused by a different virus than measles. Most people who get rubella usually have mild illness, with symptoms that can include a low-grade fever, sore throat, and a rash that starts on the face and spreads to the rest of the body. Some people may also have a headache, pink eye, and general discomfort before the rash appears. Rubella can cause a miscarriage or serious birth defects in an unborn baby if a woman is infected while she is pregnant. </br></br> Source: https://www.cdc.gov/mumps/about/index.html",
    "PERTUSSIS" : "<b>Pertussis</b></br></br>Pertussis, a respiratory illness commonly known as whooping cough, is a very contagious disease caused by a type of bacteria called Bordetella pertussis. These bacteria attach to the cilia (tiny, hair-like extensions) that line part of the upper respiratory system. The bacteria release toxins (poisons), which damage the cilia and cause airways to swell. People with pertussis usually spread the disease to another person by coughing or sneezing or when spending a lot of time near one another where you share breathing space. Infected people are most contagious up to about 2 weeks after the cough begins.  </br></br> Source: https://www.cdc.gov/pertussis/about/index.html"
};


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

    mapVis = new MapVis("map-vis", usaJson, mmrData, dtapData, hepbData, polioData, mapEventHandler);
    stateVac = new StateVac("state-vac", mmrData, dtapData, hepbData, polioData, mmrPolicy);
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

    console.log(pertussisVaccination);
    console.log(pertussisData);

    var margin = {top: 30, right: 50, bottom: 70, left: 70};

    var width = width = $("#chart1").width() - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

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

    var tool_tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-8, 0])
        .html(function(d) { return d.percentage + "%"; });

    svg.append("g")
        .attr("class", "tooltips")
        .call(tool_tip);

    var circles = svg.selectAll("circle")
        .data(measlesVaccination);

    circles.enter().append("circle")
        .merge(circles)
        .attr("cx", function(d) { return dateScale(parseYear(d.year)); })
        .attr("cy", function(d) { return percentageScale(d.percentage); })
        .attr("class", "tooltip-circle")
        .attr("r", "4")
        .on('mouseover', tool_tip.show)
        .on('mouseout', tool_tip.hide);

    circles.exit().remove();

    svg.append("g")
        .attr("class", "axis y-axis vaccination-axis")
        .attr("transform", "translate(" + width + ",0)")
        .call(yAxisVaccination);

    svg.append("text")
        .text("Cases")
        .attr("class", "label")
        .attr("x", -29)
        .attr("y", -10)
        .style("fill", "#931a12");

    svg.append("text")
        .text("Vaccination Rate")
        .attr("class", "label")
        .attr("x", width - 58)
        .attr("y", -10)
        .style("fill", "#185cb4");

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

        var tool_tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-8, 0])
            .html(function(d) { return d.percentage + "%"; });

        svg.select(".tooltips")
            .call(tool_tip);

        var circles = svg.selectAll("circle")
            .data(vaccination);

        circles.enter().append("circle")
            .merge(circles)
            .on('mouseover', tool_tip.show)
            .on('mouseout', tool_tip.hide)
            .transition()
            .duration(800)
            .attr("cx", function(d) { return dateScale(parseYear(d.year)); })
            .attr("cy", function(d) { return percentageScale(d.percentage); })
            .attr("class", "tooltip-circle")
            .attr("r", "4");

        circles.exit().remove();

    }

    function updateInfo(dis) {
        document.getElementById("disease-info").innerHTML = info[dis];
    }

    d3.select("#disease-type").on("change", function() {
        var disease = d3.select("#disease-type").property("value");
        if (disease == "MEASLES") {
            initVis(measlesData, measlesVaccination);
            updateInfo(disease);
        } else if (disease == "MUMPS") {
            initVis(mumpsData, mumpsVaccination);
            updateInfo(disease);
        } else if (disease == "RUBELLA") {
            initVis(rubellaData, rubellaVaccination);
            updateInfo(disease);
        } else {
            initVis(pertussisData, pertussisVaccination);
            updateInfo(disease);
        }

    });

}
