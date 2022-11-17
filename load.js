let map;
let markerLayer = [];
let drawInfoArr = [];
let RandomLocation = [];
let RandomBuilding = [];
let startX;
let startY;
let endX;
let endY;
let startSearchList;
let endSearchList;

function GetRandomNumber(start, end) {
  return Math.floor(Math.random() * (end - start + 1)) + start;
}

function initTmap() {
  // 1. 지도 띄우기
  document.getElementsByClassName("loadBox")[0].style.display = "none";
  map = new Tmapv2.Map("map_div", {
    center: new Tmapv2.LatLng(37.56701114710962, 126.9973611831669),
    width: "80vw",
    height: "80vh",
    zoom: 8,
    zoomControl: true,
    scrollwheel: true,
  });
}

function setTest() {
  setStartEnd(startSearchList[0][1], startSearchList[0][2], "s");
  setStartEnd(endSearchList[0][1], endSearchList[0][2], "e");
  RandomBuilding = [startSearchList[0][0], endSearchList[1][0]];
}

function setStartEnd(x, y, flag) {
  // 2. 출발지 설정
  if (flag == "s"){
	startX = x;
	startY = y;
  
  }
  if (flag == "e"){
	endX = x;
	endY = y;
  }
 
    new Tmapv2.Marker({
    position: new Tmapv2.LatLng(x, y),
    icon: "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_"+ flag + ".png",
    iconSize: new Tmapv2.Size(24, 38),
    map: map,
  });
}


async function markingMap() {
  document.getElementsByClassName("loadBox")[0].style.display = "block";

  setTest();
  // 4. 랜덤 경유지 마킹
  const location = await fetch("https://rich-taxi.kro.kr:444/random-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      LoactionCount: GetRandomNumber(3, 5),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.checkBestPath) {
        console.log(data.randomLocation);
        return data.randomLocation;
      }
      console.log([]);
      return [];
    });

  markerLayer = [];

  location.forEach((currentElement, index, array) => {
    marker = new Tmapv2.Marker({
      position: new Tmapv2.LatLng(currentElement[0], currentElement[1]),
      icon: `http://tmapapi.sktelecom.com/upload/tmap/marker/pin_b_m_${
        index + 1
      }.png`,
      iconSize: new Tmapv2.Size(24, 38),
      map: map,
    });
    markerLayer.push(marker);
  });

  RandomLocation = location;

  markerLine();

  document.getElementsByClassName("loadBox")[0].style.display = "none";
}

function clearMap() {
  // 0. 마킹 삭제
  markerLayer.forEach((currentElement, index, array) => {
    currentElement.setVisible(false);
  });

  markingMap();
}

function convertlocation() {
  // API 요청 형식에 맞게 위치값 변환
  return RandomLocation.map(function (element, index, array) {
    return {
      viaPointId: `test0${index + 1}`,
      viaPointName: `test0${index + 1}`,
      viaX: String(element[1]),
      viaY: String(element[0]),
    };
  });
}

function markerLine() {
  // 5. 마킹 연결
  var headers = {};
  headers["appKey"] = "l7xx22ccc674c2f14345858cc50fac566024";
  console.log(startX,startY,endX,endY)
  $.ajax({
    type: "POST",
    headers: headers,
    url: "https://apis.openapi.sk.com/tmap/routes/routeOptimization10?version=1&format=json", //
    async: false,
    contentType: "application/json",
    data: JSON.stringify({
      reqCoordType: "WGS84GEO",
      resCoordType: "EPSG3857",
      startName: "출발",
      startX: String(startY),
      startY: String(startX),
      startTime: "201711121314",
      endName: "도착",
      endX: String(endY),
      endY: String(endX),
      searchOption: "0",
      viaPoints: convertlocation(),
    }),
    success: function (response) {
      var resultData = response.properties;
      var resultFeatures = response.features;

      // 결과 출력
      var tDistance =
        "총 거리 : " + (resultData.totalDistance / 1000).toFixed(1) + "km,  ";
      var tTime =
        "총 시간 : " + (resultData.totalTime / 60).toFixed(0) + "분,  ";
      var tFare =
        "총 요금 : " + parseInt(resultData.totalDistance / 132) * 100 + "원";

      $("#result").text(tDistance + tTime + tFare);

      for (var i in resultFeatures) {
        var geometry = resultFeatures[i].geometry;
        var properties = resultFeatures[i].properties;

        drawInfoArr = [];

        if (geometry.type == "LineString") {
          for (var j in geometry.coordinates) {
            // 경로들의 결과값(구간)들을 포인트 객체로 변환
            var latlng = new Tmapv2.Point(
              geometry.coordinates[j][0],
              geometry.coordinates[j][1]
            );
            // 포인트 객체를 받아 좌표값으로 변환
            var convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
              latlng
            );
            // 포인트객체의 정보로 좌표값 변환 객체로 저장
            var convertChange = new Tmapv2.LatLng(
              convertPoint._lat,
              convertPoint._lng
            );

            drawInfoArr.push(convertChange);
          }

          polyline_ = new Tmapv2.Polyline({
            path: drawInfoArr,
            strokeColor: "#FF0000",
            strokeWeight: 6,
            map: map,
          });
        }
      }
    },
    error: function (request, status, error) {
      console.log(
        "code:" +
          request.status +
          "\n" +
          "message:" +
          request.responseText +
          "\n" +
          "error:" +
          error
      );
    },
  });

  ChangeCor();
}


