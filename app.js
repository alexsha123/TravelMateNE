import { calculateDayCosts } from './planner-rules.mjs';

const fallbackDestinations = [
  {name:'Shillong',state:'Meghalaya',district:'East Khasi Hills',description:'Café culture, pine air and lively hill-town energy.',image:'photo-1500530855697-b586d89ba3ee',budget:2200,airport:'Shillong Airport (Umroi) / Guwahati',rail:'Guwahati',vibes:['Culture','Food','Budget'],seasons:['Autumn','Winter','Spring'],gem:false,permit:'none',network:'Strong in town; patchy outside the city.',atm:'Easy in town; carry cash for day trips.',transport:'Shared sumos to Cherrapunji (₹100–250); ASTC buses and shared cabs in town; Dawki cab roughly ₹2,500–3,500 one way.',dishes:['Jadoh','Dohneiiong','Tungrymbai'],etiquette:'Ask before photographing people or sacred groves. Remove shoes where requested and follow local guides on community land.',descriptionLong:'The capital of Meghalaya pairs a relaxed café scene with living Khasi culture and easy access to waterfalls, caves and forest walks.'},
  {name:'Dawki & Umngot',state:'Meghalaya',district:'West Jaintia Hills',description:'Glass-clear river days at the Bangladesh border.',image:'photo-1500375592092-40eb2168fd21',budget:1800,airport:'Guwahati Airport (Gau)',rail:'Guwahati',vibes:['Offbeat','Adventure','Budget'],seasons:['Winter','Spring'],gem:true,permit:'none',network:'Intermittent near the river; download maps first.',atm:'Very limited. Withdraw cash in Shillong or Jowai.',transport:'Shared Sumo from Shillong (₹250–400); local boats from ₹500; Shillong–Dawki cab about ₹3,000 one way.',dishes:['Jadoh','Pumaloi','Grilled river fish'],etiquette:'Keep the river pristine, wear a life jacket on boats, and respect village customs near the border.',descriptionLong:'A slow river escape where clear water, limestone cliffs and nearby border villages make the journey part of the experience.'},
  {name:'Kaziranga',state:'Assam',district:'Golaghat',description:'Grassland safaris in one-horned rhino country.',image:'photo-1511497584788-876760111969',budget:2600,airport:'Jorhat (Rowriah) / Guwahati',rail:'Furkating / Jorhat Town',vibes:['Wildlife','Adventure'],seasons:['Winter','Spring'],gem:false,permit:'none',network:'Good near lodges; weak inside the park.',atm:'ATMs in Kohora and Bokakhat; carry cash for park fees.',transport:'ASTC buses from Guwahati; shared sumos from Jorhat; safari jeeps from ₹3,500 per vehicle.',dishes:['Masor tenga','Duck curry','Pitha'],etiquette:'Follow park rules, keep voices low and never feed wildlife. Safari zones and timings are managed by park authorities.',descriptionLong:'A UNESCO-listed floodplain landscape known for wild rhinos, elephants and memorable dawn safaris across riverine grassland.'},
  {name:'Majuli',state:'Assam',district:'Majuli',description:'River-island monasteries, mask makers and slow days.',image:'photo-1470770841072-f978cf4d019e',budget:1700,airport:'Jorhat (Rowriah)',rail:'Jorhat Town',vibes:['Culture','Offbeat','Budget','Food'],seasons:['Winter','Autumn'],gem:true,permit:'none',network:'Mostly reliable in Kamalabari; patchy in villages.',atm:'A few ATMs; carry cash as ferry schedules can shift.',transport:'Ferries from Nimati Ghat (₹15–50 passenger); rented bicycle or shared auto (₹300–700/day).',dishes:['Pork with bamboo shoot','Apong rice beer','Ali Aye Ligang pitha'],etiquette:'Dress modestly at satras, remove shoes indoors and ask before taking photos of performances or prayer spaces.',descriptionLong:'The world’s largest river island is a place for satra heritage, hand-made masks, Mising hospitality and unhurried ferry crossings.'},
  {name:'Tawang',state:'Arunachal Pradesh',district:'Tawang',description:'High-altitude monasteries beneath the eastern Himalaya.',image:'photo-1464822759023-fed622ff2c3b',budget:3200,airport:'Tezpur / Guwahati',rail:'Rangapara North',vibes:['Culture','Adventure'],seasons:['Spring','Autumn'],gem:false,permit:'ilp',network:'BSNL and Jio pockets in town; no signal on some passes.',atm:'Limited ATMs in town; carry cash for villages and road stops.',transport:'Shared Sumo from Tezpur (₹1,000–1,500); Guwahati–Tawang shared taxi around ₹2,000–3,000.',dishes:['Thukpa','Momos','Zan'],etiquette:'Tawang is a sacred Monpa centre. Dress respectfully at monasteries, walk clockwise around chortens and ask before photographing rituals.',descriptionLong:'A dramatic mountain route leads to Tawang’s great monastery, high passes and warm Monpa culture. Build in buffer time for road conditions.'},
  {name:'Ziro Valley',state:'Arunachal Pradesh',district:'Lower Subansiri',description:'Apatani heritage, rice fields and pine-lined trails.',image:'photo-1472396961693-142e6e269027',budget:2400,airport:'Lilabari / Itanagar (Donyi Polo)',rail:'Naharlagun',vibes:['Culture','Offbeat','Food'],seasons:['Spring','Autumn'],gem:true,permit:'ilp',network:'Patchy in villages; some stays offer Wi-Fi.',atm:'Limited ATMs in Hapoli; take cash from Itanagar.',transport:'Shared Sumo from Itanagar (₹500–800); local taxis or cycle hire (₹300–700/day).',dishes:['Pika pila','Smoked pork','Apong rice beer'],etiquette:'Ask permission before entering private farms or photographing people. Respect community forest and fishing rules.',descriptionLong:'The Apatani plateau is known for its distinct living culture, terraced fields, bamboo craft and pine forest walks.'},
  {name:'Dzükōu Valley',state:'Nagaland',district:'Kohima',description:'A high valley of seasonal flowers and quiet trails.',image:'photo-1464278533981-50106e6176b1',budget:2100,airport:'Dimapur',rail:'Dimapur',vibes:['Adventure','Offbeat'],seasons:['Summer','Autumn'],gem:true,permit:'ilp',network:'No dependable signal on trail; arrange meeting points.',atm:'No ATMs on trail. Carry cash from Kohima.',transport:'Shared taxi to Viswema (₹200–350); guide/porter negotiable; entry and hut charges paid locally.',dishes:['Smoked pork','Galho','Axone curry'],etiquette:'Use designated trails, pack out all waste and follow local entry rules. Weather can change quickly at altitude.',descriptionLong:'A beautiful high-altitude trek reached from Kohima, with rolling grassland and seasonal blooms. Local entry and guide requirements can change.'},
  {name:'Loktak Lake',state:'Manipur',district:'Bishnupur',description:'Floating phumdis and a lake that moves with light.',image:'photo-1500534623283-312aade485b7',budget:1900,airport:'Imphal (Bir Tikendrajit)',rail:'Dimapur (long onward road journey)',vibes:['Wildlife','Offbeat','Culture'],seasons:['Winter','Autumn'],gem:true,permit:'ilp',network:'Good near Moirang; variable at lake viewpoints.',atm:'ATMs in Moirang and Imphal; limited on the lake.',transport:'Shared taxi Imphal–Moirang (₹100–200); local boat rides from ₹500–1,500.',dishes:['Eromba','Nga-thongba','Singju'],etiquette:'Choose community-approved boat operators and avoid stepping on or littering floating wetlands.',descriptionLong:'Loktak is South Asia’s largest freshwater lake, with floating phumdi wetlands and the remarkable Keibul Lamjao National Park.'},
  {name:'Reiek',state:'Mizoram',district:'Mamit',description:'A forested peak with Mizo village life nearby.',image:'photo-1511497584788-876760111969',budget:1600,airport:'Lengpui (Aizawl)',rail:'Silchar (onward road journey)',vibes:['Offbeat','Adventure','Budget'],seasons:['Winter','Spring'],gem:true,permit:'ilp',network:'Good near Aizawl; limited on the hill.',atm:'Withdraw in Aizawl before heading out.',transport:'Shared sumo from Aizawl to Reiek (₹150–250); taxi roughly ₹1,500–2,000 return.',dishes:['Bai','Sawhchiar','Misa mach poora'],etiquette:'Mizoram observes a strong community ethic. Ask before photographing people and be mindful of local Sunday quiet and church services.',descriptionLong:'A peaceful forested ridge and heritage village that make an easy, rewarding day out from Aizawl.'},
  {name:'Unakoti',state:'Tripura',district:'Unakoti',description:'Ancient rock carvings hidden in a green hillside.',image:'photo-1470770841072-f978cf4d019e',budget:1500,airport:'Agartala (Maharaja Bir Bikram)',rail:'Kumarghat / Dharmanagar',vibes:['Culture','Offbeat','Budget'],seasons:['Winter','Spring'],gem:true,permit:'none',network:'Generally available near Kailashahar; uneven at the site.',atm:'ATMs in Kailashahar; carry small notes for transport.',transport:'Train to Kumarghat then shared auto; Agartala–Unakoti cab roughly ₹3,000–4,000 one way.',dishes:['Mui borok','Chakhwi','Wahan mosdeng'],etiquette:'Treat the carvings as a living sacred site. Avoid touching sculptures and follow local signage.',descriptionLong:'A striking archaeological landscape of monumental Shaivite rock reliefs and stone figures tucked into forested hills.'},
  {name:'Gangtok',state:'Sikkim',district:'Gangtok',description:'Mountain-town energy, monastery bells and momos.',image:'photo-1519681393784-d120267933ba',budget:2400,airport:'Pakyong / Bagdogra',rail:'New Jalpaiguri (NJP)',vibes:['Food','Culture','Adventure'],seasons:['Spring','Autumn','Winter'],gem:false,permit:'none',network:'Strong in town; variable on mountain routes.',atm:'Good ATM access in Gangtok; carry cash for remote excursions.',transport:'Shared taxi from NJP/Bagdogra (₹400–800 seat); local shared jeeps (₹50–300).',dishes:['Momos','Thukpa','Phagshapa'],etiquette:'Remove shoes in monasteries and ask before photographing. Carry ID for permits on restricted excursions.',descriptionLong:'Sikkim’s lively capital is a comfortable base for monastery visits, mountain views and day trips into the eastern Himalaya.'},
  {name:'Lachung',state:'Sikkim',district:'Mangan',description:'A mountain village on the way to Yumthang Valley.',image:'photo-1464822759023-fed622ff2c3b',budget:3400,airport:'Pakyong / Bagdogra',rail:'New Jalpaiguri (NJP)',vibes:['Adventure','Offbeat'],seasons:['Spring','Autumn'],gem:true,permit:'pap',network:'Unreliable beyond Mangan; expect long offline stretches.',atm:'No reliable ATM in Lachung. Carry enough cash from Gangtok.',transport:'Permit-linked shared jeep package from Gangtok (₹3,500–5,000/person, usually 2D/1N).',dishes:['Momos','Thukpa','Gundruk soup'],etiquette:'Carry original photo ID for permit checks. Follow guide instructions and leave high-altitude meadows untouched.',descriptionLong:'A remote mountain settlement and overnight base for Yumthang. Access is regulated and depends on road and weather conditions.'}
];

