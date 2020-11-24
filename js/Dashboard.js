queue()
    .defer(d3.csv, "data.csv")
    .await(makeGraphs);



    /*var map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([51.5, -0.09]).addTo(map)
        .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        .openPopup();
    */
function makeGraphs(error, apiData) {
	
//Start Transformations
	var dataSet = apiData;
	console.log(dataSet);
	var dateFormat = d3.time.format("%m/%d/%Y");
	dataSet.forEach(function(d) {
		d.Date_of_offence = dateFormat.parse(d.Date_of_offence);
				d.Date_of_offence.setDate(1);
		d.Total_Fatalities = +d.Total_Fatalities;
        d.Longitude = +d.Longitude;
        d.Latitude = +d.Latitude;
	});


	//Create a Crossfilter instance
	var ndx = crossfilter(dataSet);

	//Define Dimensions
	var date_of_offence_ = ndx.dimension(function(d) { return d.Date_of_offence; });
	var police_station_ = ndx.dimension(function(d) { return d.Police_station; });
	var type_of_collision_ = ndx.dimension(function(d) { return d.Type_of_collision; });
	var intersection_mid_block_ = ndx.dimension(function(d) { return d.Intersection_mid_block; });
	var hit_and_run_ = ndx.dimension(function(d) { return d.Hit_and_run; });
	var maneuver_type_ = ndx.dimension(function(d) { return d.Maneuver_type; });
	var total_Fatalities_  = ndx.dimension(function(d) { return d.Total_Fatalities; });
    var allDim = ndx.dimension(function(d) {return d;});


	//Calculate metrics
	var projectsByDate = date_of_offence_.group(); 
	var projectsByPoliceStation = police_station_.group(); 
	var projectsByCollisionType = type_of_collision_.group();
	var projectsByIntersectionStatus = intersection_mid_block_.group();
	var hitAndRunGroup = hit_and_run_.group();
	var projectsByManeuverType = maneuver_type_.group();
	

	var all = ndx.groupAll();

	//Calculate Groups
	var totalfatalitiesManeuver = maneuver_type_.group().reduceSum(function(d) {
		return d.Total_Fatalities;
	});

	var totalfatalitiespolice = police_station_.group().reduceSum(function(d) {
		return d.Police_station;
	});

	var totalfatalitiesIntersection = intersection_mid_block_.group().reduceSum(function(d) {
		return d.Intersection_mid_block;
	});



	var netTotalFatalities = ndx.groupAll().reduceSum(function(d) {return d.Total_Fatalities;});

	//Define threshold values for data
	var minDate = date_of_offence_.bottom(1)[0].Date_of_offence;
	var maxDate = date_of_offence_.top(1)[0].Date_of_offence;

console.log(minDate);
console.log(maxDate);

    //Charts
	var dateChart = dc.lineChart("#date-chart");
	var policeStationChart = dc.rowChart("#policeStation-chart");
	var collisionTypeChart = dc.rowChart("#collisionType-chart");
	var intersectionChart = dc.pieChart("#intersection-chart");
	var hitAndRunChart = dc.rowChart("#hitAndRun-chart");
	var totalProjects = dc.numberDisplay("#total-projects");
	var netFatalities = dc.numberDisplay("#net-Fatalities");
	var maneuverFatalities = dc.barChart("#maneuver-Fatalities");


  selectField = dc.selectMenu('#menuselect')
        .dimension(police_station_)
        .group(projectsByPoliceStation); 

       dc.dataCount("#row-selection")
        .dimension(ndx)
        .group(all);


	totalProjects
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);

	netFatalities
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(netTotalFatalities)
		.formatNumber(d3.format(".3s"));

	dateChart
		//.width(600)
		.height(220)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(date_of_offence_)
		.group(projectsByDate)
		.renderArea(true)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.renderHorizontalGridLines(true)
    	.renderVerticalGridLines(true)
		.xAxisLabel("Year")
		.yAxis().ticks(6);

	collisionTypeChart
        //.width(300)
        .height(220)
        .dimension(type_of_collision_)
        .group(projectsByCollisionType)
        .elasticX(true)
        .xAxis().ticks(5);

	hitAndRunChart
		//.width(300)
		.height(220)
        .dimension(hit_and_run_)
        .group(hitAndRunGroup)
        .xAxis().ticks(4);

	policeStationChart
		//.width(300)
		.height(220)
        .dimension(police_station_)
        .group(projectsByPoliceStation)
        .xAxis().ticks(4);

  
          intersectionChart
            .height(220)
            //.width(350)
            .radius(90)
            .innerRadius(40)
            .transitionDuration(1000)
            .dimension(intersection_mid_block_)
            .group(projectsByIntersectionStatus);


    maneuverFatalities
    	//.width(800)
        .height(220)
        .transitionDuration(1000)
        .dimension(maneuver_type_)
        .group(totalfatalitiesManeuver)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .centerBar(false)
        .gap(5)
        .elasticY(true)
        .x(d3.scale.ordinal().domain(maneuver_type_))
        .xUnits(dc.units.ordinal)
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .ordering(function(d){return d.value;})
        .yAxis().tickFormat(d3.format("s"));

    dc.renderAll();



 // Set up initial map center and zoom level
  var map = L.map('map', {
    center: [32.57, 72.69], // EDIT latitude, longitude to re-center map
    zoom: 9,  // EDIT from 1 to 18 -- decrease to zoom out, increase to zoom in
    scrollWheelZoom: true
  });

  /* Control panel to display map layers */
  var controlLayers = L.control.layers( null, null, {
    position: "topright",
    collapsed: true
  }).addTo(map);

  // display Carto basemap tiles with light features and labels
  var light = L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
                { attribution: 'LSCE &copy; 2016 | Baselayer &copy; ArcGis' }).addTo(map);  // EDIT - insert or remove ".addTo(map)" before last semicolon to display by default
  controlLayers.addBaseLayer(light, 'Carto Light basemap');

  /* Stamen colored terrain basemap tiles with labels */
  var terrain = L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
  }); // EDIT - insert or remove ".addTo(map)" before last semicolon to display by default
  controlLayers.addBaseLayer(terrain, 'Stamen Terrain basemap');

  // see more basemap options at https://leaflet-extras.github.io/leaflet-providers/preview/

  // Read markers data from data.csv
  $.get('./data.csv', function(csvString) {

    // Use PapaParse to convert string to array of objects
    var data = Papa.parse(csvString, {header: true, dynamicTyping: true}).data;

    // For each row in data, create a marker and add it to the map
    // For each row, columns `Latitude`, `Longitude`, and `Title` are required
    for (var i in data) {
      var row = data[i]

      var marker = L.marker([row.Latitude, row.Longitude], {
        opacity: 1
      }).bindPopup(row.Police_station)

      marker.addTo(map)
    }

  })
};