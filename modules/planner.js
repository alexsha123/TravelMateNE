import { calculateDayCosts } from "../planner-rules.mjs";

const routePlans = {
  shillong: {
    hub: "Guwahati",
    min: 3,
    name: "Guwahati → Shillong → Dawki",
    days: [
      [
        "Shillong",
        "Guwahati → Shillong",
        "Shared cab, about 3–4 hours; traffic and weather can add time.",
        350,
        "Arrive, check in, walk Ward’s Lake and Police Bazaar, and try a Khasi dinner.",
        true,
      ],
      [
        "Dawki & Umngot",
        "Shillong → Dawki",
        "Shared Sumo, about 3–4 hours; confirm the return seat before leaving.",
        350,
        "Stop at Pynursla viewpoints, take a locally operated Umngot boat and stay in a village homestay.",
        true,
      ],
      [
        "Dawki & Umngot",
        "Dawki → Guwahati",
        "Return via Shillong, about 5–6 hours total; leave early and allow a road buffer.",
        650,
        "Take a short riverside morning, then make the overland return to Guwahati.",
        false,
      ],
    ],
    extra: [
      "Shillong",
      "A slower Shillong day",
      "Local shared taxi and walking day.",
      200,
      "Choose a local food walk, Don Bosco Museum or a guided sacred-grove visit.",
      true,
    ],
  },
  kaziranga: {
    hub: "Guwahati",
    min: 3,
    name: "Guwahati → Kaziranga",
    days: [
      [
        "Kaziranga",
        "Guwahati → Kohora",
        "Shared road transfer, about 5–6 hours; allow extra time around Nagaon.",
        850,
        "Check in near the park, visit a local orchid centre if open and confirm an official safari slot.",
        true,
      ],
      [
        "Kaziranga",
        "Kaziranga safari day",
        "Park-zone transport; safari booking is separate and subject to availability.",
        300,
        "Take one early official jeep safari, rest at midday, then visit a nearby tea garden or village-run centre.",
        true,
      ],
      [
        "Kaziranga",
        "Kohora → Guwahati",
        "Road return, about 5–6 hours. A second safari adds cost and time.",
        850,
        "Have breakfast near the park and leave a generous buffer for the return journey.",
        false,
      ],
    ],
    extra: [
      "Kaziranga",
      "Second safari or village day",
      "Local shared ride around Kohora.",
      250,
      "Choose a second official safari zone or a village visit; book park activities directly.",
      true,
    ],
  },
  majuli: {
    hub: "Guwahati",
    min: 4,
    name: "Guwahati → Jorhat → Majuli",
    days: [
      [
        "Majuli",
        "Guwahati → Jorhat",
        "Train or bus, typically 6–8 hours; overnight in Jorhat to avoid a tight ferry connection.",
        700,
        "Transfer day. Buy snacks, check Nimati Ghat ferry times and keep the evening light.",
        true,
      ],
      [
        "Majuli",
        "Jorhat → Majuli by ferry",
        "Road to Nimati Ghat, then ferry; allow 1–2 hours including boarding. River conditions affect service.",
        250,
        "Check in, visit one satra with a local guide and learn about mask-making if a workshop is open.",
        true,
      ],
      [
        "Majuli",
        "Satra and village day",
        "Local bicycle or shared auto; village distances take time.",
        300,
        "Visit Auniati or Kamalabari Satra, browse a Mising village and try a locally prepared meal.",
        true,
      ],
      [
        "Majuli",
        "Majuli → Jorhat → Guwahati",
        "Early ferry and onward train or bus; allow a full travel day.",
        950,
        "Return travel day. Keep ferry and onward-ticket connections flexible.",
        false,
      ],
    ],
    extra: [
      "Majuli",
      "Island craft and wetlands day",
      "Local bicycle or shared auto.",
      250,
      "Arrange a community craft workshop or birding guide; confirm access and ferry timing locally.",
      true,
    ],
  },
  ziro: {
    hub: "Dibrugarh",
    min: 5,
    name: "Dibrugarh → Ziro Valley",
    days: [
      [
        "Ziro Valley",
        "Dibrugarh → Ziro Valley",
        "Long overland transfer, plan 8–10 hours; breaks, checkpoints and road conditions affect timing.",
        1500,
        "Transfer day. Carry snacks, water and valid photo ID; check in at a local homestay on arrival.",
        true,
      ],
      [
        "Ziro Valley",
        "Apatani villages with a local guide",
        "Short local shared taxi or homestay transport.",
        250,
        "Walk Hong, Hari and nearby villages with a local guide; ask before photographing residents or entering farms.",
        true,
      ],
      [
        "Ziro Valley",
        "Fields, craft and food",
        "Local shared transport between Hapoli and villages.",
        300,
        "Learn about Apatani wet-rice cultivation, visit a handloom or bamboo craft workshop and share a local meal.",
        true,
      ],
      [
        "Ziro Valley",
        "Pine trail and Hapoli market",
        "Local taxi or cycle hire; use a local guide for longer walks.",
        350,
        "Take a short pine-forest walk, browse Hapoli market and leave the afternoon open for weather.",
        true,
      ],
      [
        "Ziro Valley",
        "Ziro → Dibrugarh",
        "Return overland, plan 8–10 hours. Confirm the vehicle and departure time the previous evening.",
        1500,
        "Return travel day; avoid booking a tight onward connection.",
        false,
      ],
    ],
    extra: [
      "Ziro Valley",
      "Community-led culture day",
      "Local shared transport.",
      250,
      "Arrange a village walk, local food session or craft visit through a local host.",
      true,
    ],
  },
  gangtok: {
    hub: "Bagdogra",
    min: 3,
    name: "Bagdogra → Gangtok",
    days: [
      [
        "Gangtok",
        "Bagdogra → Gangtok",
        "Road transfer, about 4–5 hours in normal conditions; landslides can cause major delays.",
        900,
        "Travel day. Check in, walk MG Marg and keep plans flexible.",
        true,
      ],
      [
        "Gangtok",
        "Gangtok town and monastery trail",
        "Local shared taxi or walk; confirm monastery opening hours.",
        250,
        "Visit Enchey Monastery, Namgyal Institute of Tibetology and a local market; leave time for a Sikkimese meal.",
        true,
      ],
      [
        "Gangtok",
        "Gangtok → Bagdogra",
        "Road return, about 4–5 hours and longer in poor weather. Allow a generous onward-connection buffer.",
        900,
        "Early breakfast and return transfer. Avoid a tight same-day connection in monsoon months.",
        false,
      ],
    ],
    extra: [
      "Gangtok",
      "Rumtek and a slower town day",
      "Shared taxi to Rumtek; confirm return service.",
      350,
      "Visit Rumtek respectfully, then return to Gangtok for a local food walk.",
      true,
    ],
  },
  lachung: {
    hub: "Bagdogra",
    min: 5,
    name: "Bagdogra → Gangtok → Lachung",
    days: [
      [
        "Gangtok",
        "Bagdogra → Gangtok",
        "Road transfer, about 4–5 hours; weather and traffic can extend the drive.",
        900,
        "Travel day. Rest in Gangtok and confirm your operator, permits and next morning’s departure.",
        true,
      ],
      [
        "Lachung",
        "Gangtok → Lachung",
        "Registered shared 4WD, roughly 6–8 hours with stops; access depends on road conditions.",
        2300,
        "Mountain transfer day. Carry original photo ID and follow check-in instructions.",
        true,
      ],
      [
        "Lachung",
        "Lachung and Yumthang Valley",
        "Permit-approved local 4WD excursion; route access depends on current orders and road conditions.",
        900,
        "Visit only locations listed on your permit. Keep the schedule flexible for altitude, weather and checkpoints.",
        true,
      ],
      [
        "Lachung",
        "Lachung → Gangtok",
        "Registered 4WD return, roughly 6–8 hours when conditions permit.",
        2300,
        "Return travel day. Confirm the latest North Sikkim itinerary and road rules before booking.",
        true,
      ],
      [
        "Gangtok",
        "Gangtok → Bagdogra",
        "Road transfer, about 4–5 hours; add a buffer for mountain-road delays.",
        900,
        "Return travel day. Avoid a tight same-day onward connection.",
        false,
      ],
    ],
    extra: [
      "Gangtok",
      "Rest and local culture day",
      "Local shared taxi or walking day.",
      250,
      "Use a rest day after the high-altitude route; visit a monastery or market at an easy pace.",
      true,
    ],
  },
  loktak: {
    hub: "Imphal",
    min: 2,
    name: "Imphal → Loktak Lake",
    days: [
      [
        "Loktak Lake",
        "Imphal → Moirang and Loktak",
        "Shared taxi, about 1–1.5 hours; agree on a return plan before leaving Imphal.",
        250,
        "Visit INA Memorial at Moirang, then arrange a community boat on Loktak before sunset.",
        true,
      ],
      [
        "Loktak Lake",
        "Loktak sunrise → Imphal",
        "Return drive, about 1–1.5 hours; road timing can vary.",
        250,
        "Take an early boat with a local operator, view the lake respectfully and return to Imphal.",
        false,
      ],
    ],
    extra: [
      "Loktak Lake",
      "Keibul Lamjao nature day",
      "Arrange a local guide and confirm park access in advance.",
      350,
      "Explore only where access is open; check current conditions with local authorities.",
      true,
    ],
  },
  dzukou: {
    hub: "Guwahati",
    min: 4,
    name: "Guwahati → Kohima → Dzükōu Valley",
    days: [
      [
        "Dzükōu Valley",
        "Guwahati → Kohima",
        "Long road transfer, usually 8–10 hours; overnight in Kohima.",
        1000,
        "Transfer and rest day. Check Nagaland ILP and arrange a local guide before trekking.",
        true,
      ],
      [
        "Dzükōu Valley",
        "Kohima → trailhead → valley",
        "Drive to the trailhead, then trek about 4–6 hours depending on route and weather.",
        500,
        "Start early with a local guide, carry water and use designated trails; overnight only at permitted facilities.",
        true,
      ],
      [
        "Dzükōu Valley",
        "Valley trail and descent",
        "Allow a full day for the return trek; conditions can change quickly at altitude.",
        350,
        "Follow local entry rules, pack out all waste and descend before dark.",
        true,
      ],
      [
        "Dzükōu Valley",
        "Kohima → Guwahati",
        "Long road return, usually 8–10 hours; avoid a tight connection.",
        1000,
        "Return travel day with a road buffer.",
        false,
      ],
    ],
    extra: [
      "Dzükōu Valley",
      "Kohima cultural buffer day",
      "Local taxi in Kohima.",
      250,
      "Use this as a weather buffer or visit a community museum with local guidance.",
      true,
    ],
  },
  reiek: {
    hub: "Guwahati",
    min: 4,
    name: "Guwahati → Aizawl → Reiek",
    days: [
      [
        "Reiek",
        "Guwahati → Aizawl",
        "Flight or long overland transfer; schedules and fares vary. Plan a separate arrival day.",
        2400,
        "Travel day. Confirm your Mizoram ILP and check in near Aizawl.",
        true,
      ],
      [
        "Reiek",
        "Aizawl → Reiek",
        "Road transfer, about 1–2 hours depending on traffic.",
        250,
        "Walk the forested ridge with a local guide and visit the heritage village respectfully.",
        true,
      ],
      [
        "Reiek",
        "Reiek and Aizawl culture",
        "Local shared vehicle back toward Aizawl.",
        250,
        "Return to Aizawl, visit a local market and try Mizo dishes with a local host.",
        true,
      ],
      [
        "Reiek",
        "Aizawl → Guwahati",
        "Return flight or long road transfer; keep this as a full travel day.",
        2400,
        "Return travel day; verify schedules before buying onward tickets.",
        false,
      ],
    ],
    extra: [
      "Reiek",
      "Aizawl local day",
      "Local shared taxi and walking.",
      250,
      "Visit a local craft or food market and leave time for transport changes.",
      true,
    ],
  },
  unakoti: {
    hub: "Guwahati",
    min: 4,
    name: "Guwahati → Kailashahar → Unakoti",
    days: [
      [
        "Unakoti",
        "Guwahati → Dharmanagar",
        "Long train or road transfer, often 8–10 hours; stay near Dharmanagar.",
        1600,
        "Transfer day. Check your onward shared vehicle and keep the evening free.",
        true,
      ],
      [
        "Unakoti",
        "Dharmanagar → Unakoti",
        "Road transfer to the site, about 1–2 hours each way.",
        350,
        "Explore the carvings with a local guide; do not touch the sculptures and follow site access rules.",
        true,
      ],
      [
        "Unakoti",
        "Kailashahar and local food",
        "Local shared auto around Kailashahar.",
        250,
        "Take a slower day in Kailashahar and try Tripuri cuisine with a local host.",
        true,
      ],
      [
        "Unakoti",
        "Dharmanagar → Guwahati",
        "Return train or road transfer; reserve a full travel day.",
        1600,
        "Return travel day; avoid tight same-day connections.",
        false,
      ],
    ],
    extra: [
      "Unakoti",
      "Kailashahar buffer day",
      "Local shared auto.",
      250,
      "Use this as a buffer for transport or a second guided visit to the archaeological site.",
      true,
    ],
  },
};