let destinations = fallbackDestinations;
let supabaseClient = null;
let supabaseReady = false;
let authUser = null;
let currentAuthMode = 'login';
let favoriteDestinationNames = new Set();
let noticeTimer = null;
const modalReturnFocus = new Map();
let mapLibraryPromise = null;
let mapInitObserver = null;
const states=[...new Set(destinations.map(d=>d.state))];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const imageUrl=(id,w=800)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const destinationPhotography = {
  "Shillong": {src: "/assets/images/destinations/shillong.webp", author: "ChanduBandi", title: "Aerial view of Shillong Meghalaya India", source: "https://commons.wikimedia.org/wiki/File:Aerial_view_of_Shillong_Meghalaya_India.jpg", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", alt: "Aerial view of Shillong’s green hills and city."},
  "Dawki & Umngot": {src: "/assets/images/destinations/dawki-umngot.webp", author: "ANKAN", title: "Dawki Bridge and Umngot River", source: "https://commons.wikimedia.org/wiki/File:Dawki_Bridge_and_Umngot_River.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", alt: "Clear turquoise water on the Umngot River at Dawki."},
  "Kaziranga": {src: "/assets/images/destinations/kaziranga.webp", author: "Juin das", title: "One horned rhinoceros, Kaziranga National Park", source: "https://commons.wikimedia.org/wiki/File:One_horned_rhinoceros,_Kaziranga_National_Park.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", alt: "One-horned rhinoceros in Kaziranga National Park."},
  "Majuli": {src: "/assets/images/destinations/majuli.webp", author: "BhuyanBhaskar", title: "Samaguri Satra, located on the Majuli river island in Assam", source: "https://commons.wikimedia.org/wiki/File:Samaguri_Satra,_located_on_the_Majuli_river_island_in_Assam.jpg", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", alt: "Samaguri Satra on Majuli river island."},
  "Tawang": {src: "/assets/images/destinations/tawang.webp", author: "Trideep Dutta Photography", title: "The Tawang Monastery", source: "https://commons.wikimedia.org/wiki/File:The_Tawang_Monastery.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", alt: "Tawang Monastery set against the Himalayan landscape."},
  "Ziro Valley": {src: "/assets/images/destinations/ziro-valley.webp", author: "Kuntal Narayan Chaudhuri", title: "Apatani Rice Paddies", source: "https://commons.wikimedia.org/wiki/File:Apatani_Rice_Paddies.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", alt: "Apatani rice paddies in Ziro Valley.", modification: "Resized to WebP for this site"},
  "Dzükōu Valley": {src: "/assets/images/destinations/dzukou-valley.webp", author: "SeethaG", title: "Dzukou valley in the Nagaland-Manipur border", source: "https://commons.wikimedia.org/wiki/File:Dzukou_valley_in_the_Nagaland-Manipur_border.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", alt: "Rolling green grassland in Dzükōu Valley."},
  "Loktak Lake": {src: "/assets/images/destinations/loktak-lake.webp", author: "ch_15march", title: "Loktak Lake Manipur 06", source: "https://commons.wikimedia.org/wiki/File:Loktak_Lake_Manipur_06.jpg", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", alt: "Floating phumdis on Loktak Lake in Manipur."},
  "Reiek": {src: "/assets/images/destinations/reiek.webp", author: "Coolcolney", title: "Reiek Heritage Village", source: "https://commons.wikimedia.org/wiki/File:Reiek_Heritage_Village.JPG", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", alt: "Traditional houses at Reiek Heritage Village."},
  "Unakoti": {src: "/assets/images/destinations/unakoti.webp", author: "Barunghosh", title: "Unakoti 1", source: "https://commons.wikimedia.org/wiki/File:Unakoti_1.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", alt: "Ancient stone relief carved into the Unakoti hillside."},
  "Gangtok": {src: "/assets/images/destinations/gangtok.webp", author: "Subhrajyoti07", title: "View of Gangtok city from Ropeway", source: "https://commons.wikimedia.org/wiki/File:View_of_Gangtok_city_from_Ropeway.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", alt: "Hillside view across Gangtok from the ropeway."},
  "Lachung": {src: "/assets/images/destinations/lachung.webp", author: "Amitabha Gupta", title: "Landscape on the way to Yumthang Valley from Lachung, North Sikkim, India 06", source: "https://commons.wikimedia.org/wiki/File:Landscape_on_the_way_to_Yumthang_Valley_from_Lachung,_North_Sikkim,_India_06.jpg", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", alt: "Mountain landscape along the road from Lachung toward Yumthang Valley."}
};
function destinationImageSrc(d,w=800){const photo=destinationPhotography[d.name];if(photo)return photo.src;return typeof d.image==='string'&&d.image.startsWith('/assets/images/destinations/')?d.image:imageUrl(d.image,w);}
function destinationCardImageSrc(d){const source=destinationImageSrc(d,800);return destinationPhotography[d.name]?source.replace(/\.webp$/,'-card.webp'):source;}
function photoCreditMarkup(d){const p=destinationPhotography[d.name];return p?`<p class="image-credit">Photo: <a href="${p.source}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.author)}</a> · <a href="${p.licenseUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.license)}</a>${p.modification?` · ${escapeHtml(p.modification)}`:''}</p>`:'';}
function renderPhotoCredits(){const list=$('#photo-credit-list');if(!list)return;list.innerHTML=Object.entries(destinationPhotography).map(([name,p])=>`<li><strong>${escapeHtml(name)}</strong><span><a href="${p.source}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a> · Photo by ${escapeHtml(p.author)} · <a href="${p.licenseUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.license)}</a>${p.modification?` · ${escapeHtml(p.modification)}`:''}</span></li>`).join('');}
const heroQuotes={
  'Shillong':'A little mist, a lot of character.',
  'Dawki & Umngot':'Clear water, limestone and a slower day.',
  'Kaziranga':'Grasslands wake with the wild.',
  'Majuli':'Island mornings move to a different rhythm.',
  'Tawang':'Monastery bells beneath high Himalayan skies.',
  'Ziro Valley':'Terraced fields shaped by Apatani heritage.',
  'Dzükōu Valley':'Walk into a valley that opens underfoot.',
  'Loktak Lake':'Floating islands drift with the light.',
  'Reiek':'Forest trails meet a warm Mizo welcome.',
  'Unakoti':'Ancient stone stories in a green hillside.',
  'Gangtok':'Monastery bells, hillside lanes and mountain air.',
  'Lachung':'A quiet village on the road into the high Himalaya.'
};
const heroSlides=fallbackDestinations.filter(d=>destinationPhotography[d.name]).map(d=>({name:d.name,state:d.state,quote:heroQuotes[d.name],photo:destinationPhotography[d.name]}));
let heroSlideIndex=0,heroActiveLayer='a',heroAutoplayTimer=0,heroInteractionTimer=0,heroRequestId=0;
const heroPauseReasons=new Set();
function heroSlideImageUrls(slide){const desktop=slide.photo.src,mobile=desktop.replace(/\.webp$/,'-hero-mobile.webp');return {desktop,mobile};}
function updateHeroSlideContent(slide){
  $('#hero-slide-location').textContent=`${slide.name} · ${slide.state}`;
  $('#hero-slide-quote').textContent=slide.quote;
  $('#hero-slide-open').setAttribute('aria-label',`Open ${slide.name}, ${slide.state} destination details`);
  $('#hero-slide-credit').innerHTML=`Photo: <a href="${slide.photo.source}" target="_blank" rel="noopener noreferrer">${escapeHtml(slide.photo.author)}</a> · <a href="${slide.photo.licenseUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(slide.photo.license)}</a>${slide.photo.modification?` · ${escapeHtml(slide.photo.modification)}`:''}`;
  $$('#hero-slide-dots button').forEach((dot,index)=>{const active=index===heroSlideIndex;dot.classList.toggle('active',active);dot.setAttribute('aria-pressed',String(active));dot.setAttribute('aria-current',active?'true':'false');});
}
function preloadHeroImage(slide){const urls=heroSlideImageUrls(slide),image=new Image();image.srcset=`${urls.mobile} 960w, ${urls.desktop} 1600w`;image.sizes='(max-width: 650px) 100vw, 52vw';image.src=urls.desktop;}
function setHeroSlide(index,{announce=true}={}){
  if(!heroSlides.length)return;
  const nextIndex=(index+heroSlides.length)%heroSlides.length,slide=heroSlides[nextIndex],urls=heroSlideImageUrls(slide),incomingLayer=heroActiveLayer==='a'?'b':'a',incoming=$(`#hero-image-${incomingLayer}`),requestId=++heroRequestId;let settled=false;
  incoming.classList.remove('is-active');incoming.onload=null;incoming.onerror=null;
  incoming.onload=()=>{
    if(settled||requestId!==heroRequestId)return;settled=true;
    $('#hero-slideshow').classList.remove('hero-photo-unavailable');
    incoming.classList.add('is-active');$(`#hero-image-${heroActiveLayer}`).classList.remove('is-active');heroActiveLayer=incomingLayer;heroSlideIndex=nextIndex;updateHeroSlideContent(slide);
    const next=heroSlides[(nextIndex+1)%heroSlides.length];preloadHeroImage(next);
    if(announce)$('#hero-slideshow').setAttribute('aria-label',`North East destinations. ${slide.name}, ${slide.state}. Slide ${nextIndex+1} of ${heroSlides.length}.`);
  };
  incoming.onerror=()=>{if(!settled&&requestId===heroRequestId){settled=true;console.warn(`Hero photograph could not be loaded for ${slide.name}; keeping the current slide.`);if(!$('#hero-image-a').naturalWidth&&!$('#hero-image-b').naturalWidth)$('#hero-slideshow').classList.add('hero-photo-unavailable');}};
  incoming.setAttribute('srcset',`${urls.mobile} 960w, ${urls.desktop} 1600w`);incoming.setAttribute('sizes','(max-width: 650px) 100vw, 52vw');incoming.src=urls.desktop;
  if(incoming.complete&&incoming.naturalWidth)incoming.onload();
}
function pauseHeroAutoplay(reason){heroPauseReasons.add(reason);clearTimeout(heroAutoplayTimer);heroAutoplayTimer=0;}
function scheduleHeroAutoplay(){clearTimeout(heroAutoplayTimer);if(heroPauseReasons.size||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;heroAutoplayTimer=setTimeout(()=>{setHeroSlide(heroSlideIndex+1);scheduleHeroAutoplay();},5000);}
function markHeroInteraction(){pauseHeroAutoplay('interaction');clearTimeout(heroInteractionTimer);heroInteractionTimer=setTimeout(()=>{heroPauseReasons.delete('interaction');scheduleHeroAutoplay();},7000);}
function initializeHeroSlideshow(){
  const region=$('#hero-slideshow');if(!region||!heroSlides.length)return;
  const initial=heroSlides[heroSlideIndex],urls=heroSlideImageUrls(initial),image=$('#hero-image-a');
  image.onerror=()=>{if(!image.naturalWidth)region.classList.add('hero-photo-unavailable');};image.onload=()=>region.classList.remove('hero-photo-unavailable');image.srcset=`${urls.mobile} 960w, ${urls.desktop} 1600w`;image.sizes='(max-width: 650px) 100vw, 52vw';image.src=urls.desktop;updateHeroSlideContent(initial);
  $('#hero-slide-dots').innerHTML=heroSlides.map((slide,index)=>`<button type="button" aria-label="Show ${escapeHtml(slide.name)}, ${escapeHtml(slide.state)}" aria-pressed="${index===heroSlideIndex}" aria-current="${index===heroSlideIndex?'true':'false'}" class="${index===heroSlideIndex?'active':''}" data-hero-index="${index}"></button>`).join('');
  $('#hero-slide-prev').addEventListener('click',()=>{markHeroInteraction();setHeroSlide(heroSlideIndex-1);});$('#hero-slide-next').addEventListener('click',()=>{markHeroInteraction();setHeroSlide(heroSlideIndex+1);});
  $('#hero-slide-dots').addEventListener('click',event=>{const dot=event.target.closest('[data-hero-index]');if(dot){markHeroInteraction();setHeroSlide(Number(dot.dataset.heroIndex));}});
  $('#hero-slide-open').addEventListener('click',()=>{markHeroInteraction();openDestination(heroSlides[heroSlideIndex].name);});
  region.addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='ArrowLeft'){event.preventDefault();markHeroInteraction();setHeroSlide(heroSlideIndex-1);}else if(event.key==='ArrowRight'){event.preventDefault();markHeroInteraction();setHeroSlide(heroSlideIndex+1);}});
  let touchStart=null;region.addEventListener('touchstart',event=>{if(event.touches.length===1)touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});region.addEventListener('touchend',event=>{if(!touchStart)return;const dx=event.changedTouches[0].clientX-touchStart.x,dy=event.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)){markHeroInteraction();setHeroSlide(heroSlideIndex+(dx<0?1:-1));}},{passive:true});
  region.addEventListener('mouseenter',()=>pauseHeroAutoplay('hover'));region.addEventListener('mouseleave',()=>{heroPauseReasons.delete('hover');scheduleHeroAutoplay();});region.addEventListener('focusin',()=>pauseHeroAutoplay('focus'));region.addEventListener('focusout',event=>{if(!region.contains(event.relatedTarget)){heroPauseReasons.delete('focus');scheduleHeroAutoplay();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseHeroAutoplay('hidden');else{heroPauseReasons.delete('hidden');scheduleHeroAutoplay();}});
  const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)'),syncMotion=()=>{if(motionPreference.matches)pauseHeroAutoplay('reduced-motion');else{heroPauseReasons.delete('reduced-motion');scheduleHeroAutoplay();}};syncMotion();motionPreference.addEventListener?.('change',syncMotion);
  preloadHeroImage(heroSlides[(heroSlideIndex+1)%heroSlides.length]);scheduleHeroAutoplay();
}
const filterValues={search:'',state:'all',vibe:'all',season:'all'};


function populateStateFilter(){const el=$('#state-filter');states.forEach(s=>el.add(new Option(s,s)));}
function cardMarkup(d){
  const saved=favoriteDestinationNames.has(d.name),fullImage=destinationImageSrc(d,1200),cardImage=destinationCardImageSrc(d),responsive=destinationPhotography[d.name]?`srcset="${cardImage} 800w, ${fullImage} 1600w" sizes="(max-width: 650px) calc(100vw - 52px), (max-width: 900px) 40vw, 350px"`:'';
  return `<article class="destination-card" tabindex="0" data-destination="${escapeHtml(d.name)}"><div class="destination-image"><img loading="lazy" src="${cardImage}" ${responsive} onerror="this.onerror=null;this.src='/assets/images/destinations/fallback.svg'" alt="${escapeHtml(destinationPhotography[d.name]?.alt||`Landscape near ${d.name}`)}" decoding="async"/><span class="destination-state">${escapeHtml(d.state)}</span>${d.gem?'<span class="gem-badge">✦ HIDDEN GEM</span>':''}<button class="heart-button ${saved?'saved':''}" aria-label="${saved?'Remove':'Save'} ${escapeHtml(d.name)}" aria-pressed="${saved}">${saved?'♥':'♡'}</button></div><div class="destination-body"><div class="destination-title-row"><h3>${escapeHtml(d.name)}</h3><span class="daily-budget"><b>₹${Number(d.budget).toLocaleString('en-IN')}</b> / day</span></div><p>${escapeHtml(d.description)}</p><div class="card-meta"><div class="tag-list">${d.vibes.slice(0,2).map(v=>`<span class="mini-tag">${escapeHtml(v)}</span>`).join('')}</div><span class="card-arrow">↗</span></div></div></article>`;
}
function renderDestinations(){const list=destinations.filter(d=>d.name.toLowerCase().includes(filterValues.search)||d.state.toLowerCase().includes(filterValues.search)).filter(d=>filterValues.state==='all'||d.state===filterValues.state).filter(d=>filterValues.vibe==='all'||d.vibes.includes(filterValues.vibe)).filter(d=>filterValues.season==='all'||d.seasons.includes(filterValues.season));$('#destination-grid').innerHTML=list.map(cardMarkup).join('');$('#destination-grid').hidden=!list.length;$('#empty-state').hidden=!!list.length;$('#result-count').textContent=`Showing ${list.length} destination${list.length===1?'':'s'}`;const active=Object.entries(filterValues).filter(([_,v])=>v&&v!=='all').map(([k,v])=>k==='search'?`“${v}”`:v);const chips=active.map(value=>{const chip=document.createElement('span');chip.className='filter-chip';chip.textContent=value;return chip;});$('#filter-chips').replaceChildren(...chips);$('#clear-filters').classList.toggle('visible',active.length>0);}
function permitInfo(d){if(d.permit==='ilp'){const note=d.state==='Arunachal Pradesh'?'Indian citizens from outside Arunachal need an ILP; foreign nationals need the applicable PAP/RAP. Check current eligibility, validity and entry checkpoints on the official portal.':d.state==='Nagaland'?'Visitors from outside Nagaland need an ILP. Permit category, documents and fees depend on visitor status; foreign visitors should also check whether a PAP applies.':d.state==='Mizoram'?'Non-indigenous visitors generally require an ILP; the state portal lists exceptions and application categories. Confirm current requirements before travel.':'Indian citizens who are not indigenous or permanent residents of Manipur need an ILP. Confirm current documents, fees and entry rules on the official portal.';return ['ILP CHECK REQUIRED','permit-required',note+' Carry valid photo ID.'];}if(d.permit==='pap')return ['PAP / ROUTE PERMIT','permit-check','Lachung and other restricted North Sikkim routes require advance permits. Requirements differ for Indian and foreign visitors and can change with road conditions; check Sikkim Tourism guidance and arrange required permits through an authorized operator. Carry original photo ID.'];return ['NO SPECIAL PERMIT LISTED','permit-none','No special permit is listed for this destination in this guide. Rules can vary by nationality, route and current orders; verify with the official tourism authority before departure. Carry valid photo ID.'];}
function permitLink(d){if(d.state==='Arunachal Pradesh')return ['Official Arunachal eILP portal','https://eilp.arunachal.gov.in/'];if(d.state==='Nagaland')return ['Official Nagaland ILP portal','https://ilp.nagaland.gov.in/'];if(d.state==='Mizoram')return ['Official Mizoram ILP portal','https://ilp.mizoram.gov.in/'];if(d.state==='Manipur')return ['Official Manipur ILP portal','https://manipurilponline.mn.gov.in/'];if(d.state==='Sikkim')return ['Sikkim Tourism permit information','https://www.sikkimtourism.gov.in/rap'];return ['Official state tourism information','https://tourism.gov.in/'];}
const defaultColumns={destinations:{budget:'daily_budget',vibes:'vibes',seasons:'seasons',latitude:'latitude',longitude:'longitude',details:'details'},profiles:{id:'id',username:'username'},favorites:{userId:'user_id',destinationId:'destination_id'},itineraries:{id:'id',userId:'user_id',title:'title',hub:'hub',month:'travel_month',duration:'duration',totalBudget:'total_budget',estimatedCost:'estimated_cost',plan:'plan'}};
function tableName(key){return (window.TRAVELMATENE_SUPABASE?.tables||{})[key]||key;}
function dbColumn(table,key){return (window.TRAVELMATENE_SUPABASE?.columns?.[table]||{})[key]||defaultColumns[table][key];}
function configuredSupabase(){const c=window.TRAVELMATENE_SUPABASE||{};return !!(c.url&&c.publishableKey&&!c.url.includes('YOUR_PROJECT')&&!c.publishableKey.includes('YOUR_'));}
function isSafeSupabaseUrl(value){try{const url=new URL(value),loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);return !url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/'&&(url.protocol==='https:'||(url.protocol==='http:'&&loopback));}catch{return false;}}
function safeAuthRedirectUrl(){const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);if(location.protocol!=='https:'&&!(location.protocol==='http:'&&local))return null;return new URL(location.pathname,location.origin).href;}
function isAdministrativeKey(key){if(/^sb_secret_/i.test(key))return true;try{const token=key.split('.')[1],payload=JSON.parse(atob(token.replace(/-/g,'+').replace(/_/g,'/')));return payload.role==='service_role';}catch{return false;}}
function notify(message,type='info'){const el=$('#app-notice');if(!el)return;el.textContent=message;el.className='app-notice '+type;el.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.hidden=true,5500);}
function authMessage(message,isError=false){const el=$('#auth-message');el.textContent=message;el.classList.toggle('error',isError);}
function showAppModal(id,focusSelector){const modal=$('#'+id);if(!modal)return;modalReturnFocus.set(id,document.activeElement);modal.hidden=false;document.body.style.overflow='hidden';const target=focusSelector?modal.querySelector(focusSelector):modal.querySelector('[role=dialog]');target?.focus();}
function hideAppModal(id){const modal=$('#'+id);if(!modal||modal.hidden)return;modal.hidden=true;const target=modalReturnFocus.get(id);if(target?.isConnected)target.focus();modalReturnFocus.delete(id);if(!document.querySelector('.modal-backdrop:not([hidden]),.itinerary-overlay:not([hidden])'))document.body.style.overflow='';}
function trapDialogTab(event){if(event.key!=='Tab')return;const modal=['destination-modal','itinerary-overlay','auth-modal'].map(id=>$('#'+id)).find(node=>node&&!node.hidden);if(!modal)return;const dialog=modal.querySelector('[role=dialog]'),items=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(node=>node.getClientRects().length);if(!items.length){event.preventDefault();dialog.focus();return;}const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
function openAuth(mode='login',message=''){currentAuthMode=mode;setAuthMode(mode);authMessage(message);showAppModal('auth-modal','#auth-email');}
function closeAuth(){hideAppModal('auth-modal');}
function setAuthMode(mode){currentAuthMode=mode;const signup=mode==='signup';$('#auth-login-mode').classList.toggle('active',!signup);$('#auth-signup-mode').classList.toggle('active',signup);$('#auth-name-wrap').hidden=!signup;$('#auth-name').required=signup;$('#auth-password').autocomplete=signup?'new-password':'current-password';$('#auth-title').textContent=signup?'Create your account':'Welcome back.';$('#auth-submit').textContent=signup?'Create account':'Sign in';authMessage('');}
function setAuthNav(){const button=$('#auth-trigger');if(button){button.textContent=authUser?'Logout':'Login / Sign Up';if(authUser)button.setAttribute('aria-label','Logout');else button.removeAttribute('aria-label');}}
function setTripsMessage(message){const el=$('#trips-message');if(el)el.textContent=message;}
function normalizeArray(value,fallback=[]){if(Array.isArray(value))return value;if(typeof value==='string'){try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:value.replace(/^{|}$/g,'').split(',').filter(Boolean);}catch{return value.replace(/^{|}$/g,'').split(',').filter(Boolean);}}return fallback;}
function imageKey(value,fallback){if(typeof value!=='string')return fallback;if(/^\/?assets\/images\/destinations\/[A-Za-z0-9._-]+$/.test(value))return value.startsWith('/')?value:`/${value}`;const match=value.match(/photo-[A-Za-z0-9-]+/);return match?match[0]:/^photo-[A-Za-z0-9-]+$/.test(value)?value:fallback;}
function loadSupabaseLibrary(){
  if(window.supabase?.createClient)return Promise.resolve();
  return new Promise((resolve,reject)=>{const script=document.createElement('script');let settled=false;const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):window.supabase?.createClient?resolve():reject(new Error('Supabase client did not initialize.'));};const timer=setTimeout(()=>finish(new Error('Supabase client download timed out.')),8000);script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/dist/umd/supabase.js';script.integrity='sha384-A97u3Qnt9GZHURO9YJZRe7VQgGUeFzcv6I1oIGnUTxQrCxnpQMwR0/G8F2zt9abZ';script.crossOrigin='anonymous';script.async=true;script.onload=()=>finish();script.onerror=()=>finish(new Error('Supabase client could not be downloaded.'));document.head.appendChild(script);});
}
function normalizeDestination(row){
  const details=row[dbColumn('destinations','details')]||row.details||{},base=fallbackDestinations.find(d=>d.name===row.name)||{};
  const lat=Number(row[dbColumn('destinations','latitude')]??row.lat??row.latitude??details.latitude??base.coordinates?.[0]);
  const lng=Number(row[dbColumn('destinations','longitude')]??row.lng??row.longitude??details.longitude??base.coordinates?.[1]);
  const val=(names,fallback)=>{for(const name of names){if(row[name]!==undefined&&row[name]!==null)return row[name];if(details[name]!==undefined&&details[name]!==null)return details[name];}return fallback;};
  return {...base,...details,id:row.id,name:row.name||base.name,state:row.state||details.state||base.state,district:val(['district'],base.district),description:row.description||details.description||base.description,descriptionLong:val(['description_long','descriptionLong'],base.descriptionLong||row.description),budget:Number(row[dbColumn('destinations','budget')]??row.daily_budget_inr??row.budget_per_day??row.budget??details.budget??base.budget??0),vibes:normalizeArray(row[dbColumn('destinations','vibes')]??row.travel_vibes??row.vibes??details.vibes,base.vibes||[]),seasons:normalizeArray(row[dbColumn('destinations','seasons')]??row.best_seasons??row.seasons??details.seasons,base.seasons||[]),coordinates:Number.isFinite(lat)&&Number.isFinite(lng)?[lat,lng]:base.coordinates||null,image:imageKey(row.image_url||row.image||details.image,base.image||'photo-1470770841072-f978cf4d019e'),airport:val(['airport','nearest_airport'],base.airport||''),rail:val(['rail','nearest_railway','rail_hub'],base.rail||''),gem:Boolean(val(['gem','hidden_gem'],base.gem)),permit:val(['permit'],base.permit||'none'),network:val(['network','mobile_network'],base.network||'Not specified'),atm:val(['atm','atm_availability'],base.atm||'Not specified'),transport:val(['transport','local_transport'],base.transport||'Ask local operators'),dishes:normalizeArray(val(['dishes','local_dishes'],base.dishes),base.dishes||[]),etiquette:val(['etiquette','cultural_etiquette'],base.etiquette||'Ask before photographing and follow local guidance.')};
}
async function loadRemoteDestinations(){
  if(!supabaseReady)return false;
  try{
    const result=await Promise.race([supabaseClient.from(tableName('destinations')).select('*'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Destination request timed out.')),8000))]);
    if(result.error)throw result.error;
    if(!result.data?.length)throw new Error('The destination table is empty or not readable with its current policies.');
    destinations=result.data.map(normalizeDestination);renderDestinations();renderGuide($('#guide-destination').value);
    if(destinationMap){destinationMapMarkers.forEach(marker=>marker.remove());destinationMapMarkers=[];const points=[];destinations.forEach(d=>{if(!d.coordinates)return;const marker=L.marker(d.coordinates,{icon:destinationMapIcon(d),title:d.name,alt:d.name}).addTo(destinationMap);marker.bindTooltip('<strong>'+escapeHtml(d.name)+'</strong><br><span>'+escapeHtml(d.state)+' · est. ₹'+Number(d.budget).toLocaleString('en-IN')+'/day</span>');marker.on('click',()=>openDestination(d.name));destinationMapMarkers.push(marker);points.push(d.coordinates);});if(points.length)destinationMap.fitBounds(points,{padding:[28,28],maxZoom:6});}
    return true;
  }catch(error){console.warn('Supabase destinations unavailable; using bundled data.',error);notify('Could not load the destination table. Showing the built-in guide instead.','warning');return false;}
}
async function refreshFavorites(){
  favoriteDestinationNames=new Set();
  if(!supabaseReady||!authUser){renderDestinations();return;}
  const userColumn=dbColumn('favorites','userId'),destinationColumn=dbColumn('favorites','destinationId');
  try{const {data,error}=await supabaseClient.from(tableName('favorites')).select(destinationColumn).eq(userColumn,authUser.id);if(error)throw error;
    (data||[]).forEach(row=>{const ref=String(row[destinationColumn]);const d=destinations.find(item=>String(item.id??item.name)===ref);if(d)favoriteDestinationNames.add(d.name);});renderDestinations();
  }catch(error){console.warn('Could not restore favorites.',error);notify('Favorites could not be loaded. Check the favorites table columns and RLS policies.','warning');}
}
async function upsertProfile(user){
  const columns={id:dbColumn('profiles','id'),username:dbColumn('profiles','username')},payload={[columns.id]:user.id,[columns.username]:user.user_metadata?.username||user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split('@')[0]||'Traveler'};
  try{const {error}=await supabaseClient.from(tableName('profiles')).upsert(payload,{onConflict:columns.id});if(error)throw error;}
  catch(error){console.warn('Profile row was not written; check the existing profiles policy and columns.',error);notify('Signed in, but the profile could not be synced. Check the existing profiles columns and RLS policy.','warning');}
}
async function handleAuthChange(user){
  authUser=user||null;setAuthNav();
  if(authUser){await upsertProfile(authUser);await refreshFavorites();await loadSavedTrips();}
  else{favoriteDestinationNames.clear();renderDestinations();renderSavedTrips([]);setTripsMessage(supabaseReady?'Sign in to save and revisit your itineraries.':'Set up Supabase to enable private saved trips.');}
}
async function initializeSupabase(){
  if(!configuredSupabase()){setAuthNav();setTripsMessage('Add the local Supabase URL and publishable key to enable accounts and saved trips.');return;}
  const config=window.TRAVELMATENE_SUPABASE;
  if(!isSafeSupabaseUrl(config.url)){notify('Supabase was not initialized: use an HTTPS project URL (HTTP is allowed only on localhost).','error');setTripsMessage('The configured Supabase URL is not safe for browser authentication.');return;}
  if(isAdministrativeKey(config.publishableKey)){notify('Supabase was not initialized: browser configuration must use a publishable key, never a secret or service-role key.','error');setTripsMessage('The local key is not a publishable key.');return;}
  try{
    await loadSupabaseLibrary();
    supabaseClient=window.supabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    supabaseReady=true;
    const {data,error}=await supabaseClient.auth.getSession();if(error)throw error;
    handleAuthChange(data.session?.user||null);
    supabaseClient.auth.onAuthStateChange((_event,session)=>{queueMicrotask(()=>handleAuthChange(session?.user||null));});
    loadRemoteDestinations();
  }catch(error){console.error('Supabase initialization failed.',error);notify('Supabase connection failed. The explorer will continue using its built-in data.','warning');}
}
async function submitAuth(event){
  event.preventDefault();if(!supabaseReady){authMessage('Add your local Supabase URL and publishable key first.',true);return;}
  const email=$('#auth-email').value.trim(),password=$('#auth-password').value,name=$('#auth-name').value.trim(),button=$('#auth-submit');button.disabled=true;authMessage('Connecting…');
  try{
    if(currentAuthMode==='signup'){
      const options={data:{username:name}},redirectTo=safeAuthRedirectUrl();if(redirectTo)options.emailRedirectTo=redirectTo;const {data,error}=await supabaseClient.auth.signUp({email,password,options});if(error)throw error;
      if(data.session){authMessage('Account created. You are signed in.');closeAuth();}
      else authMessage('Check your email to confirm your account, then return here to sign in.');
    }else{const {error}=await supabaseClient.auth.signInWithPassword({email,password});if(error)throw error;authMessage('Signed in.');closeAuth();}
  }catch(error){authMessage(error.message||'Could not complete that request. Check your connection and try again.',true);}
  finally{button.disabled=false;}
}
async function signInWithGoogle(){
  if(!supabaseReady){authMessage('Add your local Supabase URL and publishable key first.',true);return;}
  const button=$('#auth-google');button.disabled=true;authMessage('Connecting to Google…');
  try{
    const options={},redirectTo=safeAuthRedirectUrl();if(redirectTo)options.redirectTo=redirectTo;const {error}=await supabaseClient.auth.signInWithOAuth({provider:'google',options});
    if(error)throw error;
    authMessage('Redirecting to Google…');
  }catch(error){authMessage(error.message||'Google sign-in could not start. Check the Google provider settings in Supabase and try again.',true);button.disabled=false;}
}
function consumeOAuthRedirectError(){
  const url=new URL(location.href),keys=['error','error_code','error_description'];let message='';
  for(const source of ['search','hash']){
    const raw=source==='search'?url.search.slice(1):url.hash.slice(1);if(!raw)continue;
    const params=new URLSearchParams(raw),description=params.get('error_description'),code=params.get('error_code')||params.get('error');
    if(!message&&(description||code))message=description||code;
    keys.forEach(key=>params.delete(key));
    const remaining=params.toString();if(source==='search')url.search=remaining?`?${remaining}`:'';else url.hash=remaining?`#${remaining}`:'';
  }
  if(!message)return '';
  history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  return `Google sign-in failed: ${message.slice(0,300)}`;
}
function renderGuide(name){
  const d=destinations.find(x=>x.name===name)||destinations[0];if(!d)return;
  const [badge,cls,permit]=permitInfo(d),[linkLabel,linkUrl]=permitLink(d),monsoon=['June','July','August','September'].includes($('#month-input').value);
  const warning=monsoon?'Heavy monsoon: expect landslide risk, road delays and ferry/trek disruptions. Check locally before departure.':`Best season: ${d.seasons.map(escapeHtml).join(' · ')}. Check same-day road and weather updates before setting out.`;
  $('#guide-content').innerHTML=`<article class="guide-card"><div class="guide-card-head"><span class="guide-icon">▣</span><h3>Permits & entry</h3><span class="permit-status ${cls}">${badge}</span></div><p>${escapeHtml(permit)}</p><a class="official-link" href="${linkUrl}" target="_blank" rel="noopener">${escapeHtml(linkLabel)} ↗</a></article><article class="guide-card"><div class="guide-card-head"><span class="guide-icon">⌁</span><h3>Stay connected</h3></div><div class="condition-row"><span>Mobile network</span><strong>${escapeHtml(d.network)}</strong></div><div class="condition-row"><span>ATMs & cash</span><strong>${escapeHtml(d.atm)}</strong></div></article><article class="guide-card"><div class="guide-card-head"><span class="guide-icon">☼</span><h3>Road & season</h3></div><p class="${monsoon?'condition-row warning':''}">${warning}</p><div class="condition-row"><span>Closest hubs</span><strong>${escapeHtml(d.airport)} · ${escapeHtml(d.rail)}</strong></div></article>`;
  $('#culture-content').innerHTML=`<div class="culture-heading"><span class="section-kicker">A LITTLE LOCAL KNOW-HOW</span><h3>${escapeHtml(d.name)}, thoughtfully.</h3><p>Small gestures make a better journey.</p></div><div class="culture-column"><h4>GETTING AROUND</h4><p>${escapeHtml(d.transport)}</p></div><div class="culture-column"><h4>TRY A BITE</h4><div class="dish-list">${d.dishes.map(x=>`<span class="dish-pill">${escapeHtml(x)}</span>`).join('')}</div></div><div class="culture-column"><h4>LOCAL ETIQUETTE</h4><p>${escapeHtml(d.etiquette)}</p></div>`;
}
function setTab(tab){$$('.nav-link').forEach(b=>{const selected=b.dataset.tab===tab;b.classList.toggle('active',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});const target=tab==='explore'?'explore-section':tab==='planner'?'planner-section':tab==='trips'?'trips-section':'guide-section';document.getElementById(target).scrollIntoView({behavior:'smooth',block:'start'});if(tab==='trips')loadSavedTrips();if(innerWidth<=650){$('.main-nav').classList.remove('open');$('.mobile-menu').setAttribute('aria-expanded','false');$('.mobile-menu').setAttribute('aria-label','Open navigation');}}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function openDestination(name){const d=destinations.find(x=>x.name===name);if(!d)return;const [badge,,permit]=permitInfo(d);$('#modal-content').innerHTML=`<div class="modal-hero"><img src="${destinationImageSrc(d,1200)}" onerror="this.onerror=null;this.src='/assets/images/destinations/fallback.svg'" alt="${escapeHtml(destinationPhotography[d.name]?.alt||d.name)}" decoding="async"/><span>${escapeHtml(d.district)} · ${escapeHtml(d.state)}</span></div><div class="modal-inner"><span class="section-kicker">${d.gem?'HIDDEN GEM':'NORTH EAST FAVOURITE'} · ${badge}</span><h2 id="modal-title">${escapeHtml(d.name)}</h2>${photoCreditMarkup(d)}<p>${escapeHtml(d.descriptionLong)}</p><div class="modal-stats"><span>EST. DAILY BUDGET<b>₹${Number(d.budget).toLocaleString('en-IN')} / person</b></span><span>NEAREST AIRPORT<b>${escapeHtml(d.airport)}</b></span><span>RAIL HUB<b>${escapeHtml(d.rail)}</b></span></div><h3>Worth knowing</h3><p>${escapeHtml(permit)}</p><p><b>Mobile:</b> ${escapeHtml(d.network)} <b>ATMs:</b> ${escapeHtml(d.atm)}</p><h3>Get around</h3><p>${escapeHtml(d.transport)}</p><h3>Taste & travel kindly</h3><p><b>Try:</b> ${d.dishes.map(escapeHtml).join(', ')}. ${escapeHtml(d.etiquette)}</p><button class="button button-primary modal-plan" data-destination-plan="${escapeHtml(d.name)}">Plan a trip here <span>→</span></button></div>`;showAppModal('destination-modal','.modal-close');}
function closeModal(){hideAppModal('destination-modal');}
function closeItinerary(){hideAppModal('itinerary-overlay');}
function serializeItinerary(plan,meta){
  return {version:1,route:plan.route,minDays:plan.minDays,total:plan.total,hub:meta.hub,duration:meta.duration,budget:meta.budget,month:meta.month,label:meta.label||meta.duration+'-day '+plan.route+' trip',days:plan.days.map(day=>({day:day.day,title:day.title,transfer:day.transfer,fare:day.fare,activity:day.activity,overnight:day.overnight,stay:day.stay,meals:day.meals,transport:day.transport,activities:day.activities,permitCost:day.permitCost,destination:{...day.destination}}))};
}
function renderSavedTrips(rows){
  const grid=$('#saved-trips-grid');if(!grid)return;
  if(!authUser){grid.innerHTML='';return;}
  if(!rows.length){grid.innerHTML='<p class="empty-trips">No saved itineraries yet. Generate a plan and save it here.</p>';return;}
  grid.innerHTML=rows.map(row=>{const dataCol=dbColumn('itineraries','plan'),raw=row[dataCol];let data=raw;if(typeof raw==='string'){try{data=JSON.parse(raw);}catch{data=null;}}const id=String(row[dbColumn('itineraries','id')]??row.id??'');const title=row[dbColumn('itineraries','title')]||data?.label||'Saved trip';const days=Number(row[dbColumn('itineraries','duration')]||data?.duration||data?.days?.length||0);const total=Number(row[dbColumn('itineraries','estimatedCost')]||data?.total||0);const hub=row[dbColumn('itineraries','hub')]||data?.hub||'Starting hub';const month=row[dbColumn('itineraries','month')]||data?.month||'Month';return '<article class="saved-trip-card" data-trip-id="'+escapeHtml(id)+'"><span class="section-kicker">SAVED ITINERARY · '+days+' DAYS</span><h3>'+escapeHtml(title)+'</h3><p>'+escapeHtml(hub+' · '+month)+' · Estimated ₹'+total.toLocaleString('en-IN')+'</p><div class="saved-trip-actions"><button class="button button-secondary" data-trip-open="'+escapeHtml(id)+'">Open & print</button><button class="saved-trip-delete" data-trip-delete="'+escapeHtml(id)+'">Delete</button></div></article>';}).join('');
}
async function loadSavedTrips(){
  if(!authUser||!supabaseReady){renderSavedTrips([]);return;}
  setTripsMessage('Loading your private itineraries…');
  const userColumn=dbColumn('itineraries','userId');
  try{const {data,error}=await supabaseClient.from(tableName('itineraries')).select('*').eq(userColumn,authUser.id);if(error)throw error;const rows=(data||[]).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));renderSavedTrips(rows);setTripsMessage(rows.length?'Your saved itineraries are visible only to your account.':'Your saved trips will appear here.');}
  catch(error){console.warn('Could not load saved itineraries.',error);renderSavedTrips([]);setTripsMessage('Could not load trips. Check the existing itinerary columns and RLS policy.');}
}
async function saveCurrentItinerary(){
  if(!authUser){openAuth('login','Sign in to save this itinerary.');return;}
  if(!supabaseReady){notify('Add the local Supabase URL and publishable key to save trips.','warning');return;}
  const plan=window.currentItinerary,meta=window.currentItineraryMeta;if(!plan||!meta){notify('Generate a trip plan before saving it.','warning');return;}
  const snapshot=serializeItinerary(plan,meta),columns={userId:dbColumn('itineraries','userId'),title:dbColumn('itineraries','title'),hub:dbColumn('itineraries','hub'),month:dbColumn('itineraries','month'),duration:dbColumn('itineraries','duration'),totalBudget:dbColumn('itineraries','totalBudget'),estimatedCost:dbColumn('itineraries','estimatedCost'),plan:dbColumn('itineraries','plan')},payload={[columns.userId]:authUser.id,[columns.title]:meta.label||plan.route,[columns.hub]:meta.hub,[columns.month]:meta.month,[columns.duration]:meta.duration,[columns.totalBudget]:meta.budget,[columns.estimatedCost]:plan.total,[columns.plan]:snapshot},button=$('#save-itinerary');
  if(button){button.disabled=true;button.textContent='Saving…';}
  try{const {error}=await supabaseClient.from(tableName('itineraries')).insert(payload);if(error)throw error;notify('Itinerary saved to My trips.','success');await loadSavedTrips();}
  catch(error){console.error('Could not save itinerary.',error);notify('Could not save this trip. Check the itinerary table columns and RLS policy.','error');}
  finally{const current=$('#save-itinerary');if(current){current.disabled=false;current.textContent='Save itinerary';}}
}
async function deleteSavedTrip(id){
  if(!authUser||!supabaseReady)return;
  const idColumn=dbColumn('itineraries','id'),userColumn=dbColumn('itineraries','userId');
  try{const {error}=await supabaseClient.from(tableName('itineraries')).delete().eq(idColumn,id).eq(userColumn,authUser.id);if(error)throw error;notify('Saved itinerary deleted.','success');await loadSavedTrips();}
  catch(error){console.error('Could not delete itinerary.',error);notify('Could not delete this trip. Check the existing itinerary policy.','error');}
}
function openSavedTrip(id){
  const card=$('.saved-trip-card[data-trip-id="'+CSS.escape(String(id))+'"]');if(!card)return;
  const rawId=dbColumn('itineraries','id'),rawData=dbColumn('itineraries','plan');
  supabaseClient.from(tableName('itineraries')).select('*').eq(rawId,id).eq(dbColumn('itineraries','userId'),authUser.id).single().then(({data,error})=>{
    if(error||!data){notify('Could not open the saved trip.','error');return;}
    let snapshot=data[rawData];if(typeof snapshot==='string'){try{snapshot=JSON.parse(snapshot);}catch{snapshot=null;}}
    if(!snapshot?.days){notify('This saved itinerary uses an unsupported data format.','error');return;}
    const plan={route:snapshot.route,minDays:snapshot.minDays||snapshot.duration,total:snapshot.total,hub:snapshot.hub,month:snapshot.month,days:snapshot.days.map(day=>({...day,destination:destinations.find(d=>d.name===day.destination?.name)||day.destination}))};
    const tripHub=data[dbColumn('itineraries','hub')]||snapshot.hub,tripMonth=data[dbColumn('itineraries','month')]||snapshot.month,tripDuration=Number(data[dbColumn('itineraries','duration')]||snapshot.duration||plan.days.length),tripBudget=Number(data[dbColumn('itineraries','totalBudget')]||snapshot.budget||snapshot.total);
    window.currentItinerary=plan;window.currentItineraryMeta={hub:tripHub,duration:tripDuration,budget:tripBudget,month:tripMonth,label:data[dbColumn('itineraries','title')]||snapshot.label};
    showItinerary(plan,{budget:tripBudget,month:tripMonth||'January',duration:tripDuration,hub:tripHub||'Unknown',presetLabel:data[dbColumn('itineraries','title')]||snapshot.label,saved:true});
  });
}
async function toggleFavorite(destination,button){
  if(!authUser){openAuth('login','Sign in to save places to your favourites.');return;}
  if(!supabaseReady){notify('Add the local Supabase URL and publishable key to save favourites.','warning');return;}
  if(destination.id==null){notify('This destination is not linked to a database record yet. Check public read access and seed the destinations table.','warning');return;}
  const userColumn=dbColumn('favorites','userId'),destinationColumn=dbColumn('favorites','destinationId'),reference=destination.id,saved=favoriteDestinationNames.has(destination.name);
  button.disabled=true;
  try{
    if(saved){const {error}=await supabaseClient.from(tableName('favorites')).delete().eq(userColumn,authUser.id).eq(destinationColumn,reference);if(error)throw error;favoriteDestinationNames.delete(destination.name);}
    else{const {error}=await supabaseClient.from(tableName('favorites')).insert({[userColumn]:authUser.id,[destinationColumn]:reference});if(error)throw error;favoriteDestinationNames.add(destination.name);}
    renderDestinations();
  }catch(error){console.error('Could not update favorite.',error);notify('Could not update this favourite. Check the favorites table columns and RLS policy.','error');}
  finally{const current=$('.heart-button[aria-label*="'+CSS.escape(destination.name)+'"]');if(current)current.disabled=false;}
}
const routePlans = {
  shillong:{hub:'Guwahati',min:3,name:'Guwahati → Shillong → Dawki',days:[
    ['Shillong','Guwahati → Shillong','Shared cab, about 3–4 hours; traffic and weather can add time.',350,'Arrive, check in, walk Ward’s Lake and Police Bazaar, and try a Khasi dinner.',true],
    ['Dawki & Umngot','Shillong → Dawki','Shared Sumo, about 3–4 hours; confirm the return seat before leaving.',350,'Stop at Pynursla viewpoints, take a locally operated Umngot boat and stay in a village homestay.',true],
    ['Dawki & Umngot','Dawki → Guwahati','Return via Shillong, about 5–6 hours total; leave early and allow a road buffer.',650,'Take a short riverside morning, then make the overland return to Guwahati.',false]
  ],extra:['Shillong','A slower Shillong day','Local shared taxi and walking day.',200,'Choose a local food walk, Don Bosco Museum or a guided sacred-grove visit.',true]},
  kaziranga:{hub:'Guwahati',min:3,name:'Guwahati → Kaziranga',days:[
    ['Kaziranga','Guwahati → Kohora','Shared road transfer, about 5–6 hours; allow extra time around Nagaon.',850,'Check in near the park, visit a local orchid centre if open and confirm an official safari slot.',true],
    ['Kaziranga','Kaziranga safari day','Park-zone transport; safari booking is separate and subject to availability.',300,'Take one early official jeep safari, rest at midday, then visit a nearby tea garden or village-run centre.',true],
    ['Kaziranga','Kohora → Guwahati','Road return, about 5–6 hours. A second safari adds cost and time.',850,'Have breakfast near the park and leave a generous buffer for the return journey.',false]
  ],extra:['Kaziranga','Second safari or village day','Local shared ride around Kohora.',250,'Choose a second official safari zone or a village visit; book park activities directly.',true]},
  majuli:{hub:'Guwahati',min:4,name:'Guwahati → Jorhat → Majuli',days:[
    ['Majuli','Guwahati → Jorhat','Train or bus, typically 6–8 hours; overnight in Jorhat to avoid a tight ferry connection.',700,'Transfer day. Buy snacks, check Nimati Ghat ferry times and keep the evening light.',true],
    ['Majuli','Jorhat → Majuli by ferry','Road to Nimati Ghat, then ferry; allow 1–2 hours including boarding. River conditions affect service.',250,'Check in, visit one satra with a local guide and learn about mask-making if a workshop is open.',true],
    ['Majuli','Satra and village day','Local bicycle or shared auto; village distances take time.',300,'Visit Auniati or Kamalabari Satra, browse a Mising village and try a locally prepared meal.',true],
    ['Majuli','Majuli → Jorhat → Guwahati','Early ferry and onward train or bus; allow a full travel day.',950,'Return travel day. Keep ferry and onward-ticket connections flexible.',false]
  ],extra:['Majuli','Island craft and wetlands day','Local bicycle or shared auto.',250,'Arrange a community craft workshop or birding guide; confirm access and ferry timing locally.',true]},
  ziro:{hub:'Dibrugarh',min:5,name:'Dibrugarh → Ziro Valley',days:[
    ['Ziro Valley','Dibrugarh → Ziro Valley','Long overland transfer, plan 8–10 hours; breaks, checkpoints and road conditions affect timing.',1500,'Transfer day. Carry snacks, water and valid photo ID; check in at a local homestay on arrival.',true],
    ['Ziro Valley','Apatani villages with a local guide','Short local shared taxi or homestay transport.',250,'Walk Hong, Hari and nearby villages with a local guide; ask before photographing residents or entering farms.',true],
    ['Ziro Valley','Fields, craft and food','Local shared transport between Hapoli and villages.',300,'Learn about Apatani wet-rice cultivation, visit a handloom or bamboo craft workshop and share a local meal.',true],
    ['Ziro Valley','Pine trail and Hapoli market','Local taxi or cycle hire; use a local guide for longer walks.',350,'Take a short pine-forest walk, browse Hapoli market and leave the afternoon open for weather.',true],
    ['Ziro Valley','Ziro → Dibrugarh','Return overland, plan 8–10 hours. Confirm the vehicle and departure time the previous evening.',1500,'Return travel day; avoid booking a tight onward connection.',false]
  ],extra:['Ziro Valley','Community-led culture day','Local shared transport.',250,'Arrange a village walk, local food session or craft visit through a local host.',true]},
  gangtok:{hub:'Bagdogra',min:3,name:'Bagdogra → Gangtok',days:[
    ['Gangtok','Bagdogra → Gangtok','Road transfer, about 4–5 hours in normal conditions; landslides can cause major delays.',900,'Travel day. Check in, walk MG Marg and keep plans flexible.',true],
    ['Gangtok','Gangtok town and monastery trail','Local shared taxi or walk; confirm monastery opening hours.',250,'Visit Enchey Monastery, Namgyal Institute of Tibetology and a local market; leave time for a Sikkimese meal.',true],
    ['Gangtok','Gangtok → Bagdogra','Road return, about 4–5 hours and longer in poor weather. Allow a generous onward-connection buffer.',900,'Early breakfast and return transfer. Avoid a tight same-day connection in monsoon months.',false]
  ],extra:['Gangtok','Rumtek and a slower town day','Shared taxi to Rumtek; confirm return service.',350,'Visit Rumtek respectfully, then return to Gangtok for a local food walk.',true]},
  lachung:{hub:'Bagdogra',min:5,name:'Bagdogra → Gangtok → Lachung',days:[
    ['Gangtok','Bagdogra → Gangtok','Road transfer, about 4–5 hours; weather and traffic can extend the drive.',900,'Travel day. Rest in Gangtok and confirm your operator, permits and next morning’s departure.',true],
    ['Lachung','Gangtok → Lachung','Registered shared 4WD, roughly 6–8 hours with stops; access depends on road conditions.',2300,'Mountain transfer day. Carry original photo ID and follow check-in instructions.',true],
    ['Lachung','Lachung and Yumthang Valley','Permit-approved local 4WD excursion; route access depends on current orders and road conditions.',900,'Visit only locations listed on your permit. Keep the schedule flexible for altitude, weather and checkpoints.',true],
    ['Lachung','Lachung → Gangtok','Registered 4WD return, roughly 6–8 hours when conditions permit.',2300,'Return travel day. Confirm the latest North Sikkim itinerary and road rules before booking.',true],
    ['Gangtok','Gangtok → Bagdogra','Road transfer, about 4–5 hours; add a buffer for mountain-road delays.',900,'Return travel day. Avoid a tight same-day onward connection.',false]
  ],extra:['Gangtok','Rest and local culture day','Local shared taxi or walking day.',250,'Use a rest day after the high-altitude route; visit a monastery or market at an easy pace.',true]},
  loktak:{hub:'Imphal',min:2,name:'Imphal → Loktak Lake',days:[
    ['Loktak Lake','Imphal → Moirang and Loktak','Shared taxi, about 1–1.5 hours; agree on a return plan before leaving Imphal.',250,'Visit INA Memorial at Moirang, then arrange a community boat on Loktak before sunset.',true],
    ['Loktak Lake','Loktak sunrise → Imphal','Return drive, about 1–1.5 hours; road timing can vary.',250,'Take an early boat with a local operator, view the lake respectfully and return to Imphal.',false]
  ],extra:['Loktak Lake','Keibul Lamjao nature day','Arrange a local guide and confirm park access in advance.',350,'Explore only where access is open; check current conditions with local authorities.',true]},
  dzukou:{hub:'Guwahati',min:4,name:'Guwahati → Kohima → Dzükōu Valley',days:[
    ['Dzükōu Valley','Guwahati → Kohima','Long road transfer, usually 8–10 hours; overnight in Kohima.',1000,'Transfer and rest day. Check Nagaland ILP and arrange a local guide before trekking.',true],
    ['Dzükōu Valley','Kohima → trailhead → valley','Drive to the trailhead, then trek about 4–6 hours depending on route and weather.',500,'Start early with a local guide, carry water and use designated trails; overnight only at permitted facilities.',true],
    ['Dzükōu Valley','Valley trail and descent','Allow a full day for the return trek; conditions can change quickly at altitude.',350,'Follow local entry rules, pack out all waste and descend before dark.',true],
    ['Dzükōu Valley','Kohima → Guwahati','Long road return, usually 8–10 hours; avoid a tight connection.',1000,'Return travel day with a road buffer.',false]
  ],extra:['Dzükōu Valley','Kohima cultural buffer day','Local taxi in Kohima.',250,'Use this as a weather buffer or visit a community museum with local guidance.',true]},
  reiek:{hub:'Guwahati',min:4,name:'Guwahati → Aizawl → Reiek',days:[
    ['Reiek','Guwahati → Aizawl','Flight or long overland transfer; schedules and fares vary. Plan a separate arrival day.',2400,'Travel day. Confirm your Mizoram ILP and check in near Aizawl.',true],
    ['Reiek','Aizawl → Reiek','Road transfer, about 1–2 hours depending on traffic.',250,'Walk the forested ridge with a local guide and visit the heritage village respectfully.',true],
    ['Reiek','Reiek and Aizawl culture','Local shared vehicle back toward Aizawl.',250,'Return to Aizawl, visit a local market and try Mizo dishes with a local host.',true],
    ['Reiek','Aizawl → Guwahati','Return flight or long road transfer; keep this as a full travel day.',2400,'Return travel day; verify schedules before buying onward tickets.',false]
  ],extra:['Reiek','Aizawl local day','Local shared taxi and walking.',250,'Visit a local craft or food market and leave time for transport changes.',true]},
  unakoti:{hub:'Guwahati',min:4,name:'Guwahati → Kailashahar → Unakoti',days:[
    ['Unakoti','Guwahati → Dharmanagar','Long train or road transfer, often 8–10 hours; stay near Dharmanagar.',1600,'Transfer day. Check your onward shared vehicle and keep the evening free.',true],
    ['Unakoti','Dharmanagar → Unakoti','Road transfer to the site, about 1–2 hours each way.',350,'Explore the carvings with a local guide; do not touch the sculptures and follow site access rules.',true],
    ['Unakoti','Kailashahar and local food','Local shared auto around Kailashahar.',250,'Take a slower day in Kailashahar and try Tripuri cuisine with a local host.',true],
    ['Unakoti','Dharmanagar → Guwahati','Return train or road transfer; reserve a full travel day.',1600,'Return travel day; avoid tight same-day connections.',false]
  ],extra:['Unakoti','Kailashahar buffer day','Local shared auto.',250,'Use this as a buffer for transport or a second guided visit to the archaeological site.',true]}
};

function chosenRoute(hub, interests, preferred, duration) {
  if(preferred==='Shillong'||preferred==='Dawki & Umngot') return routePlans.shillong;
  if(preferred==='Kaziranga') return routePlans.kaziranga;
  if(preferred==='Majuli') return routePlans.majuli;
  if(preferred==='Ziro Valley') return routePlans.ziro;
  if(preferred==='Gangtok') return routePlans.gangtok;
  if(preferred==='Lachung') return routePlans.lachung;
  if(preferred==='Loktak Lake') return routePlans.loktak;
  if(preferred==='Dzükōu Valley') return routePlans.dzukou;
  if(preferred==='Reiek') return routePlans.reiek;
  if(preferred==='Unakoti') return routePlans.unakoti;
  if(preferred==='Tawang') return {...routePlans.ziro,hub:hub,min:6,name:hub+' → Dirang → Tawang',days:[
    ['Tawang',hub+' → Dirang / Bomdila','Break the long approach here; do not attempt Guwahati to Tawang in one day.',1800,'Transfer day. Check current road and weather advice with your driver.',true],
    ['Tawang','Dirang / Bomdila → Tawang','Mountain road, about 5–7 hours depending on stops and pass conditions.',900,'Reach Tawang, rest and acclimatize; only make a nearby stop if daylight allows.',true],
    ['Tawang','Tawang Monastery and town','Local taxi around town.',250,'Visit Tawang Monastery respectfully and explore the market at an easy pace.',true],
    ['Tawang','Highland excursion with local driver','Use a local driver and check permit coverage and road status.',700,'Choose only a currently open and permitted highland stop; keep the return flexible.',true],
    ['Tawang','Tawang → Dirang / Bomdila','Mountain road return, about 5–7 hours.',900,'Begin the return in daylight and avoid driving after dark.',true],
    ['Tawang','Dirang / Bomdila → '+hub,'Long road return to '+hub+', roughly 8–10 hours; full transfer day.',1800,'Return with a large road buffer and no tight same-day onward connection.',false]
  ],extra:['Tawang','Tawang rest and culture day','Local taxi around town.',250,'Use a buffer day for acclimatization, a monastery visit or weather changes.',true]};
  if(hub==='Bagdogra') return duration>=5&&interests.includes('Adventure')?routePlans.lachung:routePlans.gangtok;
  if(hub==='Dibrugarh') return interests.some(x=>x==='Culture'||x==='Offbeat')||duration>=5?routePlans.ziro:routePlans.majuli;
  if(hub==='Imphal') return routePlans.loktak;
  if(interests.includes('Wildlife')) return routePlans.kaziranga;
  if(interests.includes('Culture')&&duration>=4) return routePlans.majuli;
  return routePlans.shillong;
}

function makeDays(hub,duration,budget,month,interests,forcedRoute,preferred) {
  const route=chosenRoute(hub,interests,preferred,duration), template=route.days.map(x=>x.slice());
  while(template.length<duration) template.splice(Math.max(0,template.length-1),0,route.extra);
  const chargedPermits=new Set();
  const days=template.slice(0,duration).map((x,i)=>{
    const d=destinations.find(y=>y.name===x[0])||destinations[0], permitCost=(d.permit!=='none'&&!chargedPermits.has(d.state))?(chargedPermits.add(d.state),d.permit==='ilp'?250:350):0;
    const costs=calculateDayCosts({dailyBudget:d.budget,fare:x[3],overnight:x[5],permitCost});
    return {destination:d,title:x[1],transfer:x[2],fare:x[3],activity:x[4],overnight:x[5],day:i+1,...costs};
  });
  const total=days.reduce((sum,d)=>sum+d.stay+d.meals+d.transport+d.activities+d.permitCost,0);
  return {days,total,route:route.name,minDays:route.min,hub:hub,month:month};
}

function showItinerary(plan,options) {
  const budget=options.budget,month=options.month,duration=options.duration,hub=options.hub,actual=plan.total;
  let title='',reason='';
  if(duration<plan.minDays){title='This route needs more time.';reason=plan.route+' is best planned over at least '+plan.minDays+' days for its transfer legs and time at the destination. Extend the trip or choose a closer route.';if(actual>budget)reason+=' It is also estimated at ₹'+actual.toLocaleString('en-IN')+', above your budget.';}
  else if(actual>budget){title='A little more budget is needed.';reason='This practical route is estimated at ₹'+actual.toLocaleString('en-IN')+' per person. Increase the budget or shorten the trip. The estimate includes transfers, accommodation, meals, activities and permits.';}
  if(title){$('#itinerary-content').innerHTML='<div class="itinerary-head"><span class="section-kicker">TRIP CHECK</span><h2 id="itinerary-title">'+title+'</h2><p>'+reason+'</p></div><div class="budget-summary"><span>ESTIMATED ROUTE COST</span><strong>₹'+actual.toLocaleString('en-IN')+'</strong></div><button class="button button-primary itinerary-close-button">Back to planner <span>→</span></button>';}
  else {
    const totals=plan.days.reduce((s,d)=>({stay:s.stay+d.stay,meals:s.meals+d.meals,transport:s.transport+d.transport,activities:s.activities+d.activities,permits:s.permits+d.permitCost}),{stay:0,meals:0,transport:0,activities:0,permits:0});
    const monsoon=['June','July','August','September'].includes(month),warning=monsoon?'Monsoon warning: June–September can bring landslides, road closures and ferry delays. Reconfirm conditions locally.':'Times and fares are approximate. Roads, shared rides, activities and permits are not live; confirm before travel.';
    const days=plan.days.map(x=>'<article class="itinerary-day"><div class="day-top"><span class="day-number">'+x.day+'</span><h3>'+escapeHtml(x.title)+'</h3></div><div class="day-activities"><b>'+escapeHtml(x.transfer)+'</b><br>'+escapeHtml(x.activity)+'</div><div class="day-costs"><span>Stay <b>₹'+x.stay+'</b></span><span>Meals <b>₹'+x.meals+'</b></span><span>Transport <b>₹'+x.transport+'</b></span><span>Activities <b>₹'+x.activities+'</b></span><span>Permits <b>₹'+x.permitCost+'</b></span></div></article>').join('');
    const label=options.presetLabel||duration+'-day '+plan.route+' trip';
    $('#itinerary-content').innerHTML='<header class="itinerary-head"><span class="section-kicker">RULE-BASED ESTIMATE · APPROXIMATE INR</span><h2 id="itinerary-title">'+escapeHtml(label)+'</h2><p>Starting in '+escapeHtml(hub)+' · '+duration+' days · '+escapeHtml(month)+'</p><div class="budget-summary"><span>ESTIMATED TOTAL<br><small>Per person · indicative prices</small></span><strong>₹'+actual.toLocaleString('en-IN')+'</strong></div></header><div class="itinerary-cost-summary"><span>Stay <b>₹'+totals.stay.toLocaleString('en-IN')+'</b></span><span>Meals <b>₹'+totals.meals.toLocaleString('en-IN')+'</b></span><span>Transport <b>₹'+totals.transport.toLocaleString('en-IN')+'</b></span><span>Activities <b>₹'+totals.activities.toLocaleString('en-IN')+'</b></span><span>Permits <b>₹'+totals.permits.toLocaleString('en-IN')+'</b></span><span>Budget left <b>₹'+(budget-actual).toLocaleString('en-IN')+'</b></span></div><p class="trip-condition '+(monsoon?'trip-condition-warning':'')+'">ⓘ '+warning+'</p><div class="day-list">'+days+'</div><div class="itinerary-actions">'+(options.saved?'':'<button class="button button-secondary" id="save-itinerary">Save itinerary</button>')+'<button class="button button-primary" id="print-itinerary">↓ &nbsp; Download / print itinerary</button><button class="button button-secondary itinerary-close-button">'+(options.saved?'Close itinerary':'Edit my plan')+'</button></div>';
  }
  showAppModal('itinerary-overlay','.itinerary-close');
  if(title) clearItinerarySequence(); else renderItinerarySequence(plan);
}

function generateFromForm() {
  const hub=$('#hub-input').value,duration=Number($('#duration-input').value),budget=Math.max(0,Number($('#budget-input').value)||0),month=$('#month-input').value,interests=$$('.interest-options input:checked').map(x=>x.value);
  const plan=makeDays(hub,duration,budget,month,interests,null,window.requestedDestination||null);window.currentItinerary=plan;window.currentItineraryMeta={budget:budget,month:month,hub:hub,duration:duration,label:duration+'-day '+plan.route+' trip'};showItinerary(plan,{budget:budget,month:month,hub:hub,duration:duration});
}

function preset(key) {
  const isZiro=key==='ziro',hub=isZiro?'Dibrugarh':'Guwahati',duration=isZiro?5:3,budget=isZiro?16500:8000,month=$('#month-input').value,interests=isZiro?['Culture','Offbeat']:['Culture','Adventure'],preferred=isZiro?'Ziro Valley':'Dawki & Umngot',label=isZiro?'5-Day Ziro Valley Cultural Trip':'Guwahati → Shillong → Dawki';
  $('#hub-input').value=hub;$('#duration-input').value=duration;$('#budget-input').value=budget;$$('.interest-options input').forEach(x=>x.checked=interests.includes(x.value));window.requestedDestination=null;setTab('planner');const plan=makeDays(hub,duration,budget,month,interests,null,preferred);window.currentItinerary=plan;window.currentItineraryMeta={budget:budget,month:month,hub:hub,duration:duration,label:label};showItinerary(plan,{budget:budget,month:month,hub:hub,duration:duration,presetLabel:label});
}

document.addEventListener('click',function(e){const planButton=e.target.closest('.modal-plan');if(planButton)window.requestedDestination=planButton.dataset.destinationPlan;});

const destinationCoordinates={
  'Shillong':[25.5788,91.8933],'Dawki & Umngot':[25.1870,92.0167],'Kaziranga':[26.5775,93.1711],'Majuli':[26.9500,94.1800],
  'Tawang':[27.5860,91.8590],'Ziro Valley':[27.5440,93.8190],'Dzükōu Valley':[25.5300,94.0300],'Loktak Lake':[24.5500,93.7800],
  'Reiek':[23.6840,92.6130],'Unakoti':[24.3270,92.0665],'Gangtok':[27.3389,88.6065],'Lachung':[27.6880,88.7450]
};
let destinationMap=null,destinationMapMarkers=[],itineraryRouteLayer=null,destinationBaseLayer=null,mapTileReady=false,mapTileFallbackShown=false,mapTileWatchdog=null;
const MAP_ATTRIBUTION='<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
destinations.forEach(d=>{d.coordinates=destinationCoordinates[d.name]||null;});

function destinationMapIcon(d){return L.divIcon({className:'',html:'<div class="map-marker '+(d.gem?'gem':'')+'"><span>•</span></div>',iconSize:[23,23],iconAnchor:[11,22],popupAnchor:[0,-20]});}
function routeMapIcon(n){return L.divIcon({className:'',html:'<div class="map-route-number">'+n+'</div>',iconSize:[23,23],iconAnchor:[11,11]});}
function showMapTileFallback(message){
  if(mapTileFallbackShown)return;mapTileFallbackShown=true;
  if(mapTileWatchdog)clearTimeout(mapTileWatchdog);
  if(destinationBaseLayer&&destinationMap&&destinationMap.hasLayer(destinationBaseLayer))destinationBaseLayer.remove();
  const fallback=document.createElement('div');fallback.id='map-tile-fallback';fallback.className='map-tile-fallback';fallback.setAttribute('role','status');fallback.setAttribute('aria-live','polite');fallback.innerHTML='<strong>Map tiles are unavailable.</strong><span>'+escapeHtml(message||'The destination pins and itinerary sequence remain available. Check your connection and reload the page to try again.')+'</span>';
  destinationMap.getContainer().appendChild(fallback);
}
function initDestinationMap(){
  const el=document.getElementById('destination-map');if(!el)return;
  if(!window.L){el.innerHTML='<div class="map-fallback">The map library did not load. Check your connection and refresh to view the destination map.</div>';return;}
  destinationMap=L.map(el,{scrollWheelZoom:false,zoomControl:true,keyboard:true});
  if(window.maplibregl&&L.maplibreGL){
    destinationBaseLayer=L.maplibreGL({style:'https://tiles.openfreemap.org/styles/positron',attribution:MAP_ATTRIBUTION}).addTo(destinationMap);
  } else {
    showMapTileFallback('The map renderer did not load. Your destination pins and trip path are still interactive.');
  }
  const bounds=[];
  destinations.forEach(d=>{if(!d.coordinates)return;const marker=L.marker(d.coordinates,{icon:destinationMapIcon(d),title:d.name,alt:d.name}).addTo(destinationMap);marker.bindTooltip('<strong>'+escapeHtml(d.name)+'</strong><br><span>'+escapeHtml(d.state)+' · est. ₹'+d.budget.toLocaleString('en-IN')+'/day</span>');marker.on('click',()=>openDestination(d.name));destinationMapMarkers.push(marker);bounds.push(d.coordinates);});
  if(bounds.length)destinationMap.fitBounds(bounds,{padding:[28,28],maxZoom:6});
  if(destinationBaseLayer){
    const glMap=destinationBaseLayer._glMap,markReady=()=>{if(mapTileFallbackShown)return;mapTileReady=true;if(mapTileWatchdog)clearTimeout(mapTileWatchdog);};
    if(glMap){if(glMap.loaded())markReady();else{glMap.once('load',markReady);glMap.once('idle',markReady);}glMap.on('error',event=>{if(event.error&&event.error.status>=400)showMapTileFallback('The map provider returned an error. Your destination pins and trip path are still interactive.');});}
    mapTileWatchdog=setTimeout(()=>{if(!mapTileReady)showMapTileFallback('The map provider did not finish loading. Your destination pins and trip path are still interactive.');},25000);
  }
  itineraryRouteLayer=L.layerGroup().addTo(destinationMap);
  requestAnimationFrame(()=>destinationMap.invalidateSize());
  window.addEventListener('resize',()=>destinationMap&&destinationMap.invalidateSize());
}
function loadMapStylesheet(href,integrity){return new Promise((resolve,reject)=>{const existing=document.querySelector(`link[data-map-asset="${href}"]`);if(existing){existing.sheet?resolve():existing.addEventListener('load',resolve,{once:true});return;}const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.integrity=integrity;link.crossOrigin='anonymous';link.dataset.mapAsset=href;link.onload=resolve;link.onerror=()=>reject(new Error('Map styles could not be downloaded.'));document.head.appendChild(link);});}
function loadMapScript(src,integrity){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.integrity=integrity;script.crossOrigin='anonymous';script.async=true;script.onload=resolve;script.onerror=()=>reject(new Error('Map library could not be downloaded.'));document.head.appendChild(script);});}
function loadMapLibraries(){if(!mapLibraryPromise)mapLibraryPromise=(async()=>{await Promise.all([loadMapStylesheet('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='),loadMapStylesheet('https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css','sha384-uTttxo/aOKbdE5RlD/SPzSDoDmNvGlUYPjONi2MN/b7c9HPSvW07OIuyP7uL6jxK')]);await loadMapScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=');await loadMapScript('https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js','sha384-5+cfbwT0iiub6VsQAdn6yz16nr6sDiQoHx6tm4O8OVYXHYOxcffFmCJBL0dgdvGp');await loadMapScript('https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.3/leaflet-maplibre-gl.js','sha384-LIxE/QjpJKC2A91yD40ZisdYtFbgAjl58jqpo9/MUZNgwhqsTfzwrTlqv6nDdzzB');})();return mapLibraryPromise;}
function initializeMapWhenVisible(){const el=$('#destination-map');if(!el)return;const start=async()=>{mapInitObserver?.disconnect();try{await loadMapLibraries();if(destinationMap)return;initDestinationMap();if(window.currentItinerary)renderItinerarySequence(window.currentItinerary);}catch(error){console.warn('Map libraries could not be loaded; the destination explorer remains available.',error);el.replaceChildren();const fallback=document.createElement('div');fallback.className='map-fallback';fallback.setAttribute('role','status');fallback.textContent='Map display is unavailable. Use the destination cards and travel guide while offline.';el.appendChild(fallback);}};if('IntersectionObserver'in window){mapInitObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))start();},{rootMargin:'0px'});mapInitObserver.observe(el);}else start();}
function clearItinerarySequence(){if(itineraryRouteLayer)itineraryRouteLayer.clearLayers();const list=document.getElementById('map-itinerary-sequence');if(list)list.innerHTML='';const title=document.getElementById('map-route-title');if(title)title.textContent='Your trip will appear here.';const note=document.getElementById('map-route-note');if(note)note.textContent='Build a plan to see its destination sequence. Dotted connectors show order only, not driving routes.';}
function renderItinerarySequence(plan){
  if(!destinationMap||!itineraryRouteLayer||!plan||!plan.days)return;
  itineraryRouteLayer.clearLayers();const coords=[],seen=new Map();
  const list=document.getElementById('map-itinerary-sequence');list.innerHTML=plan.days.map(day=>'<li><b>'+String(day.day).padStart(2,'0')+'</b><span>'+escapeHtml(day.destination.name)+'</span></li>').join('');
  document.getElementById('map-route-title').textContent='Day-by-day destination sequence';document.getElementById('map-route-note').textContent='The dotted connector indicates destination order only; it is not a road or travel-time route.';
  plan.days.forEach(day=>{const d=day.destination;if(!d.coordinates)return;if(!seen.has(d.name)){const n=seen.size+1;seen.set(d.name,n);coords.push(d.coordinates);L.marker(d.coordinates,{icon:routeMapIcon(n),interactive:false,keyboard:false,zIndexOffset:800}).addTo(itineraryRouteLayer);}});
  if(coords.length>1)L.polyline(coords,{color:'#c86f51',weight:3,dashArray:'5 8',opacity:.78,interactive:false}).addTo(itineraryRouteLayer);
  if(coords.length)destinationMap.fitBounds(coords,{padding:[52,52],maxZoom:8});
}


