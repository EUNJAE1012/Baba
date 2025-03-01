const area = document.querySelector("#areaCode");
const sigungu = document.querySelector("#sigunguCode");
const contentType = document.querySelector("#contentType");

const areaCode1 = async (areaCode) => {
  const queryObj = {
    serviceKey: key_data,
    numOfRows: 120,
    pageNo: 1,
    MobileOS: "ETC",
    MobileApp: "Test",
    _type: "json",
  };
  if (areaCode) {
    queryObj.areaCode = areaCode;
  }
  try {
    const json = await getFetch("https://apis.data.go.kr/B551011/KorService1/areaCode1", queryObj);
    console.log(json);
    let info = json.response.body.items.item;
    info.forEach((item) => {
      item.key = item.code;
      item.label = item.name;
    });
    if (areaCode) {
      updateSelect(sigungu, "시군구", info);
    } else {
      updateSelect(area, "지역", info);
    }
  } catch (e) {
    console.log(e);
  }
};

area.addEventListener("change", async function () {
  await areaCode1(area.value);
});

document.querySelector("#btn_trip_search").addEventListener("click", async () => {
  const queryObj = {
    serviceKey: key_data,
    numOfRows: 20,
    pageNo: 1,
    MobileOS: "ETC",
    MobileApp: "Test",
    _type: "json",
  };
  // 추가로 설정할 조건이 있다면 추가하기
  if (area.value) {
    queryObj.areaCode = area.value;
  }
  if (sigungu.value) {
    queryObj.sigunguCode = sigungu.value;
  }
  if (contentType.value) {
    queryObj.contentTypeId = contentType.value;
  }

  try {
    const json = await getFetch("https://apis.data.go.kr/B551011/KorService1/areaBasedList1", queryObj);

    const spots = json.response.body.items.item;
    spots.forEach((element) => {
      // 기본적으로 통계청의 SGIS map은 utmk 기반이므로 WG384(lat, lng)기반을 utmk 로 변경
      element.utmk = new sop.LatLng(element.mapy, element.mapx);
      element.address = element.addr1;
      element.label = element.title;
    });
    updateMap(spots);
  } catch (e) {
    console.log(e);
  }
});

let addedNames = []; // 이미 추가된 관광지 이름을 추적하는 배열
// 관광지 추가 함수
const updateRightPanel = (info) => {
  const rightPanel = document.querySelector(".selected-location");

  // 중복 체크
  if (!addedNames.includes(info.label)) {
    // 중복되지 않으면 추가
    rightPanel.innerHTML += `
      <div class="location-card">
        <img src="${info.firstimage || "/assets/img/no-image.png"}" alt="${info.label}" class="location-img" />
        <div class="location-info">
          <div class="location-name">${info.label}</div>
          <div class="location-rating">📍 주소: ${info.address}</div>
          ${info.tel ? `<div class="location-rating">📞 전화번호: ${info.tel}</div>` : ""}
          <button class="more-btn">자세히</button>
          <button class="delete-btn">삭제</button>
        </div>
      </div>
    `;
    addedNames.push(info.label); // 이름을 배열에 추가

    // 삭제 버튼 이벤트 리스너 추가
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const locationCard = e.target.closest(".location-card");
        if (locationCard) {
          locationCard.remove(); // 해당 location-card 삭제
          // 삭제 후 해당 이름도 배열에서 제거
          addedNames = addedNames.filter((name) => name !== info.label);
        }
      });
    });

    // "자세히" 버튼 이벤트 리스너 추가
    document.querySelectorAll(".more-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const locationCard = e.target.closest(".location-card");
        if (locationCard) {
          const label = locationCard.querySelector(".location-name").textContent;
          const address = locationCard.querySelector(".location-rating").textContent;
          const tel = locationCard.querySelector(".location-rating:last-of-type")
            ? locationCard.querySelector(".location-rating:last-of-type").textContent
            : "정보 없음";
          const imageUrl = locationCard.querySelector("img").src;

          // 데이터를 URL 매개변수로 전달
          const params = new URLSearchParams();
          params.append("label", label);
          params.append("address", address);
          params.append("tel", tel);
          params.append("imageUrl", imageUrl);

          // 팝업 차단 예외 처리
          try {
            const childWindow = window.open(`/detail.html?${params.toString()}`, "_blank", "width=500,height=400");
            if (!childWindow) {
              alert("팝업이 차단되었습니다. 팝업 차단을 해제해 주세요.");
            }
          } catch (error) {
            console.error("팝업 창을 열 수 없습니다:", error);
            alert("팝업 창을 열 수 없습니다. 팝업 차단을 확인해 주세요.");
          }
        }
      });
    });
  } else {
    alert("이미 같은 이름의 관광지가 등록되어 있습니다.");
  }
};
