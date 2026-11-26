// AI 영상 생성용 예시 프롬프트(한국어 · English).
// 공식: 효과 이름 + 무엇을 + 어떻게. 각 프롬프트에는 기법 이름이 그대로 들어간다.

export interface TechniquePrompt {
  ko: string;
  en: string;
}

export const PROMPTS: Record<number, TechniquePrompt> = {
  // ── 1부 카메라 무빙 ──
  1: {
    ko: '골목에 서 있는 인물의 얼굴을 향해 카메라가 레일 위를 미끄러지듯 천천히 다가가는 달리 인으로 찍어줘. 화각은 그대로 두고 앞쪽 담장이 양옆으로 빠르게 비켜 지나가게 해줘.',
    en: "Slow Dolly In toward the face of a person standing in an alley, the camera gliding forward on a track. Keep the focal length fixed so the foreground walls slide past quickly on both sides.",
  },
  2: {
    ko: '카메라는 삼각대에 고정한 채로, 멀리 마을 길에 서 있는 인물에게 렌즈만 천천히 당기는 줌 인을 해줘. 배경도 함께 납작하게 커지게 해줘.',
    en: 'Locked-off camera on a tripod, slow Zoom In on a distant person standing on a village road. Only the lens zooms, so the background flattens and enlarges together with the subject.',
  },
  3: {
    ko: '언덕 위에서 마을을 왼쪽에서 오른쪽으로 천천히 훑는 팬·틸트로 시작해서, 마지막에 하늘 쪽으로 틸트 업 해줘. 카메라 위치는 움직이지 않게 해줘.',
    en: 'Pan & Tilt from a fixed spot on a hill: slowly pan across the village from left to right, then tilt up toward the sky at the end. The camera position never moves.',
  },
  4: {
    ko: '골목을 걸어가는 인물을 옆에서 같은 속도로 나란히 따라가는 트래킹 숏으로 찍어줘. 가까운 가로등은 빠르게, 먼 집들은 느리게 지나가게 해줘.',
    en: 'Tracking Shot moving alongside a person walking down an alley at the same speed, filmed from the side. Nearby lamp posts rush past while distant houses drift slowly.',
  },
  5: {
    ko: '인물 바로 옆에서 시작해 카메라가 하늘 높이 솟아오르며 마을 전체가 한눈에 보이는 크레인 숏으로 영상을 시작해줘.',
    en: 'Open with a Crane Shot that starts right next to the character and rises high into the sky until the whole village is revealed below.',
  },
  6: {
    ko: '깜짝 놀라는 인물을 달리 줌으로 찍어줘. 카메라는 뒤로 물러나면서 동시에 줌을 당겨 인물 크기는 그대로, 뒤 배경만 확 다가오게 해줘(버티고 효과).',
    en: 'Dolly Zoom on a shocked character: the camera dollies backward while zooming in, so the character stays the same size while the background rushes forward (the Vertigo effect).',
  },
  7: {
    ko: '인물을 화면 가운데 두고 카메라가 주위를 반 바퀴 천천히 도는 아크 숏으로 찍어줘. 인물은 그대로이고 뒤 배경만 빙 돌아가게 해줘.',
    en: 'Arc Shot slowly circling half way around the character, keeping them centered while the background sweeps around behind them.',
  },
  8: {
    ko: '비둘기가 머리에 앉는 순간, 인물의 얼굴로 눈 깜짝할 사이에 확 당겨 들어가는 크래시 줌을 넣어줘. 예능처럼 과장되게.',
    en: "Crash Zoom: the instant a pigeon lands on the character's head, snap-zoom into their face in a split second, exaggerated like a variety show.",
  },
  9: {
    ko: '달리는 인물 옆에서 함께 뛰는 것처럼 화면이 잔잔하게 흔들리는 핸드헬드로 찍어줘. 다큐멘터리 같은 생생한 느낌으로.',
    en: 'Handheld camera running alongside a sprinting character, with natural subtle shake for a raw, documentary-like feel.',
  },
  // ── 2부 앵글과 숏 ──
  10: {
    ko: '놀이터에 혼자 서 있는 인물을 높은 곳에서 비스듬히 내려다보는 하이 앵글로 보여줘. 인물이 작고 외로워 보이게.',
    en: 'High Angle looking down diagonally at a character standing alone in a playground, making them look small and lonely.',
  },
  11: {
    ko: '놀이터의 인물을 땅 가까이에서 올려다보는 로우 앵글로 찍어줘. 하늘을 등지고 크고 당당해 보이게.',
    en: 'Low Angle from near the ground looking up at the character in a playground, the sky behind them so they look tall and heroic.',
  },
  12: {
    ko: '놀이터 전체를 바로 위에서 수직으로 내려다보는 버즈아이 뷰로 지도처럼 보여줘. 인물이 그 사이를 천천히 걸어가게 해줘.',
    en: "Bird's-eye View straight down over the whole playground like a map, with the character slowly walking across it.",
  },
  13: {
    ko: '노을 속 놀이터에서 바람에 혼자 흔들리는 그네를 화면을 15도 정도 기울인 더치 앵글로 찍어줘. 불안하고 이상한 분위기로.',
    en: 'Dutch Angle tilted about 15 degrees, showing an empty swing creaking in the wind at a sunset playground, with an uneasy, eerie mood.',
  },
  14: {
    ko: '눈물이 맺히는 눈 하나를 화면 가득 담는 익스트림 클로즈업으로 보여줘. 눈동자의 작은 떨림까지 보이게.',
    en: 'Extreme Close-up of a single eye welling up with tears, filling the whole frame so even tiny trembles are visible.',
  },
  15: {
    ko: '그네를 타는 인물의 눈에 보이는 그대로 POV 숏으로 만들어줘. 그네가 앞뒤로 흔들릴 때마다 하늘과 땅이 번갈아 보이게.',
    en: "POV Shot from the eyes of a character riding a swing: as the swing goes back and forth, the view alternates between sky and ground.",
  },
  16: {
    ko: '같은 구도로 고정한 카메라 앞에서 인물이 여기저기 순간 이동하는 것처럼 시간만 툭툭 건너뛰는 점프 컷으로 편집해줘.',
    en: 'Jump Cut edit with a locked-off camera and the same framing, the character teleporting from spot to spot as time skips forward.',
  },
  // ── 3부 장면 전환 ──
  17: {
    ko: '낮의 공원이 저녁의 공원으로 천천히 겹쳐지며 바뀌는 디졸브로 이어줘. 두 장면이 2초 정도 반투명하게 겹치게.',
    en: 'Dissolve from a park in daylight to the same park at dusk, the two images overlapping semi-transparently for about two seconds.',
  },
  18: {
    ko: '밤 장면에서 눈 오는 장면으로, 사선 경계선이 화면을 쓸고 지나가는 와이프로 바꿔줘. 스타워즈 스타일로.',
    en: 'Wipe transition from a night scene to a snowy scene, a diagonal edge sweeping across the frame, Star Wars style.',
  },
  19: {
    ko: '밤하늘의 둥근 보름달이 같은 자리, 같은 크기의 둥근 캐릭터로 바뀌는 매치 컷으로 이어줘.',
    en: 'Match Cut from a round full moon in the night sky to a round character placed in exactly the same position and size in the frame.',
  },
  20: {
    ko: '지붕 위 장면에서 카메라를 옆으로 휙 돌려 화면이 번진 순간 골목 장면으로 넘어가는 휩 팬 전환을 넣어줘.',
    en: 'Whip Pan transition: whip the camera sideways from a rooftop scene, hiding the cut in the motion blur and landing in an alley scene.',
  },
  21: {
    ko: '고요하게 잠든 밤에서 알람이 시끄럽게 울리는 아침으로 갑자기 뚝 끊는 스매시 컷을 넣어줘.',
    en: 'Smash Cut from a silent, peaceful night of sleep straight to a loud morning with a ringing alarm clock, no transition at all.',
  },
  22: {
    ko: '마지막 장면을 인물만 남기고 동그란 원이 점점 좁아지며 닫히는 무성영화 같은 아이리스 아웃으로 끝내줘.',
    en: 'End the final scene with an Iris out like a silent film: a circle closes in around the character until the screen goes black.',
  },
  23: {
    ko: '하루를 마치는 장면을 천천히 까맣게 페이드 아웃하고, 다음 날 아침으로 페이드 인 해줘.',
    en: 'Fade Out slowly to black at the end of the day, then fade in on the next morning.',
  },
  // ── 4부 편집 기법 ──
  24: {
    ko: '일주일 동안 스케이트보드를 연습하고, 넘어지고, 다시 일어나는 과정을 1~2초짜리 짧은 장면들로 이어 붙인 몽타주로 보여줘.',
    en: 'Montage of a week of skateboard practice — practicing, falling, getting back up — built from short 1–2 second clips.',
  },
  25: {
    ko: '역으로 달려가는 인물과 다가오는 기차를 점점 짧게 번갈아 보여주는 교차 편집으로 긴장감을 만들어줘.',
    en: 'Cross-cutting between a character running to the station and an approaching train, alternating faster and faster to build tension.',
  },
  26: {
    ko: '기차역의 인물과 멀리 떨어진 친구가 통화하는 장면을 좌우 분할 화면으로 동시에 보여줘.',
    en: 'Split Screen showing a character at a train station and a faraway friend talking on the phone at the same moment, left and right.',
  },
  27: {
    ko: '기차가 떠나기 직전, 역 시계가 5시를 가리키는 인서트 숏을 1초 정도 중간에 끼워줘.',
    en: 'Insert Shot of the station clock hitting five o\'clock, cut in for about one second just before the train departs.',
  },
  28: {
    ko: '큰 나무를 바라보던 인물이 어릴 때 그 나무를 심던 장면이 빛바랜 누런 색과 흐린 테두리로 떠오르는 플래시백을 넣어줘.',
    en: 'Flashback: as the character looks at a big tree, cut to a faded, sepia-toned memory with soft vignette edges of them planting it as a child.',
  },
  // ── 5부 시간 ──
  29: {
    ko: '분수에서 물방울이 튀고 인물이 점프하는 순간을 아주 느린 슬로 모션으로 보여줘. 물방울 하나하나가 보이게.',
    en: 'Slow Motion of water droplets splashing from a fountain as the character jumps, slow enough to see every single droplet.',
  },
  30: {
    ko: '광장 시계탑을 고정 카메라로 찍어, 한낮이 밤이 되기까지를 몇 초짜리 타임랩스로 압축해줘. 구름이 빠르게 흐르고 시계 바늘이 휙휙 돌게.',
    en: 'Time-lapse of the town square clock tower from a locked-off camera, compressing noon to night into a few seconds with racing clouds and spinning clock hands.',
  },
  31: {
    ko: '달려오다 점프하는 순간에만 느려졌다가 착지하면 다시 빨라지는 스피드 램프로 만들어줘.',
    en: 'Speed Ramp: the character runs in at high speed, slows down dramatically only at the peak of the jump, then speeds back up on landing.',
  },
  32: {
    ko: '점프한 순간 화면을 멈추고 옆에 인물 이름이 뜨는 프리즈 프레임으로 등장인물을 소개해줘.',
    en: "Freeze Frame at the peak of the character's jump, with their name tag popping up beside them to introduce the character.",
  },
  33: {
    ko: '담장에서 떨어져 깨진 화분이 다시 붙어서 제자리로 올라가도록 리버스로 재생해줘.',
    en: 'Reverse playback: a flower pot that fell from a wall and shattered reassembles itself and flies back up to its place.',
  },
  34: {
    ko: '오후부터 노을까지 거리를 따라 성큼성큼 앞으로 나아가는 하이퍼랩스로 찍어줘. 시간과 장소가 함께 흘러가게.',
    en: 'Hyperlapse moving forward down the street from afternoon to sunset, time and place flowing together in big strides.',
  },
  35: {
    ko: '점프한 순간 시간을 멈추고 카메라만 인물 주위를 크게 도는 불릿 타임으로 보여줘. 주변 물방울도 공중에 멈춰 있게.',
    en: 'Bullet Time: freeze the moment of the jump and orbit the camera around the character, with water droplets hanging still in mid-air.',
  },
  36: {
    ko: '장난감 블록이 한 칸씩 움직여 줄을 서는 장면을 뚝뚝 끊기는 스톱모션으로 만들어줘. 1초에 8~12장 느낌으로.',
    en: 'Stop Motion of toy blocks moving one step at a time until they line up, choppy like 8–12 frames per second.',
  },
  // ── 6부 렌즈·빛·색 ──
  37: {
    ko: '앞에 있는 꽃에 맞춰져 있던 초점을 뒤에 서 있는 인물에게로 옮기는 랙 포커스를 넣어줘.',
    en: 'Rack Focus from a flower in the foreground to a character standing in the background.',
  },
  38: {
    ko: '카메라가 노을 지는 해 쪽을 천천히 지나갈 때 은은한 렌즈 플레어가 줄지어 생기게 해줘.',
    en: 'Subtle Lens Flare: as the camera slowly pans past the setting sun, a line of soft flare circles appears across the frame.',
  },
  39: {
    ko: '무거운 추가 쿵 하고 떨어지는 순간에만 짧고 강하게 흔들리는 카메라 셰이크를 넣어줘.',
    en: 'Camera Shake that hits hard and short only at the moment a heavy weight slams onto the ground, then settles immediately.',
  },
  40: {
    ko: '눈앞을 빠르게 지나가는 기차에 자연스러운 모션 블러를 넣어줘. 속도감이 느껴지게.',
    en: 'Natural Motion Blur on a train rushing past the camera, conveying its speed.',
  },
  41: {
    ko: '노을 들판의 그네 장면을 밝은 곳은 주황, 그림자는 청록으로 나눈 영화 같은 컬러 그레이딩(틸 앤 오렌지)으로 바꿔줘.',
    en: 'Cinematic Color Grading in teal and orange on a sunset swing scene: highlights pushed to orange, shadows to teal.',
  },
  42: {
    ko: '화면 위아래에 검은 띠를 넣어서 2.39:1 영화관 비율의 레터박스로 만들어줘.',
    en: 'Letterbox the frame with black bars top and bottom for a 2.39:1 cinema aspect ratio.',
  },
  // ── 7부 특수 렌즈와 룩 ──
  43: {
    ko: '밤거리를 배경으로 인물에게 초점을 맞추고 뒤의 불빛들이 동그랗게 번지는 보케를 넣어줘.',
    en: 'Bokeh: focus on the character on a night street while the string lights behind them melt into soft round circles.',
  },
  44: {
    ko: '옥상에서 내려다본 마을을 위아래가 흐린 틸트 시프트로 장난감 미니어처처럼 보여줘.',
    en: 'Tilt-shift shot of the village from a rooftop, blurring the top and bottom of the frame so it looks like a toy miniature.',
  },
  45: {
    ko: '스케이트보드를 타는 인물을 아주 가까이에서 어안 렌즈로 찍어줘. 가장자리 선들이 둥글게 휘게.',
    en: 'Fisheye Lens shot very close to a character riding a skateboard, the edges of the frame bending into curves.',
  },
  46: {
    ko: '안개 낀 숲에서 나뭇잎 사이로 햇빛이 줄기처럼 쏟아지는 갓레이를 넣어줘. 신비로운 분위기로.',
    en: 'God Rays streaming through the leaves of a misty forest, beams of sunlight cutting through the fog for a mystical mood.',
  },
  47: {
    ko: '시장 장면을 흑백으로 바꾸고 인물의 주황색만 남기는 셀렉티브 컬러로 만들어줘.',
    en: "Selective Color: turn the market scene black and white, keeping only the character's orange color.",
  },
  48: {
    ko: '햇살 좋은 들판 장면을 어둡게, 푸르게, 하늘은 더 어둡게 보정한 데이 포 나이트로 달밤처럼 바꿔줘.',
    en: 'Day for Night: grade a sunny field scene darker and bluer with an even darker sky so it looks like a moonlit night.',
  },
  49: {
    ko: '노을 속 그네 장면에 옛날 필름처럼 자글자글한 필름 그레인을 더해줘.',
    en: 'Add vintage Film Grain to a sunset swing scene so it feels like old celluloid.',
  },
  50: {
    ko: '집 앞에서 시작해 골목을 지나 광장까지 컷 없이 끊김 없이 이어지는 원테이크로 찍어줘. 마지막엔 시계탑까지 위로 올라가게.',
    en: 'One Take (Long Take) with no cuts: start at a front door, move through the alley and into the town square, rising up to the clock tower at the end.',
  },
  // ── 8부 카메라·앵글 확장 ──
  51: {
    ko: '공황에 빠져 걷는 인물의 몸에 카메라를 고정한 스노리캠으로 찍어줘. 인물은 화면 가운데 그대로, 배경만 크게 흔들리게.',
    en: 'SnorriCam rig strapped to a panicked character walking: their face stays locked in the center while the world lurches around them.',
  },
  52: {
    ko: '드론으로 마을 위를 높이 날며 길을 따라 멀리 비행하는 에어리얼 숏으로 오프닝을 만들어줘.',
    en: 'Aerial Shot for the opening: a drone flies high over the village, following the road into the distance.',
  },
  53: {
    ko: '꿈속 장면처럼 카메라가 렌즈 방향을 축으로 한 바퀴 빙글 도는 배럴 롤로 찍어줘.',
    en: 'Barrel Roll: the camera rotates a full 360 degrees around its lens axis, like a scene from a dream.',
  },
  54: {
    ko: '땅바닥에 카메라를 대고 거의 수직으로 올려다보는 웜즈아이 뷰로 인물과 시계탑이 하늘 높이 솟아 보이게 해줘.',
    en: "Worm's-eye View from the ground looking almost straight up, so the character and the clock tower tower over the sky.",
  },
  55: {
    ko: '같은 인물을 익스트림 와이드 → 와이드 → 풀 숏 → 미디엄 숏 → 클로즈업 순서로 숏 사이즈를 한 단계씩 좁혀가며 보여줘.',
    en: 'Shot Sizes progression on the same character: extreme wide, wide, full shot, medium shot, then close-up, one step closer each cut.',
  },
  56: {
    ko: '마을 전체를 멀리서 보여주는 설정 숏으로 시작한 뒤, 컷해서 인물 가까이로 들어가줘.',
    en: 'Start with an Establishing Shot of the whole village from far away, then cut in close to the character.',
  },
  // ── 9부 편집 문법·전환 ──
  57: {
    ko: '마주 보고 대화하는 두 인물을 180도 규칙에 맞춰 축의 한쪽에서만 찍다가, 관계가 뒤틀리는 순간 일부러 축을 넘어가 좌우를 바꿔줘.',
    en: 'Follow the 180-degree Rule for two characters talking face to face, filming only from one side of the axis, then deliberately cross the line when their relationship flips.',
  },
  58: {
    ko: '두 인물의 대화를 서로의 어깨 너머로 번갈아 찍는 숏/리버스 숏(오버 더 숄더)으로 편집해줘.',
    en: 'Shot / Reverse Shot (OTS) for a two-person conversation, alternating over-the-shoulder angles of each speaker.',
  },
  59: {
    ko: '인물이 문을 여는 동작 도중에 먼 숏에서 가까운 숏으로 바꾸는 컷 온 액션으로 자연스럽게 이어줘.',
    en: 'Cut on Action: switch from a wide shot to a close shot in the middle of the character opening a door, so the motion flows seamlessly.',
  },
  60: {
    ko: '하늘을 올려다보는 인물 다음에 그 시선 방향 그대로 떠 있는 빨간 풍선을 보여주는 아이라인 매치로 이어줘.',
    en: 'Eyeline Match: the character looks up at the sky, then cut to the red balloon they are looking at, seen from their line of sight.',
  },
  61: {
    ko: '같은 무표정 클로즈업을 수프, 시든 꽃, 선물 상자 장면 사이에 각각 붙여 감정이 달라 보이는 쿨레쇼프 효과를 보여줘.',
    en: 'Kuleshov Effect: intercut the same neutral close-up with soup, a wilted flower and a gift box, so the face seems to express hunger, grief and joy.',
  },
  62: {
    ko: '카메라 앞을 검은 기둥이 지나가며 화면을 가리는 순간 다른 장소로 넘어가는 인비저블 컷으로 원테이크처럼 이어줘.',
    en: 'Invisible Cut: hide the edit as a dark pillar passes in front of the lens, so the move to a new location feels like one continuous take.',
  },
  63: {
    ko: '다음 장면의 기차 소리가 화면보다 먼저 들리는 J컷, 화면이 바뀐 뒤에도 이전 소리가 남는 L컷으로 장면을 이어줘.',
    en: 'Use a J-cut & L-cut: let the train sound of the next scene start before the picture changes, and let the previous sound linger after the cut.',
  },
  64: {
    ko: '큰 나무를 보던 인물이 어린 시절 회상으로 들어가도록 화면이 물결처럼 일렁이는 리플 디졸브로 이어줘.',
    en: 'Ripple Dissolve into a childhood memory: the image wobbles like rippling water as the present-day tree melts into the past.',
  },
  65: {
    ko: '거리 장면에서 한순간 화면이 하얗게 번쩍인 뒤 광장으로 넘어가는 화이트 플래시 전환을 넣어줘.',
    en: 'White Flash transition: the street scene bursts to pure white for an instant, then opens on the town square.',
  },
  // ── 10부 빛·렌즈·룩 ──
  66: {
    ko: '카메라 가까이 선 인물과 멀리 있는 시계탑을 겹쳐서 인물이 시계탑보다 큰 거인처럼 보이는 강제 원근법으로 찍어줘.',
    en: 'Forced Perspective: line up a character close to the lens with the distant clock tower so the character looks like a giant bigger than the tower.',
  },
  67: {
    ko: '인물의 옆얼굴 위에 노을 진 마을 풍경이 비쳐 보이는 이중 노출로 그리운 감정을 표현해줘.',
    en: "Double Exposure blending the character's side profile with a sunset view of the village to express longing.",
  },
  68: {
    ko: '노을 무렵 거리를 아나모픽 렌즈로 찍어줘. 2.39:1 비율에 가로로 길게 뻗는 푸른 렌즈 플레어와 타원형 보케가 생기게.',
    en: 'Shot on an Anamorphic Lens at dusk: 2.39:1 frame, long horizontal blue lens flares and oval bokeh in the background.',
  },
  69: {
    ko: '같은 인물을 그림자 없는 밝은 하이키 조명, 한쪽만 비추는 어두운 로우키 조명, 해를 등진 실루엣으로 차례로 보여줘.',
    en: 'Compare High-key / Low-key Lighting on the same character: bright shadowless high-key, then dark one-sided low-key, then a backlit silhouette.',
  },
  70: {
    ko: '앞의 꽃부터 멀리 있는 인물과 집까지 모두 선명한 딥 포커스로 찍어줘. 시작은 꽃만 선명한 얕은 심도에서 바뀌게.',
    en: 'Deep Focus with everything sharp from the flower in the foreground to the character and houses far behind, starting from a shallow focus on the flower.',
  },
  71: {
    ko: '거리에서 춤추는 인물 장면에 색이 어긋나고 가로줄이 밀리는 글리치·VHS 룩을 입혀줘. 오래된 비디오테이프처럼.',
    en: 'Glitch / VHS Look on a character dancing in the street: RGB color shift, horizontal line jitter and scanlines like an old videotape.',
  },
};