function getEndSearchList() {

  $("#btn_select").click(function () {
	getStartEndSearchList("start", "#searchKeyword")
	console.log(2);
});

$("#btn_select_end").click(function () {
    getStartEndSearchList("end", "#searchKeyword_end")
	console.log(1);  
});
}

function getStartEndSearchList(flag, keyword){
	tempSearchList = [];

    var searchKeyword = $(keyword).val();
    $.ajax({
      method: "GET",
      url: "https://apis.openapi.sk.com/tmap/pois?version=1&format=json&callback=result",
      async: false,
      data: {
        appKey: "l7xx22ccc674c2f14345858cc50fac566024",
        searchKeyword: searchKeyword,
        resCoordType: "EPSG3857",
        reqCoordType: "WGS84GEO",
        count: 5,
      },
      success: function (response) {
        var resultpoisData = response.searchPoiInfo.pois.poi;
		if(flag == "start"){
			var innerHtml = ""; 
			var positionBounds = new Tmapv2.LatLngBounds();
		}
        for (var k in resultpoisData) {
          var noorLat = Number(resultpoisData[k].noorLat);
          var noorLon = Number(resultpoisData[k].noorLon);
          var pointCng = new Tmapv2.Point(noorLon, noorLat);
          var projectionCng = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
            pointCng
          );
          var lat = projectionCng._lat;
          var lon = projectionCng._lng;
          var name = resultpoisData[k].name;
          tempSearchList.push([name, lat, lon]);
        }
		if (flag == "start"){
			startSearchList = tempSearchList
			console.log("startSearchList")
			console.log(startSearchList)
		} else if (flag == "end"){
			endSearchList = tempSearchList
			console.log("startSearchList")
			console.log(endSearchList)
		}
      },
      error: function (request, status, error) {
        console.log(
          "code:" +
            request.status +
            "\n" +
            "message:" +
            request.responseText +
            "\n" +
            "error:" +
            error
        );
      },
    });
}

async function ChangeCor() {
  for (let i = 0; i < RandomLocation.length; i++) {
    let tempBuildName = await $.ajax({
      method: "GET",
      url: "https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&format=json&callback=result",
      async: false,
      data: {
        appKey: "l7xx22ccc674c2f14345858cc50fac566024",
        coordType: "WGS84GEO",
        addressType: "A10",
        lon: RandomLocation[i][1],
        lat: RandomLocation[i][0],
      },
      error: function (request, status, error) {
        console.log(
          "code:" +
            request.status +
            "\n" +
            "message:" +
            request.responseText +
            "\n" +
            "error:" +
            error
        );
      },
    });
    RandomBuilding.splice(
      i + 1,
      0,
      tempBuildName["addressInfo"]["ri"] +
        " " +
        tempBuildName["addressInfo"]["roadName"]
    );
  }
  console.log(RandomBuilding);
  for (let i = 0; i < RandomBuilding.length; i++) {
    document.getElementById(
      "randombuilding"
    ).innerHTML += `<div class="border bg-light mb-3 text-center p-3">${RandomBuilding[i]}</div>`;
  }
}
