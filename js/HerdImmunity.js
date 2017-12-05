/**
 * Created by dorbaruch on 11/7/17.
 */


/*
 *  StationMap - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

HerdImmunity = function(_parentElement, _stateInfo) {

    this.parentElement = _parentElement;
    this.stateInfo = _stateInfo;
    this.curDisease = "Measles";
    this.curState = "Alabama";
    this.infectionRateVaccinated = 3;
    this.infectionRateNotVaccinated = 90;
    this.diseaseVaccinationsDict = {
        "Measles": "MMR",
        "Mumps": "MMR",
        "Polio": "Polio",
        "Pertusis": "DTaP3",
        "rubella": "MMR"
    };
    this.extension = null;
    if(this.parentElement.indexOf('good') !== -1) {
        this.extension = '-good';
    }
    else {
        this.extension = '-bad';
    }

    this.allStates = [];

    this.initVis();
};

HerdImmunity.prototype.parseStateInfo = function() {
    var vis = this;

    var oldData = this.stateInfo;
    this.stateInfo = {};
    for(var disease in vis.diseaseVaccinationsDict) {
        this.stateInfo[disease] = {};
    }
    for(var i = 1; i < oldData.length; i++) {
        var curState = oldData[i];
        vis.allStates.push(curState["state_name"]);
        for(var disease in vis.diseaseVaccinationsDict) {
            var vaccineName = vis.diseaseVaccinationsDict[disease];
            var vaccineRate = +(curState[vaccineName].substring(0, 4));
            this.stateInfo[disease][curState["state_name"]] = vaccineRate;
        }
    }
};

/*
 *  Initialize station map
 */

HerdImmunity.prototype.initVis = function() {
    var vis = this;

    // parse data
    this.parseStateInfo();

    // add select option per state, only in the 'good' vis
    if(vis.extension === '-good') {
        for(var i = 0; i < vis.allStates.length; i++) {
            var curState = vis.allStates[i];
            var newSelect = '<option value="' + curState + '">' + curState + '</option>';
            $('#state-select' + vis.extension).append(newSelect);
        }

        $('#state-select' + vis.extension).on("change", function() {
            vis.curState = $(this).val();
            vis.updateVis(true);
        });
    }
    else {
        $('#ukraine').on('click', function() {
            $('#ukraine').addClass('active');
            vis.updateVis(true);
        });
    }

    // $(".disease-button").on("click", function() {
    //     // deactivate active class on last clicked button
    //     $(".disease-button").each(function() {
    //         $(this).removeClass("active");
    //     });
    //     $(this).addClass("active");
    //     vis.curDisease = $(this).text();
    //     vis.updateVis();
    // });

    vis.margin = {top: 0, right: 30, bottom: 15, left: 0};

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = 460 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.updateVis(true);

    // bind repopulate button
    $('#repopulate-button' + vis.extension).on("click", function() {
       vis.updateVis(false);
    });
};

HerdImmunity.prototype.initPopulation = function() {
    var vis = this;
    var immunizationRate = $('#immunization-rate' + vis.extension).val() / 100;
    var vis = this;
    var rect_width = 22;
    var rect_height = 30;
    var rect;
    vis.population = [];
    vis.totalVaccinated = 0;
    vis.totalUnvaccinated = 0;
    vis.infectedVaccinated = 0;
    vis.infectedUnvaccinated = 0;
    for(var i = 20; i < vis.width; i+=rect_width - 8) {
        var rects_row = [];
        for(var j = 20; j < vis.height; j+= rect_height - 5) {
            // rect = vis.svg.append("rect")
            //     .attr("x", i)
            //     .attr("y", j)
            //     .attr("width", rect_width)
            //     .attr("height", rect_height)
            //     .attr("class", "unprocessed");
            //     if(Math.random() < immunizationRate) {
            //         rect.style("fill", "green");
            //     }
            //     else {
            //         rect.style("fill", "red");
            //     }

            rect = vis.svg.append("svg:image")
                .attr("x", i)
                .attr("y", j)
                .attr("width", rect_width)
                .attr("height", rect_height)
                .attr("class", "unprocessed");

            if(Math.random() < immunizationRate) {
                rect.style("fill", "green");
                rect.attr("xlink:href", "img/green_man.svg");
                vis.totalVaccinated += 1;
            }
            else {
                rect.style("fill", "red");
                rect.attr("xlink:href", "img/red_man.svg");
                vis.totalUnvaccinated += 1;
            }

            rect.on("mouseover", function(d) {
                    if(d3.select(this).style("fill") === "green" || d3.select(this).style("fill") === "red") {
                        d3.select(this).style("cursor", "pointer");
                    }
                });

            rects_row.push(rect);
        }
        vis.population.push(rects_row);
    }

    vis.totalPopulation = vis.totalVaccinated + vis.totalUnvaccinated;

    for(i = 0; i < vis.population.length; i++) {
        for(j = 0; j < vis.population[0].length; j++) {
            bindRun([i, j]);
        }
    }

    function bindRun(pos) {
        vis.population[pos[0]][pos[1]].on("click", function() {
            vis.startSimulation([pos[0], pos[1]]);
        });
    }

    vis.updateResults();
};