export function chosenRoute(hub, interests, preferred, duration) {
  if (preferred === "Shillong" || preferred === "Dawki & Umngot")
    return routePlans.shillong;
  if (preferred === "Kaziranga") return routePlans.kaziranga;
  if (preferred === "Majuli") return routePlans.majuli;
  if (preferred === "Ziro Valley") return routePlans.ziro;
  if (preferred === "Gangtok") return routePlans.gangtok;
  if (preferred === "Lachung") return routePlans.lachung;
  if (preferred === "Loktak Lake") return routePlans.loktak;
  if (preferred === "Dzükōu Valley") return routePlans.dzukou;
  if (preferred === "Reiek") return routePlans.reiek;
  if (preferred === "Unakoti") return routePlans.unakoti;
  if (preferred === "Tawang")
    return {
      ...routePlans.ziro,
      hub: hub,
      min: 6,
      name: hub + " → Dirang → Tawang",
      days: [
        [
          "Tawang",
          hub + " → Dirang / Bomdila",
          "Break the long approach here; do not attempt Guwahati to Tawang in one day.",
          1800,
          "Transfer day. Check current road and weather advice with your driver.",
          true,
        ],
        [
          "Tawang",
          "Dirang / Bomdila → Tawang",
          "Mountain road, about 5–7 hours depending on stops and pass conditions.",
          900,
          "Reach Tawang, rest and acclimatize; only make a nearby stop if daylight allows.",
          true,
        ],
        [
          "Tawang",
          "Tawang Monastery and town",
          "Local taxi around town.",
          250,
          "Visit Tawang Monastery respectfully and explore the market at an easy pace.",
          true,
        ],
        [
          "Tawang",
          "Highland excursion with local driver",
          "Use a local driver and check permit coverage and road status.",
          700,
          "Choose only a currently open and permitted highland stop; keep the return flexible.",
          true,
        ],
        [
          "Tawang",
          "Tawang → Dirang / Bomdila",
          "Mountain road return, about 5–7 hours.",
          900,
          "Begin the return in daylight and avoid driving after dark.",
          true,
        ],
        [
          "Tawang",
          "Dirang / Bomdila → " + hub,
          "Long road return to " +
            hub +
            ", roughly 8–10 hours; full transfer day.",
          1800,
          "Return with a large road buffer and no tight same-day onward connection.",
          false,
        ],
      ],
      extra: [
        "Tawang",
        "Tawang rest and culture day",
        "Local taxi around town.",
        250,
        "Use a buffer day for acclimatization, a monastery visit or weather changes.",
        true,
      ],
    };
  if (hub === "Bagdogra")
    return duration >= 5 && interests.includes("Adventure")
      ? routePlans.lachung
      : routePlans.gangtok;
  if (hub === "Dibrugarh")
    return interests.some((x) => x === "Culture" || x === "Offbeat") ||
      duration >= 5
      ? routePlans.ziro
      : routePlans.majuli;
  if (hub === "Imphal") return routePlans.loktak;
  if (interests.includes("Wildlife")) return routePlans.kaziranga;
  if (interests.includes("Culture") && duration >= 4) return routePlans.majuli;
  return routePlans.shillong;
}

