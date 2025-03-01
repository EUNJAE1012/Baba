let accessToken;
const map = sop.map("map");
// marker 목록
const markers = [];
// 경계 목록
const bounds = [];

// access token 가져오기
const getAccessToken = async () => {
  try {
    const json = await getFetch("https://sgisapi.kostat.go.kr/OpenAPI3/auth/authentication.json", {
      consumer_key: "46d0d3813d9c4bc8af25", // 서비스 id
      consumer_secret: "bd0c408816314cdaa46f", // 보안 key
    });
    accessToken = json.result.accessToken;
  } catch (e) {
    console.log(e);
  }
};

// 주소를 UTM-K좌표로 변환해서 반환: - json의 errCd ==-401에서 access token 확보!!
const getCoords = async (address) => {
  try {
    const json = await getFetch("https://sgisapi.kostat.go.kr/OpenAPI3/addr/geocode.json", {
      accessToken: accessToken,
      address: address,
      resultcount: 1,
    });
    if (json.errCd === -401) {
      await getAccessToken();
      return await getCoords(address);
    }
    return json.result.resultdata[0];
  } catch (e) {
    console.log(e);
  }
};

const updateMap = (infos) => {
  resetMarker();
  try {
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      const marker = sop.marker([info.utmk.x, info.utmk.y]);
      const infoWindowContent = `
        <div style="min-width: 200px;">
          <h3>${info.label}</h3>
          <p><strong>주소:</strong> ${info.address}</p>
          ${info.tel ? `<p><strong>전화번호:</strong> ${info.tel}</p>` : ""}
          ${
            info.firstimage
              ? `<img src="${info.firstimage}" alt="${info.label}" style="width: 100%; height: 50%;"/>`
              : ""
          }
        </div>
      `;
      marker.addTo(map).bindInfoWindow(infoWindowContent);
      markers.push(marker);
      bounds.push([info.utmk.x, info.utmk.y]);
      // 마커 클릭 시 right panel 업데이트
      marker.on("click", () => {
        updateRightPanel(info);
      });
    }

    // 경계를 기준으로 map을 중앙에 위치하도록 함
    if (bounds.length > 1) {
      map.setView(map._getBoundsCenterZoom(bounds).center, map._getBoundsCenterZoom(bounds).zoom);
    } else {
      map.setView(map._getBoundsCenterZoom(bounds).center, 9);
    }
  } catch (e) {
    console.log(e);
  }
};

// 마커와 경계 초기화
const resetMarker = () => {
  markers.forEach((item) => item.remove());
  bounds.length = 0;
};