HerdImmunity.prototype.updateResults = function() {
    var vis = this;
    // if(total) {
    //     $("#total-population").text(vis.totalPopulation);
    //     $("#total-vaccinated").text(vis.totalVaccinated);
    //     $("#total-unvaccinated").text(vis.totalUnvaccinated);
    // }

    // $('#total-infected' + vis.extension).text(vis.infectedVaccinated + vis.infectedUnvaccinated);
    // $('#infected-vaccinated' + vis.extension).text(vis.infectedVaccinated);
    // $('#infected-unvaccinated' + vis.extension).text(vis.infectedUnvaccinated);
    if(vis.extension === '-bad') {
       // console.log(vis.totalPopulation);
    }
    $('#percent-infected' + vis.extension).text((((vis.infectedVaccinated + vis.infectedUnvaccinated) / vis.totalPopulation)
    * 100).toFixed(2));
    $('#percent-vaccinated-infected' + vis.extension).text(((vis.infectedVaccinated / vis.totalPopulation) * 100).toFixed(2));
    $('#percent-unvaccinated-infected' + vis.extension).text(((vis.infectedUnvaccinated / vis.totalPopulation) * 100).toFixed(2));
    if(vis.infectedVaccinated + vis.infectedUnvaccinated == 0) {
        $('#percent-of-infected-vaccinated' + vis.extension).text((0).toFixed(2));
    }
    else {
        $('#percent-of-infected-vaccinated' + vis.extension).text(((vis.infectedVaccinated / (vis.infectedVaccinated +
        vis.infectedUnvaccinated)) * 100).toFixed(2));
    }
};

HerdImmunity.prototype.startSimulation = function(startPos) {
    var vis = this;
    var rateVaccinated = $('#rate-vaccinated' + vis.extension).val() / 100;
    var rateNotVaccinated = $('#rate-not-vaccinated' + vis.extension).val() / 100;
    var startFlag = true;
    function iteratePopulation(curPos) {
        setTimeout(function () {
            if (curPos[0] >= 0 && curPos[0] < vis.population.length && curPos[1] >= 0
                && curPos[1] < vis.population[0].length) {
                var curRect = vis.population[curPos[0]][curPos[1]];
                // if(curRect.style("fill") !== "black" && curRect.attr("class") !== "processed") {
                if(curRect.style("fill") !== "black") {
                    curRect.attr("class", "processed");
                    if(curRect.style("fill") == "red") {
                        if(Math.random() < rateNotVaccinated || startFlag) {
                            curRect.style("fill", "black");
                            curRect.attr("xlink:href", "img/black_man.svg");
                            vis.infectedUnvaccinated += 1;
                            vis.updateResults();
                            recurse(curPos);
                        }
                    }
                    else if (curRect.style("fill") == "green") {
                        if(Math.random() < rateVaccinated || startFlag) {
                            curRect.style("fill", "black");
                            curRect.attr("xlink:href", "img/black_man.svg");
                            vis.infectedVaccinated += 1;
                            vis.updateResults();
                            recurse(curPos);
                        }
                    }
                }
            }
            if(startFlag) {
                startFlag = false;
            }
        }, 100);
    }

    function recurse(curPos) {
        iteratePopulation([curPos[0] + 1, curPos[1]]);
        iteratePopulation([curPos[0], curPos[1] + 1]);
        iteratePopulation([curPos[0] - 1, curPos[1]]);
        iteratePopulation([curPos[0], curPos[1] - 1]);
        iteratePopulation([curPos[0] - 1, curPos[1] - 1]);
        iteratePopulation([curPos[0] - 1, curPos[1] + 1]);
        iteratePopulation([curPos[0] + 1, curPos[1] - 1]);
        iteratePopulation([curPos[0] + 1, curPos[1] + 1]);
    }

    iteratePopulation(startPos);
};

/*
 *  Data wrangling
 */

HerdImmunity.prototype.wrangleData = function() {
    var vis = this;

    // Currently no data wrangling/filtering needed

    // Update the visualization
    vis.updateVis();
};


/*
 *  The drawing function
 */

HerdImmunity.prototype.updateVis = function(select) {
    var vis = this;

    // initialize input boxes
    if(select) {
        if(vis.extension === '-good') {
            var stateVaccination = vis.stateInfo[vis.curDisease][vis.curState];
            $('#immunization-rate' + vis.extension).val(stateVaccination.toString());
            $('#rate-vaccinated' + vis.extension).val(vis.infectionRateVaccinated);
            $('#rate-not-vaccinated' + vis.extension).val(vis.infectionRateNotVaccinated);
        }
        else {
            $('#immunization-rate' + vis.extension).val("42.4");
            $('#rate-vaccinated' + vis.extension).val(vis.infectionRateVaccinated);
            $('#rate-not-vaccinated' + vis.extension).val(vis.infectionRateNotVaccinated);
        }
    }
    else {
        if(vis.extension === '-bad') {
            $('#ukraine').removeClass('active');
        }
    }

    vis.initPopulation();
};