export function makeItinerary(
  destinations,
  hub,
  duration,
  month,
  interests,
  preferred,
) {
  const route = chosenRoute(hub, interests, preferred, duration),
    template = route.days.map((x) => x.slice());
  while (template.length < duration)
    template.splice(Math.max(0, template.length - 1), 0, route.extra);
  const chargedPermits = new Set();
  const days = template.slice(0, duration).map((x, i) => {
    const d = destinations.find((y) => y.name === x[0]) || destinations[0],
      permitCost =
        d.permit !== "none" && !chargedPermits.has(d.state)
          ? (chargedPermits.add(d.state), d.permit === "ilp" ? 250 : 350)
          : 0;
    const costs = calculateDayCosts({
      dailyBudget: d.budget,
      fare: x[3],
      overnight: x[5],
      permitCost,
    });
    return {
      destination: d,
      title: x[1],
      transfer: x[2],
      fare: x[3],
      activity: x[4],
      overnight: x[5],
      day: i + 1,
      ...costs,
    };
  });
  const total = days.reduce(
    (sum, d) =>
      sum + d.stay + d.meals + d.transport + d.activities + d.permitCost,
    0,
  );
  return {
    days,
    total,
    route: route.name,
    minDays: route.min,
    hub: hub,
    month: month,
  };
}

export function minimumTripBudget(days, dailyCosts, fixedCosts = 0) {
  return (
    Math.max(0, Math.round(days)) * Math.max(0, dailyCosts) +
    Math.max(0, fixedCosts)
  );
}

export { calculateDayCosts };
