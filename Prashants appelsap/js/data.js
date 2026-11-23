/* Prashants appelsap – speldata */
(function () {
  'use strict';
  var PA = (window.PA = window.PA || {});

  PA.LEVELS = [
    { name: 'Lichtgeel appelsap', need: 0, reward: 0, j1: '#FFFBD6', j2: '#FFEF85', j3: '#EBCB3A', glow: '#FFF3A0' },
    { name: 'Goudgeel appelsap', need: 1000, reward: 150, j1: '#FFE89A', j2: '#FFC93C', j3: '#E09A00', glow: '#FFD45C' },
    { name: 'Oranje appelsap', need: 25000, reward: 3000, j1: '#FFC879', j2: '#FF9A1F', j3: '#DB6200', glow: '#FFAA45' },
    { name: 'Rood appelsap', need: 500000, reward: 60000, j1: '#FF9A9A', j2: '#FF4B5C', j3: '#BE1634', glow: '#FF6B7A' },
    { name: 'Paars appelsap', need: 1e7, reward: 1.2e6, j1: '#DDB3FF', j2: '#A75CF0', j3: '#6620BF', glow: '#C08BFF' },
    { name: 'Blauw appelsap', need: 2.5e8, reward: 3e7, j1: '#A6DEFF', j2: '#3FA9FF', j3: '#1461D1', glow: '#6CC2FF' },
    { name: 'Magisch regenboogappelsap', need: 7.5e9, reward: 9e8, rainbow: true, j1: '#FF7AA2', j2: '#FFD93D', j3: '#4FC3FF', glow: '#FF9CF0' },
    { name: 'Gouden magisch appelsap', need: 2.5e11, reward: 3e10, gold: true, j1: '#FFF6C2', j2: '#FFD54A', j3: '#C68F00', glow: '#FFE27A' }
  ];

  PA.LEVEL_PERKS = [
    '',
    'Je appel krijgt een gouden gloed.',
    'Draaiende zonnestralen achter je appel!',
    'Je sap spat nu extra ver.',
    'Magische bubbels zweven rond je appel.',
    'Een sprankelende ring van sap draait rond je appel.',
    'Regenboogsap! Alles wordt magisch.',
    'Je appel draagt nu een gouden kroon!'
  ];

  PA.BUILDINGS = [
    { id: 'boom', emoji: '🍎', name: 'Appelboom', desc: 'Laat sappige appeltjes vallen die vanzelf tot sap worden.', cost: 15, sps: 0.1, noun: 'wortels' },
    { id: 'machine', emoji: '🧃', name: 'Sapmachine', desc: 'Perst automatisch verse appelsap.', cost: 100, sps: 1, noun: 'persen' },
    { id: 'fabriek', emoji: '🏭', name: 'Sapfabriek', desc: 'Produceert grote hoeveelheden appelsap.', cost: 1100, sps: 8, noun: 'lopende banden' },
    { id: 'super', emoji: '🚀', name: 'Supersapmachine', desc: 'Produceert extreem veel appelsap op raketkracht.', cost: 12000, sps: 47, noun: 'raketmotoren' },
    { id: 'magie', emoji: '🌳', name: 'Magische appelboom', desc: 'Aan zijn takken groeit magisch appelsap.', cost: 130000, sps: 260, noun: 'toverbladeren' },
    { id: 'lab', emoji: '👨‍🔬', name: 'Saplaboratorium', desc: 'Verbetert de productie: elk lab geeft +1% op ál je appelsap.', cost: 1.4e6, sps: 1400, noun: 'reageerbuisjes' },
    { id: 'portaal', emoji: '🌀', name: 'Sapportaal', desc: 'Haalt appelsap uit een parallelle appelwereld.', cost: 2e7, sps: 7800, noun: 'portaalringen' },
    { id: 'ster', emoji: '🌟', name: 'Appelsapster', desc: 'Een ster die appelsap straalt in plaats van licht.', cost: 3.3e8, sps: 44000, noun: 'sterrenkristallen' },
    { id: 'tijd', emoji: '⏳', name: 'Prashants tijdmachine', desc: 'Haalt appelsap uit de toekomst. Slim hoor, Prashant!', cost: 5.1e9, sps: 260000, noun: 'tandwielen' }
  ];

  var TIERS = [
    { n: 1, adj: 'Glimmende', m: 10 },
    { n: 5, adj: 'Turbo', m: 50 },
    { n: 25, adj: 'Mega', m: 500 },
    { n: 50, adj: 'Ultra', m: 5e4 },
    { n: 100, adj: 'Hyper', m: 5e6 },
    { n: 150, adj: 'Kosmische', m: 5e8 },
    { n: 200, adj: 'Legendarische', m: 5e10 }
  ];

  PA.UPGRADES = [
    { id: 'klik1', emoji: '👆', name: 'Stevige vingers', desc: 'Klikken levert 2× zo veel op.', cost: 100, type: 'click', mult: 2, req: { clicks: 10 } },
    { id: 'klik2', emoji: '🧤', name: 'Sapspetterhandschoen', desc: 'Klikken levert 2× zo veel op.', cost: 600, type: 'click', mult: 2, req: { clicks: 80 } },
    { id: 'klik3', emoji: '⚡', name: 'Turbotik', desc: 'Klikken levert 2× zo veel op.', cost: 12000, type: 'click', mult: 2, req: { clicks: 300 } },
    { id: 'klik4', emoji: '👑', name: 'Gouden vinger', desc: 'Elke klik levert ook 1% van je sap per seconde op.', cost: 1e5, type: 'clickSps', pct: 0.01, req: { earned: 5e4 } },
    { id: 'klik5', emoji: '🤖', name: 'Prashants perstechniek', desc: 'Elke klik levert nog eens 1% van je sap per seconde op.', cost: 1e7, type: 'clickSps', pct: 0.01, req: { earned: 5e6 } },
    { id: 'klik6', emoji: '🌌', name: 'Kosmische klik', desc: 'Elke klik levert nog eens 1% van je sap per seconde op.', cost: 1e9, type: 'clickSps', pct: 0.01, req: { earned: 5e8 } },
    { id: 'klik7', emoji: '✨', name: 'Klik der sapgoden', desc: 'Elke klik levert nog eens 2% van je sap per seconde op.', cost: 1e11, type: 'clickSps', pct: 0.02, req: { earned: 5e10 } },
    { id: 'g1', emoji: '🍯', name: 'Suikerzoet recept', desc: 'Al je productie +10%.', cost: 5e4, type: 'global', mult: 1.1, req: { earned: 2e4 } },
    { id: 'g2', emoji: '🧪', name: 'Geheime saus', desc: 'Al je productie +15%.', cost: 5e6, type: 'global', mult: 1.15, req: { earned: 2e6 } },
    { id: 'g3', emoji: '📜', name: 'Prashants geheime formule', desc: 'Al je productie +20%.', cost: 5e8, type: 'global', mult: 1.2, req: { earned: 2e8 } },
    { id: 'g4', emoji: '🌈', name: 'Regenboogrecept', desc: 'Al je productie +25%.', cost: 5e10, type: 'global', mult: 1.25, req: { earned: 2e10 } },
    { id: 'g5', emoji: '🏆', name: 'Gouden standaard', desc: 'Al je productie +30%.', cost: 5e12, type: 'global', mult: 1.3, req: { earned: 2e12 } },
    { id: 'nacht', emoji: '🌙', name: 'Nachtpers', desc: 'Offline productie gaat van 50% naar 100%.', cost: 25000, type: 'offline', req: { earned: 1e4 } },
    { id: 'goud1', emoji: '👃', name: 'Gouden neus', desc: 'Gouden appels verschijnen 2× zo vaak.', cost: 75000, type: 'goldFreq', req: { golden: 1 } },
    { id: 'goud2', emoji: '💛', name: 'Gouden hart', desc: 'Effecten van gouden appels duren 2× zo lang.', cost: 7.5e6, type: 'goldDur', req: { golden: 5 } }
  ];
  PA.BUILDINGS.forEach(function (b) {
    TIERS.forEach(function (t, i) {
      PA.UPGRADES.push({
        id: b.id + '_' + i, emoji: b.emoji, name: t.adj + ' ' + b.noun,
        desc: b.name + ' produceert 2× zo veel.', cost: b.cost * t.m,
        type: 'building', target: b.id, mult: 2, req: { building: b.id, count: t.n }
      });
    });
  });

  PA.WORLD = [
    { id: 'gras', emoji: '🌱', name: 'Appelgrasland', desc: 'Een klein stukje zacht, groen appelgrasland. Hier begint je wereld!', cost: 200, bonus: 0.05 },
    { id: 'bomen', emoji: '🌳', name: 'Appelbomen', desc: 'Vrolijke appelbomen vol glimmende rode appels.', cost: 5000, bonus: 0.1 },
    { id: 'rivier', emoji: '🏞️', name: 'Appelsaprivier', desc: 'Een kronkelende rivier van pure appelsap.', cost: 1e5, bonus: 0.15 },
    { id: 'meer', emoji: '🦆', name: 'Appelsapmeer', desc: 'Een glinsterend meer om in te zwemmen (en van te drinken).', cost: 2e6, bonus: 0.2 },
    { id: 'waterval', emoji: '💦', name: 'Appelsapwaterval', desc: 'Een bruisende waterval die sap laat spetteren.', cost: 4e7, bonus: 0.25 },
    { id: 'fabrieken', emoji: '🏭', name: 'Appelsapfabrieken', desc: 'Grote fabrieken die dag en nacht sap persen.', cost: 8e8, bonus: 0.35 },
    { id: 'kasteel', emoji: '🏰', name: 'Appelsapkasteel', desc: 'Een gigantisch kasteel met torens vol appelsap. Prashant woont hier!', cost: 2e10, bonus: 0.5 },
    { id: 'planeet', emoji: '🪐', name: 'Appelsapplaneet', desc: 'Een complete planeet van appelsap. Jouw magische wereld is af!', cost: 1e12, bonus: 1 }
  ];

  function cnt(s, id) { return s.buildings[id] || 0; }
  function totalB(s) { var t = 0; for (var k in s.buildings) t += s.buildings[k]; return t; }

  var A = [];
  function add(id, emoji, name, desc, test) { A.push({ id: id, emoji: emoji, name: name, desc: desc, test: test }); }
  [[1, 'Eerste slokje'], [100, 'Klikkertje'], [1000, 'Klikmeester'], [5000, 'Vingers van staal'], [20000, 'Onstuitbare klikker']].forEach(function (x, i) {
    add('klik' + i, '👆', x[1], 'Klik ' + PA_fmtInt(x[0]) + (x[0] === 1 ? ' keer' : ' keer') + ' op de appel.', function (s) { return s.clicks >= x[0]; });
  });
  [[100, 'Een glaasje vol', '🥛'], [1000, 'Een kan vol', '🫗'], [1e5, 'Een badkuip vol', '🛁'], [1e7, 'Een zwembad vol', '🏊'], [1e9, 'Een meer vol', '🏞️'], [1e11, 'Een oceaan vol', '🌊'], [1e13, 'Een heelal vol', '🌌']].forEach(function (x, i) {
    add('sap' + i, x[2], x[1], 'Verdien in totaal ' + PA_fmtInt(x[0]) + ' appelsap.', function (s) { return s.earned >= x[0]; });
  });
  [[10, 'Druppelaar'], [1000, 'Sapstroom'], [1e5, 'Sapstorm'], [1e7, 'Saptsunami']].forEach(function (x, i) {
    add('sps' + i, '💧', x[1], 'Maak ' + PA_fmtInt(x[0]) + ' appelsap per seconde.', function (s, g) { return g.baseSps >= x[0]; });
  });
  PA.BUILDINGS.forEach(function (b) {
    add('eerste_' + b.id, b.emoji, 'Eerste ' + b.name.toLowerCase(), 'Koop je eerste ' + b.name.toLowerCase() + '.', function (s) { return cnt(s, b.id) >= 1; });
  });
  add('boomgaard', '🌳', 'Boomgaard', 'Bezit 50 appelbomen.', function (s) { return cnt(s, 'boom') >= 50; });
  add('fabriekstad', '🏭', 'Fabrieksstad', 'Bezit 50 sapfabrieken.', function (s) { return cnt(s, 'fabriek') >= 50; });
  add('bouw100', '🧱', 'Bouwmeester', 'Bezit 100 gebouwen in totaal.', function (s) { return totalB(s) >= 100; });
  add('bouw300', '🏙️', 'Sapimperium', 'Bezit 300 gebouwen in totaal.', function (s) { return totalB(s) >= 300; });
  [[2, 'Goudgeel!'], [4, 'Roodgloeiend'], [6, 'Diepblauw'], [8, 'Gouden legende']].forEach(function (x) {
    add('level' + x[0], '⭐', x[1], 'Bereik level ' + x[0] + '.', function (s) { return s.level >= x[0]; });
  });
  add('wereld1', '🌱', 'Een eigen stukje grond', 'Ontgrendel je eerste deel van de appelsapwereld.', function (s) { return s.world.length >= 1; });
  add('wereld4', '🗺️', 'Wereldbouwer', 'Ontgrendel 4 delen van de appelsapwereld.', function (s) { return s.world.length >= 4; });
  add('wereld8', '🪐', 'Heerser van het appelsapheelal', 'Ontgrendel de complete appelsapplaneet.', function (s) { return s.world.length >= 8; });
  [[1, 'Gouden vondst'], [10, 'Goudzoeker'], [50, 'Goudkoorts']].forEach(function (x, i) {
    add('goud' + i, '🍏', x[1], 'Vang ' + x[0] + ' gouden appel' + (x[0] > 1 ? 's' : '') + '.', function (s) { return s.golden >= x[0]; });
  });
  add('dag3', '🎁', 'Trouwe sapdrinker', 'Haal 3 dagen achter elkaar je dagelijkse beloning.', function (s) { return s.daily.streak >= 3; });
  add('dag7', '📅', 'Een hele week sap', 'Haal 7 dagen achter elkaar je dagelijkse beloning.', function (s) { return s.daily.streak >= 7; });
  [[1, 'Uitdager'], [5, 'Kampioen'], [15, 'Uitdagingsheld']].forEach(function (x, i) {
    add('uitdaging' + i, '🏅', x[1], 'Voltooi ' + x[0] + ' uitdaging' + (x[0] > 1 ? 'en' : '') + '.', function (s) { return s.challengesDone >= x[0]; });
  });
  add('upg10', '🛠️', 'Knutselaar', 'Koop 10 upgrades.', function (s) { return s.upgrades.length >= 10; });
  add('upg30', '⚙️', 'Uitvinder', 'Koop 30 upgrades.', function (s) { return s.upgrades.length >= 30; });
  add('slaap', '😴', 'Slaap lekker', 'Verdien appelsap terwijl het spel gesloten was.', function (s) { return s.offlineTotal > 0; });
  add('rijk', '💰', 'Spaarvarken', 'Heb 1 miljoen appelsap tegelijk op zak.', function (s) { return s.sap >= 1e6; });
  PA.ACHIEVEMENTS = A;

  PA.CHALLENGES = [
    { id: 'klikstorm', emoji: '⚡', name: 'Klikstorm', type: 'clicks', time: 15,
      goal: function (g, s) { return 40 + 5 * Math.min(s.challengesDone, 12); },
      text: function (goal) { return 'Klik ' + goal + ' keer in 15 seconden.'; } },
    { id: 'sapsprint', emoji: '🏃', name: 'Sapsprint', type: 'earn', time: 60,
      goal: function (g) { return Math.ceil(g.baseSps * 66 + g.perClick * 40); },
      text: function (goal) { return 'Verdien ' + PA.fmt(goal) + ' appelsap in 60 seconden.'; } },
    { id: 'koopjes', emoji: '🛒', name: 'Koopjesjager', type: 'buy', time: 30,
      goal: function () { return 5; },
      text: function (goal) { return 'Koop ' + goal + ' gebouwen binnen 30 seconden.'; } }
  ];

  PA.NEWS = [
    [ 'Nieuws: Prashant drinkt zijn eerste glaasje appelsap. "Lekker!", zegt hij.',
      'Buurman ziet iemand heel hard op een appel klikken. "Rare hobby," vindt hij.',
      'Weetje: een appel bestaat voor 85% uit water. De rest is pure magie.',
      'Prashant droomt van een wereld vol appelsap. Zou dat ooit lukken?' ],
    [ 'Nieuws: lokale supermarkt verbaasd over enorme vraag naar appels.',
      'Prashants appelsap nu officieel "het lekkerste sap van de straat".',
      'Bijen in de buurt organiseren een feestje bij de appelbomen.' ],
    [ 'Nieuws: oranje appelsap verbijstert wetenschappers. "Hoe dan?!"',
      'Sinaasappels voelen zich bedreigd door het nieuwe oranje appelsap.',
      'Schoolkantine serveert voortaan alleen nog Prashants appelsap.' ],
    [ 'Nieuws: rood appelsap blijkt 3× zo bruisend als gewoon sap.',
      'Tomaten boos: "Rood is ONZE kleur!"',
      'Prashant opent een appelsapmuseum. Toegang: één slokje.' ],
    [ 'Nieuws: paars appelsap smaakt naar druiven én appels tegelijk.',
      'Tovenaars bestellen massaal paars appelsap voor hun toverdrankjes.',
      'Een eenhoorn is gespot bij de magische appelboom.' ],
    [ 'Nieuws: blauw appelsap? De oceaan is jaloers.',
      'Astronauten nemen Prashants blauwe appelsap mee naar de ruimte.',
      'Wetenschappers: "Blauw appelsap maakt je 12% vrolijker."' ],
    [ 'Nieuws: er schijnt een regenboog uit elk glas appelsap!',
      'Kabouters ruilen hun pot met goud in voor regenboogappelsap.',
      'Het regent regenboogsap boven de appelsapwereld. Paraplu vergeten? Lekker!' ],
    [ 'Nieuws: gouden magisch appelsap is het kostbaarste drankje van het heelal.',
      'Koningen uit alle sterrenstelsels staan in de rij voor één slokje.',
      'Prashant: "Ik begon met één klein glaasje. Kijk nu eens!"' ]
  ];

  function PA_fmtInt(n) { return PA.fmt ? PA.fmt(n) : String(n); }
})();