async function bootApp(){
  destinations=fallbackDestinations.map(d=>({...d,coordinates:destinationCoordinates[d.name]||null}));
  initializeSupabase();
  initializeMapWhenVisible();
  populateStateFilter();renderDestinations();renderPhotoCredits();initializeHeroSlideshow();
  const guideSelect=$('#guide-destination');destinations.forEach(d=>guideSelect.add(new Option(`${d.name} · ${d.state}`,d.name)));guideSelect.value=destinations.some(d=>d.name==='Tawang')?'Tawang':destinations[0]?.name||'';renderGuide(guideSelect.value);
  $('#search-input').addEventListener('input',e=>{filterValues.search=e.target.value.trim().toLowerCase();renderDestinations()});
  $('#state-filter').addEventListener('change',e=>{filterValues.state=e.target.value;renderDestinations()});
  $('#vibe-filter').addEventListener('change',e=>{filterValues.vibe=e.target.value;renderDestinations()});
  $('#season-filter').addEventListener('change',e=>{filterValues.season=e.target.value;renderDestinations()});
  $('#clear-filters').addEventListener('click',()=>{filterValues.search='';filterValues.state=filterValues.vibe=filterValues.season='all';$('#search-input').value='';$('#state-filter').value=$('#vibe-filter').value=$('#season-filter').value='all';renderDestinations()});
  $('#empty-clear').addEventListener('click',()=>$('#clear-filters').click());
  $('#auth-trigger').addEventListener('click',async()=>{
    const button=$('#auth-trigger');
    if(!authUser){openAuth('login');return;}
    if(!supabaseReady||!supabaseClient){notify('Could not sign out because the account service is unavailable. Try again when connected.','error');return;}
    button.disabled=true;button.textContent='Signing out…';
    try{
      const {error}=await supabaseClient.auth.signOut();if(error)throw error;
      await handleAuthChange(null);
      notify('You have been signed out.','success');
    }catch(error){console.error('Sign out failed.',error);setAuthNav();notify(error.message||'Sign out failed. Please check your connection and try again.','error');}
    finally{button.disabled=false;setAuthNav();}
  });
  $('#auth-form').addEventListener('submit',submitAuth);$('#auth-google').addEventListener('click',signInWithGoogle);$('#auth-login-mode').addEventListener('click',()=>setAuthMode('login'));$('#auth-signup-mode').addEventListener('click',()=>setAuthMode('signup'));
  $('#auth-modal').addEventListener('click',e=>{if(e.target.id==='auth-modal')closeAuth();});

  $('#destination-modal').addEventListener('click',e=>{if(e.target.id==='destination-modal')closeModal()});
  $('#itinerary-overlay').addEventListener('click',e=>{if(e.target.id==='itinerary-overlay')closeItinerary()});
  $('#guide-destination').addEventListener('change',e=>renderGuide(e.target.value));$('#month-input').addEventListener('change',()=>renderGuide($('#guide-destination').value));
  $('#planner-form').addEventListener('submit',e=>{e.preventDefault();generateFromForm()});$('.mobile-menu').addEventListener('click',()=>{const open=$('.main-nav').classList.toggle('open');$('.mobile-menu').setAttribute('aria-expanded',String(open));$('.mobile-menu').setAttribute('aria-label',open?'Close navigation':'Open navigation');});
  document.addEventListener('click',e=>{
    const heart=e.target.closest('.heart-button');if(heart){e.stopPropagation();const destination=destinations.find(d=>d.name===heart.closest('.destination-card')?.dataset.destination);if(destination)toggleFavorite(destination,heart);return;}
    const card=e.target.closest('.destination-card');if(card)openDestination(card.dataset.destination);
    const tab=e.target.closest('[data-tab]');if(tab)setTab(tab.dataset.tab);
    const go=e.target.closest('[data-go-tab]');if(go){e.preventDefault();setTab(go.dataset.goTab);}
    const pre=e.target.closest('[data-preset]');if(pre)preset(pre.dataset.preset);
    const planButton=e.target.closest('.modal-plan');if(planButton){const name=planButton.dataset.destinationPlan,d=destinations.find(x=>x.name===name);window.requestedDestination=name;closeModal();if(d){$('#guide-destination').value=d.name;renderGuide(d.name);$('#hub-input').value=d.state==='Manipur'?'Imphal':d.state==='Sikkim'?'Bagdogra':d.state==='Arunachal Pradesh'?'Dibrugarh':'Guwahati';setTab('planner');}}
    if(e.target.closest('.modal-close')){closeModal();closeItinerary();closeAuth();}
    if(e.target.closest('.itinerary-close-button'))closeItinerary();
    if(e.target.closest('#print-itinerary'))window.print();
    if(e.target.closest('#save-itinerary'))saveCurrentItinerary();
    const open=e.target.closest('[data-trip-open]');if(open)openSavedTrip(open.dataset.tripOpen);
    const remove=e.target.closest('[data-trip-delete]');if(remove)deleteSavedTrip(remove.dataset.tripDelete);
  });
  document.addEventListener('keydown',e=>{trapDialogTab(e);if(e.key==='Escape'){if(!$('#auth-modal').hidden)closeAuth();else if(!$('#itinerary-overlay').hidden)closeItinerary();else if(!$('#destination-modal').hidden)closeModal();}});
  const oauthError=consumeOAuthRedirectError();if(oauthError)openAuth('login',oauthError);
}
bootApp();
